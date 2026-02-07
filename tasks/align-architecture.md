---
max_iterations: 8
max_hours: 2
max_budget_usd: 20
turns_per_iteration: 40
fresh_session: true
completion_checks:
  - type: file_exists
    path: /workspace/docs/architecture.md
  - type: review
    prompt: "Review docs/architecture.md against docs/game-design.md. Check that: (1) Every system, mechanic, and decision in game-design.md has a corresponding section in architecture.md, (2) There are no contradictions between the two documents (numbers, rules, behaviors), (3) architecture.md stays high-level — no implementation code, no folder structures, no class names — but is detailed enough that an engineer could start building without asking clarifying questions, (4) No gaps exist where an engineer would have to guess how something works. Reply PASS only if all four criteria are fully met. Reply FAIL if ANY discrepancy, gap, or contradiction exists, and list each one."
    files:
      - "docs/architecture.md"
      - "docs/game-design.md"
---

## Task

Align `docs/architecture.md` with `docs/game-design.md` so the two documents are fully consistent.

## Context

- `docs/game-design.md` is the source of truth for what the game should do
- `docs/architecture.md` is the technical blueprint that engineers will follow
- The architecture must cover everything in the game design — no gaps, no contradictions
- The architecture must remain HIGH-LEVEL: no code, no implementation details — just clear technical decisions, interfaces, data flows, and boundaries
- It should be detailed enough that an engineer can start working without asking clarifying questions

## Process

Each iteration, do the following:

### Step 1: Read both documents
Read `docs/game-design.md` and `docs/architecture.md` carefully, end to end.

### Step 2: Find discrepancies yourself
Look for:
- Systems or mechanics in game design that are missing from architecture
- Contradictions (different numbers, conflicting rules, inconsistent behaviors)
- Gaps where an engineer would need to guess or ask questions
- Architecture sections that are too vague or too implementation-specific
- Anything in architecture that contradicts or goes beyond what game design specifies

### Step 3: Get Codex review
Use the Codex MCP tool to get a second opinion. Send BOTH full documents to Codex with this prompt:

"Review these two documents. The first is the game design (source of truth) and the second is the architecture (technical blueprint). Find ALL discrepancies: missing systems, contradictions, gaps where an engineer would have to guess, and any places where architecture includes implementation details it shouldn't. List each issue specifically."

Read Codex's response carefully.

### Step 4: Fix architecture.md
Based on your own findings AND Codex's findings, edit `docs/architecture.md` to resolve every issue. Do NOT modify `docs/game-design.md`.

Rules for edits:
- Add missing sections for systems not yet covered
- Fix contradictions by matching game-design.md (it's the source of truth)
- Fill gaps with enough detail that an engineer won't need to ask questions
- Remove any implementation details (code snippets, folder structures, class names)
- Keep the tone technical but high-level: decisions, boundaries, data flows, interfaces

### Step 5: Verify with Codex
After making changes, send both documents to Codex again and ask:

"I've updated the architecture document. Review both documents again. Are there any remaining discrepancies, gaps, or contradictions? If everything is aligned, say ALIGNED. If not, list the remaining issues."

### Step 6: Decide completion
- If BOTH you and Codex agree everything is aligned → write TASK_COMPLETE to `.orchestrator/task-signal`
- If either of you found remaining issues → update `.orchestrator/progress.md` with what was fixed and what remains, then let the iteration end naturally (the orchestrator will start a new one)

## Progress tracking

Update `.orchestrator/progress.md` after each step with:
- What discrepancies you found
- What Codex found
- What you fixed
- What still needs work (if anything)

## Completion

Write TASK_COMPLETE to `.orchestrator/task-signal` ONLY when:
1. You have reviewed both documents and found zero discrepancies
2. Codex has reviewed both documents and confirmed alignment
3. Architecture remains high-level with no implementation details

If stuck after 3 attempts at the same issue, write TASK_BLOCKED to `.orchestrator/task-signal`.
