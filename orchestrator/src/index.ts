import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parseTask } from "./task.js";
import { loadState, saveState, updateStagnation, isStagnant, isTimedOut } from "./state.js";
import { createLogger } from "./logger.js";
import { runCompletionChecks } from "./completion.js";
import { buildStopHook, buildPreCompactHook, buildCanUseTool, readSignalFile, clearSignalFile } from "./hooks.js";

const taskFile = process.env.TASK_FILE ?? process.argv[2];
if (!taskFile) {
  console.error("Usage: tsx src/index.ts <task-file>");
  console.error("  or set TASK_FILE environment variable");
  process.exit(1);
}

const resolvedTaskFile = resolve(taskFile);
if (!existsSync(resolvedTaskFile)) {
  console.error(`Task file not found: ${resolvedTaskFile}`);
  process.exit(1);
}

const task = parseTask(resolvedTaskFile);
const state = loadState(resolvedTaskFile);
const log = createLogger(".orchestrator/logs");
const cwd = process.env.WORKSPACE_DIR ?? process.cwd();

log.info(`Starting orchestrator for task: ${resolvedTaskFile}`);
log.info(`Max iterations: ${task.maxIterations}, Max hours: ${task.maxHours}, Budget: $${task.maxBudgetUsd}`);

if (state.iteration > 0) {
  log.info(`Resuming from iteration ${state.iteration}, session: ${state.sessionId}`);
}

// Load MCP config from project if it exists
function loadMcpServers(): Record<string, unknown> | undefined {
  const mcpPath = resolve(cwd, ".mcp.json");
  if (!existsSync(mcpPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(mcpPath, "utf-8"));
    return raw.mcpServers ?? raw;
  } catch {
    log.warn(`Failed to parse .mcp.json at ${mcpPath}`);
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  while (state.iteration < task.maxIterations && !isTimedOut(state, task.maxHours)) {
    state.iteration++;
    state.status = "running";
    saveState(state);

    clearSignalFile();

    const isFirstIteration = state.iteration === 1 && !state.sessionId;
    const useFreshSession = task.freshSession || isFirstIteration;

    const prompt = useFreshSession
      ? task.body + "\n\nCheck .orchestrator/progress.md for any prior progress."
      : `Continue working. Re-read the task file at ${resolvedTaskFile} if needed. ` +
        "Check .orchestrator/progress.md for current state.";

    const systemAppend =
      "You are in autonomous mode. " +
      "Update .orchestrator/progress.md as you work. " +
      "When the task is fully complete, write TASK_COMPLETE to .orchestrator/task-signal. " +
      "If stuck after 3 attempts at the same issue, write TASK_BLOCKED to .orchestrator/task-signal.";

    log.info(`--- Iteration ${state.iteration} ---`);

    try {
      const shouldFork = !useFreshSession && state.compactions > 3;
      if (shouldFork) {
        log.info("Forking session due to >3 compactions.");
      }
      if (useFreshSession && !isFirstIteration) {
        log.info("Fresh session mode: starting clean context.");
      }

      const mcpServers = loadMcpServers();

      const response = query({
        prompt,
        options: {
          maxTurns: task.turnsPerIteration,
          maxBudgetUsd: task.maxBudgetUsd,
          cwd,
          resume: useFreshSession ? undefined : (state.sessionId ?? undefined),
          forkSession: shouldFork,
          canUseTool: buildCanUseTool(log),
          hooks: {
            Stop: [{ hooks: [buildStopHook(state, log)] }],
            PreCompact: [{ hooks: [buildPreCompactHook(state, log)] }],
          },
          systemPrompt: {
            type: "preset" as const,
            preset: "claude_code" as const,
            append: systemAppend,
          },
          settingSources: ["project" as const],
          ...(mcpServers ? { mcpServers: mcpServers as Record<string, never> } : {}),
          allowDangerouslySkipPermissions: true,
        },
      });

      for await (const message of response) {
        // Capture session ID from init message
        if (
          typeof message === "object" &&
          message !== null &&
          "type" in message &&
          message.type === "system" &&
          "subtype" in message &&
          message.subtype === "init" &&
          "session_id" in message
        ) {
          state.sessionId = message.session_id as string;
          if (shouldFork) {
            state.compactions = 0;
          }
        }

        // Also capture session_id from any message that has it
        if (typeof message === "object" && message !== null && "session_id" in message) {
          const sid = (message as Record<string, unknown>).session_id;
          if (typeof sid === "string") state.sessionId = sid;
        }

        log.message(message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.error(`Iteration ${state.iteration}: ${errorMsg}`);
      state.errors.push({ iteration: state.iteration, error: errorMsg });
      state.sessionId = null; // Fresh session after crash
      saveState(state);

      const backoff = Math.min(30_000, 1000 * 2 ** state.errors.length);
      log.info(`Backing off for ${backoff}ms`);
      await sleep(backoff);
      continue;
    }

    // Check signal file for completion
    const signal = readSignalFile();

    if (signal === "TASK_COMPLETE") {
      if (task.completionChecks.length > 0) {
        log.info("Running completion checks...");
        const checks = await runCompletionChecks(task.completionChecks, cwd);
        if (checks.allPassed) {
          state.status = "completed";
          saveState(state);
          log.info("Task complete. All checks passed.");
          break;
        }
        log.warn(`Completion signal but checks failed: ${checks.summary}`);
        clearSignalFile();
        // Next iteration will resume and Claude sees the failure
      } else {
        state.status = "completed";
        saveState(state);
        log.info("Task complete (no completion checks configured).");
        break;
      }
    }

    if (signal === "TASK_BLOCKED") {
      state.status = "blocked";
      saveState(state);
      log.info("Task blocked by Claude.");
      break;
    }

    // Stagnation detection
    updateStagnation(state);
    if (isStagnant(state, 3)) {
      state.status = "failed";
      saveState(state);
      log.warn("Stagnation detected: progress.md unchanged for 3 iterations.");
      break;
    }

    saveState(state);
  }

  if (state.status === "running") {
    // Ran out of iterations or time
    if (isTimedOut(state, task.maxHours)) {
      state.status = "failed";
      log.warn(`Timed out after ${task.maxHours} hours.`);
    } else {
      state.status = "failed";
      log.warn(`Exhausted ${task.maxIterations} iterations.`);
    }
    saveState(state);
  }

  log.info(`Finished. Status: ${state.status}, Iterations: ${state.iteration}`);
  process.exit(state.status === "completed" ? 0 : 1);
}

main().catch((err) => {
  log.error(`Fatal: ${err}`);
  state.status = "failed";
  saveState(state);
  process.exit(1);
});
