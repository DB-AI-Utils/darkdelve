# DARKDELVE: Design Blockers & Issues

> Pre-implementation audit results from RPG Game Designer, Mechanics Auditor, Progression Pacing Auditor, and Game Balance Tuner agents.
>
> **Document Status:** Critical blockers RESOLVED - ready for architect phase.
> **Audit Date:** 2026-01-15
> **Last Updated:** 2026-01-15
> **Design Doc Version:** 1.5 (updated from 1.2)

---

## Table of Contents

1. [Critical Blockers](#critical-blockers)
2. [High Priority Issues](#high-priority-issues)
3. [Moderate Concerns](#moderate-concerns)
4. [Exploits Identified](#exploits-identified)
5. [Missing Specifications](#missing-specifications)
6. [Validated Systems](#validated-systems)

---

## Critical Blockers

These **must be resolved** before implementation can begin.

### 1. Dread Threshold Text Contradiction

**Source:** Mechanics Auditor
**Location:** Line 245 vs Lines 217-223

**Problem:**
- Threshold table defines: Uneasy (50-69), Shaken (70-84), Terrified (85-99)
- But line 245 states: "At Shaken (51+) Dread, the game's text becomes untrustworthy"
- Should say 70+, not 51+

**Fix:** Change line 245 from "Shaken (51+)" to "Shaken (70+)"

---

### 2. Starting Dread Value Undefined

**Source:** Mechanics Auditor
**Location:** Not specified anywhere

**Problem:** Document never states what Dread value players start a run with.
- Camp reduces Dread to "min 10" but first run has no prior camp visit
- Is starting Dread 0 or 10?

**Fix:** Add explicit rule: "Characters begin each run at 0 Dread"

---

### 3. Starting Character Stats Undefined

**Source:** Game Balance Tuner
**Location:** Not specified anywhere

**Problem:** Document gives formulas (+2 damage per MIGHT, +5 HP per VIGOR) but never defines starting values for VIGOR, MIGHT, and CUNNING.

**Proposed Fix:**
```
Mercenary Starting Stats:
- VIGOR: 3 (gives 50 HP: 35 base + 15)
- MIGHT: 3
- CUNNING: 3

Base HP Formula: 35 + (VIGOR × 5) = 50
```

---

### 4. Damage Formula Ambiguous

**Source:** Game Balance Tuner
**Location:** Lines 383-387, 1027

**Problem:** Document says "MIGHT: Physical damage (+2 per point)" but:
- Is this additive to weapon damage?
- Is base damage 5-8 BEFORE or AFTER MIGHT?
- With 5 MIGHT: 5-8 + 10 = 15-18 damage, killing basic enemies in 1-2 turns (not 3-4)

**Proposed Fix:**
```
Damage Formula: Weapon Base + (MIGHT × 1)
- Change MIGHT bonus from +2 to +1 per point
- Starter damage: 5-8 + 3 = 8-11
- This keeps early combat at 3-4 turns vs 12-25 HP enemies
```

---

### 5. Enemy Damage Values Missing

**Source:** Game Balance Tuner
**Location:** Lines 1031-1036

**Problem:** Enemy HP is specified (12-25 basic, 40-60 elite, 100+ boss) but NO damage values exist. Cannot calculate player survivability.

**Proposed Enemy Stats:**

| Enemy | HP | Damage | Special |
|-------|-----|--------|---------|
| Plague Rat | 12-15 | 5-8 | Poison (30% chance) |
| Ghoul | 18-22 | 8-12 | - |
| Fleshweaver (Elite) | 40-50 | 15-20 | Summons at 50% HP |
| Bone Colossus (Boss) | 120 | 25-35 | Multi-attack, Ground Slam |

**Survivability Check:** Player with 50 HP survives 4-6 basic hits, 2-3 elite hits. Appropriate.

---

### 6. Inventory Capacity Undefined

**Source:** RPG Game Designer, Mechanics Auditor
**Location:** Line 1027 mentions "Potion capacity: 3" but general inventory never specified

**Problem:**
- How many items can players carry during a run?
- What happens when stash is full and player extracts with items?
- Document references "full inventory" scenarios without defining capacity

**Proposed Fix:**
```
Inventory Capacity:
- Carried items during run: 10 slots
- Potion/consumable slots: 3 (separate)
- Stash overflow: Must sell or discard before depositing
```

---

### 7. Death Economy Contradictions

**Source:** RPG Game Designer, Mechanics Auditor
**Location:** Lines 736-746 vs Line 476

**Problem:** Multiple contradictions in what happens to items on death:
- "Equipped items return to stash" on death
- "Cannot stash legendaries"
- "Brought stash items lost on death"
- "Identified items kept on death"

**Questions needing answers:**
1. Equipped legendary dies with you? Returns to inventory? What?
2. If I bring an item, equip it, then die - lost (brought) or safe (equipped)?
3. Can identification override the "brought" risk flag?

**Proposed Fix - Priority Order:**
```
Death Economy Priority (highest to lowest):
1. BROUGHT from stash = ALWAYS lost on death (overrides all)
2. LEGENDARY = Returns to inventory (not stash), must bring or sell
3. EQUIPPED + IDENTIFIED = Safe, returns to stash
4. EQUIPPED but UNIDENTIFIED = Lost
5. CARRIED (unequipped) = Lost regardless of ID status
```

---

### 8. Room Traversal Rules Missing

**Source:** RPG Game Designer
**Location:** Lines 543-550

**Problem:** Session length math doesn't add up without knowing if players can skip rooms.

Document says:
- Floor 1: ~5 min
- Full dungeon: 25-35 minutes

But with 4-6 rooms per floor and 1-3 min per combat:
- 5 floors × 5 rooms × 2 min = 50 minutes minimum

**Questions:**
- Can players skip rooms?
- Is there a critical path vs optional rooms?
- What's mandatory per floor?

**Proposed Fix:**
```
Room Traversal Rules:
- Each floor has 4-6 rooms
- 2-3 rooms are MANDATORY (block path to stairs)
- 2-3 rooms are OPTIONAL (side paths for bonus loot)

Session Length (revised):
- Fast clear (mandatory only): 3-4 min/floor
- Full clear (all rooms): 7-8 min/floor
- Quick raid (2 floors, fast): 6-8 min
- Deep dive (5 floors, full): 35-40 min
```

---

## High Priority Issues

Should be resolved before or during architect phase.

### 9. Heavy Attack is a Trap Option

**Source:** Game Balance Tuner

**Analysis over 4 turns (8 stamina total):**
- Light Spam (8 attacks): 8 × 8-11 = 64-88 damage
- Heavy Focus (2 heavy + 2 light): (2 × 16-22) + (2 × 8-11) = 48-66 damage

Heavy attack deals **17% less DPS** than light spam AND has -10% accuracy penalty.

**Fix Options:**
1. Reduce heavy cost to 2 stamina (makes it burst-superior)
2. Keep 3 stamina, add 30% stun chance (utility niche)
3. Keep 3 stamina, add armor penetration (anti-elite niche)

**Recommendation:** Option 2 - meaningful tactical choice

---

### 10. Block is Strictly Inferior to Dodge

**Source:** Game Balance Tuner

**Comparison:**
- Dodge: 1 stamina, net 0 (refunds 1), avoids 100% damage
- Block: 2 stamina, net 2, reduces damage by 50%

Block is always worse. Dead option.

**Fix:** Block should have niche value:
- Works against multi-hit attacks (Dodge only avoids first hit)
- Reduces status effect application chance
- Can be used while stunned

---

### 11. Floor 5 Boss Impossible at Low Level

**Source:** Progression Pacing Auditor

**Math:**
- Level 1 player: 50 HP, ~10 damage/turn
- Bone Colossus: 100+ HP, unknown damage (but high)
- Expected turns to kill: 10+ turns
- Expected player damage taken: Likely 100+ HP

New players attempting Floor 5 = guaranteed death.

**Fix Options:**
1. Add explicit level gates (Floor 5 requires Level 7+)
2. Scale boss to player level
3. Add warning: "You are underleveled for this challenge"

**Recommendation:** Option 3 - preserve player agency, inform the risk

---

### 12. Floor 3 Difficulty Spike

**Source:** Progression Pacing Auditor

**Floor 3 introduces ALL AT ONCE:**
- Elite enemies
- Extraction costs (10% gold)
- Mimic chance (10%)
- Mini-boss

This is too much simultaneous new threat.

**Fix:** Stagger introductions:
- Floor 2: First elite encounter
- Floor 3: Extraction costs + mimic chance
- Floor 4: Mini-boss (move from Floor 3)

---

### 13. "Loot Quality Bonus" Formula Undefined

**Source:** Game Balance Tuner
**Location:** Line 685

**Problem:** Document says "+0% + (Dread% × 0.5) = +50% at max Dread" but never defines what "+50% loot quality" means.

**Options:**
1. +50% to rarity roll?
2. +50% gold value?
3. Shift rarity table by 50%?

**Proposed Definition - Rarity Table Shift:**

| Rarity | 0 Dread | 100 Dread |
|--------|---------|-----------|
| Common | 60% | 45% |
| Uncommon | 25% | 32% |
| Rare | 12% | 17% |
| Epic | 2.5% | 5% |
| Legendary | 0.5% | 1% |

---

### 14. XP Grind Wall at Level 15+

**Source:** Progression Pacing Auditor

**Current formula:** 100 × level XP per level
- Level 10: 1000 XP needed
- Level 15: 1500 XP needed
- Level 20: 2000 XP needed

With ~200 XP per full clear, Level 15+ requires 7-10 full clears per level.

**Fix Options:**
1. Sublinear curve: Level 10 = 600 XP, Level 15 = 800 XP, Level 20 = 1000 XP
2. Floor XP multipliers: Floor 1 = 1.0x, Floor 5 = 2.5x
3. Milestone XP for boss kills

**Recommendation:** Combination of 1 and 2

---

### 15. Pre-Boss Warning Missing

**Source:** RPG Game Designer

Players may stumble into Floor 5 boss at 10 HP with no escape option.

**Add before Floor 5 descent:**
```
WARNING: The Bone Colossus guards the depths below.
You cannot flee from this fight.

Your status: HP 23/50 | Dread 67/100

[D]escend anyway  [R]eturn to camp via Waystone (25% gold)
```

---

### 16. P0 Scope Missing Implicit Requirements

**Source:** RPG Game Designer
**Location:** Lines 971-997

P0 list doesn't include features REQUIRED for core loop:
- Camp hub (even basic navigation)
- Stash system
- Character persistence (XP, level, stats)
- Gold persistence

**Fix:** Add explicit P0 requirements:
```
P0 Core Infrastructure:
- Camp hub (navigation menu only, no NPCs initially)
- Stash (10 slots, bring 2)
- Character save (level, XP, stats, equipped gear)
- Gold tracking (per-run and persistent)
```

---

## Moderate Concerns

Should be tracked but can be resolved during implementation.

### 17. Flagellant Class Unlock Ambiguity

**Source:** Mechanics Auditor
**Location:** Line 442

"Reach 85+ Dread, extract alive" - unclear timing:
- 85 Dread at ANY point during run (easy)?
- 85 Dread at the moment of extraction (hard)?

**Proposed clarification:** "Extract while at 85+ Dread" (at moment of extraction)

---

### 18. Veteran Knowledge + Dread Hallucinations Interaction

**Source:** Mechanics Auditor

Player has Tier 3 knowledge of Ghouls (knows exact stats: 15 HP). Player is at 80 Dread.

**Question:** What does UI show?
- If knowledge overrides hallucinations: Dread trivialized for veterans
- If Dread corrupts knowledge: Veteran system feels useless

**Proposed solution:** Both coexist. Display shows corrupted value BUT adds "(You know: 15 HP)" in parentheses. Player retains KNOWLEDGE but sees corrupted PERCEPTION.

---

### 19. Status Effect Stacking Lethality

**Source:** Game Balance Tuner

**Poisoned + 2× Bleeding:**
- 3 + 2 + 2 = 7 damage/turn
- Over 4 turns: 28 damage (56% of starting HP)

**Concern:** DoT stacking is very dangerous for new players.

**Mitigation needed:** Ensure Antidote and Bandage consumables are common. Consider cap on bleed stacks (max 3).

---

### 20. Session Length Documentation Mismatch

**Source:** Progression Pacing Auditor

Document says deep dive = 25-30 min, but actual calculation = 35-40 min.

**Fix:** Update documentation to match reality, or adjust room/combat pacing.

---

### 21. Content Exhaustion Risk (MVP)

**Source:** Progression Pacing Auditor

MVP has only:
- 3 enemy types
- 1 boss
- 30 items initially

Likely content exhaustion by run 20-30.

**Acceptable for MVP** if post-MVP content is prioritized immediately.

---

### 22. Extraction Cost Too Light on Floor 3

**Source:** Game Balance Tuner

Floor 3 at 10% is negligible. Player with 150g loses only 15g.

**Consider:** 20% for Floor 3, 40% for Floor 4 to create real stakes.

---

### 23. Veteran Knowledge Tier 1 Too Fast

**Source:** Progression Pacing Auditor

5 encounters unlocks basic info. With only 3 enemy types, all learned by run 3.

**Consider:** Increase to 8-10 encounters for Tier 1.

---

## Exploits Identified

### Zero-Gold Floor 3 Extraction

**Source:** Mechanics Auditor

**Exploit:** 10% of 0 gold = 0. Free extraction.

**Mechanism:** Dump all gold (buy items, pay identification) before reaching Floor 3 Waystone.

**Fix:** Add minimum costs:
- Floor 3: 10% gold (minimum 15 gold)
- Floor 4: 25% gold (minimum 25 gold) OR 1 Uncommon+ item

---

### Watcher Farm on Floor 1

**Source:** Mechanics Auditor

**Exploit:** Deliberately trigger 100 Dread on Floor 1 (darkness + forbidden texts), then use free extraction.

**Questions:**
- Does Watcher block Floor 1-2 extraction?
- Document says Watcher "prioritizes blocking extraction" but Floor 1-2 doesn't use Waystones

**Risk:** If Watcher doesn't block, players can farm Hollowed One unlock with near-zero risk.

**Fix:** "The Watcher blocks ALL extraction attempts until stunned"

---

### Watcher Stun-Lock

**Source:** Mechanics Auditor

**Math:**
- Stun threshold: 30 damage in one hit
- Level 20 player with +19 MIGHT: Heavy attack = 86+ damage
- Result: Permanent stun capability

**Fix:** "After being stunned twice, The Watcher becomes immune to stun for remainder of run"

---

### Shrine Buff Stacking

**Source:** Mechanics Auditor

**Question:** Do multiple shrine buffs stack?

**Risk:** +3 MIGHT from every shrine = broken damage scaling

**Fix:** "Only one shrine blessing active at a time. New blessing replaces previous."

---

### Flee-Reset Exploit

**Source:** Mechanics Auditor

**Exploit:** Flee combat, re-enter room, get different RNG seed

**Fix:** "Cannot re-enter a room you fled from this floor"

---

### Safe XP Grinding

**Source:** Mechanics Auditor

**Exploit:** Farm Floor 1-2 forever (free extraction) for XP

**Fix:** XP multiplied by floor number (Floor 1 = 1x, Floor 5 = 2.5x)

---

### Identification = Permanent Safety

**Source:** RPG Game Designer

**Current rules imply:**
1. Find epic item
2. Spend 25 gold to identify
3. Item is now "safe" - can die freely

This makes identification = "pay 25 gold to permanently secure loot" rather than risk/reward.

**Clarification needed:** Does identification reduce SELL VALUE uncertainty, or death risk?

**Proposed:** Identification reveals true stats. Items are only truly "banked" on successful extraction. Identified items in inventory are still lost on death.

---

## Missing Specifications

Items the document references or implies but doesn't define.

### Must Define Before Implementation

| Specification | Notes |
|---------------|-------|
| Starting stats (VIGOR, MIGHT, CUNNING) | See Blocker #3 |
| Starting Dread | See Blocker #2 |
| Enemy damage values | See Blocker #5 |
| Inventory capacity | See Blocker #6 |
| Room traversal rules | See Blocker #8 |
| Damage formula | See Blocker #4 |
| Loot quality bonus definition | See Issue #13 |

### Should Define Before Beta

| Specification | Notes |
|---------------|-------|
| Bone Colossus full mechanics | HP, damage, phases, abilities |
| Item effect taxonomy | On-hit, passive, proc categories |
| Curse effect pool | What "negative secondary effects" exist |
| Gold source breakdown | How much from enemies vs treasure vs events |
| Bounty system basics | Referenced but not designed |
| The Ossuary room templates | Dungeon identity specifics |
| Save system | When saves happen, mid-run allowed? |
| Tutorial pacing | What unlocks when for new players |

### Can Defer to Post-MVP

| Specification | Notes |
|---------------|-------|
| Full NPC dialogue trees | |
| Additional dungeon designs | |
| Class-specific ability sets | |
| Mutator definitions | |

---

## Validated Systems

These were reviewed and found to be **mathematically sound and well-designed**.

| System | Verdict | Notes |
|--------|---------|-------|
| Dread accumulation rates | VALIDATED | Targets 40-60 at healthy extraction, achievable |
| Drop rate distribution | VALIDATED | Legendary rarity appropriate (~40 runs to first) |
| Flee mechanics | VALIDATED | Penalties prevent spam while keeping viable |
| Elite spawn formula | VALIDATED | 5% + (Dread% × 0.2) scales sensibly |
| Dangerous event scaling | VALIDATED | 1.0 + (Dread% × 0.02) = 3x at max |
| Gold economy (income) | VALIDATED | Deep runs more gold-efficient, incentivizes risk |
| Session length (concept) | VALIDATED | Achievable with room traversal rules added |
| Death-as-discovery loop | VALIDATED | +10% Lesson Learned creates revenge motivation |
| Extraction dilemma design | VALIDATED | Core hook is compelling |
| Unreliable narrator concept | VALIDATED | Unique CLI advantage, well-protected input |

---

## Resolution Checklist

### Before Architect Phase

- [x] Fix Dread threshold text (line 245: 51+ -> 70+) - **RESOLVED in v1.4**
- [x] Define starting Dread (0) - **RESOLVED in v1.5**
- [x] Define starting stats (VIGOR 3, MIGHT 3, CUNNING 3) - **RESOLVED in v1.3**
- [x] Clarify damage formula (Weapon + MIGHTx1) - **RESOLVED in v1.3**
- [x] Add enemy damage values - **RESOLVED in v1.3**
- [x] Define inventory capacity (8 carried + 4 equipped + 3 consumables) - **RESOLVED in v1.5**
- [x] Clarify death economy priority order - **RESOLVED in v1.5**
- [x] Add room traversal rules (mandatory vs optional) - **RESOLVED in v1.3**

### During Architect Phase

- [x] Design heavy attack utility (stun chance recommended) - **RESOLVED in v1.3**
- [x] Design block niche (multi-hit, status resist) - **RESOLVED in v1.3**
- [x] Add pre-boss warning - **RESOLVED in v1.3**
- [x] Stagger Floor 3 difficulty introductions - **RESOLVED in v1.3**
- [x] Define loot quality bonus formula - **RESOLVED in v1.3**
- [x] Add minimum extraction costs - **RESOLVED in v1.5**
- [ ] Add P0 implicit requirements to scope

### Before Beta

- [ ] Full Bone Colossus mechanics
- [ ] Item effect taxonomy
- [ ] Curse effect pool
- [x] XP curve adjustment (floor multipliers + level-gated reduction) - **RESOLVED in v1.5**
- [ ] Tutorial pacing system
- [x] Exploit mitigations (all listed above) - **RESOLVED in v1.5**

### Exploit Mitigations (All Resolved in v1.5)

- [x] Zero-Gold Floor 3 Extraction - Minimum costs added
- [x] Watcher Farm on Floor 1 - Watcher blocks ALL extraction, Hollowed One requires Floor 3+
- [x] Watcher Stun-Lock - 2-stun limit, then immunity + Enrage
- [x] Shrine Buff Stacking - Only one blessing active
- [x] Flee-Reset Exploit - Room state locks on entry
- [x] Safe XP Grinding - Level-gated XP reduction
- [x] Identification = Permanent Safety - ID only protects EQUIPPED items

---

*Generated from audits by: RPG Game Designer, Mechanics Auditor, Progression Pacing Auditor, Game Balance Tuner*
*Document version: 1.0*
*Created: 2026-01-15*
