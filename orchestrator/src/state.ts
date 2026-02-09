import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import type { RuntimeConfig } from "./config.js";

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
  totalCostUsd: number;
}

export function loadState(taskFile: string, config: RuntimeConfig): OrchestratorState {
  const stateFile = join(config.stateDir, "state.json");
  if (existsSync(stateFile)) {
    const raw = readFileSync(stateFile, "utf-8");
    const state = JSON.parse(raw) as OrchestratorState;
    if (state.taskFile === taskFile) {
      // Ensure new fields exist for older state files
      state.totalCostUsd ??= 0;
      return state;
    }
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
    totalCostUsd: 0,
  };
}

export function saveState(state: OrchestratorState, config: RuntimeConfig): void {
  mkdirSync(config.stateDir, { recursive: true });
  const stateFile = join(config.stateDir, "state.json");
  const tmp = stateFile + ".tmp";
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, stateFile);
}

export function hashProgress(config: RuntimeConfig): string | null {
  if (!existsSync(config.progressFile)) return null;
  const content = readFileSync(config.progressFile, "utf-8");
  return createHash("md5").update(content).digest("hex");
}

export function updateStagnation(state: OrchestratorState, config: RuntimeConfig): void {
  const currentHash = hashProgress(config);
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

export function isStagnant(state: OrchestratorState, threshold: number): boolean {
  return state.stagnantCount >= threshold;
}

export function isTimedOut(state: OrchestratorState, maxHours: number): boolean {
  const elapsed = Date.now() - new Date(state.startedAt).getTime();
  return elapsed >= maxHours * 60 * 60 * 1000;
}
