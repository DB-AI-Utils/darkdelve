import { mkdirSync, appendFileSync } from "fs";
import { join, dirname } from "path";

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  message(data: unknown): void;
}

export function createLogger(logDir: string): Logger {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[T:]/g, "-").slice(0, 16);
  const logFile = join(logDir, `${timestamp}.jsonl`);

  mkdirSync(dirname(logFile), { recursive: true });

  function write(level: string, msg: string) {
    const entry = JSON.stringify({ ts: new Date().toISOString(), level, msg });
    appendFileSync(logFile, entry + "\n");
    const prefix = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "INFO";
    console.error(`[${prefix}] ${msg}`);
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
