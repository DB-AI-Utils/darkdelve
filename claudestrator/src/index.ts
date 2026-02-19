#!/usr/bin/env node

/**
 * Claudestrator — host CLI entry point.
 * Interactive dashboard for managing autonomous Claude Agent SDK tasks in Docker containers.
 */

import { randomUUID } from "crypto";
import Docker from "dockerode";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureDirs, paths } from "./paths.js";
import { SqliteTaskStore } from "./task/store.js";
import { TaskScheduler } from "./task/scheduler.js";
import { cleanupOrphanedContainers, runLoginContainer } from "./docker/manager.js";
import { ensureImage } from "./docker/image.js";
import { pruneOrphanedWorktrees } from "./worktree.js";
import { createPlainRenderer } from "./logger.js";
import type { TaskCreateInput } from "./types.js";

// --- CLI arg parsing ---

interface CliArgs {
  command: "dashboard" | "run" | "login" | "help";
  project?: string;
  prompt?: string;
  maxIterations?: number;
  maxHours?: number;
  maxBudgetUsd?: number;
  turnsPerIteration?: number;
  completionCmd?: string;
  completionReview?: string;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const firstArg = args[0];
  let command: CliArgs["command"] = "dashboard";

  if (firstArg === "run") command = "run";
  else if (firstArg === "login") command = "login";
  else if (firstArg === "help" || firstArg === "--help" || firstArg === "-h") command = "help";
  else if (!firstArg) command = "dashboard";
  else command = "help"; // unknown command

  const rest = ["run", "login", "help", "dashboard"].includes(firstArg) ? args.slice(1) : args;

  const map = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--") && i + 1 < rest.length) {
      map.set(rest[i].slice(2), rest[++i]);
    } else if (!rest[i].startsWith("--")) {
      positional.push(rest[i]);
    }
  }

  return {
    command,
    project: map.get("project") ?? map.get("p"),
    prompt: map.get("prompt") ?? positional[0],
    maxIterations: map.has("max-iterations") ? parseInt(map.get("max-iterations")!, 10) : undefined,
    maxHours: map.has("max-hours") ? parseFloat(map.get("max-hours")!) : undefined,
    maxBudgetUsd: map.has("max-budget") ? parseFloat(map.get("max-budget")!) : undefined,
    turnsPerIteration: map.has("turns-per-iteration") ? parseInt(map.get("turns-per-iteration")!, 10) : undefined,
    completionCmd: map.get("completion-cmd"),
    completionReview: map.get("completion-review"),
  };
}

