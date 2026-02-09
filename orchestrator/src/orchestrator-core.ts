import { EventEmitter } from "events";
import { query, AbortError } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, SDKResultMessage, SDKSystemMessage, Query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { RuntimeConfig } from "./config.js";
import type { TaskConfig } from "./task.js";
import { loadState, saveState, updateStagnation, isStagnant, isTimedOut } from "./state.js";
import type { OrchestratorState } from "./state.js";
import { buildStopHook, buildPreCompactHook, buildCanUseTool, readSignalFile, clearSignalFile } from "./hooks.js";
import { runCompletionChecks } from "./completion.js";

// --- Event types ---

export interface IterationStartEvent {
  iteration: number;
  maxIterations: number;
  sessionId: string | null;
  fresh: boolean;
}

export interface IterationEndEvent {
  iteration: number;
  costUsd: number;
  durationMs: number;
  numTurns: number;
}

export interface OrchestratorMessageEvent {
  message: SDKMessage;
}

export interface OrchestratorErrorEvent {
  iteration: number;
  error: string;
  backoffMs: number;
}

export interface SignalEvent {
  signal: string;
}

export interface CompletionEvent {
  allPassed: boolean;
  summary: string;
}

export interface StagnationEvent {
  stagnantCount: number;
  threshold: number;
}

export interface DoneEvent {
  status: OrchestratorState["status"];
  iterations: number;
  totalCostUsd: number;
}

export interface OrchestratorEvents {
  "iteration:start": [IterationStartEvent];
  "iteration:end": [IterationEndEvent];
  message: [OrchestratorMessageEvent];
  error: [OrchestratorErrorEvent];
  signal: [SignalEvent];
  completion: [CompletionEvent];
  stagnation: [StagnationEvent];
  timeout: [];
  done: [DoneEvent];
}

export class OrchestratorEmitter extends EventEmitter<OrchestratorEvents> {
  private _abortController: AbortController | null = null;
  private _state: OrchestratorState;

  constructor(state: OrchestratorState) {
    super();
    this._state = state;
  }

  /** Abort the current iteration (force timeout). */
  abort(): void {
    this._abortController?.abort();
  }

  get state(): Readonly<OrchestratorState> {
    return this._state;
  }

  /** Set the abort controller for the current iteration (called by the run loop). */
  _setAbortController(ac: AbortController): void {
    this._abortController = ac;
  }
}

// --- MCP loader ---

