import { readFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import type { Logger } from "./logger.js";
import type { OrchestratorState } from "./state.js";

const SIGNAL_DIR = ".orchestrator";
const SIGNAL_FILE = join(SIGNAL_DIR, "task-signal");

// --- Signal file helpers ---

export function readSignalFile(): string | null {
  if (!existsSync(SIGNAL_FILE)) return null;
  return readFileSync(SIGNAL_FILE, "utf-8").trim();
}

export function clearSignalFile(): void {
  mkdirSync(SIGNAL_DIR, { recursive: true });
  if (existsSync(SIGNAL_FILE)) unlinkSync(SIGNAL_FILE);
}

// --- Stop Hook ---

export function buildStopHook(state: OrchestratorState, log: Logger) {
  let consecutiveBlocks = 0;

  return async (input: Record<string, unknown>) => {
    // If another stop hook already handled this, don't interfere
    if (input.stop_hook_active) return {};

    // Check if Claude wrote a completion signal
    if (existsSync(SIGNAL_FILE)) {
      const signal = readFileSync(SIGNAL_FILE, "utf-8").trim();
      if (signal === "TASK_COMPLETE" || signal === "TASK_BLOCKED") {
        consecutiveBlocks = 0;
        log.info(`Stop allowed: signal=${signal}`);
        return {};
      }
    }

    // Circuit breaker: after 5 consecutive blocks, let it stop.
    // The outer loop will re-evaluate and resume if needed.
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
    // Block dangerous bash commands
    if (toolName === "Bash") {
      const cmd = input.command as string;
      for (const pattern of DENY_BASH_PATTERNS) {
        if (pattern.test(cmd)) {
          log.warn(`Blocked dangerous command: ${cmd}`);
          return { behavior: "deny" as const, message: `Blocked dangerous command: ${cmd}` };
        }
      }
    }

    // Block writes to protected files
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
