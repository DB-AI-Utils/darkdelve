import { query, AbortError } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, SDKResultMessage, SDKSystemMessage, Query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "fs";
import { createHash } from "crypto";
import { resolve, join } from "path";
import type { WorkerConfig, CompletionCheck } from "../types.js";
import { WorkerLogger } from "./logger.js";
import { buildStopHook, buildPreCompactHook, buildCanUseTool, readSignalFile, clearSignalFile } from "./hooks.js";
import { runCompletionChecks } from "./completion.js";

// --- Worker state (persisted to /logs/state.json) ---

interface WorkerState {
  sessionId: string | null;
  iteration: number;
  startedAt: string;
  status: "running" | "completed" | "blocked" | "failed";
  compactions: number;
  errors: Array<{ iteration: number; error: string }>;
  progressHash: string | null;
  stagnantCount: number;
  totalCostUsd: number;
}

function loadState(stateFile: string): WorkerState {
  if (existsSync(stateFile)) {
    try {
      const raw = readFileSync(stateFile, "utf-8");
      const state = JSON.parse(raw) as WorkerState;
      state.totalCostUsd ??= 0;
      return state;
    } catch {
      // corrupted state, start fresh
    }
  }

  return {
    sessionId: null,
    iteration: 0,
    startedAt: new Date().toISOString(),
    status: "running",
    compactions: 0,
    errors: [],
    progressHash: null,
    stagnantCount: 0,
    totalCostUsd: 0,
  };
}

function saveState(state: WorkerState, stateFile: string): void {
  const tmp = stateFile + ".tmp";
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, stateFile);
}

function hashProgress(cwd: string): string | null {
  const progressFile = resolve(cwd, ".orchestrator/progress.md");
  if (!existsSync(progressFile)) return null;
  const content = readFileSync(progressFile, "utf-8");
  return createHash("md5").update(content).digest("hex");
}

function updateStagnation(state: WorkerState, cwd: string): void {
  const currentHash = hashProgress(cwd);
  if (currentHash === null) {
    state.stagnantCount = 0;
    state.progressHash = null;
    return;
  }
  if (currentHash === state.progressHash) {
    state.stagnantCount++;
  } else {
    state.stagnantCount = 0;
  }
  state.progressHash = currentHash;
}

function isStagnant(state: WorkerState, threshold: number): boolean {
  return state.stagnantCount >= threshold;
}

function isTimedOut(state: WorkerState, maxHours: number): boolean {
  const elapsed = Date.now() - new Date(state.startedAt).getTime();
  return elapsed >= maxHours * 60 * 60 * 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- MCP loader ---

function loadMcpServers(cwd: string): Record<string, unknown> | undefined {
  const mcpPath = resolve(cwd, ".mcp.orchestrator.json");
  if (!existsSync(mcpPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(mcpPath, "utf-8"));
    return raw.mcpServers ?? raw;
  } catch {
    return undefined;
  }
}

// --- Type guards ---

function isSystemInit(msg: unknown): msg is SDKSystemMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    (msg as Record<string, unknown>).type === "system" &&
    "subtype" in msg &&
    (msg as Record<string, unknown>).subtype === "init" &&
    "session_id" in msg
  );
}

function isResultMessage(msg: unknown): msg is SDKResultMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    (msg as Record<string, unknown>).type === "result"
  );
}

// --- SDK message → WorkerEvent conversion ---

