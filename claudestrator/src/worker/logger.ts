import { mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";
import type { WorkerEvent, WorkerEventRecord } from "../types.js";

/**
 * JSONL event writer for the worker process.
 * Writes structured events to /logs/events.jsonl (bind-mounted from host).
 */
export class WorkerLogger {
  private filePath: string;

  constructor(logDir: string) {
    this.filePath = `${logDir}/events.jsonl`;
    mkdirSync(dirname(this.filePath), { recursive: true });
  }

  emit(event: WorkerEvent): void {
    const record: WorkerEventRecord = {
      ts: new Date().toISOString(),
      event,
    };
    appendFileSync(this.filePath, JSON.stringify(record) + "\n");
  }
}
