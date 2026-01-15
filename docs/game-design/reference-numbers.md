# Reference Numbers (Appendix)

> Part of the [DARKDELVE Game Design Document](../game-design.md)

This appendix contains all numeric specifications, stats, and balance validation data.

---

## Starting Stats (Mercenary Class)

| Stat | Value | Derived Effect |
|------|-------|----------------|
| VIGOR | 3 | 35 base HP + (3 x 5) = **50 HP** |
| MIGHT | 3 | +3 damage per attack |
| CUNNING | 3 | 5% base + (3 × 3%) = **14% crit chance** (see soft cap below) |

### Starting Equipment

- Weapon: Rusty Sword (5-8 damage, Common)
- Armor: Tattered Leathers (+5 HP, Common)
- Helm: None
- Accessory: None

### Derived Stats

- Starting HP: 50 (35 base + 15 from VIGOR)
- Starting Damage: 8-11 (5-8 weapon + 3 MIGHT)
- Crit Chance: 14%
- Stamina: 4 (regen 2/turn)
- Potion capacity: 3

### CUNNING Crit Scaling (Soft Cap)

Crit chance uses diminishing returns to prevent degenerate crit-stacking builds:

```
Crit Chance = 5% (base) + CUNNING Contribution + Gear Bonuses

CUNNING Contribution:
  Points 1-10:  +3% per point
  Points 11+:   +1.5% per point (diminishing)

TOTAL CRIT CAP: 65% (from all sources combined)
```

| CUNNING | Contribution | Total Crit (stats only) |
|---------|-------------|------------------------|
| 3 | 9% | 14% |
| 5 | 15% | 20% |
| 10 | 30% | 35% |
| 15 | 37.5% | 42.5% |
| 20 | 45% | 50% |

**Soft Cap Breakpoint:** CUNNING 10 provides 86% of the crit value of CUNNING 20 at half the investment. This makes moderate CUNNING attractive without forcing all-or-nothing builds.

**Hard Cap (65%):** Prevents gear stacking from breaking combat balance. With gear bonuses (+5% to +15%) and legendary items (+15%+), builds could otherwise reach 80%+ crit, making crit the strictly dominant strategy.

