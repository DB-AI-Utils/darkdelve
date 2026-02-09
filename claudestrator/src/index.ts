#!/usr/bin/env node

/**
 * Claudestrator — host CLI entry point.
 * Manages Docker containers running Claude Agent SDK tasks.
 */

import Docker from "dockerode";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureDirs, paths } from "./paths.js";
import { MemoryTaskStore } from "./task/store.js";
import { TaskRunner } from "./task/runner.js";
import { cleanupOrphanedContainers, runLoginContainer } from "./docker/manager.js";
import { ensureImage } from "./docker/image.js";
import { pruneOrphanedWorktrees } from "./worktree.js";
import { createPlainRenderer } from "./logger.js";
import type { TaskCreateInput } from "./types.js";

// --- CLI arg parsing ---

interface CliArgs {
  command: "run" | "login" | "help";
  project?: string;
  prompt?: string;
  maxIterations?: number;
  maxHours?: number;
  maxBudgetUsd?: number;
  turnsPerIteration?: number;
  tui: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const firstArg = args[0];
  let command: CliArgs["command"] = "help";
  if (firstArg === "run") command = "run";
  else if (firstArg === "login") command = "login";
  else if (firstArg === "help" || firstArg === "--help" || firstArg === "-h") command = "help";
  else if (firstArg) command = "run"; // default to run if unknown

  const rest = ["run", "login", "help"].includes(firstArg) ? args.slice(1) : args;

  const map = new Map<string, string>();
  const positional: string[] = [];
  let tui = false;

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--tui") {
      tui = true;
    } else if (rest[i].startsWith("--") && i + 1 < rest.length) {
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
    tui,
  };
}

function printHelp(): void {
  console.log(`
Claudestrator — Autonomous Claude Agent SDK task runner in Docker

Commands:
  login                         Authenticate Claude inside Docker (run once)
  run --prompt <prompt>         Run a task
  help                          Show this help

Options (for 'run'):
  --project <dir>             Project directory (default: .)
  --prompt <prompt>           Task prompt (required)
  --max-iterations <n>        Max orchestrator iterations (default: 10)
  --max-hours <n>             Max hours (default: 4)
  --max-budget <n>            Max budget in USD (default: 30)
  --turns-per-iteration <n>   SDK turns per iteration (default: 30)
  --tui                       Show TUI dashboard

Examples:
  claudestrator login
  claudestrator run --project . --prompt "Fix the login bug"
  claudestrator run --project /repo --prompt "Add tests" --max-budget 5 --tui
`);
}

// --- Preflight checks ---

async function preflightChecks(docker: Docker): Promise<void> {
  // Check Docker daemon
  try {
    await docker.ping();
  } catch {
    console.error("Error: Docker daemon is not reachable. Is Docker running?");
    process.exit(1);
  }

  // Check git
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

  // Use docker run -it --rm directly for proper TTY passthrough
  runLoginContainer();

  // Verify auth was saved
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

// --- Run command ---

if (!cliArgs.prompt) {
  console.error("Error: --prompt is required. Use `claudestrator help` for usage.");
  process.exit(1);
}

checkAuth();

const projectDir = resolve(cliArgs.project ?? ".");
if (!existsSync(projectDir)) {
  console.error(`Error: Project directory not found: ${projectDir}`);
  process.exit(1);
}

// Startup reconciliation
const orphaned = await cleanupOrphanedContainers(docker);
if (orphaned > 0) {
  console.error(`Cleaned up ${orphaned} orphaned container(s).`);
}
pruneOrphanedWorktrees();

// Create store and runner
const store = new MemoryTaskStore();
const runner = new TaskRunner(docker, store, contextDir);

// Create task input
const input: TaskCreateInput = {
  prompt: cliArgs.prompt,
  projectDir,
  maxIterations: cliArgs.maxIterations,
  maxHours: cliArgs.maxHours,
  maxBudgetUsd: cliArgs.maxBudgetUsd,
  turnsPerIteration: cliArgs.turnsPerIteration,
};

// Wire rendering
const isTTY = !!(process.stdout.isTTY && process.stdin.isTTY);

if (cliArgs.tui && isTTY) {
  const task = store.create(input);
  const { renderApp } = await import("./tui/app.js");
  renderApp(runner, task);
  runner.run(input, task.id).then((finalTask) => {
    setTimeout(() => {
      process.exit(finalTask.status === "completed" ? 0 : 1);
    }, 500);
  });
} else {
  if (cliArgs.tui && !isTTY) {
    console.error("Warning: --tui requires an interactive terminal. Falling back to plain mode.");
  }

  const renderer = createPlainRenderer();
  runner.on("event", (taskId, event) => renderer(taskId, event));

  const finalTask = await runner.run(input);
  process.exit(finalTask.status === "completed" ? 0 : 1);
}
