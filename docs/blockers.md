# DARKDELVE Implementation Blockers

**Generated**: 2026-01-15
**Source**: Red Team Review (rpg-game-designer, mechanics-auditor, game-balance-tuner, progression-pacing-auditor)
**Document Version Reviewed**: v1.5
**Last Updated**: 2026-01-15 (MVP scope reduction applied)

---

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| 🔴 BLOCKER | 0 | Must resolve before Architect |
| 🟠 HIGH | 0 | Resolve during early implementation |
| 🟡 MEDIUM | 0 | Resolve during implementation |
| 🟢 RESOLVED/DEFERRED | 25 | Deferred to post-MVP or resolved |
| **Total** | **25** | |

**v1.6 Update**: All critical blockers, high priority, and medium priority issues have been resolved. Design documents updated with complete specifications.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| 🔴 BLOCKER | Cannot begin implementation without resolution |
| 🟠 HIGH | Should resolve before implementation, causes friction |
| 🟡 MEDIUM | Resolve during implementation, can work around temporarily |
| 🟢 RESOLVED | Issue has been addressed or deferred with rationale |

---

## Critical Blockers (Must Resolve Before Architect)

### B-001: Enemy AI Behavior System Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` |
| **Source** | RPG Designer Review |
| **Location** | `combat.md`, `reference-numbers.md` |

**Problem**: Enemy stats (HP, damage, speed, abilities) are defined, but no decision logic exists for what enemies actually DO each turn.

**Resolution Applied**: Added complete Enemy AI Behavior System to `combat.md`:
- Weighted random action selection (not pattern-based)
- Per-enemy action weight tables
- HP-conditional weight modifiers (e.g., Fleshweaver +50 to Life Drain when HP <50%)
- Explicit rule: enemies never use defensive actions (player advantage)
- Targeting priority rules for multi-target scenarios

---

### B-002: Event System Outcomes Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` |
| **Source** | RPG Designer Review |
| **Location** | `dungeon-structure.md` |

**Problem**: Event room UI shows multiple choice options, but outcomes for choices are not specified.

**Resolution Applied**: Created `docs/game-design/events.md` with complete outcome tables:
- 8 MVP event types fully specified
- Alert mechanics defined (add combat encounter to next room)
- Lockpick as CUNNING skill check (Difficulty = Floor × 3)
- All outcome tables with exact probabilities and rewards
- Hooded Stranger, Rest Site, and all other events documented

---

### B-003: Loot Generation Algorithm Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` + `game-balance-tuner` |
| **Source** | RPG Designer Review |
| **Location** | `character-progression.md`, `items.md` |

**Problem**: Drop rate percentages exist, but the actual loot generation process is missing.

**Resolution Applied**: Added complete Loot Generation Algorithm to `items.md`:
- Step-by-step pseudocode for loot generation
- Drop triggers (enemy death, chest types)
- Drop chance formula by enemy type (15% basic, 25% elite, 40% boss)
- Slot determination weights (40% weapon, 25% armor, 20% helm, 15% accessory)
- Effect rolling mechanics
- Dread quality bonus as tier upgrade chance

---

### B-004: Gold Drop Values Missing
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | RPG Designer Review, Balance Tuner Review |
| **Location** | `reference-numbers.md` |

**Problem**: Floor-level gold ranges exist (F1-2: 20-50g each) but per-enemy values are not specified.

**Resolution Applied**: Added complete gold drop table to `reference-numbers.md`:
- Per-enemy gold drops (Plague Rat 3-5g through Bone Colossus 80-120g)
- Chest gold values by type (Small 8-15g, Locked 25-40g, etc.)
- Boss gold confirmed at 80-120g
- Floor multipliers for gold scaling

---

### B-005: Dungeon Layout Generation Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` |
| **Source** | RPG Designer Review |
| **Location** | `dungeon-generation.md`, `dungeon-structure.md` |

**Problem**: Hybrid approach (fixed skeleton, random flesh) described but no actual generation algorithm.

