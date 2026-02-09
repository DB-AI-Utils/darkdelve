import { EventEmitter } from "events";
import Docker from "dockerode";
import type { Task, TaskCreateInput, TaskStore, WorkerEvent } from "../types.js";
import { createWorktree, removeWorktree, createBranchFromWorktree } from "../worktree.js";
import { ensureImage } from "../docker/image.js";
import { createContainer, copyAuth, startContainer, waitContainer, removeContainer } from "../docker/manager.js";
import { EventTailer } from "../event-tailer.js";
import { paths } from "../paths.js";

interface TaskRunnerEvents {
  event: [string, WorkerEvent]; // [taskId, event]
  taskUpdate: [Task];
}

/**
 * TaskRunner coordinates the full lifecycle of a task:
 * worktree → Docker container → event tailing → cleanup.
 */
export class TaskRunner extends EventEmitter<TaskRunnerEvents> {
  private docker: Docker;
  private store: TaskStore;
  private contextDir: string;

  constructor(docker: Docker, store: TaskStore, contextDir: string) {
    super();
    this.docker = docker;
    this.store = store;
    this.contextDir = contextDir;
  }

  /**
   * Run a task end-to-end. Returns the completed/failed task.
   * If existingTaskId is provided, uses that task from the store instead of creating a new one.
   */
  async run(input: TaskCreateInput, existingTaskId?: string): Promise<Task> {
    const task = existingTaskId
      ? this.store.get(existingTaskId)!
      : this.store.create(input);
    this.emitUpdate(task);

    try {
      // 1. Create worktree
      const worktreePath = createWorktree(input.projectDir, task.id);
      this.store.update(task.id, { worktreePath });

      // 2. Ensure Docker image
      await ensureImage(this.docker, this.contextDir);

      // 3. Create container
      const container = await createContainer(this.docker, {
        taskId: task.id,
        prompt: input.prompt,
        worktreePath,
        logDir: task.logDir,
        maxIterations: task.maxIterations,
        maxHours: task.maxHours,
        maxBudgetUsd: task.maxBudgetUsd,
        turnsPerIteration: task.turnsPerIteration,
        completionChecks: JSON.stringify(task.completionChecks),
      });

      this.store.update(task.id, {
        containerId: container.id,
        status: "running",
        startedAt: new Date().toISOString(),
      });
      this.emitUpdate(task);

      // 4. Copy auth files
      await copyAuth(container);

      // 5. Start event tailer before starting container
      const tailer = new EventTailer(paths.taskEventsFile(task.id));
      tailer.on("event", (event) => {
        this.emit("event", task.id, event);
        this.handleWorkerEvent(task.id, event);
      });
      tailer.start();

      // 6. Start container
      await startContainer(container);

      // 7. Wait for container to exit
      const exitCode = await waitContainer(container);

      // 8. Stop tailer, give it a moment to read final lines
      await new Promise((r) => setTimeout(r, 1000));
      tailer.stop();

      // 9. Update task status based on exit code
      const finalStatus = exitCode === 0 ? "completed" as const : "failed" as const;
      this.store.update(task.id, {
        status: finalStatus,
        exitCode,
        finishedAt: new Date().toISOString(),
      });
      this.emitUpdate(task);

      // 10. Create branch from worktree if there are commits
      const branchName = createBranchFromWorktree(input.projectDir, worktreePath, task.id);
      if (branchName) {
        this.emit("event", task.id, { type: "message", source: "system", text: `Branch created: ${branchName}` });
      }

      // 11. Cleanup
      await removeContainer(container);
      removeWorktree(input.projectDir, worktreePath);

      return this.store.get(task.id)!;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.store.update(task.id, {
        status: "failed",
        error: errorMsg,
        finishedAt: new Date().toISOString(),
      });
      this.emitUpdate(task);

      // Best-effort cleanup
      if (task.worktreePath) {
        try {
          removeWorktree(input.projectDir, task.worktreePath);
        } catch { /* ignore */ }
      }

      return this.store.get(task.id)!;
    }
  }

  private handleWorkerEvent(taskId: string, event: WorkerEvent): void {
    switch (event.type) {
      case "iteration:end":
        this.store.update(taskId, {
          iteration: event.iteration,
          costUsd: (this.store.get(taskId)?.costUsd ?? 0) + event.costUsd,
        });
        break;
      case "done":
        this.store.update(taskId, {
          costUsd: event.totalCostUsd,
          iteration: event.iterations,
        });
        break;
    }
  }

  private emitUpdate(task: Task): void {
    const latest = this.store.get(task.id);
    if (latest) this.emit("taskUpdate", latest);
  }
}
