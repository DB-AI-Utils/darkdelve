import { mkdirSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import type { OrchestratorEmitter } from "./orchestrator-core.js";

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  message(data: unknown): void;
}

/**
 * Creates a JSONL file logger. Always active regardless of TUI/plain mode.
 */
export function createFileLogger(logDir: string): Logger {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[T:]/g, "-").slice(0, 16);
  const logFile = join(logDir, `${timestamp}.jsonl`);

  mkdirSync(dirname(logFile), { recursive: true });

  function write(level: string, msg: string) {
    const entry = JSON.stringify({ ts: new Date().toISOString(), level, msg });
    appendFileSync(logFile, entry + "\n");
  }

  return {
    info: (msg) => write("info", msg),
    warn: (msg) => write("warn", msg),
    error: (msg) => write("error", msg),
    message(data) {
      const entry = JSON.stringify({ ts: new Date().toISOString(), level: "message", data });
      appendFileSync(logFile, entry + "\n");
    },
  };
}

/**
 * Wire JSONL logging to emitter events.
 */
export function wireFileLogger(emitter: OrchestratorEmitter, logDir: string): void {
  const log = createFileLogger(logDir);

  emitter.on("iteration:start", (ev) => {
    log.info(`--- Iteration ${ev.iteration}/${ev.maxIterations} (${ev.fresh ? "fresh" : "resume"}) ---`);
  });

  emitter.on("iteration:end", (ev) => {
    log.info(`Iteration ${ev.iteration} ended: $${ev.costUsd.toFixed(2)}, ${ev.numTurns} turns, ${(ev.durationMs / 1000).toFixed(1)}s`);
  });

  emitter.on("message", (ev) => {
    log.message(ev.message);
  });

  emitter.on("error", (ev) => {
    log.error(`Iteration ${ev.iteration}: ${ev.error} (backoff ${ev.backoffMs}ms)`);
  });

  emitter.on("signal", (ev) => {
    log.info(`Signal: ${ev.signal}`);
  });

  emitter.on("completion", (ev) => {
    if (ev.allPassed) {
      log.info("Task complete. All checks passed.");
    } else {
      log.warn(`Completion signal but checks failed: ${ev.summary}`);
    }
  });

  emitter.on("stagnation", (ev) => {
    log.warn(`Stagnation detected: progress.md unchanged for ${ev.stagnantCount} iterations.`);
  });

  emitter.on("timeout", () => {
    log.warn("Timed out.");
  });

  emitter.on("done", (ev) => {
    log.info(`Finished. Status: ${ev.status}, Iterations: ${ev.iterations}, Cost: $${ev.totalCostUsd.toFixed(2)}`);
  });
}

/**
 * Plain stderr renderer for non-TUI mode. Subscribes to emitter and prints colored text.
 */
export function wirePlainRenderer(emitter: OrchestratorEmitter): void {
  const useColor = process.stderr.isTTY ?? false;

  const color = {
    gray: (s: string) => useColor ? `\x1b[90m${s}\x1b[0m` : s,
    cyan: (s: string) => useColor ? `\x1b[36m${s}\x1b[0m` : s,
    yellow: (s: string) => useColor ? `\x1b[33m${s}\x1b[0m` : s,
    red: (s: string) => useColor ? `\x1b[31m${s}\x1b[0m` : s,
    green: (s: string) => useColor ? `\x1b[32m${s}\x1b[0m` : s,
    blue: (s: string) => useColor ? `\x1b[34m${s}\x1b[0m` : s,
  };

  function log(prefix: string, msg: string) {
    process.stderr.write(`${prefix} ${msg}\n`);
  }

  emitter.on("iteration:start", (ev) => {
    log(color.cyan("[ITER]"), `--- Iteration ${ev.iteration}/${ev.maxIterations} (${ev.fresh ? "fresh" : "resume"}) ---`);
  });

  emitter.on("iteration:end", (ev) => {
    log(color.gray("[INFO]"), `Iteration ${ev.iteration}: $${ev.costUsd.toFixed(2)}, ${ev.numTurns} turns, ${(ev.durationMs / 1000).toFixed(1)}s`);
  });

  emitter.on("message", (ev) => {
    const msg = ev.message;
    if (typeof msg !== "object" || msg === null) return;

    const m = msg as Record<string, unknown>;

    if (m.type === "assistant" && "message" in m) {
      const betaMsg = m.message as Record<string, unknown>;
      if (betaMsg && Array.isArray(betaMsg.content)) {
        for (const block of betaMsg.content) {
          if (block.type === "text") {
            const text = (block.text as string).slice(0, 200);
            log(color.cyan("[CLAUDE]"), text);
          } else if (block.type === "tool_use") {
            log(color.blue("[TOOL]"), `${block.name}: ${JSON.stringify(block.input).slice(0, 150)}`);
          }
        }
      }
    } else if (m.type === "system" && m.subtype === "init") {
      log(color.gray("[INIT]"), `model=${(m as Record<string, unknown>).model}, session=${(m as Record<string, unknown>).session_id}`);
    } else if (m.type === "result") {
      const cost = (m as Record<string, unknown>).total_cost_usd;
      const turns = (m as Record<string, unknown>).num_turns;
      log(color.green("[RESULT]"), `turns=${turns}, cost=$${typeof cost === "number" ? cost.toFixed(2) : "?"}`);
    }
  });

  emitter.on("error", (ev) => {
    log(color.red("[ERROR]"), `Iteration ${ev.iteration}: ${ev.error}`);
  });

  emitter.on("signal", (ev) => {
    log(color.green("[SIGNAL]"), ev.signal);
  });

  emitter.on("completion", (ev) => {
    if (ev.allPassed) {
      log(color.green("[DONE]"), "All completion checks passed.");
    } else {
      log(color.yellow("[WARN]"), `Checks failed: ${ev.summary}`);
    }
  });

  emitter.on("stagnation", (ev) => {
    log(color.yellow("[WARN]"), `Stagnation: ${ev.stagnantCount}/${ev.threshold} unchanged iterations.`);
  });

  emitter.on("timeout", () => {
    log(color.yellow("[WARN]"), "Timed out.");
  });

  emitter.on("done", (ev) => {
    log(color.gray("[DONE]"), `Status: ${ev.status}, Iterations: ${ev.iterations}, Cost: $${ev.totalCostUsd.toFixed(2)}`);
  });
}
