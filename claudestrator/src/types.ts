// --- Completion checks (shared between host and worker) ---

export type CompletionCheck =
  | { type: "command"; cmd: string; timeout_sec?: number }
  | { type: "file_exists"; path: string }
  | { type: "glob_exists"; pattern: string; min_count: number }
  | { type: "review"; prompt: string; files?: string[] };

// --- Task (host-side) ---

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface Task {
  id: string;
  prompt: string;
  projectDir: string;
  worktreePath: string;
  status: TaskStatus;
  containerId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  costUsd: number;
  iteration: number;
  logDir: string;
  error: string | null;
  // Task config
  maxIterations: number;
  maxHours: number;
  maxBudgetUsd: number;
  turnsPerIteration: number;
  completionChecks: CompletionCheck[];
}

export interface TaskCreateInput {
  prompt: string;
  projectDir: string;
  maxIterations?: number;
  maxHours?: number;
  maxBudgetUsd?: number;
  turnsPerIteration?: number;
  completionChecks?: CompletionCheck[];
}

export interface TaskStore {
  create(input: TaskCreateInput): Task;
  get(id: string): Task | undefined;
  update(id: string, patch: Partial<Task>): Task;
  list(filter?: { status?: TaskStatus }): Task[];
}

// --- JSONL Events (shared between worker and host) ---

export type WorkerEvent =
  | { type: "iteration:start"; iteration: number; maxIterations: number; fresh: boolean }
  | { type: "iteration:end"; iteration: number; costUsd: number; durationMs: number; numTurns: number }
  | { type: "message"; source: "claude" | "tool" | "system"; text: string }
  | { type: "error"; iteration: number; error: string }
  | { type: "signal"; signal: string }
  | { type: "completion"; allPassed: boolean; summary: string }
  | { type: "stagnation"; stagnantCount: number; threshold: number }
  | { type: "timeout" }
  | { type: "done"; status: string; iterations: number; totalCostUsd: number };

export interface WorkerEventRecord {
  ts: string;
  event: WorkerEvent;
}

// --- Worker config (passed via CLI args to container) ---

export interface WorkerConfig {
  prompt: string;
  maxIterations: number;
  maxHours: number;
  maxBudgetUsd: number;
  turnsPerIteration: number;
  logDir: string;
  completionChecks: CompletionCheck[];
}
