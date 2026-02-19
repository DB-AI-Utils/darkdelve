import { execSync } from "child_process";
import { existsSync } from "fs";
import { globSync } from "glob";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { CompletionCheck } from "../types.js";

interface CheckResult {
  id: string;
  passed: boolean;
  reason?: string;
}

export async function runCompletionChecks(checks: CompletionCheck[], cwd: string, taskPrompt?: string) {
  const results: CheckResult[] = [];

  for (const check of checks) {
    switch (check.type) {
      case "command": {
        try {
          execSync(check.cmd, {
            timeout: (check.timeout_sec ?? 300) * 1000,
            cwd,
            stdio: "pipe",
          });
          results.push({ id: check.cmd, passed: true });
        } catch {
          results.push({ id: check.cmd, passed: false });
        }
        break;
      }
      case "file_exists":
        results.push({ id: check.path, passed: existsSync(check.path) });
        break;
      case "glob_exists": {
        const matches = globSync(check.pattern, { cwd });
        results.push({ id: check.pattern, passed: matches.length >= check.min_count });
        break;
      }
      case "review": {
        const result = await runReviewCheck(check.prompt, cwd, taskPrompt);
        results.push(result);
        break;
      }
    }
  }

  return {
    allPassed: results.every((r) => r.passed),
    summary: results.filter((r) => !r.passed).map((r) => `${r.id}${r.reason ? `: ${r.reason}` : ""}`).join(", "),
    results,
  };
}

async function runReviewCheck(
  prompt: string,
  cwd: string,
  taskPrompt?: string,
): Promise<CheckResult> {
  const reviewPrompt =
    (taskPrompt ? `## Original task\n${taskPrompt}\n\n` : "") +
    `## Review criteria\n${prompt}\n\n` +
    `Review the code in this workspace. Read whatever files you need to evaluate the criteria above. ` +
    `When done, respond with exactly PASS or FAIL on the FIRST line, then your reasoning.`;

  try {
    let resultText = "";

    for await (const message of query({
      prompt: reviewPrompt,
      options: {
        systemPrompt: "You are a strict code reviewer. You have full access to the workspace. Read whatever files you need to evaluate the review criteria. Respond with PASS or FAIL on the first line, then explain why.",
        allowDangerouslySkipPermissions: true,
        cwd,
      },
    })) {
      if (typeof message === "object" && message !== null && "result" in message) {
        resultText = (message as Record<string, unknown>).result as string;
      }
    }

    const firstLine = resultText.trim().split("\n")[0].trim().toUpperCase();
    const passed = firstLine.startsWith("PASS");
    const reason = resultText.trim().split("\n").slice(1).join(" ").trim().slice(0, 200);

    return { id: `review: ${prompt.slice(0, 60)}`, passed, reason: passed ? undefined : reason };
  } catch (err) {
    return {
      id: `review: ${prompt.slice(0, 60)}`,
      passed: false,
      reason: `Review failed to run: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
