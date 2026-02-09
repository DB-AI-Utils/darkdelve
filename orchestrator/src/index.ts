import { existsSync } from "fs";
import { resolve } from "path";
import { parseTask } from "./task.js";
import { createConfig } from "./config.js";
import { runOrchestrator } from "./orchestrator-core.js";
import { wireFileLogger, wirePlainRenderer } from "./logger.js";

// --- Parse CLI args ---

const args = process.argv.slice(2);
const tuiFlag = args.includes("--tui");
const taskFile = args.find((a) => !a.startsWith("--"));

if (!taskFile && !process.env.TASK_FILE) {
  console.error("Usage: tsx src/index.ts <task-file> [--tui]");
  console.error("  or set TASK_FILE environment variable");
  process.exit(1);
}

const resolvedTaskFile = resolve(taskFile ?? process.env.TASK_FILE!);
if (!existsSync(resolvedTaskFile)) {
  console.error(`Task file not found: ${resolvedTaskFile}`);
  process.exit(1);
}

const task = parseTask(resolvedTaskFile);
const config = createConfig();

// --- Launch orchestrator ---

const emitter = runOrchestrator(task, config);

// Always write JSONL logs
wireFileLogger(emitter, config.logDir);

// --- Choose rendering mode ---

const isTTY = !!(process.stdout.isTTY && process.stdin.isTTY);

if (tuiFlag && isTTY) {
  // Dynamic import to avoid loading React/Ink when not needed
  const { renderApp } = await import("./tui/app.js");
  renderApp(emitter, task, config);
} else {
  if (tuiFlag && !isTTY) {
    console.error("Warning: --tui requires an interactive terminal. Falling back to plain mode.");
  }
  wirePlainRenderer(emitter);
}

// --- Exit on done ---

emitter.on("done", (ev) => {
  // Give a moment for final output to flush
  setTimeout(() => {
    process.exit(ev.status === "completed" ? 0 : 1);
  }, 100);
});
