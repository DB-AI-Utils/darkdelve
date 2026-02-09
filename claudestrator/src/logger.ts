import type { WorkerEvent } from "./types.js";

/**
 * Plain stderr renderer for non-TUI mode.
 * Called with each WorkerEvent and prints colored text to stderr.
 */
export function createPlainRenderer(): (taskId: string, event: WorkerEvent) => void {
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

  return (_taskId: string, event: WorkerEvent) => {
    switch (event.type) {
      case "iteration:start":
        log(color.cyan("[ITER]"), `--- Iteration ${event.iteration}/${event.maxIterations} (${event.fresh ? "fresh" : "resume"}) ---`);
        break;
      case "iteration:end":
        log(color.gray("[INFO]"), `Iteration ${event.iteration}: $${event.costUsd.toFixed(2)}, ${event.numTurns} turns, ${(event.durationMs / 1000).toFixed(1)}s`);
        break;
      case "message":
        if (event.source === "claude") {
          log(color.cyan("[CLAUDE]"), event.text.slice(0, 200));
        } else if (event.source === "tool") {
          log(color.blue("[TOOL]"), event.text.slice(0, 200));
        } else {
          log(color.gray("[SYS]"), event.text.slice(0, 200));
        }
        break;
      case "error":
        log(color.red("[ERROR]"), `Iteration ${event.iteration}: ${event.error}`);
        break;
      case "signal":
        log(color.green("[SIGNAL]"), event.signal);
        break;
      case "completion":
        if (event.allPassed) {
          log(color.green("[DONE]"), "All completion checks passed.");
        } else {
          log(color.yellow("[WARN]"), `Checks failed: ${event.summary}`);
        }
        break;
      case "stagnation":
        log(color.yellow("[WARN]"), `Stagnation: ${event.stagnantCount}/${event.threshold} unchanged iterations.`);
        break;
      case "timeout":
        log(color.yellow("[WARN]"), "Timed out.");
        break;
      case "done":
        log(color.gray("[DONE]"), `Status: ${event.status}, Iterations: ${event.iterations}, Cost: $${event.totalCostUsd.toFixed(2)}`);
        break;
    }
  };
}
