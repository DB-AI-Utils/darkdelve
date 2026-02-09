import { resolve } from "path";

export interface RuntimeConfig {
  cwd: string;
  stateDir: string;
  logDir: string;
  signalFile: string;
  progressFile: string;
}

export function createConfig(overrides?: Partial<RuntimeConfig>): RuntimeConfig {
  const cwd = overrides?.cwd ?? process.env.WORKSPACE_DIR ?? process.cwd();
  const stateDir = overrides?.stateDir ?? resolve(cwd, ".orchestrator");
  return {
    cwd,
    stateDir,
    logDir: overrides?.logDir ?? resolve(stateDir, "logs"),
    signalFile: overrides?.signalFile ?? resolve(stateDir, "task-signal"),
    progressFile: overrides?.progressFile ?? resolve(stateDir, "progress.md"),
  };
}
