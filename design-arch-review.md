# Design vs Architecture Review

## Scope
Reviewed `docs/game-design` and `docs/architecture`, plus `CLAUDE.md` and `for-architect.md`, for alignment between game design and implementation architecture.

---

## Findings (Ordered by Severity)

### High

1) ~~Combat balance constants diverge across docs.~~
- **Status**: Resolved. Architecture docs updated to match design values (crit multiplier: 2.5x, max stamina: 4). Design (`docs/game-design/combat.md`) is now the authoritative source; architecture docs reference it.

2) ~~Extraction costs conflict between design and architecture.~~
- **Status**: Resolved. Removed `extractionCost` fields from dungeon config example (`10-dungeon-system.md`). `configs/extraction.json` is the canonical source for extraction costs; design doc (`extraction-system.md`) now explicitly references this. Dungeon config should NOT define extraction costs—that's the Extraction System's responsibility.

### Medium

3) ~~Dungeon layout and room distribution diverge from design intent.~~
- **Status**: Resolved. Design docs updated to mark hybrid layouts and Floor 5 rest room as post-MVP. Architecture's linear-only approach is the correct MVP scope.

4) Exploration info features in design are not represented in dungeon interfaces.
- **Issue**: CUNNING scouting bonuses and the “no 3 combat rooms in a row” pacing guarantee are not reflected in the dungeon system API/types.
- **Evidence**:
  - Design requirements: `docs/game-design/dungeon-structure.md:421`
  - Architecture navigation data lacks CUNNING-driven info + pacing constraints: `docs/architecture/10-dungeon-system.md:323`
- **Potential fix**: Extend `NavigationOption`/`RoomPreview` to carry “scouted” metadata and enforce the pacing rule during generation. Alternatively, document the feature as post-MVP in design and remove the requirement.

5) ~~Flee/Dread rules inconsistent between design and Dread system.~~
- **Status**: Resolved. Game design is the source of truth. Architecture updated to match:
  - `FleeAttemptResult.dreadCost` now documents both outcomes (success: +5, failure: +2 per design)
  - Removed `combat_damage_taken` from `DreadSource` type (was never in design; would break Dread budget and create death spiral risk)

### Low

6) ~~Camp/merchant flow mismatches (identification and merchant inventory policy).~~
- **Status**: Resolved. Chronicler performs identification (thematically correct—knowledge NPC handles knowledge work). Architecture updated: `MERCHANT_IDENTIFY` → `CHRONICLER_IDENTIFY`, `unidentifiedSellRatio` → 0.5 to match design. Design updated: added identification option to Chronicler menu UI. Merchant inventory policy was a non-issue—"accessories only" refers to equipment types; consumables are a separate category already correctly handled.

---

## Open Questions

1) ~~Should `configs/loot.json` be a first-class config in the Content Registry?~~
- **Status**: Resolved. Added `loot.json` to Content Registry as first-class config:
  - Added to `configs/` directory structure listing
  - Added `LootConfig` type with dropChances, itemCounts, slotWeights, consumableChance, bossLegendaryRate, dreadQualityBonusMultiplier
  - Added `getLootConfig()` accessor to ContentRegistry interface
  - Added `LootConfig` to public exports
- **Rationale**: Consistent with other tunable systems (combat, dread, extraction, merchant). Enables balance iteration without code changes. Clear separation: `content/loot_tables/` = WHAT drops; `configs/loot.json` = HOW loot generates.

2) ~~Save system source of truth: profile folder structure vs OS-specific single save file.~~
- **Status**: No action needed. Design describes the *schema* (what goes in save.json), architecture describes the *file layout* (profiles/). They are complementary perspectives, not conflicting approaches.

---

## Suggested Reconciliation Order

1) ~~**Combat constants**~~: resolved (design is authoritative, architecture docs updated).
2) ~~**Extraction costs**~~: resolved (`configs/extraction.json` is canonical, dungeon config no longer defines costs).
3) ~~**Dungeon structure**~~: resolved (linear MVP, post-MVP hybrid templates).
4) ~~**Dread/flee**~~: resolved (design is authoritative; architecture updated to match flee costs, removed `combat_damage_taken`).
5) ~~**Camp economy**~~: resolved (Chronicler handles identification, sell ratios aligned to 50%).
6) ~~**Save system architecture**~~: no action needed (complementary docs).

