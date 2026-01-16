# Architecture vs Design Issues

Validated gaps between game design docs and architecture docs. Prioritized by impact.

---

## High Priority

### Issue #6: Merchant Equipment Constraints Not Enforced

**Status:** Confirmed

**Problem:** Design mandates "accessories only" for equipment sales. Architecture has no enforcement filter—relies on config to happen to only list valid items.

**Design spec:** `camp-system.md` line 280: "The Merchant sells **accessories only**"
**Architecture gap:** `07-item-system.md` MerchantService has no slot filter

**Fix:** Add explicit merchant stock filter that rejects weapons/armor/helms at stock generation.

---

## Medium Priority

### Issue #8: Save Format Mismatch

**Status:** Confirmed

**Problem:**
- Design: Single `darkdelve_save.json` file
- Architecture: Three files (`profile.json`, `save.json`, `stash.json`)

Architecture choice is reasonable for performance (smaller files, faster stash access) but docs disagree.

**Fix:** Update design doc to match architecture's three-file structure, or vice versa.

---

## Low Priority

### Issue #5: Event Resolution Mechanics Underspecified

**Status:** Partially Confirmed

**Problem:** Architecture has event templates and outcome types, but lacks explicit documentation for:
- Pre-roll RNG mechanism ("Hidden rolls are made BEFORE the player chooses")
- Weighted outcome selection algorithm
- Stat check resolution (CUNNING checks)
- Ambush trigger mechanics

**Fix:** Document the resolution algorithm in command system or add dedicated Event Resolution module.

---

### Issue #11: Dungeon Layout Templates Need Phase Clarification

**Status:** Partially Confirmed

**Problem:** Design has A/B/C layout templates with floor-specific weights. Architecture uses linear layout only. This is correct for MVP (Phase 1), but architecture doesn't explicitly note templates are Phase 2.

**Fix:** Add note to architecture: "MVP uses linear layouts. A/B/C template system deferred to Phase 2."

---

## Deferred (Phase 2)

### Issue #7: Dread Event Weighting

**Status:** Deferred to Phase 2 (Rich Variance)

**Original Problem:** Design specifies dangerous event weight formula: `1.0 + (Dread% × 0.02)` (1x at 0 Dread, 3x at 100 Dread). Architecture implements elite spawn scaling but NOT event weighting.

**Decision:** Omit for MVP. Existing Dread mechanics (information corruption, elite spawn scaling, The Watcher) already create sufficient escalating tension. Event weighting is a background system with subtle player-perceived impact.

**Rationale:**
- Players notice "I can't trust my HP display" and "unexpected elite spawned" more than "I'm seeing more Blood Shrines"
- Implementation requires event danger classification, weighted selection, and per-floor tuning
- Already listed as Phase 2 feature ("Dread-influenced spawning" in dungeon-generation.md)
- Game designer analysis confirms low criticality for core Dread experience

**Design doc updated:** `dungeon-generation.md` - removed formula from MVP, noted as Phase 2 feature.

---

## Resolved

| Issue | Resolution |
|-------|------------|
| #1: Dread persistence | Design changed to reset Dread to 0 each run (v1.9) |
| #2: Veteran Knowledge System Lacks Owner | Added KnowledgeService to Character System (06) with event subscriptions and tier evaluation |
| #3: Item Risk Status Semantic Conflict | ItemService's `ItemRiskStatus` corrected to match design semantics. ExtractionService now imports type from ItemService (single source of truth). `at_risk` = brought from stash, `doomed` = carried (not equipped). |
| #4: Combat Stamina Spec Drift | Architecture aligned: maxStamina → 4, added dodgeStaminaBonus (+1 next turn) |
| #9: MIGHT Carry Capacity Effect Missing | Dropped from design (v1.9). Secondary effect was underspecified; fixed 8 slots preserved. MIGHT's +1 damage/point is sufficient value. |
| #10: Extraction atomicity | False positive—architecture does specify this |
