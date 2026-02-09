# Phase 2: Dashboard + Multi-task

## Goal

Replace the current single-task CLI with a full interactive TUI dashboard. Users launch `claudestrator` (no args) and create/manage tasks from within the app. Support 1-3 concurrent tasks.

## What exists (Phase 1 baseline)

Phase 1 is fully implemented and working. Current state:

- **CLI**: `claudestrator run --project <dir> --prompt <text> [options]` runs a single task
- **TUI**: `--tui` flag shows a single-task detail view (StatusBar + TaskDetail log stream)
- **Store**: `MemoryTaskStore` implements `TaskStore` interface (in-memory, lost on exit)
- **Runner**: `TaskRunner` handles full lifecycle: git clone -> Docker container -> event tailing -> branch creation -> cleanup
- **Worker**: Runs inside Docker with Agent SDK `query()` loop, hooks, stagnation detection, signal files, completion checks
- **Communication**: Worker writes JSONL to `/logs/events.jsonl`, host tails via `EventTailer`

### Existing files to modify

| File | Current role |
|------|-------------|
| `src/index.ts` | CLI entry point, parses args, runs single task |
| `src/tui/app.tsx` | Single-task Dashboard component, subscribes to one runner |
| `src/tui/components/StatusBar.tsx` | Shows one task's status, cost, elapsed time |
| `src/tui/components/TaskList.tsx` | Static read-only list (not interactive) |
| `src/tui/components/TaskDetail.tsx` | Log stream viewer with scroll (this is fine as-is) |
| `src/task/store.ts` | `MemoryTaskStore` — in-memory Map |
| `src/task/runner.ts` | `TaskRunner` — runs one task end-to-end |

### Existing interfaces (in `src/types.ts`)

```typescript
interface TaskStore {
  create(input: TaskCreateInput): Task;
  get(id: string): Task | undefined;
  update(id: string, patch: Partial<Task>): Task;
  list(filter?: { status?: TaskStatus }): Task[];
}

interface TaskCreateInput {
  prompt: string;
  projectDir: string;
  maxIterations?: number;        // default 10
  maxHours?: number;             // default 4
  maxBudgetUsd?: number;         // default 30
  turnsPerIteration?: number;    // default 30
  completionChecks?: CompletionCheck[];
}
```

---

## Changes

### 1. SQLite task store (`src/task/store.ts` — rewrite)

Replace `MemoryTaskStore` with `SqliteTaskStore implements TaskStore`.

- Use `better-sqlite3` (synchronous, simple, no ORM)
- Database file: `~/.claudestrator/tasks.db`
- WAL mode for concurrent reads
- Single `tasks` table matching the `Task` interface
- `completionChecks` stored as JSON string column
- Same `TaskStore` interface — drop-in replacement

Add `better-sqlite3` and `@types/better-sqlite3` to dependencies.

### 2. Task scheduler (`src/task/scheduler.ts` — new file)

Wraps `TaskRunner` to manage concurrency.

```typescript
class TaskScheduler extends EventEmitter<SchedulerEvents> {
  constructor(docker: Docker, store: TaskStore, contextDir: string, maxConcurrent?: number);
  enqueue(input: TaskCreateInput): Task;    // creates task, calls tick()
  cancel(taskId: string): Promise<void>;    // stops container, updates store
}
```

- Maintains `Map<taskId, TaskRunner>` for active tasks
- `tick()` — if running count < maxConcurrent (default 3), dequeue next pending task and call `runner.run()`
- Forwards all runner `event` and `taskUpdate` emissions
- `cancel(taskId)` — stops the container via `docker.stop()`, updates task status to "cancelled"

### 3. TUI app rewrite (`src/tui/app.tsx`)

Replace single-task Dashboard with a view router:

```
Views:
  "list"   → TaskListView (default)
  "detail" → TaskDetailView (existing TaskDetail + StatusBar)
  "new"    → NewTaskForm
```

State: `{ view: "list" | "detail" | "new", selectedTaskId: string | null }`

