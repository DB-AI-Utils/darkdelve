import { EventEmitter } from "events";
import Docker from "dockerode";
import { TaskRunner } from "./runner.js";
import { stopContainer } from "../docker/manager.js";
import type { Task, TaskCreateInput, TaskStore, WorkerEvent } from "../types.js";

interface SchedulerEvents {
  event: [string, WorkerEvent];
  taskUpdate: [Task];
}

export class TaskScheduler extends EventEmitter<SchedulerEvents> {
  readonly store: TaskStore;
  private docker: Docker;
  private contextDir: string;
  private maxConcurrent: number;
  private sessionId: string;
  private activeRunners = new Map<string, TaskRunner>();
  private cancelledSet = new Set<string>();
  private ticking = false;
  private started = false;

  constructor(docker: Docker, store: TaskStore, contextDir: string, maxConcurrent = 3, sessionId = "") {
    super();
    this.docker = docker;
    this.store = store;
    this.contextDir = contextDir;
    this.maxConcurrent = maxConcurrent;
    this.sessionId = sessionId;
  }

  enqueue(input: TaskCreateInput): Task {
    const task = this.store.create(input);
    this.emit("taskUpdate", task);
    this.tick();
    return task;
  }

  async cancel(taskId: string): Promise<void> {
    const task = this.store.get(taskId);
    if (!task) return;

    if (task.status === "pending") {
      this.store.update(taskId, {
        status: "cancelled",
        finishedAt: new Date().toISOString(),
      });
      this.emit("taskUpdate", this.store.get(taskId)!);
      return;
    }

    if (task.status === "running") {
      this.cancelledSet.add(taskId);

      // Stop the container if we have a containerId
      if (task.containerId) {
        try {
          const container = this.docker.getContainer(task.containerId);
          await stopContainer(container);
        } catch {
          // Container may already be gone
        }
      }
    }
  }

  delete(taskId: string): void {
    const task = this.store.get(taskId);
    if (!task) return;
    if (task.status === "running" || task.status === "pending") return;
    this.store.delete(taskId);
    this.emit("taskUpdate", task);
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    // Set up graceful shutdown
    const onSignal = () => {
      this.shutdown().then(() => process.exit(0));
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);

    this.tick();
  }

  async shutdown(): Promise<void> {
    const cancelPromises = Array.from(this.activeRunners.keys()).map((id) =>
      this.cancel(id),
    );
    await Promise.allSettled(cancelPromises);
    // Brief wait for runners to finish cleanup
    await new Promise((r) => setTimeout(r, 2000));
  }

  private tick(): void {
    if (this.ticking) return;
    this.ticking = true;

    try {
      while (this.activeRunners.size < this.maxConcurrent) {
        const pending = this.store.list({ status: "pending" })
          .filter((t) => !this.activeRunners.has(t.id));
        if (pending.length === 0) break;

        const task = pending[0];
        this.launchTask(task);
      }
    } finally {
      this.ticking = false;
    }
  }

  private launchTask(task: Task): void {
    const runner = new TaskRunner(this.docker, this.store, this.contextDir, this.sessionId);
    this.activeRunners.set(task.id, runner);

    // Forward runner events
    runner.on("event", (taskId, event) => {
      this.emit("event", taskId, event);
    });
    runner.on("taskUpdate", (updated) => {
      this.emit("taskUpdate", updated);
    });

    // Build input from stored task
    const input: TaskCreateInput = {
      prompt: task.prompt,
      projectDir: task.projectDir,
      maxIterations: task.maxIterations,
      maxHours: task.maxHours,
      maxBudgetUsd: task.maxBudgetUsd,
      turnsPerIteration: task.turnsPerIteration,
      completionChecks: task.completionChecks,
    };

    // Fire-and-forget — no await
    runner.run(input, task.id).then(() => {
      this.activeRunners.delete(task.id);

      // If task was cancelled while running, fix status only if runner
      // didn't already set a terminal state
      if (this.cancelledSet.has(task.id)) {
        this.cancelledSet.delete(task.id);
        const current = this.store.get(task.id);
        if (current && (current.status === "running" || current.status === "failed")) {
          this.store.update(task.id, {
            status: "cancelled",
            finishedAt: new Date().toISOString(),
          });
          this.emit("taskUpdate", this.store.get(task.id)!);
        }
      }

      // Try to pick up more pending tasks
      this.tick();
    }).catch(() => {
      // Runner.run() already handles errors internally, but just in case
      this.activeRunners.delete(task.id);
      this.tick();
    });
  }
}
