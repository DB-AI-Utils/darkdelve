import { readFileSync } from "fs";

export type CompletionCheck =
  | { type: "command"; cmd: string; timeout_sec?: number }
  | { type: "file_exists"; path: string }
  | { type: "glob_exists"; pattern: string; min_count: number }
  | { type: "review"; prompt: string; files?: string[] };

export interface TaskConfig {
  maxIterations: number;
  maxHours: number;
  maxBudgetUsd: number;
  turnsPerIteration: number;
  completionChecks: CompletionCheck[];
  body: string;
  filePath: string;
}

export function parseTask(filePath: string): TaskConfig {
  const raw = readFileSync(filePath, "utf-8");

  // Split YAML frontmatter from body
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Task file ${filePath} must have YAML frontmatter (--- delimited)`);
  }

  const [, frontmatter, body] = match;
  const config = parseYamlSimple(frontmatter);

  return {
    maxIterations: config.max_iterations ?? 10,
    maxHours: config.max_hours ?? 4,
    maxBudgetUsd: config.max_budget_usd ?? 30,
    turnsPerIteration: config.turns_per_iteration ?? 30,
    completionChecks: parseCompletionChecks(config.completion_checks),
    body: body.trim(),
    filePath,
  };
}

// Minimal YAML parser for flat keys and simple arrays.
// Handles: scalars, inline arrays, and block arrays of objects.
function parseYamlSimple(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentArray: Record<string, unknown>[] | null = null;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // Block array item: "  - type: command"
    const arrayItemMatch = line.match(/^\s+-\s+(\w+):\s*(.+)$/);
    if (arrayItemMatch && currentKey) {
      if (!currentArray) currentArray = [];
      currentArray.push({ [arrayItemMatch[1]]: parseValue(arrayItemMatch[2]) });
      continue;
    }

    // Continuation of block array object: "    cmd: 'npm test'"
    const continuationMatch = line.match(/^\s{4,}(\w+):\s*(.+)$/);
    if (continuationMatch && currentArray && currentArray.length > 0) {
      const lastItem = currentArray[currentArray.length - 1];
      lastItem[continuationMatch[1]] = parseValue(continuationMatch[2]);
      continue;
    }

    // Flush any accumulated array
    if (currentKey && currentArray) {
      result[currentKey] = currentArray;
      currentArray = null;
    }

    // Top-level key: "max_iterations: 10"
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, value] = keyMatch;
      if (value.trim() === "") {
        // Start of a block array or nested object
        currentKey = key;
        currentArray = [];
      } else {
        result[key] = parseValue(value);
        currentKey = key;
      }
    }
  }

  // Flush final accumulated array
  if (currentKey && currentArray) {
    result[currentKey] = currentArray;
  }

  return result;
}

function parseValue(raw: string): string | number | boolean {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") return num;
  return trimmed;
}

function parseCompletionChecks(raw: unknown): CompletionCheck[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: Record<string, unknown>) => {
    const type = item.type as string;
    switch (type) {
      case "command":
        return { type: "command" as const, cmd: item.cmd as string, timeout_sec: item.timeout_sec as number | undefined };
      case "file_exists":
        return { type: "file_exists" as const, path: item.path as string };
      case "glob_exists":
        return { type: "glob_exists" as const, pattern: item.pattern as string, min_count: item.min_count as number };
      case "review":
        return { type: "review" as const, prompt: item.prompt as string, files: item.files as string[] | undefined };
      default:
        throw new Error(`Unknown completion check type: ${type}`);
    }
  });
}