function emitSdkMessage(msg: SDKMessage, logger: WorkerLogger): void {
  const m = msg as Record<string, unknown>;

  if (m.type === "assistant" && "message" in m) {
    const betaMsg = m.message as Record<string, unknown>;
    if (betaMsg && Array.isArray(betaMsg.content)) {
      for (const block of betaMsg.content as Array<Record<string, unknown>>) {
        if (block.type === "text") {
          const text = (block.text as string).slice(0, 200).replace(/\n/g, " ");
          logger.emit({ type: "message", source: "claude", text });
        } else if (block.type === "tool_use") {
          const name = block.name as string;
          const input = JSON.stringify(block.input).slice(0, 120);
          logger.emit({ type: "message", source: "tool", text: `${name}: ${input}` });
        }
      }
    }
  } else if (m.type === "system" && m.subtype === "init") {
    const model = (m as Record<string, unknown>).model as string ?? "unknown";
    logger.emit({ type: "message", source: "system", text: `Init: model=${model}` });
  } else if (m.type === "result") {
    const cost = m.total_cost_usd as number;
    const turns = m.num_turns as number;
    const subtype = m.subtype as string | undefined;
    const resultText = m.result as string | undefined;
    logger.emit({ type: "message", source: "system", text: `Result: ${turns} turns, $${typeof cost === "number" ? cost.toFixed(2) : "?"}, subtype=${subtype ?? "ok"}` });
    if (resultText) {
      logger.emit({ type: "message", source: "system", text: `Result text: ${resultText.slice(0, 500)}` });
    }
  } else if (m.type === "tool_use_summary") {
    const summary = (m as Record<string, unknown>).summary as string;
    if (summary) {
      logger.emit({ type: "message", source: "tool", text: summary.slice(0, 200) });
    }
  }
}

// --- Main orchestrator loop ---

