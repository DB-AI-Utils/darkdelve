---
max_iterations: 2
max_hours: 0.1
max_budget_usd: 1
turns_per_iteration: 10
completion_checks:
  - type: file_exists
    path: /workspace/.orchestrator/smoke-test-output.txt
---

## Task

This is a smoke test for the autonomous orchestrator.

## Instructions

1. Create the file `.orchestrator/smoke-test-output.txt` with the content "Smoke test passed"
2. Update `.orchestrator/progress.md` with "Smoke test completed"
3. Write TASK_COMPLETE to `.orchestrator/task-signal`

That's it. Do not do anything else.
