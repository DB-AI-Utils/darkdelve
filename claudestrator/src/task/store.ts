import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import { mkdirSync } from "fs";
import { paths } from "../paths.js";
import type { Task, TaskCreateInput, TaskStatus, TaskStore, CompletionCheck } from "../types.js";

interface TaskRow {
  id: string;
  prompt: string;
  projectDir: string;
  worktreePath: string;
  status: string;
  containerId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  costUsd: number;
  iteration: number;
  logDir: string;
  error: string | null;
  maxIterations: number;
  maxHours: number;
  maxBudgetUsd: number;
  turnsPerIteration: number;
  completionChecks: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    prompt: row.prompt,
    projectDir: row.projectDir,
    worktreePath: row.worktreePath,
    status: row.status as TaskStatus,
    containerId: row.containerId ?? null,
    createdAt: row.createdAt,
    startedAt: row.startedAt ?? null,
    finishedAt: row.finishedAt ?? null,
    exitCode: row.exitCode ?? null,
    costUsd: row.costUsd,
    iteration: row.iteration,
    logDir: row.logDir,
    error: row.error ?? null,
    maxIterations: row.maxIterations,
    maxHours: row.maxHours,
    maxBudgetUsd: row.maxBudgetUsd,
    turnsPerIteration: row.turnsPerIteration,
    completionChecks: JSON.parse(row.completionChecks) as CompletionCheck[],
  };
}

export class SqliteTaskStore implements TaskStore {
  private db: Database.Database;

  constructor(dbPath: string = paths.tasksDb) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        projectDir TEXT NOT NULL,
        worktreePath TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        containerId TEXT,
        createdAt TEXT NOT NULL,
        startedAt TEXT,
        finishedAt TEXT,
        exitCode INTEGER,
        costUsd REAL NOT NULL DEFAULT 0,
        iteration INTEGER NOT NULL DEFAULT 0,
        logDir TEXT NOT NULL,
        error TEXT,
        maxIterations INTEGER NOT NULL DEFAULT 10,
        maxHours REAL NOT NULL DEFAULT 4,
        maxBudgetUsd REAL NOT NULL DEFAULT 30,
        turnsPerIteration INTEGER NOT NULL DEFAULT 30,
        completionChecks TEXT NOT NULL DEFAULT '[]'
      )
    `);
  }

  create(input: TaskCreateInput): Task {
    const id = nanoid(12);
    const logDir = paths.taskLogDir(id);
    mkdirSync(logDir, { recursive: true });

    const now = new Date().toISOString();
    const checks = JSON.stringify(input.completionChecks ?? []);

    this.db.prepare(`
      INSERT INTO tasks (id, prompt, projectDir, createdAt, logDir, maxIterations, maxHours, maxBudgetUsd, turnsPerIteration, completionChecks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.prompt,
      input.projectDir,
      now,
      logDir,
      input.maxIterations ?? 10,
      input.maxHours ?? 4,
      input.maxBudgetUsd ?? 30,
      input.turnsPerIteration ?? 30,
      checks,
    );

    return this.get(id)!;
  }

  get(id: string): Task | undefined {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : undefined;
  }

  update(id: string, patch: Partial<Task>): Task {
    const task = this.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const entries = Object.entries(patch).filter(([key]) => key !== "id");
    if (entries.length === 0) return task;

    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of entries) {
      sets.push(`${key} = ?`);
      if (key === "completionChecks") {
        values.push(JSON.stringify(value));
      } else {
        values.push(value ?? null);
      }
    }

    values.push(id);
    this.db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.get(id)!;
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  }

  list(filter?: { status?: TaskStatus }): Task[] {
    if (filter?.status) {
      const rows = this.db.prepare("SELECT * FROM tasks WHERE status = ? ORDER BY createdAt ASC").all(filter.status) as TaskRow[];
      return rows.map(rowToTask);
    }
    const rows = this.db.prepare("SELECT * FROM tasks ORDER BY createdAt ASC").all() as TaskRow[];
    return rows.map(rowToTask);
  }
}