The app receives `TaskScheduler` instead of `TaskRunner`. Subscribes to scheduler events to keep a local tasks array in sync.

### 4. Interactive task list (`src/tui/components/TaskList.tsx` — rewrite)

Currently a static read-only list. Rewrite to be interactive:

- Arrow keys to move selection cursor
- `Enter` → navigate to detail view for selected task
- `n` → navigate to new task form
- `c` → cancel selected task (if running)
- `q` → quit

Show for each task: status symbol, task ID, status, iteration count, cost, prompt (truncated).

### 5. New task form (`src/tui/components/NewTaskForm.tsx` — new file)

Text input form with these fields:

| Field | Default | Notes |
|-------|---------|-------|
| Project directory | `.` (cwd) | Path to git repo |
| Prompt | (required) | Task description, multi-line if possible |
| Max iterations | 10 | |
| Max budget (USD) | 30 | |
| Max hours | 4 | |
| Turns per iteration | 30 | |

Navigation:
- `Tab` / `Shift+Tab` to move between fields
- `Enter` on last field (or a Submit button) to create task
- `Esc` to cancel and go back to list

On submit: call `scheduler.enqueue(input)` and navigate to the detail view for the new task.

Use `@inkjs/ui` `TextInput` for fields. For numeric fields, validate on submit (not per-keystroke).

### 6. StatusBar enhancement (`src/tui/components/StatusBar.tsx`)

Two modes:
- **Global mode** (task list view): Show total running tasks, total cost across all tasks, app uptime
- **Task mode** (detail view): Current behavior — show single task's status, cost, elapsed (no change needed)

### 7. CLI changes (`src/index.ts`)

New behavior:

```bash
claudestrator                  # Launch dashboard (TUI, interactive)
claudestrator run [options]    # Queue task + launch dashboard
claudestrator help             # Show help
claudestrator login            # Auth flow (unchanged)
```

- No args → launch dashboard with empty task list
- `run` with `--prompt` → create task via scheduler, then launch dashboard focused on that task
- Remove `--tui` flag (TUI is now the default and only mode)
- Keep plain mode as fallback when not a TTY (non-interactive `run` only)

### 8. Task detail view adjustments

The existing `TaskDetail.tsx` component works fine for the log stream. The detail view needs:
- `Esc` → go back to task list
- `c` → cancel task (if running)
- Show the StatusBar in task mode above the log

---

## New dependencies

```json
{
  "better-sqlite3": "^11.0.0",
  "@types/better-sqlite3": "^7.6.0"
}
```

Note: `better-sqlite3` is a native module. The Dockerfile does NOT need it — SQLite is host-side only. The worker inside Docker still uses JSONL + state.json.

---

## Implementation order

1. Add `better-sqlite3` dependency, implement `SqliteTaskStore` with same `TaskStore` interface
2. Implement `TaskScheduler` wrapping `TaskRunner` with concurrency control
3. Update `src/index.ts` — new CLI routing (no args = dashboard, run = queue + dashboard)
4. Rewrite `src/tui/app.tsx` — view router with list/detail/new views
5. Rewrite `src/tui/components/TaskList.tsx` — interactive with keyboard nav
6. Create `src/tui/components/NewTaskForm.tsx` — input form
7. Enhance `src/tui/components/StatusBar.tsx` — global vs task mode
8. Wire everything together, test end-to-end

---

## Verification

1. `claudestrator` (no args) launches dashboard with empty task list
2. `n` opens new task form, fill in project + prompt, submit creates and starts task
3. Task appears in list with "running" status, Enter shows live detail view
4. `Esc` returns to list, task still running
5. Second task on same project creates a separate git clone
6. Tasks persist across dashboard restarts (quit and relaunch — SQLite)
7. `c` on a running task stops its container and marks it "cancelled"
8. `claudestrator run --prompt "..." --project .` queues task and opens dashboard focused on it
9. Non-TTY fallback still works: `echo | claudestrator run --prompt "test" --project .` uses plain stderr output
