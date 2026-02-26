import { execFile } from "child_process";
import { existsSync, readdirSync, rmSync } from "fs";
import { promisify } from "util";
import { paths } from "./paths.js";

const execFileAsync = promisify(execFile);

function execGit(args: string[], opts?: { cwd?: string }): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, {
    cwd: opts?.cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

/**
 * Create a standalone git clone of the project for a task.
 * Unlike worktrees, clones have a self-contained .git directory
 * that works correctly when bind-mounted into Docker containers.
 */
export async function createWorktree(projectDir: string, taskId: string): Promise<string> {
  const clonePath = paths.worktreePath(taskId);

  if (existsSync(clonePath)) {
    rmSync(clonePath, { recursive: true, force: true });
  }

  try {
    await execGit(["clone", "--no-local", projectDir, clonePath]);
  } catch (err: unknown) {
    const stderr = (err as { stderr?: string })?.stderr ?? "";
    throw new Error(`git clone failed: ${stderr || (err as Error).message}`);
  }

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
export async function createBranchFromWorktree(
  projectDir: string,
  clonePath: string,
  taskId: string,
): Promise<string | null> {
  try {
    const { stdout: status } = await execGit(["status", "--porcelain"], { cwd: clonePath });

    if (status.trim()) {
      await execGit(["add", "-A"], { cwd: clonePath });
      await execGit(["commit", "-m", "Uncommitted changes from claudestrator task"], { cwd: clonePath });
    }
  } catch {
    // best effort
  }

  try {
    const { stdout: cloneHead } = await execGit(["rev-parse", "HEAD"], { cwd: clonePath });
    const { stdout: originalHead } = await execGit(["rev-parse", "HEAD"], { cwd: projectDir });

    if (cloneHead.trim() === originalHead.trim()) {
      return null;
    }

    const branchName = `claudestrator/${taskId}`;
    await execGit(["fetch", clonePath, `HEAD:refs/heads/${branchName}`], { cwd: projectDir });

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
