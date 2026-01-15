# Pre-Implementation Blockers

**Status:** Ready for architect review
**Overall Readiness:** 100%
**Generated:** 2026-01-15
**Last Updated:** 2026-01-15 (v1.5 - Resolved all blockers and HIGH-PRIORITY concerns via mechanics-auditor)

---

## RESOLVED BLOCKERS (v1.5)

### ~~BLOCKER 1: Room Navigation System~~ RESOLVED

**Resolution:** Added Room Navigation System to `dungeon-structure.md`

- **Model:** Corridor-based graph with symmetric edges
- **Input:** Numbered corridor selection ([1] North -> [TREASURE], etc.)
- **Backtracking:** Allowed to CLEARED rooms only, costs 1 turn
- **Entry:** COMBAT immediate, TREASURE/EVENT/REST show choice menu
- **Dread Corruption:** Display-only (50+: 5% wrong, 70+: 30% hidden, 85+: all ?????)

---

### ~~BLOCKER 2: Turn Order in Combat~~ RESOLVED

**Resolution:** Added Turn Order System to `combat.md`

- **Default:** Player-first (player acts, then enemy)
- **SLOW:** Player first, +25% damage from Heavy Attack
- **FAST:** First-strike on Turn 1 only, then normal
- **AMBUSH:** 2 free enemy actions before Turn 1, cannot flee Turn 1
- **Effects:** Process at start of turn. Stagger/stun skip action phase.

---

### ~~BLOCKER 3: Armor Formula Missing~~ RESOLVED

**Resolution:** Added Armor System to `combat.md`

- **Formula:** `Effective Armor% = Base Armor% × (1 - Armor Penetration%)`
- **Damage After Armor:** `Raw Damage × (1 - Effective Armor%)`
- **Armor Penetration:** Heavy Attack's 25% pen reduces enemy armor multiplicatively (e.g., 25% armor becomes 18.75% effective)
- **Player Armor:** From gear only (no base stat). Ranges: Common 5-10%, Uncommon 10-15%, Rare 15-20%, Legendary 20-25%
- **Player Armor Cap:** 40% (hard cap from all sources)
- **Rounding:** Nearest integer (0.5 rounds up)

---

### ~~BLOCKER 4: Floor Transition Mechanics~~ RESOLVED

**Resolution:** Added Floor Transition System to `dungeon-structure.md`

- **Stairwell:** One per floor, contains stairs down + extraction point (except F5)
- **Descent:** Available immediately on entering Stairwell, no minimum rooms
- **One-Way:** Cannot return to previous floors
- **Cost:** +5 Dread on descent
- **Blocked When:** The Watcher active, or in combat

---

### ~~BLOCKER 5: Item Data Schema~~ RESOLVED

**Resolution:** Created new `items.md` document with complete specification

- **Core Fields:** id, templateId, slot, rarity, identified, names, baseStats, effects, consumable, cursed
- **Effect System:** 20+ typed effects (STAT_BONUS, CRIT_CHANCE, LIFESTEAL, ON_HIT_POISON, CURSE_DREAD_GAIN, etc.)
- **Identification:** Reveals true name, stats, effects, cursed status (25g cost)
- **Save Schema:** Minimal (id, templateId, identified) - derived from templates
- **Dread Corruption:** Display-only corruption at high Dread levels

---

### ~~BLOCKER 6: Veteran Knowledge Threshold Inconsistency~~ RESOLVED

**Resolution:** Adopted hybrid system with thresholds 6/15/25 encounters OR 1/2/3 deaths

- **Tier 1:** 6 encounters OR 1 death (achievable in ~1 run focused combat)
- **Tier 2:** 15 encounters OR 2 deaths (requires 2-3 runs or 2 deaths)
- **Tier 3:** 25 encounters OR 3 deaths (achievable in 4-6 runs for average player)
- **Rationale:** 6 threshold requires deliberate engagement (not automatic), 25 respects player time while maintaining aspiration. Death acceleration preserved for "death as discovery" theme.
- **Updated:** character-progression.md, CLAUDE.md

