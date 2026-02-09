import { nanoid } from "nanoid";
import { mkdirSync } from "fs";
import { paths } from "../paths.js";
import type { Task, TaskCreateInput, TaskStatus, TaskStore } from "../types.js";

export class MemoryTaskStore implements TaskStore {
  private tasks = new Map<string, Task>();

  create(input: TaskCreateInput): Task {
    const id = nanoid(12);
    const logDir = paths.taskLogDir(id);
    mkdirSync(logDir, { recursive: true });

    const task: Task = {
      id,
      prompt: input.prompt,
      projectDir: input.projectDir,
      worktreePath: "",
      status: "pending",
      containerId: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      exitCode: null,
      costUsd: 0,
      iteration: 0,
      logDir,
      error: null,
      maxIterations: input.maxIterations ?? 10,
      maxHours: input.maxHours ?? 4,
      maxBudgetUsd: input.maxBudgetUsd ?? 30,
      turnsPerIteration: input.turnsPerIteration ?? 30,
      completionChecks: input.completionChecks ?? [],
    };

    this.tasks.set(id, task);
    return task;
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(id: string, patch: Partial<Task>): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    Object.assign(task, patch);
    return task;
  }

  list(filter?: { status?: TaskStatus }): Task[] {
    const all = Array.from(this.tasks.values());
    if (!filter?.status) return all;
    return all.filter((t) => t.status === filter.status);
  }
}