function validatePositive(name: string, value: number | undefined): void {
  if (value !== undefined && (isNaN(value) || value <= 0)) {
    console.error(`Error: --${name} must be a positive number.`);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Claudestrator — Autonomous Claude Agent SDK task runner in Docker

Commands:
  (no args)                     Launch interactive dashboard
  run --prompt <prompt>         Queue a task and launch dashboard
  login                         Authenticate Claude inside Docker (run once)
  help                          Show this help

Options (for 'run'):
  --project <dir>             Project directory (default: .)
  --prompt <prompt>           Task prompt (required)
  --max-iterations <n>        Max orchestrator iterations (default: 10)
  --max-hours <n>             Max hours (default: 4)
  --max-budget <n>            Max budget in USD (default: 30)
  --turns-per-iteration <n>   SDK turns per iteration (default: 30)
  --completion-cmd <cmd>      Command to verify task completion (e.g. "npm test")
  --completion-review <prompt> AI review prompt to verify task completion

Examples:
  claudestrator
  claudestrator login
  claudestrator run --project . --prompt "Fix the login bug"
  claudestrator run --project /repo --prompt "Add tests" --max-budget 5
`);
}

// --- Preflight checks ---

async function preflightChecks(docker: Docker): Promise<void> {
  try {
    await docker.ping();
  } catch {
    console.error("Error: Docker daemon is not reachable. Is Docker running?");
    process.exit(1);
  }

  try {
    const { execSync } = await import("child_process");
    execSync("git --version", { stdio: "pipe" });
  } catch {
    console.error("Error: git is not available.");
    process.exit(1);
  }
}

function checkAuth(): void {
  const authDir = paths.auth;
  if (!existsSync(authDir) || readdirSync(authDir).length === 0) {
    console.error("Error: No auth credentials found. Run `claudestrator login` first.");
    process.exit(1);
  }
}

// --- Login flow ---

async function runLogin(docker: Docker, contextDir: string): Promise<void> {
  console.log("Starting login container...");
  console.log("Once inside, run: claude");
  console.log("Then use /login to authenticate.");
  console.log("Credentials will be saved to ~/.claudestrator/auth/");
  console.log("Press Ctrl+D or type 'exit' when done.\n");

  await ensureImage(docker, contextDir);
  runLoginContainer();

  const authFiles = readdirSync(paths.auth);
  if (authFiles.length > 0) {
    console.log(`\nAuth saved. Found ${authFiles.length} file(s) in ~/.claudestrator/auth/`);
  } else {
    console.log("\nWarning: No auth files found. Did you run /login?");
  }
}

// --- Main ---

const cliArgs = parseCliArgs(process.argv);

if (cliArgs.command === "help") {
  printHelp();
  process.exit(0);
}

// Ensure base directories exist
ensureDirs();

const docker = new Docker();
await preflightChecks(docker);

// Resolve claudestrator project dir (for Docker image builds)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contextDir = resolve(__dirname, "..");

if (cliArgs.command === "login") {
  await runLogin(docker, contextDir);
  process.exit(0);
}

// --- Dashboard / Run ---

checkAuth();

const sessionId = randomUUID().slice(0, 8);

// Create store early so cleanup can query task state
const store = new SqliteTaskStore();

// Session-aware container cleanup: skip containers belonging to our session
const orphaned = await cleanupOrphanedContainers(docker, sessionId);
if (orphaned > 0) {
  console.error(`Cleaned up ${orphaned} orphaned container(s).`);
}

// Worktree cleanup: protect worktrees belonging to non-terminal tasks
// (may include tasks from other running instances sharing the same DB)
const nonTerminalIds = new Set(
  store.list().filter((t) => t.status === "running" || t.status === "pending").map((t) => t.id),
);
pruneOrphanedWorktrees(nonTerminalIds);

const scheduler = new TaskScheduler(docker, store, contextDir, 3, sessionId);

// Recover stale "running" tasks from previous session
for (const task of store.list({ status: "running" })) {
  store.update(task.id, {
    status: "failed",
    error: "Process terminated unexpectedly (recovered on restart)",
    finishedAt: new Date().toISOString(),
  });
}

const isTTY = !!(process.stdout.isTTY && process.stdin.isTTY);

if (cliArgs.command === "run") {
  if (!cliArgs.prompt) {
    console.error("Error: --prompt is required for 'run'. Use `claudestrator help` for usage.");
    process.exit(1);
  }

  validatePositive("max-iterations", cliArgs.maxIterations);
  validatePositive("max-hours", cliArgs.maxHours);
  validatePositive("max-budget", cliArgs.maxBudgetUsd);
  validatePositive("turns-per-iteration", cliArgs.turnsPerIteration);

  const projectDir = resolve(cliArgs.project ?? ".");
  if (!existsSync(projectDir)) {
    console.error(`Error: Project directory not found: ${projectDir}`);
    process.exit(1);
  }

  const input: TaskCreateInput = {
    prompt: cliArgs.prompt,
    projectDir,
    maxIterations: cliArgs.maxIterations,
    maxHours: cliArgs.maxHours,
    maxBudgetUsd: cliArgs.maxBudgetUsd,
    turnsPerIteration: cliArgs.turnsPerIteration,
    completionChecks: (cliArgs.completionCmd || cliArgs.completionReview)
      ? [
          ...(cliArgs.completionCmd ? [{ type: "command" as const, cmd: cliArgs.completionCmd }] : []),
          ...(cliArgs.completionReview ? [{ type: "review" as const, prompt: cliArgs.completionReview }] : []),
        ]
      : undefined,
  };

  const task = scheduler.enqueue(input);

  if (isTTY) {
    const { renderApp } = await import("./tui/app.js");
    renderApp(scheduler, "detail", task.id);
    scheduler.start();
  } else {
    // Non-TTY: plain renderer, wait for this specific task
    const renderer = createPlainRenderer();
    scheduler.on("event", (taskId, event) => {
      if (taskId === task.id) renderer(taskId, event);
    });
    scheduler.start();

    // Poll until the task reaches a terminal state
    await new Promise<void>((resolve) => {
      const check = () => {
        const current = store.get(task.id);
        if (current && (current.status === "completed" || current.status === "failed" || current.status === "cancelled" || current.status === "blocked")) {
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      };
      check();
    });

    const finalTask = store.get(task.id)!;
    process.exit(finalTask.status === "completed" ? 0 : 1);
  }
} else {
  // Dashboard mode (no args)
  if (!isTTY) {
    console.error("Error: Dashboard requires an interactive terminal. Use `claudestrator run --prompt ...` for non-TTY mode.");
    process.exit(1);
  }

  const { renderApp } = await import("./tui/app.js");
  renderApp(scheduler, "list");
  scheduler.start();
}
