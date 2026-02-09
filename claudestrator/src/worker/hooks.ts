import { readFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { dirname } from "path";

// --- Signal file helpers ---

export function readSignalFile(signalPath: string): string | null {
  if (!existsSync(signalPath)) return null;
  return readFileSync(signalPath, "utf-8").trim();
}

export function clearSignalFile(signalPath: string): void {
  mkdirSync(dirname(signalPath), { recursive: true });
  if (existsSync(signalPath)) unlinkSync(signalPath);
}

// --- Stop Hook ---

interface WorkerState {
  compactions: number;
}

export function buildStopHook(signalPath: string, state: WorkerState) {
  let consecutiveBlocks = 0;

  return async (input: Record<string, unknown>) => {
    if (input.stop_hook_active) return {};

    if (existsSync(signalPath)) {
      const signal = readFileSync(signalPath, "utf-8").trim();
      if (signal === "TASK_COMPLETE" || signal === "TASK_BLOCKED") {
        consecutiveBlocks = 0;
        return {};
      }
    }

    if (consecutiveBlocks >= 5) {
      consecutiveBlocks = 0;
      return {};
    }

    consecutiveBlocks++;

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

export function buildPreCompactHook(state: WorkerState) {
  return async () => {
    state.compactions++;
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

export function buildCanUseTool() {
  return async (toolName: string, input: Record<string, unknown>) => {
    if (toolName === "Bash") {
      const cmd = input.command as string;
      for (const pattern of DENY_BASH_PATTERNS) {
        if (pattern.test(cmd)) {
          return { behavior: "deny" as const, message: `Blocked dangerous command: ${cmd}` };
        }
      }
    }

    if (toolName === "Write" || toolName === "Edit") {
      const filePath = input.file_path as string;
      if (filePath && PROTECTED_FILES.some((p) => filePath.endsWith(p))) {
        return { behavior: "deny" as const, message: `Protected file: ${filePath}` };
      }
    }

    return { behavior: "allow" as const, updatedInput: input };
  };
}
