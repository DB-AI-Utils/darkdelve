import Docker from "dockerode";
import { execFileSync } from "child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { paths } from "../paths.js";

const IMAGE_NAME = "claudestrator:latest";
const LABEL_PREFIX = "claudestrator";

export interface ContainerConfig {
  taskId: string;
  prompt: string;
  worktreePath: string;
  logDir: string;
  maxIterations: number;
  maxHours: number;
  maxBudgetUsd: number;
  turnsPerIteration: number;
  completionChecks: string; // JSON string
  memoryMb?: number;
  cpus?: number;
  sessionId?: string;
}

/**
 * Create and return a Docker container for a task.
 */
export async function createContainer(
  docker: Docker,
  config: ContainerConfig,
): Promise<Docker.Container> {
  const container = await docker.createContainer({
    Image: IMAGE_NAME,
    Cmd: [
      "--prompt", config.prompt,
      "--max-iterations", String(config.maxIterations),
      "--max-hours", String(config.maxHours),
      "--max-budget", String(config.maxBudgetUsd),
      "--turns-per-iteration", String(config.turnsPerIteration),
      "--log-dir", "/logs",
      "--completion-checks", config.completionChecks,
    ],
    Labels: {
      [LABEL_PREFIX]: "true",
      [`${LABEL_PREFIX}.task-id`]: config.taskId,
      [`${LABEL_PREFIX}.session`]: config.sessionId ?? "",
    },
    // Run as 'coder' user from Dockerfile (no UID override — Docker Desktop handles file ownership)
    HostConfig: {
      Init: true,
      Binds: [
        `${config.worktreePath}:/workspace:rw`,
        `${config.logDir}:/logs:rw`,
      ],
      SecurityOpt: ["no-new-privileges"],
      Memory: (config.memoryMb ?? 4096) * 1024 * 1024,
      NanoCpus: (config.cpus ?? 2) * 1e9,
    },
    Env: ["HOME=/home/coder", "TERM=xterm-256color"],
  });

  return container;
}

/**
 * Run an interactive login container via `docker run -it --rm`.
 * User runs `claude` and `/login` inside it.
 * Auth dir (~/.claudestrator/auth/) is bind-mounted so credentials persist.
 *
 * Uses the CLI directly instead of dockerode to get proper TTY passthrough.
 */
export function runLoginContainer(): void {
  // Ensure claude.json exists so it can be bind-mounted
  if (!existsSync(paths.claudeJson)) {
    writeFileSync(paths.claudeJson, "{}");
  }

  const args = [
    "run", "-it", "--rm",
    "--init",
    "--label", `${LABEL_PREFIX}=true`,
    "--label", `${LABEL_PREFIX}.login=true`,
    "-v", `${paths.auth}:/home/coder/.claude:rw`,
    "-v", `${paths.claudeJson}:/home/coder/.claude.json:rw`,
    "-e", "HOME=/home/coder",
    "-e", "TERM=xterm-256color",
    "--entrypoint", "/bin/bash",
    IMAGE_NAME,
  ];

  execFileSync("docker", args, { stdio: "inherit" });
}

/**
 * Copy saved auth files into the container:
 * - ~/.claudestrator/auth/* → /home/coder/.claude/ (credentials, settings)
 * - ~/.claudestrator/claude.json → /home/coder/.claude.json (CLI state/onboarding)
 */
export async function copyAuth(container: Docker.Container): Promise<void> {
  const { pack } = await import("tar-stream");
  const packer = pack();
  const chunks: Buffer[] = [];

  // Copy auth directory files (credentials, settings)
  const authDir = paths.auth;
  if (existsSync(authDir)) {
    for (const file of readdirSync(authDir)) {
      const filePath = join(authDir, file);
      try {
        const content = readFileSync(filePath);
        packer.entry({ name: `.claude/${file}` }, content);
      } catch {
        // skip unreadable files (directories, etc.)
      }
    }
  }

  // Copy claude.json (CLI state — needed to skip onboarding)
  if (existsSync(paths.claudeJson)) {
    try {
      const content = readFileSync(paths.claudeJson);
      packer.entry({ name: ".claude.json" }, content);
    } catch {
      // skip if unreadable
    }
  }

  packer.finalize();

  for await (const chunk of packer) {
    chunks.push(chunk as Buffer);
  }

  const tarBuf = Buffer.concat(chunks);
  if (tarBuf.length > 0) {
    await container.putArchive(tarBuf, { path: "/home/coder" });
  }
}

/**
 * Start a container.
 */
export async function startContainer(container: Docker.Container): Promise<void> {
  await container.start();
}

/**
 * Wait for a container to exit. Returns the exit code.
 */
export async function waitContainer(container: Docker.Container): Promise<number> {
  const result = await container.wait();
  return result.StatusCode;
}

/**
 * Stop a container gracefully (SIGTERM → timeout → SIGKILL).
 */
export async function stopContainer(container: Docker.Container, timeoutSec = 10): Promise<void> {
  try {
    await container.stop({ t: timeoutSec });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("not running") && !msg.includes("304")) {
      throw err;
    }
  }
}

/**
 * Remove a container.
 */
export async function removeContainer(container: Docker.Container): Promise<void> {
  try {
    await container.remove({ force: true });
  } catch {
    // Ignore errors (container may not exist)
  }
}

/**
 * Find and remove orphaned claudestrator containers.
 * If excludeSession is provided, containers with that session label are skipped
 * so that concurrent instances don't kill each other's containers.
 */
export async function cleanupOrphanedContainers(docker: Docker, excludeSession?: string): Promise<number> {
  const containers = await docker.listContainers({
    all: true,
    filters: { label: [`${LABEL_PREFIX}=true`] },
  });

  let cleaned = 0;
  for (const info of containers) {
    if (excludeSession && info.Labels?.[`${LABEL_PREFIX}.session`] === excludeSession) {
      continue;
    }
    try {
      const container = docker.getContainer(info.Id);
      await stopContainer(container, 5);
      await removeContainer(container);
      cleaned++;
    } catch {
      // best effort
    }
  }

  return cleaned;
}