---

### ~~BLOCKER 7: VIGOR Resistance Formula Undefined~~ RESOLVED

**Resolution:** Added VIGOR DoT Resistance to `character-progression.md`

- **Formula:** `DoT Resistance = min(VIGOR × 5%, 40%)`
- **Application:** `Actual DoT = Base DoT × (1 - DoT Resistance)`
- **Soft Cap:** 40% at 8 VIGOR (prevents trivializing DoT enemies)
- **Affects:** Poison damage, Bleeding damage
- **Does NOT affect:** Duration (only damage per tick)
- **Rationale:** Option B (percentage) chosen—scales with damage, never fully negates, simple mental math

---

### ~~BLOCKER 8: Item Pool Expansion Schedule Unspecified~~ RESOLVED

**Resolution:** Level-based expansion only (no achievement system needed)

- **Schedule:** 30 items (L1-4) → 45 (L5-7) → 60 (L8-10) → 80 (L11-14) → 100 (L15+)
- **Base pool:** 30 items (19 Common, 8 Uncommon, 3 Rare) across all slots
- **Rarity gates:** Epic at Level 5+, Legendary at Level 8+
- **Implementation:** Single integer comparison: `item.minLevel <= character.level`
- **Rationale:** Level is already tracked. No new systems. Achievement unlocks deferred to post-MVP.
- **Updated:** character-progression.md with full expansion schedule and base pool distribution

---

## RESOLVED HIGH-PRIORITY CONCERNS (v1.5)

### ~~CONCERN 1: Watcher + Boss Interaction Undefined~~ RESOLVED

**Resolution:** Added Watcher + Boss Interaction Rules to `dread-system.md`

- **Spawn Deferral:** The Watcher CANNOT spawn during boss encounters
- **Dread Tracking:** Dread can reach 100 during boss fight, but spawn is deferred
- **Warning Display:** At 100 Dread during boss: "The Watcher stirs beyond the threshold..."
- **Post-Boss Spawn:** If Dread was 100+ during boss fight, Watcher spawns immediately after boss defeat
- **Death Override:** If player dies to boss, standard death rules apply (no Watcher spawn)
- **Post-Boss Mechanics:** Extraction available after boss death; Watcher blocks until stunned once
- **Thematic:** Creates "double gauntlet" for players who pushed too hard

---

### ~~CONCERN 2: Death vs Extraction Dread Creates Perverse Incentive~~ RESOLVED

**Resolution:** Unified death and extraction Dread formulas in `dread-system.md`

- **Old Rule:** Death reset Dread to exactly 10 (created 25-50 Dread advantage for dying at high Dread)
- **New Rule:** Death applies same formula as extraction: `EndDread - 25 (min 10)`
- **Result:** Death penalty is purely item/gold loss, not Dread management
- **Rationale:** Removes degenerate "extraction + suicide" pattern where dying was mechanically optimal

---

### ~~CONCERN 3: Floor 2 Farming May Be Degenerate~~ RESOLVED

**Resolution:** Added Level-Gated Gold Reduction to `character-progression.md` and `reference-numbers.md`

- **Gold Penalty (mirrors XP penalty):**
  - Levels 6-10: Floor 1 gives 70% gold
  - Levels 11-15: Floors 1-2 give 70% gold
  - Levels 16-20: Floors 1-3 give 70% gold
- **Implementation:** Multiply gold drops by 0.7 when penalty active
- **Display:** "The dungeon's lesser denizens carry little of value."
- **Rationale:** Quick raids remain VIABLE (recovery, casual play) but not OPTIMAL (deep runs reward more)
- **Preserves:** Floor 1-2 loot already caps effectively at Uncommon (Epic 1-1.5%, Legendary 0-0.5%)

---

