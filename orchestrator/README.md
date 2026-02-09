# DarkDelve Orchestrator

Autonomous task runner built on the Claude Agent SDK. Runs multi-iteration sessions with progress tracking, stagnation detection, and completion checks.

## Usage

```bash
# Plain mode (default)
npx tsx src/index.ts tasks/smoke-test.md

# TUI dashboard (requires interactive terminal)
npx tsx src/index.ts tasks/smoke-test.md --tui

# Via environment variable (Docker)
TASK_FILE=tasks/smoke-test.md npx tsx src/index.ts
```

## Task files

YAML frontmatter + markdown body:

```markdown
---
max_iterations: 10
max_hours: 4
max_budget_usd: 30
turns_per_iteration: 30
fresh_session: false
completion_checks:
  - type: command
    cmd: 'npm test'
---

Your task prompt here.
```

## TUI keybindings

| Key | Action |
|-----|--------|
| `h` | Toggle help |
| `t` | Force-abort current iteration |
| `n` | New task (v2, not yet implemented) |
| `Up/Down` | Scroll activity log |
| `Ctrl+C` | Quit |

## Output modes

| Context | Rendering |
|---------|-----------|
| `--tui` + TTY | Ink dashboard with progress bars, activity log, metrics |
| TTY (no flag) | Colored text to stderr |
| Non-TTY (CI/Docker) | Plain text, no colors |

JSONL logs are always written to `.orchestrator/logs/` regardless of mode.

## State

Session state persists in `.orchestrator/state.json`. Resuming the same task file picks up where it left off. Stagnation (unchanged `progress.md` for 3 iterations) auto-fails the run.
