# Codex Architecture Review Highlights

## Summary
Architecture aligns well with core design pillars (CLI-first, deterministic core, dread corruption, extraction loop), but there are several gaps and spec drifts that will cause integration issues if left unresolved. Below are targeted highlights and concrete fixes.

## High Priority Gaps + Potential Solutions

1) ~~Dread persistence between runs is undefined in persistence/state.~~ **RESOLVED (v1.9)**
- Resolution: Design changed to remove Dread persistence. Dread now resets to 0 at the start of every run.
- Rationale: Persistence added complexity without proportional gameplay benefit; within-run escalation provides sufficient tension.

2) Veteran Knowledge and bestiary progression lacks a system owner.
- Issue: State types exist but no system specifies when encounters/deaths increment or when tiers unlock; death only updates Lesson Learned.
- Affected: docs/game-design/character-progression.md, docs/game-design/death-discovery.md, docs/architecture/03-state-management.md, docs/architecture/11-extraction-system.md.
- Fix: Add a dedicated Knowledge service (or extend character/extraction system) to increment encounter/death counters on `ENEMY_KILLED` and `PLAYER_KILLED`, compute tier unlocks from config, emit `VETERAN_KNOWLEDGE_UNLOCKED` and `BESTIARY_ENTRY_UNLOCKED` events.

3) Item risk status semantics are inconsistent across systems.
- Issue: ItemService risk tags differ from Death Economy and design tags (at_risk/doomed/protected/vulnerable), which will cause UI and loss logic mismatches.
- Affected: docs/architecture/07-item-system.md, docs/architecture/11-extraction-system.md, docs/game-design/death-discovery.md.
- Fix: Define canonical risk statuses and map them in one place (e.g., `ItemRiskStatus` in item system) with explicit translation for UI labels and death handling.

4) Combat stamina spec drift.
- Issue: Architecture uses max stamina 5 and no Dodge stamina bonus; design specifies max 4 and Dodge grants +1 stamina next turn.
- Affected: docs/architecture/08-combat-system.md, docs/game-design/combat.md.
- Fix: Align `StaminaConfig.maxStamina` to 4 and implement Dodge bonus (stamina regen +1 on next turn) or update design if architecture is preferred.

5) Event/treasure/rest resolution mechanics are not fully specified in architecture.
- Issue: Command and template types exist, but no explicit resolver/handler rules for pre-roll RNG, choice outcomes, or ambush triggers.
- Affected: docs/game-design/events.md, docs/architecture/02-content-registry.md, docs/architecture/05-command-system.md, docs/architecture/10-dungeon-system.md.
- Fix: Add an Event Resolution module (or expand command handlers) that defines: pre-roll RNG, selection of weighted outcomes, stat checks, ambush triggers, and effects application (gold, items, dread, status, combat start).

6) Merchant constraints are not enforced.
- Issue: Design mandates accessories-only for equipment sales; architecture does not specify enforcement.
- Affected: docs/game-design/camp-system.md, docs/architecture/07-item-system.md.
- Fix: Add a merchant stock filter to allow consumables + accessories only; reject or avoid other slots at stock generation.

## Medium Priority Drift + Potential Solutions

7) Dread-driven dungeon variance is split across modules with unclear ownership.
- Issue: Design describes dread-influenced elite chance and event weighting; architecture covers elite scaling but not event weighting or exit-count distortion under dread.
- Affected: docs/game-design/dungeon-generation.md, docs/game-design/dungeon-structure.md, docs/architecture/10-dungeon-system.md, docs/architecture/09-dread-system.md.
- Fix: Centralize dread variance in dungeon generation (elite chance + event weights) and leave display corruption strictly in Dread/presentation as already described.

8) Save format mismatch (single file vs per-profile files).
- Issue: Design describes a single save file; architecture uses per-profile `save.json` + `stash.json`.
- Affected: docs/game-design/save-system.md, docs/architecture/13-save-system.md.
- Fix: Choose one model, document it, and align schema + examples across both docs.

9) MIGHT carry capacity secondary effect missing.
- Issue: Design states MIGHT increases carry capacity; architecture uses fixed inventory capacity.
- Affected: docs/game-design/character-progression.md, docs/architecture/07-item-system.md.
- Fix: Either add capacity scaling to derived state/inventory or explicitly drop this effect in design and note the change.

10) ~~Extraction atomicity not codified.~~ **FALSE POSITIVE**
- Finding: Architecture DOES specify this in `11-extraction-system.md`: "Once validation passes, extraction completes regardless of interrupts. Even if HP would drop to 0 during animation, player extracts at 1 HP."
- No fix needed.

11) Dungeon layout templates/weights unclear in architecture.
- Issue: Design has A/B/C templates and floor-specific weights; architecture examples default to linear layouts.
- Affected: docs/game-design/dungeon-generation.md, docs/architecture/10-dungeon-system.md.
- Fix: Either bring template weights into architecture config or clarify MVP ignores template weighting.

## Recommended Next Step
Pick a single canonical source for each drift area (design vs architecture), then patch the other doc set to match. The highest leverage change is adding a Knowledge system to eliminate major gameplay regressions. (Dread persistence has been resolved by design simplification.)