### ~~CONCERN 4: Hollowed One Unlock May Be Nearly Impossible~~ RESOLVED

**Resolution:** Changed unlock condition to "Die to The Watcher on Floor 3+"

- **Old condition:** "Die at 100 Dread on Floor 3+" (semantically ambiguous, required cheese strategies)
- **New condition:** "Die to The Watcher on Floor 3+" (clear, intentional, achievable)
- **Expected journey:** Runs 6-10 - player deliberately pushes to 100 Dread on Floor 3+, triggers Watcher, and is defeated
- **Thematic fit:** "The Watcher's gaze pierced your soul. You fell into the abyss... and found something there."
- **Contrast with Flagellant:** Flagellant rewards surviving the edge; Hollowed One rewards falling off it
- **Updated:** character-progression.md with new unlock condition and narrative text

---

### ~~CONCERN 5: Heavy Attack May Be Underpowered~~ VALIDATED

**Resolution:** No change needed. Balance analysis confirms correct design.

**Analysis Result:**
- Against unarmored enemies: Heavy is intentionally weaker (83% efficiency vs Light spam)
- Against 15% armor (Armored Ghoul): Heavy is 177% efficient vs 85% for Light
- Against 25% armor (Bone Knight): Heavy is 171% efficient vs 75% for Light
- Against SLOW enemies: Heavy bonus makes it 104-221% efficient

**Conclusion:** Heavy Attack achieves its design target. It underperforms against unarmored targets (intended) and strongly outperforms against armored or SLOW targets (intended). 2/10 MVP enemies have armor, 3/10 are SLOW—Heavy has valid use cases.

**Monitoring:** If playtesting shows <20% Heavy usage, graduated fixes documented in `combat.md`

---

## CLEAN SYSTEMS (Ready for Implementation)

These systems passed all four audits and are engineer-ready:

| System | Status |
|--------|--------|
| Dread System | ✅ Thresholds, effects, The Watcher fully specified |
| Death Economy | ✅ Priority chain, risk tags, Lesson Learned complete |
| Combat Actions | ✅ All 6 actions, stamina costs, status effects |
| Enemy Stats | ✅ Full MVP roster with HP, damage, XP, abilities |
| Save System | ✅ Triggers, schema, crash recovery |
| Merchant System | ✅ Prices, stock rules, buyback |
| XP/Leveling | ✅ Formula, floor multipliers, anti-grinding |
| Loot Rarity Tables | ✅ Floor-based distribution complete |
| Extraction Costs | ✅ Floor 3-4 Waystone costs defined |
| Camp UI | ✅ Menu structure, navigation patterns |

---

## Agent Assignment Summary

| Agent | Blockers | Concerns | Status |
|-------|----------|----------|--------|
| `rpg-game-designer` | ~~#1, #2, #4, #5~~ | - | **ALL RESOLVED (v1.5)** |
| `game-balance-tuner` | ~~#3, #7~~ | ~~#5 (Heavy Attack)~~ | **ALL RESOLVED (v1.5)** |
| `progression-pacing-auditor` | ~~#6, #8~~ | ~~#4 (Hollowed One)~~ | **ALL RESOLVED (v1.5)** |
| `mechanics-auditor` | - | ~~#1, #2, #3 (Watcher, Dread, Farming)~~ | **ALL RESOLVED (v1.5)** |

---

## Next Steps

1. ~~Resolve rpg-game-designer blockers~~ **DONE (v1.5)**
2. ~~Resolve game-balance-tuner blockers (#3, #7) and validate concern #5~~ **DONE (v1.5)**
3. ~~Resolve progression-pacing-auditor blockers (#6, #8) and concern #4~~ **DONE (v1.5)**
4. ~~Address HIGH-PRIORITY CONCERNS (#1-3) with `mechanics-auditor`~~ **DONE (v1.5)**
5. Re-run audit to verify fixes
6. Pass to architect for implementation planning
