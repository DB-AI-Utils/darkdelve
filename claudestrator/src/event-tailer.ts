import { EventEmitter } from "events";
import { createReadStream, existsSync, watchFile, unwatchFile, statSync } from "fs";
import { createInterface } from "readline";
import type { WorkerEvent, WorkerEventRecord } from "./types.js";

interface EventTailerEvents {
  event: [WorkerEvent];
  error: [Error];
}

/**
 * Tails a JSONL events file on the host side.
 * Watches for new lines and emits parsed WorkerEvent objects.
 */
export class EventTailer extends EventEmitter<EventTailerEvents> {
  private filePath: string;
  private offset = 0;
  private running = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Poll-based approach: check file for new content every 500ms.
    // More reliable than fs.watch across platforms, and JSONL files
    // grow incrementally so polling is efficient.
    this.pollInterval = setInterval(() => {
      this.readNewLines();
    }, 500);

    // Also do an initial read
    this.readNewLines();
  }

  stop(): void {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private readNewLines(): void {
    if (!existsSync(this.filePath)) return;

    try {
      const stat = statSync(this.filePath);
      if (stat.size <= this.offset) return;

      const stream = createReadStream(this.filePath, {
        start: this.offset,
        encoding: "utf-8",
      });

      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      let bytesRead = 0;

      rl.on("line", (line) => {
        bytesRead += Buffer.byteLength(line, "utf-8") + 1; // +1 for newline
        if (!line.trim()) return;

        try {
          const record = JSON.parse(line) as WorkerEventRecord;
          this.emit("event", record.event);
        } catch (err) {
          this.emit("error", new Error(`Failed to parse JSONL line: ${line.slice(0, 100)}`));
        }
      });

      rl.on("close", () => {
        this.offset += bytesRead;
      });
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }
}
