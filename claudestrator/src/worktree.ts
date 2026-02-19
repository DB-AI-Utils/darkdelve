import { execSync } from "child_process";
import { existsSync, readdirSync, rmSync } from "fs";
import { paths } from "./paths.js";

/**
 * Create a standalone git clone of the project for a task.
 * Unlike worktrees, clones have a self-contained .git directory
 * that works correctly when bind-mounted into Docker containers.
 */
export function createWorktree(projectDir: string, taskId: string): string {
  const clonePath = paths.worktreePath(taskId);

  execSync(`git clone --local "${projectDir}" "${clonePath}"`, {
    stdio: "pipe",
  });

  return clonePath;
}

/**
 * Remove a task's cloned repo.
 */
export function removeWorktree(_projectDir: string, clonePath: string): void {
  if (existsSync(clonePath)) {
    rmSync(clonePath, { recursive: true, force: true });
  }
}

/**
 * Create a branch in the original repo from the clone's HEAD.
 * Uses `git fetch` to bring commits from the clone into the original.
 * Returns the branch name if created, null if there were no new commits.
 */
export function createBranchFromWorktree(
  projectDir: string,
  clonePath: string,
  taskId: string,
): string | null {
  // Auto-commit any uncommitted changes left by the worker
  try {
    const status = execSync("git status --porcelain", {
      cwd: clonePath,
      stdio: "pipe",
    }).toString().trim();

    if (status) {
      execSync('git add -A && git commit -m "Uncommitted changes from claudestrator task"', {
        cwd: clonePath,
        stdio: "pipe",
      });
    }
  } catch {
    // best effort
  }

  // Check if clone HEAD differs from the original HEAD
  try {
    const cloneHead = execSync("git rev-parse HEAD", {
      cwd: clonePath,
      stdio: "pipe",
    }).toString().trim();

    const originalHead = execSync("git rev-parse HEAD", {
      cwd: projectDir,
      stdio: "pipe",
    }).toString().trim();

    if (cloneHead === originalHead) {
      return null; // No new commits
    }

    // Fetch the clone's HEAD into a branch in the original repo
    const branchName = `claudestrator/${taskId}`;
    execSync(
      `git fetch "${clonePath}" HEAD:refs/heads/${branchName}`,
      { cwd: projectDir, stdio: "pipe" },
    );

    return branchName;
  } catch {
    return null;
  }
}

/**
 * Prune orphaned clones from ~/.claudestrator/worktrees/.
 * Called on startup to clean up from crashed sessions.
 * If activeTaskIds is provided, worktrees whose directory name matches
 * an active task ID are skipped so that concurrent instances don't
 * destroy each other's working copies.
 */
export function pruneOrphanedWorktrees(activeTaskIds?: Set<string>): void {
  const worktreeDir = paths.worktrees;
  if (!existsSync(worktreeDir)) return;

  const entries = readdirSync(worktreeDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (activeTaskIds?.has(entry.name)) continue;

    const clonePath = `${worktreeDir}/${entry.name}`;
    rmSync(clonePath, { recursive: true, force: true });
  }
}
