#!/usr/bin/env node

/**
 * Worker entry point — runs inside the Docker container.
 * Receives configuration via CLI arguments.
 */

import { runWorker } from "./worker/orchestrator.js";
import type { WorkerConfig, CompletionCheck } from "./types.js";

function parseArgs(argv: string[]): WorkerConfig {
  const args = argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && i + 1 < args.length) {
      map.set(arg.slice(2), args[++i]);
    }
  }

  const prompt = map.get("prompt");
  if (!prompt) {
    console.error("Error: --prompt is required");
    process.exit(1);
  }

  const logDir = map.get("log-dir") ?? "/logs";

  let completionChecks: CompletionCheck[] = [];
  const checksJson = map.get("completion-checks");
  if (checksJson) {
    try {
      completionChecks = JSON.parse(checksJson);
    } catch {
      console.error("Error: --completion-checks must be valid JSON");
      process.exit(1);
    }
  }

  return {
    prompt,
    maxIterations: parseInt(map.get("max-iterations") ?? "10", 10),
    maxHours: parseFloat(map.get("max-hours") ?? "4"),
    maxBudgetUsd: parseFloat(map.get("max-budget") ?? "30"),
    turnsPerIteration: parseInt(map.get("turns-per-iteration") ?? "30", 10),
    logDir,
    completionChecks,
  };
}

const config = parseArgs(process.argv);

process.stderr.write(`[worker] Starting: ${config.prompt.slice(0, 80)}...\n`);
process.stderr.write(`[worker] Config: iterations=${config.maxIterations}, budget=$${config.maxBudgetUsd}, turns=${config.turnsPerIteration}\n`);

const exitCode = await runWorker(config);
process.exit(exitCode);
