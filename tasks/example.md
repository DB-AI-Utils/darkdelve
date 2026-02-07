---
max_iterations: 10
max_hours: 4
max_budget_usd: 30
turns_per_iteration: 30
completion_checks:
  - type: command
    cmd: "npm test"
  - type: glob_exists
    pattern: "src/**/*.ts"
    min_count: 5
---

## Task

Implement Phase 1: Foundation from docs/architecture.md.

## Instructions

1. Read docs/architecture.md for the full specification
2. Follow the implementation order specified
3. Run tests after each subtask
4. Commit after each working milestone
5. Update .orchestrator/progress.md after completing each subtask

## Completion

When ALL subtasks are done and tests pass, output: TASK_COMPLETE

If stuck after 3 attempts at the same issue, document in .orchestrator/progress.md and output: TASK_BLOCKED