→ *Full details: [Character & Progression](character-progression.md#cunning-crit-scaling-soft-cap)*

---

## Enemy Stats (MVP Roster)

### Basic Enemies

| Enemy | HP | Damage | Speed | Special | Floors |
|-------|-----|--------|-------|---------|--------|
| Plague Rat | 12-15 | 5-8 | Fast | 30% Poison on hit | 1-3 |
| Ghoul | 22-26 | 8-12 | Normal | None | 1-4 |
| Plague Ghoul | 16-20 | 6-10 | Normal | 30% Poison on hit | 2-3 |
| Skeleton Archer | 14-18 | 10-14 | Normal | Precise (10% crit chance) | 2-4 |
| Armored Ghoul | 22-26 | 10-14 | Slow | 15% armor (use Heavy Attack) | 4-5 |
| Shadow Stalker | 20-25 | 14-18 | Fast | Ambush (always acts first, no flee round 1) | 4-5 |
| Corpse Shambler | 30-35 | 6-10 | Slow | Relentless (cannot be staggered) | 3-5 |

**Variant Strategy:** Plague Ghoul and Armored Ghoul are variants of the base Ghoul, sharing visual design with distinct mechanics. This creates 3 enemy entries from 1 base asset.

### Elite Enemies

| Enemy | HP | Damage | Speed | Special | Floors |
|-------|-----|--------|-------|---------|--------|
| Fleshweaver | 40-50 | 15-20 | Slow | Life Drain at 50% HP (heals 15 HP, deals 10 damage) | 4-5 |
| Bone Knight | 45-50 | 18-24 | Normal | 25% armor (reduces damage taken) | 4-5 |

### Boss

| Enemy | HP | Damage | Speed | Special |
|-------|-----|--------|-------|---------|
| Bone Colossus | 100 | 18-24 | Slow | Pattern Attack (3-turn cycle), Ground Slam (15-20 damage, 50% stun) |

**Attack Pattern (3-turn cycle):**
- **Turn 1:** Standard Strike — single attack (18-24 damage)
- **Turn 2:** Telegraph — "The Colossus raises both fists..." (no damage, player's safe damage window)
- **Turn 3:** Crushing Blow — double attack (18-24 × 2 = 36-48 total damage)
- Cycle repeats

**Ground Slam:** Replaces one Standard Strike every 4th cycle. Deals 15-20 damage, 50% stun chance. Telegraphed 1 turn in advance ("The Colossus lifts its foot..."). Never occurs on Turn 3 (double attack turn).

**Design Intent:** Pattern-based combat rewards learning. Turn 2 is the optimal damage window. Block is essential on Turn 3 (reduces 36-48 to 18-24).

### Enemy XP Values

| Enemy | Base XP | Type | Notes | XP/Turn Ratio |
|-------|---------|------|-------|---------------|
| Plague Rat | 5 | Basic | Swarm enemy, low individual XP | 2.5 |
| Ghoul | 10 | Basic | Standard enemy baseline | 2.86 |
| Plague Ghoul | 12 | Variant | Poison risk premium | 6.0 |
| Skeleton Archer | 12 | Basic | Crit risk premium | 6.0 |
| Armored Ghoul | 15 | Variant | Armor = effort | 5.0 |
| Corpse Shambler | 15 | Basic | Long fight, low threat | 3.75 |
| Shadow Stalker | 18 | Basic | Ambush risk premium | 6.0 |
| Fleshweaver | 35 | Elite | Elite baseline | 7.0 |
| Bone Knight | 45 | Elite | Elite + armor | 12.9 |
| Bone Colossus | 150 | Boss | Boss reward, includes completion | 13.6 |

**XP Design Principle:** XP/turn increases with enemy difficulty tier. Basic enemies give 2.5-6.0 XP/turn, elites give 7.0-12.9 XP/turn, boss gives 13.6 XP/turn. This creates correct incentive: harder enemies are worth fighting, not avoiding.

**XP Calculation Assumptions:**
The XP targets in the Progression Metrics section (~740 XP for a standard run) are based on:
- Combat rooms: ~60% of total rooms (4-5 combat rooms per 4-room floor)
- Standard run (F1-4): ~10 combat encounters total
- Elite spawn rate: 10-15% on Floors 3-4 (expect 1-2 elite encounters per standard run)
- These targets assume typical encounter distribution, not worst/best case scenarios

**XP Multipliers by Floor:**

| Floor | Multiplier | Example (Ghoul) |
|-------|------------|-----------------|
| 1 | 1.0× | 10 XP |
| 2 | 1.5× | 15 XP |
| 3 | 2.0× | 20 XP |
| 4 | 3.0× | 30 XP |
| 5 | 4.0× | 40 XP |

**Level-Gated XP Reduction (Anti-Grinding):**

| Player Level | Floor 1 | Floor 2 | Floors 3-5 |
|--------------|---------|---------|------------|
| 1-5 | 100% | 100% | 100% |
| 6-10 | 50% | 100% | 100% |
| 11-15 | 50% | 50% | 100% |
| 16-20 | 50% | 50% | 50% |

**Level-Gated Gold Reduction (Anti-Farming):**

| Player Level | Floor 1 | Floor 2 | Floors 3-5 |
|--------------|---------|---------|------------|
| 1-5 | 100% | 100% | 100% |
| 6-10 | 70% | 100% | 100% |
| 11-15 | 70% | 70% | 100% |
| 16-20 | 70% | 70% | 70% |

→ *Full details: [Character & Progression](character-progression.md#level-gated-gold-reduction-anti-farming)*

### Boss Design for Underpowered Players

The boss uses soft gating rather than hard level requirements:

| Mechanism | Implementation | Rationale |
|-----------|----------------|-----------|
| Resource Gate | Waystone cost on Floor 4 (25% gold OR 1 item) filters underpowered players | Natural economic barrier |
| Soft Warning | NPC hints on Floor 4-5 if player gear is weak | Teaches without blocking |
| Minimum Stats | Boss HP: 100 minimum, scales to 120 at player level 10+ | Cannot be trivial |
| Death Teaches | First boss death unlocks Telegraph knowledge | Dying = learning attack patterns |

**NPC Warning Example (Floor 4):**
```
The Merchant eyes your equipment.
"Planning to face what's below? With THAT sword?
 I've seen better-armed corpses. Your choice."
```

**Design Philosophy:** Never hard-gate boss access. Let players attempt at any level. Death teaches patterns via Veteran Knowledge system. This aligns with "death as discovery" - underpowered players die, learn, return stronger.

---

## Combat Balance

- Light Attack: 1 Stamina, base damage
- Heavy Attack: 3 Stamina, 2x damage + 50% stagger + 25% armor penetration
- Block: 1 Stamina, 50% damage reduction on ALL attacks this turn
- Dodge: 1 Stamina, avoid ONE attack + prevent status effects
- Basic enemy HP range: 12-35 (swarm to tank)
- Elite enemy HP range: 40-50
- Boss HP: 100
- Average fight duration: 4-8 turns

---

## Economy

### Gold Sources

| Source | Gold Range | Notes |
|--------|------------|-------|
| Floor 1-2 | 20-50 each | ~70g avg total for quick raid |
| Floor 3-5 | 50-100 each | Deeper = richer |
| Quick Raid (F1-2) | 40-100g | avg ~70g |
| Standard Run (F1-4) | 140-300g | avg ~220g |
| Full Clear (F1-5 + Boss) | 190-400g | avg ~320g (includes boss bonus) |

### Gold Per Enemy Type

| Enemy | Base Gold | Variance |
|-------|-----------|----------|
| Plague Rat | 3-5g | Low |
| Ghoul | 5-8g | Low |
| Plague Ghoul | 6-9g | Low |
| Skeleton Archer | 6-9g | Low |
| Armored Ghoul | 8-12g | Medium |
| Corpse Shambler | 7-10g | Medium |
| Shadow Stalker | 10-14g | Medium |
| Fleshweaver (Elite) | 20-28g | High |
| Bone Knight (Elite) | 25-35g | High |
| Bone Colossus (Boss) | 50-75g | High |

**Gold Floor Multiplier:**
- Floor 1-2: 1.0x
- Floor 3: 1.2x
- Floor 4: 1.3x
- Floor 5: 1.5x

### Gold Per Treasure Source

| Source | Gold Range |
|--------|------------|
| Standard Chest (Floor 1-2) | 8-15g |
| Standard Chest (Floor 3-4) | 15-25g |
| Standard Chest (Floor 5) | 20-35g |
| Ornate Chest (Floor 4-5) | 30-50g |

### Gold Sinks

| Sink | Cost | Notes |
|------|------|-------|
| Item identification | 25g | At Chronicler |
| Extraction (Floor 3) | 10% gold (min 15g) | Or 1 item |
| Extraction (Floor 4) | 25% gold (min 25g) | Or 1 item |
| Threshold Retreat (Floor 5) | 25% gold (min 25g) | Or 1 item. Returns to F4, loses F5 progress. |
| Merchant purchases | See below | Primary gold sink |

### Starting Gold

New characters begin with **50 gold**—enough for 2-3 consumables or save toward equipment.

---

## Merchant System

The Merchant operates at camp between runs. Stock refreshes each run.

### Free Starter Potion

Each run begins with **1 free Healing Potion** in consumable slots. This prevents early-run starvation without trivializing economy.

*"The camp healer hands you a potion. 'You'll need it.'"*

### Always Available (Infinite Stock)

| Item | Buy | Sell | Effect |
|------|-----|------|--------|
| Healing Potion | 15g | 7g | Restore 30 HP |
| Antidote | 12g | 6g | Cure poison |
| Torch | 8g | 4g | -5 Dread gain for 1 floor |
| Bandage | 10g | 5g | Stop bleeding, restore 15 HP over 3 turns |
| Calm Draught | 18g | 9g | -15 Dread instantly |

### Rotating Consumables (2-3 slots, refreshes each run)

| Item | Buy | Sell | Effect |
|------|-----|------|--------|
| Clarity Potion | 20g | 10g | -20 Dread (premium, rotating stock) |
| ID Scroll | 30g | 15g | Identify 1 item in dungeon |
| Smelling Salts | 35g | 17g | Cure stun, +10 Stamina |
| Venom Flask | 40g | 20g | Coat weapon with poison (3 combats) |
| Smoke Bomb | 45g | 22g | Guaranteed flee (bypasses Turn 1 and Ambush restrictions, NOT Watcher extraction block) |
| Ironhide Tonic | 50g | 25g | +25% damage reduction for 1 combat |

### Equipment: Accessories Only

The Merchant sells **accessories only**—weapons, armor, and helms must be found in the dungeon. This preserves loot discovery value while allowing targeted stat purchases.

| Rarity | Buy Price | Sell Price | Level Required |
|--------|-----------|------------|----------------|
| Common | 80-100g | 40-50g | Any |
| Uncommon | 150-180g | 75-90g | Level 5+ |
| Rare+ | Never sold | 140-350g | N/A |
| Legendary | Never sold | 400-500g | N/A |

**Design Intent:** One standard run (~220g) covers 2-3 consumables + 1 Common accessory OR save for an Uncommon. Equipment requires investment, keeping drops valuable.

### Level Scaling

| Player Level | Accessory Slots | Rarities Available |
|--------------|-----------------|-------------------|
| 1-4 | 1 | Common only |
| 5-9 | 1-2 | Common, Uncommon |
| 10+ | 2 | Uncommon only (Common phases out) |

### Stock Refresh Rules

- Stock regenerates at **start of each run** (before descent)
- Death does NOT re-roll stock—prevents exploit
- Successful extraction increments run counter
- Stock seed: `hash(run_number + character_level + last_extraction_floor)`

### Buyback System

| Rule | Value |
|------|-------|
| Duration | Current session only |
| Limit | 3 most recent items |
| Price | 50% markup from sell price |
| Clears on | Run start, quit game |

### Economic Validation

| Metric | Target | Red Flag |
|--------|--------|----------|
| Gold spent at shop per run | 30-80g | <15g (irrelevant) or >150g (dominant) |
| Consumables bought per run | 1-2 | 0 (not useful) or 4+ (crutch) |
| Accessory purchases | 1 per 3-5 runs | Every run (too cheap) or never (too expensive) |
| Shop visit duration | 15-45 seconds | <5s (ignored) or >2min (paralysis) |

---

## Timing

- Combat encounter: 1.5-2 minutes (target), 2.5 minutes (max acceptable)
- Full floor: 4-9 minutes (varies by room count: Floor 1-4 = 4-5 min, Floor 5 = 9 min)
- Full dungeon: 20-28 minutes (23 rooms total)

---

## Balance Validation Checklist

Use these metrics during playtesting:

### Combat Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| Turns to kill Plague Rat | 2-3 | >4 (too tanky) or 1 (too easy) |
| Turns to kill Ghoul | 3-4 | >5 (too tanky) or 1-2 (too easy) |
| Turns to kill Plague Ghoul | 2-3 | >4 (too tanky) |
| Turns to kill Armored Ghoul (Heavy) | 2 | >3 (armor too strong) |
| Turns to kill Shadow Stalker | 3 | >4 (too tanky) or 1-2 (too glass) |
| Turns to kill Corpse Shambler | 3-4 | >6 (slog) |
| Turns to kill Bone Knight | 4-5 (with Heavy) | >6 (too tanky) or 2 (too easy) |
| Player HP after Ghoul fight | 60-80% | <40% (too punishing) or 100% (no threat) |
| Player HP after Shadow Stalker | 40-60% | <20% (too deadly) or >80% (not threatening) |
| Player HP after Bone Knight | 40-60% | <20% (too punishing) or >80% (no threat) |
| Boss fight duration | 8-12 turns | >15 (slog) or <6 (anticlimactic) |
| Heavy Attack usage rate | 20-40% of attacks | <10% (underpowered) or >60% (dominant) |
| Block vs Dodge usage | ~50/50 situational | >80% one option (imbalanced) |
| Dread at healthy extraction | 40-60 | <30 (not enough tension) or >80 (too punishing) |

### Progression Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| XP per Quick Raid (F1-2) | ~90 XP | <50 (too slow) or >150 (too fast) |
| XP per Standard Run (F1-4) | ~740 XP | <500 (too slow) or >1000 (too fast) |
| XP per Full Clear (F1-5 + Boss) | ~1,440 XP | <1,000 (too slow) or >2,000 (too fast) |
| Floor 1 XP at level 10+ | 50% reduction active | No reduction (exploit) |
| Levels per hour (deep runs) | 1-2 levels | <0.5 (grind wall) or >3 (trivial) |

---

## Related Systems

- [Combat](combat.md) - Combat mechanics and formulas
- [Character & Progression](character-progression.md) - Stat effects and leveling
- [Dungeon Structure](dungeon-structure.md) - Floor layouts and pacing

---

## Changelog

### v1.8 (2026-01-15)

**Pre-implementation blocker resolution.** Red Team audit identified ambiguities; resolved before Architect phase.

*Blockers Resolved:*

**B-002: Threshold Chamber Extraction Ambiguity**
- **Problem:** `dungeon-structure.md` stated "Floor 5 has NO extraction" but Threshold Chamber UI showed extraction option
- **Resolution:** Implemented Threshold Retreat mechanic
  - Floor 5 has NO Waystone extraction (rule is TRUE)
  - Threshold Chamber offers RETREAT to Floor 4 (not extraction)
  - Cost: 25% gold (min 25g) OR 1 item
  - Effect: Return to Floor 4 Stairwell, ALL Floor 5 progress lost
- Updated `dungeon-structure.md`: Threshold Chamber UI, Floor 5 Extraction Rules, new Threshold Retreat Mechanic section
- Updated `reference-numbers.md`: Added Threshold Retreat to Gold Sinks table

**B-003: Lesson Learned Duration Tracking**
- **Problem:** Undefined when "1 run" charge is consumed—potential "die until you win" exploit
- **Resolution:** Charge decrements at expedition START, regardless of outcome
  - Entering dungeon consumes the charge
  - Dying does NOT restore it
- Updated `death-discovery.md`: Added Duration Rules table, exploit prevention rationale, display examples
- Updated `save-system.md`: Added inline comment clarifying decrement timing

*Documentation:*
- Created `docs/blockers.md` to track design blockers and resolutions

---

### v1.7 (2026-01-15)

**Comprehensive blocker resolution.** All 21 active blockers resolved. Design documents ready for Architect phase.

*Critical Blockers Resolved (9 items):*

**B-001: Enemy AI Behavior System**
- Added to `combat.md`: weighted random action selection, per-enemy action tables, HP-conditional modifiers
- Enemies never use defensive actions (player advantage preserved)

**B-002: Event System Outcomes**
- Created `events.md` with 8 MVP event types fully specified
- Alert mechanics, skill checks (CUNNING), outcome probability tables

**B-003: Loot Generation Algorithm**
- Added to `items.md`: step-by-step pseudocode, drop triggers, slot determination weights
- Drop chance by enemy type (15% basic, 25% elite, 40% boss)

**B-004: Gold Drop Values**
- Added to `reference-numbers.md`: per-enemy gold (3-75g range), chest values, floor multipliers

**B-005: Dungeon Layout Generation**
- Added to `dungeon-generation.md`: 3 layout templates, generation pseudocode, enemy composition pools

**B-006: MVP Item Templates**
- Added to `items.md`: 15 equipment items + 5 consumables with complete stat values

**B-007: Watcher Stun Threshold**
- Lowered from 30 to 20 damage in `dread-system.md`
- Starter Mercenary now has ~51% stun chance per Heavy Attack

**B-008: Clarity Potion Contradiction**
- Standardized to -20 Dread at 20g across all documents

**B-009: Torch Effect Ambiguity**
- Adopted gain reduction model: -5 Dread gain per floor duration

*High Priority Issues Resolved (5 items):*

**B-010: Combat at 0 Stamina**
- Added PASS action to `combat.md`: skip action, +2 Stamina regen applies

**B-011: Status Effect Persistence**
- Added persistence rules to `combat.md`: combat effects END at combat end, Cursed persists

**B-012: Watcher Defensive Actions**
- Added Watcher Combat Rules to `dread-system.md`: Dodge bypassed, Block works (50% reduction), armor stacks

**B-013: MIGHT vs CUNNING Imbalance**
- Increased crit multiplier from 2.0x to 2.5x in `reference-numbers.md`

**B-016: Gold Farming Penalty**
- Documented 70% penalty rationale in `character-progression.md` with monitoring metrics

*Medium Priority Issues Resolved (6 items):*

**B-017: Cursed Item Mechanics**
- Completed in `items.md`: cannot unequip until run end, 4 curse types, Hollowed One exception

**B-018: Smoke Bomb Scope**
- Clarified in `reference-numbers.md`: bypasses Turn 1 and Ambush, NOT Watcher or Boss room

**B-019: Unarmed Combat**
- Added Weapon Slot Rules to `character-progression.md`: weapon slot cannot be empty

**B-020: Ration Item**
- Removed undefined reference from `dread-system.md`

**B-021: Turn Counting**
- Defined as exploration turns (room entries) in `dread-system.md`

**B-024: Save File Format**
- Added technical specification to `save-system.md`: JSON format, semantic versioning, atomic saves

*Previously Resolved:*

**B-025: Floor 4 Difficulty Spike**
- Redistributed room count: Floor 4 (5→4 rooms), Floor 5 (6→7 rooms)
- Floor Introduction Sequence revised:
  1. Floors 1-2: Core mechanics, free extraction
  2. Floor 3: Waystone cost (economic pressure)
  3. Floor 4: Armored enemies + Shadow Stalker ambush mechanic
  4. Floor 5: Room count increase + Boss

**B-027: Floor 3 Mechanic Stacking**
- **Problem:** Floor 3 introduced TWO major changes simultaneously (Waystone cost AND Armored Ghoul), violating "one major mechanic per floor" principle
- **Resolution:** Moved Armored Ghoul floor range from 3-4 to 4-5
- Updated `reference-numbers.md` enemy stats table
- Updated `dungeon-generation.md` enemy composition pools (Floor 3 no longer includes Armored Ghoul; Floors 4-5 now include Armored Ghoul)
- Floor 3 now introduces only Waystone extraction cost; Floor 4 introduces armored enemies alongside Shadow Stalker

*Balance Fixes:*

**B-028: Ghoul HP Too Low**
- **Problem:** Ghoul (baseline enemy) died in 2 turns with starter weapon; target was 3-4 turns for meaningful combat decisions
- **Resolution:** Increased Ghoul HP from 18-22 to 22-26
- TTK now aligns with design target (3-4 turns with starter Mercenary)

*Documentation Fixes:*

**D-001: Bone Knight TTK Target**
- **Problem:** Balance Validation Checklist showed "3-4 turns" but actual math shows 4-5 turns with Heavy rotation
- **Resolution:** Updated Balance Validation Checklist to show "4-5 (with Heavy)" instead of "3-4 (with Heavy)"
- Red flag thresholds unchanged (>6 too tanky, 2 too easy)

**D-003: XP Calculation Assumptions**
- **Problem:** XP targets (~740 for standard run) lacked clear calculation methodology
- **Resolution:** Added XP Calculation Assumptions documentation after XP Design Principle
- Documents: ~60% combat rooms, ~10 combat encounters per standard run, 10-15% elite spawn rate on Floors 3-4
- Clarifies targets assume typical distribution, not worst/best case

**D-004: Dread Event Frequency**
- **Problem:** Pure combat Dread (~25-30 per standard run) is below target (40-60); event-based Dread sources needed
- **Resolution:** Added Expected Event Contribution documentation to `dread-system.md` Dread Sources section
- Specifies 1-2 Dread-generating events per run contributing +10-20 Dread
- Guides dungeon generation tuning to hit 40-60 target range

**D-005: Consumable Stacking Rules**
- Added Consumable Stacking subsection to `character-progression.md` Inventory System section
- Stacking rules: identical consumables stack, 5-per-slot cap, separate consumable slots (3) from inventory slots (8)
- Includes design rationale for preventing consumable inventory bloat

*Edge Case Specifications (6 items):*

**B-029: Lesson Learned Duration Inconsistency**
- **Problem:** `death-discovery.md` specified "persists 1 run" but `save-system.md` schema example showed `runsRemaining: 2`
- **Resolution:** Changed save schema example from `runsRemaining: 2` to `runsRemaining: 1` in `save-system.md`

**E-001: Extraction Interruption**
- **Problem:** Undefined behavior when HP reaches 0 during extraction ritual
- **Resolution:** Added "Extraction Atomicity" rule to `extraction-system.md`
- Extraction is atomic; completes regardless of damage; if HP would reach 0, player extracts at 1 HP ("barely survived")

**E-002: Full Inventory When Loot Drops**
- **Problem:** Undefined behavior when enemy drops loot and inventory is full
- **Resolution:** Added "Full Inventory Handling" rule to `items.md` Loot Generation section
- Loot remains in room; player may return after freeing inventory space; room state persists until run ends

**E-003: Cursed Item Death Recovery**
- **Problem:** Unclear if curse overrides EQUIPPED+IDENTIFIED death recovery rule
- **Resolution:** Added "Cursed Item Death Recovery" subsection to `items.md` Cursed Item Mechanics
- Cursed items follow standard death recovery rules; curse persists on the item

**E-004: Same Shrine Blessing Re-selected**
- **Problem:** Undefined behavior when player selects their current blessing type
- **Resolution:** Added "Same Blessing Re-selection" rule to `events.md` Shrine Events section
- Selecting current blessing has no effect; displays "You already bear this blessing."

**E-005: Extraction With No Gold AND No Items**
- **Problem:** Softlock potential when player has 0 gold, all items equipped, no carried items on Floor 3-4
- **Resolution:** Added "Desperation Extraction" rule to `extraction-system.md`
- Player may sacrifice 1 equipped item (except weapon); if only weapon remains, extraction is free but inflicts +20 Dread

**E-006: Watcher Escape Window Distance**
- **Problem:** Undefined behavior when player stuns Watcher but is 3+ rooms from extraction
- **Resolution:** Added "Stun Window Movement Rules" to `dread-system.md` Watcher Stun Mechanics
- Watcher is immobilized during stun; player moves freely; after 2 turns Watcher resumes from last position (no teleport)

**D-002: Shrine Room Type Clarification**
- **Problem:** Unclear whether shrines are in EVENT rooms or separate SHRINE room type
- **Resolution:** Added "Shrine Placement" clarification to `dungeon-structure.md` Room Types section
- Shrines appear within EVENT rooms as part of the event pool

### v1.5 (2026-01-15)

Resolved all blockers and HIGH-PRIORITY concerns. Includes game designer blockers (Room Navigation, Turn Order, Floor Transitions, Item Schema), game-balance-tuner blockers (Armor Formula, VIGOR Resistance), progression-pacing-auditor blockers (Veteran Knowledge, Item Pool, Hollowed One), and mechanics-auditor concerns (Watcher+Boss, Death Dread, Floor Farming). Validated Heavy Attack balance. Added comprehensive specifications to enable engineer implementation.

*Watcher + Boss Interaction (Concern #1):*
- **Problem:** Undefined behavior if player reaches 100 Dread during Floor 5 boss fight
- **Resolution:** Added Watcher + Boss Interaction Rules to `dread-system.md`
- **Rule:** Watcher CANNOT spawn during boss encounters; spawn deferred until post-boss
- **Post-Boss:** If Dread was 100+ during fight, Watcher spawns immediately after boss defeat
- **Mechanics:** Extraction available after boss; Watcher blocks until stunned once
- **Thematic:** "Double gauntlet" rewards skilled play, punishes excessive greed

*Death Dread Perverse Incentive (Concern #2):*
- **Problem:** Death reset Dread to 10 while extraction gave EndDread-25, making death optimal at high Dread
- **Resolution:** Unified formulas in `dread-system.md`
- **New Rule:** Death applies `EndDread - 25 (min 10)` same as extraction
- **Result:** Death penalty is item/gold loss only; Dread management no longer incentivizes dying

*Floor 1-2 Farming (Concern #3):*
- **Problem:** Free extraction + only XP penalty meant gold farming remained viable
- **Resolution:** Added Level-Gated Gold Reduction to `character-progression.md` and `reference-numbers.md`
- **Gold Penalty:** 70% gold at Level 6+ for early floors (mirrors XP penalty pattern)
- **Result:** Quick raids remain viable but not optimal; deep runs properly incentivized

*Veteran Knowledge Thresholds (Blocker #6):*
- **Problem:** Inconsistent thresholds documented (8/20/35 vs 5/15/25 encounters)
- **Resolution:** Adopted hybrid 6/15/25 encounters OR 1/2/3 deaths
- **Tier 1:** 6 encounters OR 1 death (achievable in ~1 run)
- **Tier 2:** 15 encounters OR 2 deaths (2-3 runs or 2 deaths)
- **Tier 3:** 25 encounters OR 3 deaths (4-6 runs for average player)
- **Rationale:** Requires deliberate engagement, respects player time, preserves death acceleration for "death as discovery"
- Updated `character-progression.md` and `CLAUDE.md`

*Item Pool (Blocker #8):*
- **Problem:** Vague item count targets
- **Resolution:** MVP uses fixed 20-item pool, all available from Level 1
- **Base pool:** 20 items (11 Common, 5 Uncommon, 4 Rare) across all slots
- **Rarity gates:** Epic and Legendary deferred to post-MVP
- **Post-MVP:** Item pool can expand to 50-100 with level-gated unlocks
- Updated `character-progression.md` with MVP item distribution

*Hollowed One Unlock (Concern #4):*
- **Problem:** "Die at 100 Dread on Floor 3+" nearly impossible (Watcher one-shots at 100 Dread)
- **Resolution:** Changed to "Die to The Watcher on Floor 3+"
- **Journey:** Runs 6-10, player deliberately pushes to 100 Dread, triggers Watcher, is defeated
- **Thematic:** "The Watcher's gaze pierced your soul. You fell into the abyss... and found something there."
- Updated unlock condition and narrative in `character-progression.md`

*Armor System (Blocker #3):*
- **Formula:** `Effective Armor% = Base Armor% × (1 - Armor Penetration%)`
- **Damage After Armor:** `Raw Damage × (1 - Effective Armor%)`
- **Heavy Attack Penetration:** 25% pen reduces enemy armor multiplicatively (25% armor → 18.75% effective)
- **Player Armor:** From gear only (no base stat)
  - Common: 5-10%, Uncommon: 10-15%, Rare: 15-20%, Legendary: 20-25%
- **Player Armor Cap:** 40% hard cap from all sources
- **Rounding:** Nearest integer (0.5 rounds up)
- Added full specification to `combat.md` Combat Balance Formulas section

*VIGOR DoT Resistance (Blocker #7):*
- **Formula:** `DoT Resistance = min(VIGOR × 5%, 40%)`
- **Application:** `Actual DoT = Base DoT × (1 - DoT Resistance)`
- **Soft Cap:** 40% at 8 VIGOR
- **Affects:** Poison damage, Bleeding damage (damage per tick only, NOT duration)
- **Rationale:** Percentage reduction scales with damage, never fully negates, simple mental math
- Added VIGOR DoT Resistance section to `character-progression.md`

*Heavy Attack Balance Validation (Concern #5):*
- **Conclusion:** No change needed—current design is correct
- **Analysis:** Heavy intentionally weaker vs unarmored (83% efficiency), strongly outperforms vs armored (171-177%) and SLOW (104-221%)
- **Design Intent:** Creates correct tactical decisions—Light spam for unarmored, Heavy for armored/SLOW
- **Monitoring:** If playtesting shows <20% Heavy usage, graduated fixes documented in combat.md
- Added Balance Validation table to `combat.md` Heavy Attack section

*Room Navigation System (Blocker #1):*
- **Model:** Corridor-based graph (not grid). Each room has explicit connections to other rooms.
- **Input:** Numbered corridor selection ([1] North -> [TREASURE], [2] East -> [COMBAT], etc.)
- **Backtracking:** Allowed to CLEARED rooms only. Costs 1 turn. Blocked through uncleared rooms.
- **Room States:** UNEXPLORED (shows ?), ENTERED (in progress), CLEARED (safe passage)
- **Entry Behavior:** COMBAT rooms begin combat immediately. TREASURE/EVENT/REST show choice menu.
- **Dread Corruption:** Affects display only. 50+ Dread: 5% wrong room type. 70+ Dread: 30% hidden. 85+ Dread: all [?????].
- Added full specification to `dungeon-structure.md`

*Turn Order in Combat (Blocker #2):*
- **Default:** Player-first. Player acts, then enemy acts, each turn.
- **SLOW enemies:** Player first. +25% damage from Heavy Attack (off-balance).
- **NORMAL enemies:** Player first. Standard combat.
- **FAST enemies:** First-strike on Turn 1 only (enemy attacks before player). Normal order after.
- **AMBUSH (Shadow Stalker):** Enemy gets 2 free actions before Turn 1. Cannot flee Turn 1.
- **Status Effects:** Process at START of turn. Staggered enemy skips action. Stunned player skips action.
- **Boss:** Standard player-first. Pattern attacks (3-turn cycle) not affected by speed.
- Added Turn Order System section to `combat.md`

*Floor Transition Mechanics (Blocker #4):*
- **Stairwell Room:** Each floor has exactly one. Contains stairs down + extraction point (except Floor 5).
- **Descent Conditions:** Available immediately on entering Stairwell. No minimum room clear.
- **One-Way:** Cannot return to previous floors. "The stairs crumble behind you."
- **Dread Cost:** +5 Dread on descent, applied before first room of new floor.
- **Blocked When:** The Watcher active, or in combat.
- **Floor 5:** No descent (boss floor). Boss room is only exit.
- Added Floor Transition System section to `dungeon-structure.md`

*Item Data Schema (Blocker #5):*
- **Core Fields:** id, templateId, slot, rarity, identified, names, flavorText, baseStats, effects, consumable, cursed, questItem
- **Stat Block:** damageMin/Max, bonusHP, armor, vigor/might/cunning bonuses
- **Effect System:** Typed effects (STAT_BONUS, CRIT_CHANCE, LIFESTEAL, ON_HIT_POISON, CURSE_DREAD_GAIN, etc.)
- **Effect Structure:** type, magnitude, duration, chance, description, hiddenUntilIdentified
- **Consumable Data:** uses, useInCombat, useOutOfCombat flags
- **Identification:** Reveals true name, stats, effects, cursed status. Cost: 25g or ID Scroll.
- **Dread Corruption:** Display-only. 50+ shows ranges, 70+ shows wrong values 15%, 85+ shows ??? 25%.
- **Save Schema:** Minimal (id, templateId, identified). All other data derived from template.
- Created new `items.md` document with complete specification

*Document Updates:*
- Added `items.md` to Table of Contents in main game-design.md
- Updated dungeon-structure.md description to mention room navigation and floor transitions
- Updated combat.md description to mention turn order

### v1.4 (2026-01-15)

Resolved blockers 3-9 and Floor 3 Difficulty Spike. Completed full 10-enemy MVP roster with validated XP system via game-balance-tuner analysis. Added Save System and Camp System specifications. Added CUNNING soft cap system.

*CUNNING Soft Cap (Progression Issue #3):*
- **Problem:** CUNNING 15 = 50% crit, CUNNING 20 = 65% crit (unbounded scaling creates degenerate crit-stacking builds)
- **Solution:** Soft cap at CUNNING 11+ with hard cap at 65% total
- CUNNING 1-10: +3% crit per point (unchanged)
- CUNNING 11+: +1.5% crit per point (diminishing returns)
- Total crit hard cap: 65% from all sources (stats + gear)
- Validated via game-balance-tuner analysis: moderate investment (CUNNING 10 = 35%) is 86% as efficient as max investment (CUNNING 20 = 50%), preventing "max or nothing" builds
- Build parity preserved: ALL MIGHT (+19 flat damage) remains competitive with ALL CUNNING (53% crit) for pure DPS

*Floor 3 Difficulty Spike Resolution (Progression Issue #1):*
- **Problem:** Floor 3 stacked THREE changes: room count increase (4→5), Waystone cost, harder enemies
- **Solution:** Hybrid approach—reduce Floor 3 to 4 rooms, keep Waystone cost, smooth enemy distribution
- Floor 3 rooms: 5 → 4 (single mechanic introduction: Waystone cost only)
- Floor 4 now introduces room count increase (paired with epic loot reward)
- Shadow Stalker: Floor range 3-5 → 4-5 (delayed to reduce Floor 3 spike)
- Fleshweaver: Floor range 3-5 → 4-5 (elite delayed to Floor 4+)
- Total dungeon rooms: 24 → 23
- Session timing improved: Standard Run 22 min → 20 min (closer to 12-18 min target)
- Restores "one major mechanic per floor" design principle

*Complete Enemy Roster (10 enemies):*
- Added 4 missing enemies to complete MVP roster:
  - **Plague Ghoul** (Variant): HP 16-20, Damage 6-10, Normal, 30% Poison, Floors 2-3, 12 XP
  - **Armored Ghoul** (Variant): HP 22-26, Damage 10-14, Slow, 15% Armor, Floors 4-5, 15 XP
  - **Shadow Stalker** (Basic): HP 20-25, Damage 14-18, Fast, Ambush, Floors 3-5, 18 XP
  - **Corpse Shambler** (Basic): HP 30-35, Damage 6-10, Slow, Relentless, Floors 3-5, 15 XP
- Variant strategy: Plague Ghoul and Armored Ghoul demonstrate Hades-style variants (3 entries from 1 base type)

*Enemy XP System (Blocker #9):*
- Complete XP table for all 10 MVP enemies (5-150 XP range)
- Added XP/Turn ratio column for balance verification
- XP-to-effort ratios validated: Basic 2.5-6.0, Elite 7.0-12.9, Boss 13.6
- Floor multipliers confirmed: 1.0×-4.0× scaling
- Estimated run XP: Quick ~90, Standard ~740, Full Clear ~1,440
- Playtesting metrics added for combat and progression tracking

*Bone Colossus Rebalance (Blocker #7):*
- HP: 120 → 100 (enables 10-12 turn fights with optimal play)
- Damage per hit: 25-35 → 18-24 (-33% damage)
- Attack pattern: Constant 2 hits/turn → 3-turn cycle (single/telegraph/double)
- Turn 2 is now player's safe damage window (no boss attack)
- Turn 3 double attack (36-48) is telegraphed, Block reduces to 18-24
- Ground Slam: 20-30 → 15-20 damage, never occurs during double attack turn

*Bone Knight Rebalance (Blocker #8):*
- HP: 55-65 → 45-50 (-18% HP)
- Damage: 18-24 (unchanged — elites should hit hard)
- Fight duration: 7-11 turns → 3-4 turns (within target range)

*Save System & Camp System (Blockers #1-2):*
- Added comprehensive Save System and Camp System specifications

*Save System:*
- Added new "Save System" section (Section 8) with full specification
- Defined save trigger events: extraction, death, merchant transactions, stash operations, item identification
- Specified NO mid-dungeon saves (roguelike integrity)
- Added save data schema covering character, stash, veteran knowledge, bestiary, unlocks, statistics
- Documented session lifecycle flow with ASCII diagram
- Added edge case handling: mid-camp close, mid-dungeon close, crash during extraction
- Updated MVP Scope to reference save system as P0

*Design Philosophy:*
- Save on "commit actions" — irreversible decisions that protect progress without enabling save-scumming
- Aligns with modern roguelike standards (Hades, Darkest Dungeon, Slay the Spire, Dead Cells)
- Player mental model: "When I do something important, it's saved"

*Camp System:*
- Added new "Camp System" section (Section 14) with full UI specification
- Defined main menu structure with intent-based ordering (Stash → Equipment → Begin Expedition)
- Added global navigation rules: [B] back, [ESC] camp return, [?] help
- Specified status bar: Gold, Level, XP progress, Stash count, Dread (conditionally shown if > 0)
- Clarified Starting Dread rules: 0 for first run, min 10 for experienced players, death resets to 10
- Added two-stage expedition flow: preparation screen with Quick-Equip + final confirmation
- Full submenu specifications: Stash, Equipment, Merchant, Chronicler, Character
- Added pagination rules for lists exceeding 9 items
- Added compact/verbose toggle for item lists
- Defined first-time player experience via Chronicler diegetic tutorial
- Added confirmation requirements table (only irreversible actions require confirmation)
- Designed for 60-character minimum terminal width

*MVP Scope Simplification (Blockers 3-6):*
- Clarified MVP is 1v1 combat only (single enemy per encounter)
- Updated combat room examples to show single enemy encounters
- Revised Unreliable Narrator examples for 1v1 context
- Fleshweaver: Changed ability from "Summons 2 Ghouls" to "Life Drain at 50% HP"
- Skeleton Archer: Removed "Ranged" tag, now "Precise (10% crit chance)"
- CUNNING secondary effect: Changed "Trap detection" to "Special dialogue, loot detection"
- Dungeon Knowledge: Changed "Trap Locations" to "Secret Passages"
- Treasure Room: Removed trap mechanic (30% trap → 30% alerts enemies)
- Death-triggered unlocks: Changed "First death to trap" to "First death to poison"
- Floor 1 description: Changed "Tutorial floor" to "Introductory floor"
- Added four deferred features to post-MVP: Multi-enemy combat, Ranged mechanics, Trap system, Tutorial system

*Merchant System (Missing Specification):*
- Added comprehensive Merchant System specification via game-balance-tuner and rpg-game-designer analysis
- **Free Starter Potion:** Each run begins with 1 free Healing Potion (solves early-run starvation)
- **Equipment Policy:** Accessories only—weapons/armor/helms must come from dungeon drops
- **Always Available:** 5 core consumables (Healing Potion 15g, Antidote 12g, Torch 8g, Bandage 10g, Calm Draught 18g)
- **Rotating Stock:** 2-3 consumables + 1-2 accessories per run, refreshes at run start
- **Level Scaling:** Common accessories levels 1-9, Uncommon unlocks at level 5+, Uncommon-only at level 10+
- **Buyback System:** Session-based, 3-item limit, 50% markup from sell price
- **Price Contradictions Resolved:**
  - camp-system.md Health Potion: 25g → 15g
  - camp-system.md Iron Helm: 120g → Accessories only (80-100g Common)
  - blockers.md Common Equipment: 20-40g → 80-100g (accessories only)
  - blockers.md ID Scroll: 40g → 30g
- **Floor 4 NPC Modifier:** Removed from camp Merchant (was orphan from deferred in-dungeon NPC concept)
- Full specification added to Economy section, camp-system.md updated to match

*Features Deferred to Post-MVP:*
- **Bounty Board:** Quest system deferred—MVP focuses on core extraction loop without quest objectives
- **Item Affixes:** Affix system deferred—MVP items have fixed stats; affix rolling adds complexity
- **Event Outcome Tables:** Detailed event probability tables deferred—MVP events use simplified outcomes
- **Mimics:** Mimic chest mechanic deferred—MVP uses standard treasure chests without combat traps
- Camp UI updated to remove Bounty Board menu option (6 menu items → 6 menu items, CHARACTER renumbered)
- Floor 4 mimic chance (10%) removed from dungeon structure

### v1.3 (2026-01-15)

Comprehensive review pass incorporating combat balance research (Hades, Dead Cells, Slay the Spire, Darkest Dungeon, Dark Souls), UX analysis, blocker resolution, and exploit prevention.

*Combat Balance:*
- Fixed MIGHT damage bonus from +2 to +1 per point (keeps 3-4 turn fights)
- Added complete damage formula: `(Weapon Base + MIGHT) x Skill Multiplier x (1 + Bonus%) x Crit Multiplier`
- Rebalanced Heavy Attack: 50% stagger chance + 25% armor penetration (not just 2x damage)
- Rebalanced Block: reduced cost from 2 to 1 Stamina, blocks ALL attacks (vs Dodge blocks ONE)
- Added Block vs Dodge trade-off documentation
- Added status effect stacking rules with caps (Poison: 6 turns, Bleeding: 5 stacks, etc.)
- Updated combat pacing target from 1-3 to 1.5-2 minutes
- Added complete starting stats for Mercenary class (VIGOR 3, MIGHT 3, CUNNING 3)
- Added detailed enemy stats for MVP roster (Plague Rat, Ghoul, Skeleton Archer, Fleshweaver, Bone Knight, Bone Colossus)
- Added Balance Validation Checklist for playtesting metrics

*Dungeon Structure & Pacing:*
- Updated session length targets: Quick 5-10min, Standard 12-18min, Deep 20-30min
- Added room counts per floor: F1-2 = 4 rooms, F3-4 = 5 rooms, F5 = 6 rooms, total 24 rooms
- Added floor layout breakdown with room time budget (1-1.5 min/room average)
- Staggered mechanic introductions: Elites (F2), Waystone cost (F3), Room count increase (F4)
- Added pacing guarantee: 1 non-combat option required after 2 consecutive combat rooms
- Clarified Floor 5 extraction rules: NO Waystone extraction, boss is only exit
- Added boss soft-gating design: NPC warnings, minimum stats, death teaches patterns

*Progression & Economy:*
- Added floor-based XP multipliers: 1.0x/1.5x/2.0x/3.0x/4.0x by floor
- Added Level-Gated XP reduction for anti-grinding
- Updated extraction costs with minimums: Floor 3 = 10% gold (min 15g), Floor 4 = 25% gold (min 25g) OR 1 item
- Added loot rarity tables by floor (Common 70%→35%, Legendary 0%→3% as floors increase)
- Defined Dread quality bonus formula: `Upgrade Chance = Floor Bonus + (Dread% x 0.5)`

*System Specifications:*
- Added Starting Dread rule: Characters begin each run at 0 Dread
- Added Inventory System: 8 carried + 4 equipped + 3 consumables
- Set Stash capacity to 12 slots
- Added comprehensive Death Economy Priority system with clear resolution order
- Clarified Item Identification: Only protects EQUIPPED items
- Updated Veteran Knowledge thresholds: Tier 1 = 8 encounters OR 1 death, Tier 2 = 20 OR 2, Tier 3 = 35 OR 3
- Added death-linked knowledge acceleration mechanic
- Added Veteran Knowledge + Dread Interaction rules with layered display

*UX & Information Display:*
- Added Room Preview UX section with transparent choice architecture (Hades/Slay the Spire pattern)
- Added room type icons to ASCII map legend: `!`=Combat, `$`=Treasure, `*`=Event, `?`=Unknown
- Added Dread-based room preview degradation (room types hidden at high Dread)
- Added CUNNING scouting mechanic specification (5+/8+/12+ thresholds)
- Added Pre-Boss Warning UX section with Threshold Chamber design
- Added Readiness Indicator system (HP/Dread/Damage/Healing status checks)
- Added Item Risk State Indicators: [SAFE], [AT RISK], [PROTECTED], [VULNERABLE], [DOOMED]
- Added Pre-Run Equipment Check, In-Dungeon Item Display, and Death Screen Item Summary specifications
- Added Anti-Gear-Fear Monitoring metrics (target 40-60% runs with stash items)

*Exploit Prevention & Rule Clarifications:*
- Added Watcher extraction blocking: ALL extraction sealed when Watcher active
- Added Watcher stun immunity: 2-stun limit, then permanent immunity + Enrage
- Added Shrine blessing rule: Only one active at a time
- Added Room State rules: Contents persist, prevents flee-reset exploit
- Clarified Flagellant unlock: Must be at 85+ Dread AT extraction (state tracking)
- Updated Hollowed One unlock: Requires death at 100 Dread on Floor 3+
- Fixed Dread threshold reference ("Shaken" starts at 70+, not 51+)

*MVP Scope Updates:*
- Increased enemy requirement from 3 to 8-10 types with variant strategy
- Clarified item requirement as 20-25 items for MVP
- Added P0 infrastructure: Camp hub, Stash system, Character persistence, Gold tracking
- Added P1 UX features: Item risk indicators, Pre-boss warning, Room type preview
- Simplified MVP bestiary to binary unknown/known (3-tier system is post-MVP)
- Updated Defer Post-MVP: Death echoes deprioritized, Tiered Veteran Knowledge deferred

### v1.2 (2026-01-14)

- Resolved all 18 open design questions via collaborative game design review
- Reduced Dread accumulation values by 30% (target 40-60 at extraction)
- Changed camp from full Dread reset to -25 (min 10) fixed reduction
- Updated Dread thresholds with progressive hallucination rates (5%/15%/25%)
- Added The Watcher warning phase at 85 Dread with stats
- Updated flee mechanics (Dread penalty instead of gold drop, restrictions on round 1/ambush)
- Updated floor curse chances (5/10/15/20/25% instead of 0/0/20/40/60%)
- Updated class unlocks: mixed methods (Flagellant via survival, Hollowed One via death at 100 Dread)
- Added Lesson Learned mechanic on death (+10% damage to killer enemy type)
- Updated death economy (equipped items safe, carried items lost)
- Added three-tiered Veteran Knowledge unlock system (5/15/25 encounters)
- Defined MVP enemy roster (Ghoul, Plague Rat, Fleshweaver, Bone Colossus)
- Defined MVP item pool (25 items: 7 weapons, 5 armor, 5 accessories, 8 consumables)

### v1.1 (2026-01-13)

- Unified Corruption into Dread system (time adds +1 Dread per 5 turns)
- Removed "character disobeys commands" mechanic — replaced with The Watcher at 100 Dread
- Changed from "sidegrade only" to hybrid progression (power + variety)
- Updated flee mechanics (capped at 70%, gold drop on success)
- Added Floor Depth Effects (curse chance tied to floor, not time)
- Added design risks for The Watcher and gear fear
- Created `docs/open-questions.md` for unresolved decisions
