import { join } from "path";
import { mkdirSync } from "fs";
import { homedir } from "os";

const BASE = join(homedir(), ".claudestrator");
const CLAUDE_DIR = join(homedir(), ".claude");
const CODEX_DIR = join(homedir(), ".codex");

export const paths = {
  base: BASE,
  logs: join(BASE, "logs"),
  worktrees: join(BASE, "worktrees"),
  auth: join(BASE, "auth"),
  tasksDb: join(BASE, "tasks.db"),
  /** ~/.claudestrator/claude.json — persisted from login container */
  claudeJson: join(BASE, "claude.json"),

  claudeDir: CLAUDE_DIR,
  claudeMd: join(CLAUDE_DIR, "CLAUDE.md"),
  claudeSettings: join(CLAUDE_DIR, "settings.json"),
  codexAuth: join(CODEX_DIR, "auth.json"),
  codexConfig: join(CODEX_DIR, "config.toml"),

  taskLogDir(taskId: string): string {
    return join(BASE, "logs", taskId);
  },

  taskEventsFile(taskId: string): string {
    return join(BASE, "logs", taskId, "events.jsonl");
  },

  taskStateFile(taskId: string): string {
    return join(BASE, "logs", taskId, "state.json");
  },

  worktreePath(taskId: string): string {
    return join(BASE, "worktrees", taskId);
  },
};

export function ensureDirs(): void {
  mkdirSync(paths.logs, { recursive: true });
  mkdirSync(paths.worktrees, { recursive: true });
  mkdirSync(paths.auth, { recursive: true });
}
