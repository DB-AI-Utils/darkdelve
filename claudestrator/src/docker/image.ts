import Docker from "dockerode";
import { execSync } from "child_process";

const IMAGE_NAME = "claudestrator:latest";

/**
 * Check if the claudestrator Docker image exists locally.
 */
export async function imageExists(docker: Docker): Promise<boolean> {
  try {
    await docker.getImage(IMAGE_NAME).inspect();
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the claudestrator Docker image.
 * Must be called from the claudestrator project root (after `tsc`).
 */
export async function buildImage(docker: Docker, contextDir: string): Promise<void> {
  // Use docker CLI for build since dockerode's build API is cumbersome with context
  execSync(`docker build -t ${IMAGE_NAME} .`, {
    cwd: contextDir,
    stdio: "inherit",
  });
}

/**
 * Ensure the image exists, building if necessary.
 */
export async function ensureImage(docker: Docker, contextDir: string): Promise<void> {
  if (await imageExists(docker)) return;
  await buildImage(docker, contextDir);
}
