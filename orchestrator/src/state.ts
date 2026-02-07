import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

export interface OrchestratorState {
  taskFile: string;
  sessionId: string | null;
  iteration: number;
  startedAt: string;
  status: "running" | "completed" | "blocked" | "failed";
  compactions: number;
  errors: Array<{ iteration: number; error: string }>;
  progressHash: string | null;
  stagnantCount: number;
}

const STATE_DIR = ".orchestrator";
const STATE_FILE = join(STATE_DIR, "state.json");
const PROGRESS_FILE = join(STATE_DIR, "progress.md");

export function loadState(taskFile: string): OrchestratorState {
  if (existsSync(STATE_FILE)) {
    const raw = readFileSync(STATE_FILE, "utf-8");
    const state = JSON.parse(raw) as OrchestratorState;
    // Only resume if same task file
    if (state.taskFile === taskFile) return state;
  }

  return {
    taskFile,
    sessionId: null,
    iteration: 0,
    startedAt: new Date().toISOString(),
    status: "running",
    compactions: 0,
    errors: [],
    progressHash: null,
    stagnantCount: 0,
  };
}

export function saveState(state: OrchestratorState): void {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = STATE_FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, STATE_FILE);
}

export function hashProgress(): string | null {
  if (!existsSync(PROGRESS_FILE)) return null;
  const content = readFileSync(PROGRESS_FILE, "utf-8");
  return createHash("md5").update(content).digest("hex");
}

export function updateStagnation(state: OrchestratorState): void {
  const currentHash = hashProgress();
  if (currentHash === null) {
    // No progress file yet — not stagnant
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

export function isStagnant(state: OrchestratorState, threshold: number): boolean {
  return state.stagnantCount >= threshold;
}

export function isTimedOut(state: OrchestratorState, maxHours: number): boolean {
  const elapsed = Date.now() - new Date(state.startedAt).getTime();
  return elapsed >= maxHours * 60 * 60 * 1000;
}
