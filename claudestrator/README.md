# Claudestrator

Run autonomous [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk) tasks inside Docker containers. Each task gets an isolated git clone, runs the SDK orchestrator loop with configurable iteration limits and budget caps, and produces a branch in your repo when done.

## How it works

```
Host (claudestrator CLI)              Docker Container
┌────────────────────────┐            ┌──────────────────────────┐
│ TaskRunner             │  creates   │ Worker (orchestrator.ts) │
│  - git clone --local   │──────────→│  - Agent SDK query() loop│
│  - docker create/start │            │  - hooks & stagnation    │
│  - tail JSONL events   │←──────────│  - writes events.jsonl   │
│  - TUI or plain output │  reads    │  - commits on completion │
└────────────────────────┘            └──────────────────────────┘
```

1. Creates a local git clone of your project for isolation
2. Spins up a Docker container with the clone mounted at `/workspace`
3. The worker inside runs the Claude Agent SDK in a loop (iterations, hooks, stagnation detection, completion checks)
4. Events stream via a JSONL file from container to host
5. On completion, the worker commits changes and the host creates a `claudestrator/<task-id>` branch in your repo
6. Container and clone are cleaned up

## Prerequisites

- **Docker** running locally
- **Node.js 22+**
- An Anthropic API key (authenticated via Claude CLI)

## Setup

```bash
cd claudestrator
npm install
npm run docker:build   # builds TypeScript + Docker image
```

## Authentication

Run once to authenticate the Claude CLI inside Docker:

```bash
npx tsx src/index.ts login
```

This drops you into a container shell. Run `claude` then `/login` to authenticate. Credentials are saved to `~/.claudestrator/auth/` and reused for all future tasks.

## Usage

```bash
# Basic task
npx tsx src/index.ts run --project /path/to/repo --prompt "Fix the login bug"

# With limits
npx tsx src/index.ts run \
  --project . \
  --prompt "Add unit tests for the auth module" \
  --max-iterations 5 \
  --max-budget 10 \
  --turns-per-iteration 20

# TUI mode (interactive terminal required)
npx tsx src/index.ts run --project . --prompt "Refactor utils" --tui
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--project <dir>` | `.` | Project directory to work on |
| `--prompt <text>` | required | Task description for Claude |
| `--max-iterations <n>` | 10 | Max orchestrator iterations |
| `--max-hours <n>` | 4 | Time limit |
| `--max-budget <n>` | 30 | Budget cap in USD |
| `--turns-per-iteration <n>` | 30 | SDK turns per iteration |
| `--tui` | off | Show live TUI dashboard |

## Output

After a task completes, check for a new branch:

```bash
git branch | grep claudestrator/
git log claudestrator/<task-id> --oneline
```

Logs are stored at `~/.claudestrator/logs/<task-id>/`:
- `events.jsonl` — structured event stream
- `state.json` — worker state (iteration count, cost, status)

## Container security

Containers run with:
- `--init` for proper signal handling
- `--security-opt=no-new-privileges`
- Memory limit (default 4 GB) and CPU limit (default 2 cores)
- Auth files are copied in (not bind-mounted), so the host config stays safe
- No Docker socket mounted

## Project structure

```
src/
├── index.ts              # Host CLI entry point
├── worker.ts             # Container entry point
├── types.ts              # Shared interfaces
├── paths.ts              # ~/.claudestrator/ path helpers
├── worktree.ts           # Git clone create/cleanup/branch
├── event-tailer.ts       # Tails JSONL → typed events
├── logger.ts             # Plain-mode stderr renderer
├── docker/
│   ├── manager.ts        # Container lifecycle
│   └── image.ts          # Image build/check
├── task/
│   ├── runner.ts         # Orchestrates clone → container → events → cleanup
│   └── store.ts          # In-memory task store
├── worker/
│   ├── orchestrator.ts   # SDK query() loop, hooks, stagnation, signals
│   ├── hooks.ts          # Stop hook, PreCompact hook, canUseTool
│   ├── completion.ts     # Completion check runner
│   └── logger.ts         # JSONL event writer
└── tui/
    ├── app.tsx           # Ink TUI app
    └── components/
```