**Resolution Applied**: Added complete Floor Generation Algorithm to `dungeon-generation.md`:
- 3 layout templates (Linear Branch, Loop, Deep Corridor) with ASCII diagrams
- Template assignment by floor with percentages
- Room type distribution tables
- Generation pseudocode
- Enemy composition pools per floor
- Seed-based generation for deterministic runs

---

### B-006: Item Template Database Missing (MVP Scope Reduced)
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` + `game-balance-tuner` + `dark-fantasy-narrative` |
| **Source** | RPG Designer Review |
| **Location** | `items.md` |

**Problem**: Item schema defined (`templateId: "rusty_sword"`) but no actual item templates exist.

**Resolution Applied**: Added MVP Item Templates to `items.md`:
- 15 equipment items (5 weapons, 4 armor, 3 helms, 3 accessories)
- 5 consumables (Healing Potion, Clarity Potion, Torch, Smoke Bomb, Antidote)
- Complete stat values for all items
- Rarity distribution (6 Common, 5 Uncommon, 4 Rare)
- Effect specifications for each item

---

## Critical Consistency Issues

### B-007: Watcher Stun Threshold Inaccessible to New Players
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` + `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `dread-system.md` lines 105-111 |

**Problem**: Stun requires 30+ damage in single hit. Starter player deals 8-11 base. Even Heavy Attack (2x) + crit (2x) = 32-44 on high roll. New players have ~4% chance per Heavy Attack to escape.

**Resolution Applied**: Lowered stun threshold to 20 damage in `dread-system.md`:
- Starter Mercenary (8-11 base) has ~51% chance per Heavy Attack
- Heavy Attack: 16-22 damage (2x base), need 20+ to stun
- 3 out of 7 possible outcomes (43%) + 14% crit chance (~8%)
- Total: ~51% success rate per Heavy Attack
- Ensures new players CAN escape with skilled play, but not guaranteed

---

### B-008: Clarity Potion Values Contradict
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | Mechanics Auditor Review |
| **Location** | `dread-system.md` line 60, `reference-numbers.md` line 234-235 |

**Problem**:
- `dread-system.md`: "Clarity potion: -10 Dread"
- `reference-numbers.md`: "Clarity Potion 20g -25 Dread"

**Resolution Applied**: Standardized to **-20 Dread at 20g** across all documents:
- `dread-system.md` updated to -20 Dread
- `reference-numbers.md` updated to -20 Dread
- Provides meaningful Dread reduction without trivializing the mechanic

---

### B-009: Torch Effect Ambiguously Defined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `dread-system.md` line 58, `camp-system.md` line 253, `reference-numbers.md` line 227 |

**Problem**: Two completely different mechanics described:
- `dread-system.md`: "Lit torch (passive): -1 per 10 turns" (passive reduction)
- `camp-system.md`/`reference-numbers.md`: "Torch 8g: -5 Dread gain, 1 floor" (gain reduction)

**Resolution Applied**: Adopted gain reduction model across all documents:
- Torch reduces Dread GAIN (not current Dread)
- While active, all Dread sources reduced by 5 points
- Duration: 1 floor
- Passive reduction reference removed from `dread-system.md`

---

## High Priority Issues

### B-010: Combat at 0 Stamina Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `combat.md` |

**Problem**: No "Wait" or "Pass" action exists. If player has 1 Stamina and wants Heavy Attack (3 Stam), they cannot bank stamina.

**Resolution Applied**: Added PASS action to `combat.md`:
- PASS (0 Stamina): Skip action, +2 Stamina regeneration still applies
- Enables stamina banking for Heavy Attack setup
- Maintains turn economy decisions

---

### B-011: Status Effect Persistence Between Combats Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `combat.md` lines 143-168 |

**Problem**: Bleeding is "Until healed" but persistence between rooms/combats undefined. Does entering new room reset turn counters?

**Resolution Applied**: Added Status Effect Persistence Rules to `combat.md`:
- Combat effects (Poison, Bleeding, Stunned, etc.) END when combat ends
- Meta effects (Cursed) persist until cured
- Explicit table showing each effect's persistence behavior

---

### B-012: Defensive Actions Against Watcher Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `dread-system.md` lines 88-94 |

**Problem**: Watcher does "50 per hit (guaranteed hit)"—does "guaranteed hit" bypass Dodge? Does Block reduce damage?

**Resolution Applied**: Added Watcher Combat Rules to `dread-system.md`:
- Guaranteed Hit: Dodge does NOT avoid Watcher attacks
- Block Works: Reduces Watcher damage by 50% (25 damage instead of 50)
- Armor Stacks: Player armor reduction applies normally
- No Flee: Cannot flee from The Watcher
- Smoke Bomb: Does NOT bypass Watcher extraction block

---

### B-013: MIGHT vs CUNNING Stat Imbalance
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | Balance Tuner Review |
| **Location** | `character-progression.md`, `reference-numbers.md` |

**Problem**:
- Pure MIGHT build (Level 20): +210% DPS
- Pure CUNNING build (Level 20): +32% DPS

CUNNING's soft cap helps but doesn't fully equalize.

**Resolution Applied**: Increased crit multiplier from 2.0x to 2.5x in `reference-numbers.md`:
- CUNNING builds now more competitive
- High CUNNING (50% crit at max) provides ~75% DPS increase
- MIGHT still provides raw damage, CUNNING provides burst potential
- Hybrid builds remain viable

---

### B-014: Death-Triggered Items Not Designed
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (Deferred) |
| **Assigned Agent** | N/A (Post-MVP) |
| **Source** | Progression Pacing Auditor Review |
| **Location** | `death-discovery.md` |

**Problem**: Death-triggered unlocks listed but not designed:
- "Last Stand" - undefined
- "Desperate Gamble" - undefined
- Boss counter item - name only
- Antidote recipe - mechanics unclear

**Resolution**: **DEFERRED TO POST-MVP**. Remove references from MVP scope. Core "Death as Discovery" mechanics (Lesson Learned, Veteran Knowledge, Bestiary) remain in scope.

---

### B-015: New Player Revelation Schedule Missing
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (Deferred) |
| **Assigned Agent** | N/A (Post-MVP) |
| **Source** | Progression Pacing Auditor Review |
| **Location** | N/A (missing document) |

**Problem**: Documentation mentions "gradual unlock over first 5-10 runs" but doesn't specify what unlocks when.

**Missing**: Run-by-run unlock schedule showing:
- Run 1: What's visible?
- Run 2-3: What's revealed?
- Run 4-5: What unlocks?

**Resolution**: **DEFERRED TO POST-MVP**. MVP relies on existing Veteran Knowledge tiers (6/15/25 encounters). Explicit tutorial schedule designed after playtesting.

---

### B-016: Floor 1-2 Gold Farming Penalty Insufficient
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | Mechanics Auditor Review |
| **Location** | `character-progression.md` lines 200-215 |

**Problem**: XP penalty is 50%, but Gold penalty is only 70%. Level 10+ player can farm 28-70g per 5-10 minute risk-free run (336-840g/hour). Deep run yields ~768g/hour with significant death risk.

**Resolution Applied**: Accepted 70% gold penalty as intentional with documented rationale in `character-progression.md`:
- Recovery runs remain viable after bad deaths
- Deep runs are ~44% more gold-efficient (correct incentive)
- XP penalty gates progression regardless of gold
- Time cost of safe farming is self-limiting
- Added monitoring metric: if quick raids >40%, reduce penalty to 60%

---

## Medium Priority Issues

### B-017: Cursed Item Mechanics Incomplete
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | RPG Designer Review, Mechanics Auditor Review |
| **Location** | `items.md`, `extraction-system.md` |

**Problem**: Cursed items mentioned with "+30% primary stat, negative secondary effect" but mechanics incomplete.

**Resolution Applied**: Added Cursed Item Mechanics to `items.md`:
- Cannot be unequipped until end of run (extraction or death)
- Four curse types defined (DREAD_GAIN, HEALING_REDUCTION, STAMINA_DRAIN, GOLD_LOSS)
- Hollowed One class: Can unequip cursed items normally
- Curse effects stack if multiple cursed items equipped

---

### B-018: Smoke Bomb Restriction Scope Unclear
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | `reference-numbers.md` line 239 |

**Problem**: "Smoke Bomb 45g: Guaranteed flee (ignores restrictions)"—does this ignore Turn 1 restriction? Ambush restriction? Watcher extraction block?

**Resolution Applied**: Clarified Smoke Bomb scope in `reference-numbers.md`:
- Ignores Turn 1 flee restriction: YES
- Ignores Ambush flee restriction: YES
- Ignores Watcher extraction block: NO (flee only, not extraction)
- Ignores Boss Room flee restriction: NO

---

### B-019: Unarmed Combat Undefined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `mechanics-auditor` |
| **Source** | Mechanics Auditor Review |
| **Location** | All combat documentation |

**Problem**: Can player unequip weapon? What is unarmed damage?

**Resolution Applied**: Added Weapon Slot Rules to `character-progression.md`:
- Weapon slot cannot be empty
- Unequip action requires replacement from inventory or stash
- Death recovery grants starter "Rusty Sword" if weapon lost
- Eliminates need for unarmed combat stats

---

### B-020: Ration Item Referenced But Not Defined
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | Mechanics Auditor Review |
| **Location** | `dread-system.md` line 57 |

**Problem**: "Consume ration: -8 Dread" but "Ration" not in Merchant inventory or item lists.

**Resolution Applied**: Removed Ration reference from `dread-system.md`:
- Calm Draught (-15 Dread, 18g) and Clarity Potion (-20 Dread, 20g) serve this function
- Simpler item pool without redundant Dread reduction items

---

### B-021: Turn Counting for Dread Ambiguous
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `game-balance-tuner` |
| **Source** | Balance Tuner Review |
| **Location** | `dread-system.md` |

**Problem**: "Every 5 turns elapsed: +1 Dread"—is this combat turns, exploration turns, or total turns?

**Resolution Applied**: Defined as exploration turns in `dread-system.md`:
- Exploration turn = each time player enters a room (new or revisited)
- Combat rounds do NOT count as exploration turns
- Prevents combat-heavy floors from excessive Dread gain

---

### B-022: Lore Fragment Unlock Conditions Missing
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (Deferred) |
| **Assigned Agent** | N/A (Post-MVP) |
| **Source** | Progression Pacing Auditor Review |
| **Location** | `death-discovery.md` |

**Problem**: Chronicler shows lore fragments but no unlock triggers defined.

**Resolution**: **DEFERRED TO POST-MVP**. MVP includes basic Chronicler with Bestiary (binary known/unknown). Detailed lore fragments added later.

---

### B-023: Class Starting Stats Incomplete
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (Deferred) |
| **Assigned Agent** | N/A (Post-MVP) |
| **Source** | RPG Designer Review |
| **Location** | `character-progression.md` |

**Problem**: Only Mercenary starting stats specified. Flagellant and Hollowed One missing:
- Starting stats
- Unique mechanics
- Starting equipment

**Resolution**: **DEFERRED TO POST-MVP**. MVP ships with Mercenary only. Flagellant and Hollowed One unlock conditions remain in docs but stats/mechanics designed later.

---

### B-024: Save File Format Unspecified
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED (v1.6) |
| **Assigned Agent** | `rpg-game-designer` |
| **Source** | RPG Designer Review |
| **Location** | `save-system.md` |

**Problem**: Schema shows WHAT is saved but not HOW.

**Resolution Applied**: Added Save File Technical Specification to `save-system.md`:
- Format: JSON (human-readable, cross-platform)
- Single file: `darkdelve_save.json`
- Versioning: Semantic (MAJOR.MINOR.PATCH)
- Checksum: SHA-256 for corruption detection
- Corruption recovery: Field-level recovery, backup loading, default values
- Atomic save process documented

---

### B-025: Floor 4 Difficulty Spike
| Field | Value |
|-------|-------|
| **Status** | 🟢 RESOLVED |
| **Assigned Agent** | `progression-pacing-auditor` + `game-balance-tuner` |
| **Source** | Progression Pacing Auditor Review |
| **Location** | `dungeon-structure.md`, `reference-numbers.md` |

**Problem**: Floor 4 stacked three difficulty increases simultaneously:
- First Shadow Stalker (ambush + high damage)
- First Armored Ghoul (requires Heavy Attack)
- Room count increase (4 → 5)

**Resolution Applied (v1.6)**:
- Floor 4 rooms: 5 → 4 (removes room count increase)
- Floor 5 rooms: 6 → 7 (consolidates room count increase with boss floor)
- Total rooms unchanged: 23
- Floor 4 now introduces ONE mechanic: Shadow Stalker ambush
- Floor 3 emphasized as armored enemy introduction floor
- Session timing preserved: Full clear remains 20-28 minutes
- Standard run (F1-4) reduced from ~20 min to ~18 min (within 14-20 min target)

**New Floor Introduction Sequence**:
1. Floor 1-2: Core mechanics, free extraction
2. Floor 3: Waystone cost + armored enemies (Heavy Attack requirement)
3. Floor 4: Shadow Stalker ambush mechanic
4. Floor 5: Room count increase + Boss (acceptable pairing for finale)

---

## Resolution Workflow

### v1.6 Resolution Summary

**All blockers resolved!** Design documents ready for Architect phase.

**Phase 1: Critical Blockers** - 9 items → ✅ ALL RESOLVED
- B-001: Enemy AI behavior → Added to `combat.md`
- B-002: Event outcomes → Created `events.md`
- B-003: Loot generation → Added to `items.md`
- B-004: Gold drop values → Added to `reference-numbers.md`
- B-005: Dungeon generation → Added to `dungeon-generation.md`
- B-006: Item templates → Added to `items.md`
- B-007: Watcher stun threshold → Lowered to 20 damage
- B-008: Clarity Potion → Standardized to -20 Dread
- B-009: Torch effect → Gain reduction model

**Phase 2: High Priority** - 5 items → ✅ ALL RESOLVED
- B-010: Combat at 0 Stamina → PASS action added
- B-011: Status Effect Persistence → Rules added
- B-012: Watcher Defensive Rules → Rules added
- B-013: MIGHT vs CUNNING balance → Crit multiplier to 2.5x
- B-016: Gold farming penalty → Rationale documented

**Phase 3: Medium Priority** - 6 items → ✅ ALL RESOLVED
- B-017: Cursed item mechanics → Completed
- B-018: Smoke Bomb scope → Clarified
- B-019: Unarmed combat → Weapon slot rules
- B-020: Ration item → Reference removed
- B-021: Turn counting → Exploration turns
- B-024: Save file format → Specification added

**Previously Resolved** - 1 item
- B-025: Floor 4 spike → RESOLVED (v1.6 - room redistribution)

**Deferred to Post-MVP** - 4 items
- B-014: Death-triggered items
- B-015: New player schedule
- B-022: Lore fragments
- B-023: Class stats (Flagellant, Hollowed One)

---

## Deferred to Post-MVP

These items were identified but intentionally deferred to reduce initial scope:

| Item | Original Scope | MVP Scope | Deferred Work |
|------|---------------|-----------|---------------|
| Item templates | 50+ items | ~20 items | 30+ additional items |
| Item rarities | Common → Legendary | Common → Rare | Epic, Legendary tiers |
| Death-triggered items | 4+ items | 0 items | "Last Stand", "Desperate Gamble", etc. |
| Classes | 3 classes | 1 class (Mercenary) | Flagellant, Hollowed One stats/mechanics |
| Lore fragments | Full system | Basic bestiary | Detailed lore unlock conditions |
| New player schedule | Detailed | Implicit | Explicit run-by-run document |

---

## Validation Checklist

Before passing to Architect, confirm:

- [x] All 🔴 BLOCKER items resolved or deferred with rationale
- [x] No contradictions remain between documents
- [x] Engineer can implement each system without stopping to ask questions
- [x] All formulas have concrete numbers
- [x] All systems have defined edge case behavior
- [x] MVP scope clearly defined (not full 50+ items)

**v1.6 Status: ✅ Ready for Architect Phase**