function loadMcpServers(cwd: string): Record<string, unknown> | undefined {
  const mcpPath = resolve(cwd, ".mcp.json");
  if (!existsSync(mcpPath)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(mcpPath, "utf-8"));
    return raw.mcpServers ?? raw;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Main orchestrator ---

export function runOrchestrator(
  task: TaskConfig,
  config: RuntimeConfig,
): OrchestratorEmitter {
  const state = loadState(task.filePath, config);
  const emitter = new OrchestratorEmitter(state);

  // Run the loop asynchronously
  (async () => {
    try {
      await orchestratorLoop(task, config, state, emitter);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emitter.emit("error", { iteration: state.iteration, error: `Fatal: ${msg}`, backoffMs: 0 });
      state.status = "failed";
      saveState(state, config);
      emitter.emit("done", {
        status: state.status,
        iterations: state.iteration,
        totalCostUsd: state.totalCostUsd,
      });
    }
  })();

  return emitter;
}

async function orchestratorLoop(
  task: TaskConfig,
  config: RuntimeConfig,
  state: OrchestratorState,
  emitter: OrchestratorEmitter,
): Promise<void> {
  while (state.iteration < task.maxIterations && !isTimedOut(state, task.maxHours)) {
    state.iteration++;
    state.status = "running";
    saveState(state, config);
    clearSignalFile(config);

    const isFirstIteration = state.iteration === 1 && !state.sessionId;
    const useFreshSession = task.freshSession || isFirstIteration;

    emitter.emit("iteration:start", {
      iteration: state.iteration,
      maxIterations: task.maxIterations,
      sessionId: state.sessionId,
      fresh: useFreshSession,
    });

    const prompt = useFreshSession
      ? task.body + "\n\nCheck .orchestrator/progress.md for any prior progress."
      : `Continue working. Re-read the task file at ${task.filePath} if needed. ` +
        "Check .orchestrator/progress.md for current state.";

    const systemAppend =
      "You are in autonomous mode. " +
      "Update .orchestrator/progress.md as you work. " +
      "When the task is fully complete, write TASK_COMPLETE to .orchestrator/task-signal. " +
      "If stuck after 3 attempts at the same issue, write TASK_BLOCKED to .orchestrator/task-signal.";

    const ac = new AbortController();
    emitter._setAbortController(ac);

    const iterationStart = Date.now();
    let iterationCost = 0;
    let iterationTurns = 0;
    let wasAborted = false;

    try {
      const shouldFork = !useFreshSession && state.compactions > 3;
      if (shouldFork) {
        state.compactions = 0;
      }

      const mcpServers = loadMcpServers(config.cwd);

      // Hooks need a Logger interface — we use a no-op logger since
      // all meaningful events flow through the emitter instead.
      const logForHooks = {
        info: (_msg: string) => {},
        warn: (_msg: string) => {},
        error: (_msg: string) => {},
        message: (_data: unknown) => {},
      };

      const response: Query = query({
        prompt,
        options: {
          abortController: ac,
          maxTurns: task.turnsPerIteration,
          maxBudgetUsd: task.maxBudgetUsd,
          cwd: config.cwd,
          resume: useFreshSession ? undefined : (state.sessionId ?? undefined),
          forkSession: shouldFork,
          canUseTool: buildCanUseTool(logForHooks),
          hooks: {
            Stop: [{ hooks: [buildStopHook(state, logForHooks, config)] }],
            PreCompact: [{ hooks: [buildPreCompactHook(state, logForHooks)] }],
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
        emitter.emit("message", { message });

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
    } catch (err) {
      if (err instanceof AbortError || (err instanceof Error && err.name === "AbortError")) {
        // User-triggered abort — not a real error
        wasAborted = true;
        saveState(state, config);
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        state.errors.push({ iteration: state.iteration, error: errorMsg });
        state.sessionId = null;
        saveState(state, config);

        const backoff = Math.min(30_000, 1000 * 2 ** state.errors.length);
        emitter.emit("error", { iteration: state.iteration, error: errorMsg, backoffMs: backoff });
        await sleep(backoff);
        continue;
      }
    }

    const iterationDuration = Date.now() - iterationStart;
    state.totalCostUsd += iterationCost;

    emitter.emit("iteration:end", {
      iteration: state.iteration,
      costUsd: iterationCost,
      durationMs: iterationDuration,
      numTurns: iterationTurns,
    });

    if (wasAborted) {
      // Skip signal/stagnation checks for aborted iterations
      saveState(state, config);
      continue;
    }

    // Check signal file for completion
    const signal = readSignalFile(config);

    if (signal === "TASK_COMPLETE") {
      emitter.emit("signal", { signal });
      if (task.completionChecks.length > 0) {
        const checks = await runCompletionChecks(task.completionChecks, config.cwd);
        emitter.emit("completion", { allPassed: checks.allPassed, summary: checks.summary });
        if (checks.allPassed) {
          state.status = "completed";
          saveState(state, config);
          break;
        }
        clearSignalFile(config);
      } else {
        state.status = "completed";
        saveState(state, config);
        break;
      }
    }

    if (signal === "TASK_BLOCKED") {
      emitter.emit("signal", { signal });
      state.status = "blocked";
      saveState(state, config);
      break;
    }

    // Stagnation detection
    updateStagnation(state, config);
    if (isStagnant(state, 3)) {
      emitter.emit("stagnation", { stagnantCount: state.stagnantCount, threshold: 3 });
      state.status = "failed";
      saveState(state, config);
      break;
    }

    saveState(state, config);
  }

  if (state.status === "running") {
    if (isTimedOut(state, task.maxHours)) {
      state.status = "failed";
      emitter.emit("timeout");
    } else {
      state.status = "failed";
    }
    saveState(state, config);
  }

  emitter.emit("done", {
    status: state.status,
    iterations: state.iteration,
    totalCostUsd: state.totalCostUsd,
  });
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