export async function runWorker(config: WorkerConfig): Promise<number> {
  const cwd = "/workspace";
  const stateFile = join(config.logDir, "state.json");
  const signalPath = resolve(cwd, ".orchestrator/task-signal");

  const logger = new WorkerLogger(config.logDir);
  const state = loadState(stateFile);

  // Ensure .orchestrator dir exists
  mkdirSync(resolve(cwd, ".orchestrator"), { recursive: true });

  try {
    await orchestratorLoop(config, state, logger, cwd, stateFile, signalPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.emit({ type: "error", iteration: state.iteration, error: `Fatal: ${msg}` });
    state.status = "failed";
    saveState(state, stateFile);
    logger.emit({
      type: "done",
      status: state.status,
      iterations: state.iteration,
      totalCostUsd: state.totalCostUsd,
    });
    return 1;
  }

  const exitCode = state.status === "completed" ? 0 : state.status === "blocked" ? 2 : 1;

  return exitCode;
}

async function orchestratorLoop(
  config: WorkerConfig,
  state: WorkerState,
  logger: WorkerLogger,
  cwd: string,
  stateFile: string,
  signalPath: string,
): Promise<void> {
  while (state.iteration < config.maxIterations && !isTimedOut(state, config.maxHours)) {
    state.iteration++;
    state.status = "running";
    saveState(state, stateFile);
    clearSignalFile(signalPath);

    const isFirstIteration = state.iteration === 1 && !state.sessionId;
    const useFreshSession = isFirstIteration;

    logger.emit({
      type: "iteration:start",
      iteration: state.iteration,
      maxIterations: config.maxIterations,
      fresh: useFreshSession,
    });

    const prompt = useFreshSession
      ? config.prompt + "\n\nCheck .orchestrator/progress.md for any prior progress."
      : "Continue working. Check .orchestrator/progress.md for current state.";

    const systemAppend =
      "You are in autonomous mode. " +
      "Update .orchestrator/progress.md as you work. " +
      "When the task is fully complete, commit all changes with a descriptive message using `git add -A && git commit -m '...'`, " +
      "then write TASK_COMPLETE to .orchestrator/task-signal. " +
      "If stuck after 3 attempts at the same issue, write TASK_BLOCKED to .orchestrator/task-signal.";

    const ac = new AbortController();
    const iterationStart = Date.now();
    let iterationCost = 0;
    let iterationTurns = 0;
    let wasAborted = false;

    try {
      const shouldFork = !useFreshSession && state.compactions > 3;
      if (shouldFork) {
        state.compactions = 0;
      }

      const mcpServers = loadMcpServers(cwd);

      logger.emit({ type: "message", source: "system", text: `Starting SDK query (cwd=${cwd}, resume=${!useFreshSession})` });

      const response: Query = query({
        prompt,
        options: {
          abortController: ac,
          maxTurns: config.turnsPerIteration,
          maxBudgetUsd: config.maxBudgetUsd,
          cwd,
          resume: useFreshSession ? undefined : (state.sessionId ?? undefined),
          forkSession: shouldFork,
          canUseTool: buildCanUseTool(),
          hooks: {
            Stop: [{ hooks: [buildStopHook(signalPath, state)] }],
            PreCompact: [{ hooks: [buildPreCompactHook(state)] }],
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

      let messageCount = 0;
      for await (const message of response) {
        messageCount++;
        const m = message as Record<string, unknown>;
        logger.emit({ type: "message", source: "system", text: `SDK msg #${messageCount}: type=${m.type}${m.subtype ? `, subtype=${m.subtype}` : ""}` });
        emitSdkMessage(message, logger);

        // Capture session ID
        if (isSystemInit(message)) {
          state.sessionId = message.session_id;
          if (shouldFork) {
            state.compactions = 0;
          }
        }

        if (typeof message === "object" && message !== null && "session_id" in message) {
          const sid = (message as Record<string, unknown>).session_id;
          if (typeof sid === "string") state.sessionId = sid;
        }

        // Capture cost from result messages
        if (isResultMessage(message)) {
          iterationCost = message.total_cost_usd ?? 0;
          iterationTurns = message.num_turns ?? 0;
        }
      }

      logger.emit({ type: "message", source: "system", text: `SDK query completed: ${messageCount} messages` });
    } catch (err) {
      const errType = err?.constructor?.name ?? typeof err;
      const errStr = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      logger.emit({ type: "message", source: "system", text: `SDK error (${errType}): ${errStr.slice(0, 500)}` });

      if (err instanceof AbortError || (err instanceof Error && err.name === "AbortError")) {
        wasAborted = true;
        saveState(state, stateFile);
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        state.errors.push({ iteration: state.iteration, error: errorMsg });
        state.sessionId = null;
        saveState(state, stateFile);

        const backoff = Math.min(30_000, 1000 * 2 ** state.errors.length);
        logger.emit({ type: "error", iteration: state.iteration, error: errorMsg });
        await sleep(backoff);
        continue;
      }
    }

    const iterationDuration = Date.now() - iterationStart;
    state.totalCostUsd += iterationCost;

    logger.emit({
      type: "iteration:end",
      iteration: state.iteration,
      costUsd: iterationCost,
      durationMs: iterationDuration,
      numTurns: iterationTurns,
    });

    if (wasAborted) {
      saveState(state, stateFile);
      continue;
    }

    // Check signal file
    const signal = readSignalFile(signalPath);

    if (signal === "TASK_COMPLETE") {
      logger.emit({ type: "signal", signal });
      if (config.completionChecks.length > 0) {
        const checks = await runCompletionChecks(config.completionChecks, cwd);
        logger.emit({ type: "completion", allPassed: checks.allPassed, summary: checks.summary });
        if (checks.allPassed) {
          state.status = "completed";
          saveState(state, stateFile);
          break;
        }
        clearSignalFile(signalPath);
      } else {
        state.status = "completed";
        saveState(state, stateFile);
        break;
      }
    }

    if (signal === "TASK_BLOCKED") {
      logger.emit({ type: "signal", signal });
      state.status = "blocked";
      saveState(state, stateFile);
      break;
    }

    // Stagnation detection
    updateStagnation(state, cwd);
    if (isStagnant(state, 3)) {
      logger.emit({ type: "stagnation", stagnantCount: state.stagnantCount, threshold: 3 });
      state.status = "failed";
      saveState(state, stateFile);
      break;
    }

    saveState(state, stateFile);
  }

  if (state.status === "running") {
    if (isTimedOut(state, config.maxHours)) {
      state.status = "failed";
      logger.emit({ type: "timeout" });
    } else {
      state.status = "failed";
    }
    saveState(state, stateFile);
  }

  logger.emit({
    type: "done",
    status: state.status,
    iterations: state.iteration,
    totalCostUsd: state.totalCostUsd,
  });
}
