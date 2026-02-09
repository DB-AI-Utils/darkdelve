import { readFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { RuntimeConfig } from "./config.js";
import type { Logger } from "./logger.js";
import type { OrchestratorState } from "./state.js";

// --- Signal file helpers ---

export function readSignalFile(config: RuntimeConfig): string | null {
  if (!existsSync(config.signalFile)) return null;
  return readFileSync(config.signalFile, "utf-8").trim();
}

export function clearSignalFile(config: RuntimeConfig): void {
  mkdirSync(dirname(config.signalFile), { recursive: true });
  if (existsSync(config.signalFile)) unlinkSync(config.signalFile);
}

// --- Stop Hook ---

export function buildStopHook(state: OrchestratorState, log: Logger, config: RuntimeConfig) {
  let consecutiveBlocks = 0;

  return async (input: Record<string, unknown>) => {
    if (input.stop_hook_active) return {};

    if (existsSync(config.signalFile)) {
      const signal = readFileSync(config.signalFile, "utf-8").trim();
      if (signal === "TASK_COMPLETE" || signal === "TASK_BLOCKED") {
        consecutiveBlocks = 0;
        log.info(`Stop allowed: signal=${signal}`);
        return {};
      }
    }

    if (consecutiveBlocks >= 5) {
      consecutiveBlocks = 0;
      log.warn("Circuit breaker: allowing stop after 5 blocks.");
      return {};
    }

    consecutiveBlocks++;
    log.info(`Stop blocked (#${consecutiveBlocks}). Telling Claude to continue.`);

    return {
      decision: "block" as const,
      reason:
        "Task is not complete. Check .orchestrator/progress.md and continue working. " +
        "When finished, write TASK_COMPLETE to .orchestrator/task-signal. " +
        "If stuck, write TASK_BLOCKED to .orchestrator/task-signal.",
    };
  };
}

// --- PreCompact Hook ---

export function buildPreCompactHook(state: OrchestratorState, log: Logger) {
  return async () => {
    state.compactions++;
    log.info(`Compaction #${state.compactions} detected.`);
    return {};
  };
}

// --- canUseTool ---

const DENY_BASH_PATTERNS = [
  /\brm\s+-rf\s+[\/~\.]/i,
  /\bgit\s+push\s+.*--force\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+.*-f\b/i,
  /\bnpm\s+publish\b/i,
  /\bcurl\b.*\|\s*(sh|bash)\b/i,
];

const PROTECTED_FILES = [".env", ".npmrc", ".orchestrator/state.json"];

export function buildCanUseTool(log: Logger) {
  return async (toolName: string, input: Record<string, unknown>) => {
    if (toolName === "Bash") {
      const cmd = input.command as string;
      for (const pattern of DENY_BASH_PATTERNS) {
        if (pattern.test(cmd)) {
          log.warn(`Blocked dangerous command: ${cmd}`);
          return { behavior: "deny" as const, message: `Blocked dangerous command: ${cmd}` };
        }
      }
    }

    if (toolName === "Write" || toolName === "Edit") {
      const filePath = input.file_path as string;
      if (filePath && PROTECTED_FILES.some((p) => filePath.endsWith(p))) {
        log.warn(`Blocked write to protected file: ${filePath}`);
        return { behavior: "deny" as const, message: `Protected file: ${filePath}` };
      }
    }

    return { behavior: "allow" as const, updatedInput: input };
  };
}
