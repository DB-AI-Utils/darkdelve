# DARKDELVE: Pre-Implementation Blockers & Remediation

> Generated from comprehensive review by RPG Game Designer, Mechanics Auditor, Progression Pacing Auditor, and Game Balance Tuner agents.
>
> **Status:** Must address before implementation begins
> **Date:** 2026-01-15

---

## Table of Contents

1. [Critical Blockers](#critical-blockers)
2. [Exploit Vulnerabilities](#exploit-vulnerabilities)
3. [Progression Issues](#progression-issues)
4. [Missing Specifications](#missing-specifications)
5. [Balance Corrections](#balance-corrections)
6. [Implementation Readiness Summary](#implementation-readiness-summary)

---

## Critical Blockers

These issues will prevent engineers from implementing core systems. Each requires specification before development begins.

### 1. Save/Load System - UNSPECIFIED

**Problem:** Document mentions "Character persistence" as P0 but provides zero specification.

**What's Missing:**
- What data is saved (character state, stash contents, veteran knowledge, bestiary unlocks)
- When saves occur (auto-save? manual? on extraction? on death?)
- Save file format and location
- Corruption handling
- Session resume flow

**Required Specification:**

```
SAVE SYSTEM SPECIFICATION
-------------------------
Save Trigger Events:
- Auto-save on extraction (successful run end)
- Auto-save on death (run end)
- Auto-save on camp state change (stash modification, item identification)
- NO mid-dungeon saves (roguelike integrity)

Save Data Schema:
{
  character: {
    name: string,
    class: string,
    level: number,
    xp: number,
    stats: { vigor: number, might: number, cunning: number },
    equipment: { weapon: Item, armor: Item, helm: Item, accessory: Item }
  },
  stash: Item[],  // max 12
  gold: number,
  veteranKnowledge: { [enemyId]: { encounters: number, deaths: number, tier: 1|2|3 } },
  bestiary: { [enemyId]: boolean },
  unlocks: {
    classes: string[],
    items: string[],  // unlocked item pool
    mutators: string[]
  },
  statistics: {
    runsCompleted: number,
    runsFailed: number,
    totalGoldEarned: number,
    enemiesKilled: { [enemyId]: number },
    deepestFloor: number,
    bossesDefeated: number
  },
  lessonLearned: { enemyType: string, runsRemaining: number } | null
}

Save Location: ~/.darkdelve/save.json (or platform-appropriate)
Corruption Handling: Keep backup of previous save, restore on corruption
```

---

### 2. Camp UI Flow - UNDEFINED

**Problem:** Camp is the player's home base but navigation tree is not specified.

**What's Missing:**
- Main menu structure
- Navigation tree
- Input scheme (numbers? letters?)
- Back/cancel handling

**Required Specification:**

```
CAMP MAIN MENU
══════════════════════════════════════════════════════════════
                    DARKDELVE - THE CAMP
══════════════════════════════════════════════════════════════

  Welcome back, [CHARACTER_NAME]. The darkness awaits.

  [1] STASH                - Manage stored items (12 slots)
  [2] EQUIPMENT            - View/change equipped gear
  [3] BEGIN EXPEDITION     - Enter the dungeon
  [4] MERCHANT             - Buy/sell items
  [5] THE CHRONICLER       - Bestiary & lore
  [6] CHARACTER            - Stats, level, progress

  [Q] QUIT GAME

──────────────────────────────────────────────────────────────
  Gold: [GOLD] | Level: [LEVEL] | Dread: [DREAD]/100
══════════════════════════════════════════════════════════════
> _

NAVIGATION RULES:
- Number keys select options
- [B] or [ESC] returns to previous menu
- All submenus follow same pattern
- Confirmation required for: Begin Expedition, Quit Game
```

**Submenu: Begin Expedition Flow**

```
BEGIN EXPEDITION
══════════════════════════════════════════════════════════════

CURRENT LOADOUT:
  Weapon:    [WEAPON_NAME] ([DAMAGE] damage)
  Armor:     [ARMOR_NAME] ([ARMOR_EFFECT])
  Helm:      [HELM_NAME] ([HELM_EFFECT])
  Accessory: [ACCESSORY_NAME] ([ACCESSORY_EFFECT])

BRINGING FROM STASH (0/2):
  (None selected)

CONSUMABLES (0/3):
  (None selected)

──────────────────────────────────────────────────────────────
  [1] SELECT STASH ITEMS TO BRING (max 2)
  [2] SELECT CONSUMABLES (max 3)
  [3] CONFIRM & DESCEND
  [B] BACK TO CAMP
══════════════════════════════════════════════════════════════
> _
```

---

### 3. Multi-Enemy Combat - NOT SPECIFIED

**Problem:** Combat UI shows 1v1, but Fleshweaver summons 2 Ghouls and room descriptions mention multiple enemies.

**What's Missing:**
- Turn order algorithm
- Target selection UI
- AoE mechanics
- Enemy death mid-combat handling
- Maximum enemies per encounter

**Required Specification:**

```
MULTI-ENEMY COMBAT RULES
------------------------

Maximum Enemies: 4 per encounter

Turn Order:
1. Player always acts first (unless ambushed)
2. Enemies act in Speed order: Fast > Normal > Slow
3. Ties broken by enemy type alphabetically

Target Selection:
- Light Attack: Prompts target selection if multiple enemies
- Heavy Attack: Prompts target selection if multiple enemies
- Block: Affects ALL incoming attacks (no target needed)
- Dodge: Avoids ONE attack from ONE enemy (prompted which)

Combat Display (Multi-Enemy):
```

```
════════════════════════════════════════════════════════════════
                    COMBAT: GHOUL PACK
════════════════════════════════════════════════════════════════

    [1] Ghoul      ████████████░░░░░░░░  18/22 HP
    [2] Ghoul      ████████████████████  22/22 HP
    [3] Plague Rat ████████░░░░░░░░░░░░  8/15 HP

    You:          ████████████████░░░░  42/50 HP

    Stamina: ████  4/4

────────────────────────────────────────────────────────────────
    [A] SLASH        (1 Stam)  → Select target
    [S] HEAVY CUT    (3 Stam)  → Select target
    [D] DODGE        (1 Stam)  Avoid next attack from one enemy
    [F] BLOCK        (1 Stam)  50% reduction on ALL attacks
    [I] ITEM         (Free)    Use consumable
    [R] FLEE         (Free)    50% success (3 enemies)
────────────────────────────────────────────────────────────────
> _
```

```
Summon Mechanics (Fleshweaver):
- Summoned enemies act on the turn AFTER summoning
- Summoned enemies have full HP
- Killing summoner does NOT kill summons
- Summons count toward max enemy limit (4)

AoE Attacks (Future):
- Reserved for player abilities/items
- MVP: No player AoE
- Bone Colossus "Ground Slam" hits player only (flavor is AoE, mechanic is single-target)
```

---

### 4. Ranged Combat - UNDEFINED

**Problem:** Skeleton Archer is "Ranged (no melee penalty)" but ranged mechanics never explained.

**What's Missing:**
- What "ranged" means mechanically
- Whether players can have ranged weapons
- Any positioning or cover system

**Required Specification (Option A - Simple):**

```
RANGED COMBAT (SIMPLIFIED)
--------------------------

Ranged is a TAG, not a mechanic:

Ranged Enemies:
- Attack normally (no special rules)
- "No melee penalty" means they don't suffer when player is adjacent
- Flavor text indicates ranged nature

Ranged Player Weapons (Post-MVP):
- Not in MVP scope
- Future: Bows/crossbows attack before melee enemies act

MVP Implementation:
- Skeleton Archer behaves like any other enemy mechanically
- "Ranged" is narrative/flavor only
- Remove "no melee penalty" text (confusing without ranged system)
```

**Alternative (Option B - Tactical):**

```
RANGED COMBAT (TACTICAL)
------------------------

If implementing positioning:
- Ranged enemies attack from "back row"
- Player must "close distance" (1 stamina) to melee back row
- Ranged enemies in front row have -25% damage
- Player ranged weapons can hit any row

RECOMMENDATION: Use Option A for MVP. Positioning adds complexity.
```

---

### 5. Trap Mechanics - UNDEFINED

**Problem:** Traps referenced in CUNNING, chests, Veteran Knowledge, and death unlocks - but never specified.

**What's Missing:**
- Trap types
- Trap damage values
- Detection mechanics
- Disarm mechanics
- Trap locations/triggers

**Required Specification:**

```
TRAP SYSTEM
-----------

Trap Types:
| Type         | Damage    | Effect              | Floor Range |
|--------------|-----------|---------------------|-------------|
| Spike Trap   | 8-12      | None                | 1-5         |
| Poison Dart  | 5-8       | Poison (3 turns)    | 2-5         |
| Bear Trap    | 10-15     | Cannot flee 2 turns | 3-5         |
| Soul Snare   | 6-10      | +15 Dread           | 4-5         |

Trap Locations:
- Treasure rooms: 30% if forced open (per document)
- Corridor rooms: 10% chance per room (hidden)
- Event rooms: Context-dependent (stranger's gift, etc.)

Detection (CUNNING):
- CUNNING 5+: "You sense danger..." warning before entering trapped room
- CUNNING 8+: Trap type revealed
- CUNNING 12+: Can attempt disarm

Disarm Mechanic:
- Requires CUNNING 12+
- 70% success rate
- Failure: Trap triggers at 50% damage
- Success: Trap removed, +10 gold salvage

Veteran Knowledge (Traps):
- After 3 visits: Traps shown on minimap for that dungeon
- After triggering specific trap 3x: That trap type always visible
```

---

### 6. First-Run Experience / Tutorial - NOT DESIGNED

**Problem:** No specification for what new players see or how they learn mechanics.

**Required Specification:**

```
FIRST-RUN EXPERIENCE
--------------------

Game Launch (First Time):
1. Title screen with "NEW GAME" prominent
2. Character naming (8 char max)
3. Brief intro text (skippable after first run):

   "The village of Ashford burns behind you.
    The DARKDELVE awaits below.

    They say the dungeon drives men mad.
    They say the deeper you go, the greater the treasure.
    They say no one returns from the fifth floor.

    You intend to prove them wrong."

4. Camp tutorial overlay (first visit only):
   - Highlights each menu option with brief explanation
   - "Press [1] to begin your first expedition"

First Dungeon Run (Guided):
- Floor 1, Room 1: Forced combat tutorial
  - "TUTORIAL: Press [A] to attack with your weapon"
  - "TUTORIAL: Heavy attacks [S] deal more damage but cost more stamina"
  - (Disable flee option for tutorial combat)

- Floor 1, Room 2: Forced treasure tutorial
  - "TUTORIAL: You found a chest. Choose how to open it."
  - (All options available, outcomes explained)

- Floor 1, Room 3: Dread introduction
  - After reaching 10 Dread: "Your hands tremble slightly. This is DREAD."
  - "TUTORIAL: Dread accumulates as you delve deeper. At high levels, your perception becomes... unreliable."

- Floor 1, Stairway: Extraction tutorial
  - "TUTORIAL: You can EXTRACT here and keep everything you've found."
  - "TUTORIAL: Or DESCEND to Floor 2 for greater rewards... and greater danger."
  - "The choice is yours. It always will be."

Subsequent Runs:
- No tutorial overlays
- All mechanics assumed known
- Optional: "Tutorial" toggle in settings to replay
```

---

### 7. Bone Colossus Damage - LETHAL

**Problem:** 2 attacks × 25-35 damage = 50-70 damage/turn. Player has 50 HP. Dies in 1 turn.

**Current Stats:**
- HP: 120
- Damage: 25-35 per hit
- Attacks: 2 per turn
- Total damage/turn: 50-70

**Required Fix:**

```
BONE COLOSSUS (REBALANCED)
--------------------------

Option A (Reduce Damage):
- Damage: 12-18 per hit
- Attacks: 2 per turn
- Total damage/turn: 24-36
- Player survives: 1.4-2.1 turns (allows reaction)

Option B (Telegraph Multi-Attack):
- Damage: 25-35 per hit (unchanged)
- Attacks: 2 per turn, BUT:
  - Turn 1: Single attack (25-35)
  - Turn 2: "The Colossus raises both fists..." (telegraph)
  - Turn 3: Double attack (50-70) - player had warning to Block
  - Repeat cycle

RECOMMENDATION: Option B - preserves boss threat, rewards attentive play

Ground Slam (Clarification):
- AoE flavor, single-target mechanic
- 20-30 damage, 50% stun
- Telegraphed 1 turn: "The Colossus raises its foot..."
- Player can Dodge (avoid entirely) or Block (half damage, still stunned)
```

---

### 8. Bone Knight Survivability - IMPOSSIBLE

**Problem:** Player survives 2.4 turns vs Bone Knight, but TTK is 7-11 turns.

**Current Stats:**
- HP: 55-65
- Damage: 18-24
- Armor: 25%

**Required Fix:**

```
BONE KNIGHT (REBALANCED)
------------------------

Option A (Reduce HP):
- HP: 40-50 (was 55-65)
- Damage: 18-24 (unchanged)
- Armor: 25% (unchanged)
- New TTK: 5-7 turns (Light), 3-4 turns (Heavy)
- Survivability: 2.4 turns → requires healing/blocking

Option B (Reduce Damage):
- HP: 55-65 (unchanged)
- Damage: 12-16 (was 18-24)
- Armor: 25% (unchanged)
- Survivability: 3.5-4.2 turns → manageable

RECOMMENDATION: Option A - Elite should hit hard, but die faster
The armor already makes it tactical (Heavy Attack required)
```

---

### 9. Enemy XP Not Defined

**Problem:** Cannot validate progression curve without enemy XP values.

**Required Specification:**

```
ENEMY XP TABLE
--------------

| Enemy           | Base XP | Type   | Notes                        |
|-----------------|---------|--------|------------------------------|
| Plague Rat      | 5       | Basic  | Swarm enemy, low individual  |
| Ghoul           | 10      | Basic  | Standard enemy               |
| Plague Ghoul    | 12      | Basic  | Variant, slight bonus        |
| Skeleton Archer | 12      | Basic  | Ranged threat                |
| Armored Ghoul   | 15      | Basic  | Tanky variant                |
| Shadow Stalker  | 18      | Basic  | Dangerous, higher reward     |
| Corpse Shambler | 15      | Basic  | Slow tank                    |
| Fleshweaver     | 35      | Elite  | Caster, summons              |
| Bone Knight     | 45      | Elite  | Armored elite                |
| Bone Colossus   | 150     | Boss   | Includes completion bonus    |

XP Multipliers by Floor:
- Floor 1: 1.0x
- Floor 2: 1.5x
- Floor 3: 2.0x
- Floor 4: 3.0x
- Floor 5: 4.0x

Example: Ghoul (10 XP) on Floor 4 = 10 × 3.0 = 30 XP

Level-Gated XP Reduction:
- Levels 6-10: Floor 1 gives 50% XP
- Levels 11-15: Floors 1-2 give 50% XP
- Levels 16-20: Floors 1-3 give 50% XP
```

---

## Exploit Vulnerabilities

These mechanics can be abused to bypass intended progression.

### 1. Floor 1-2 Infinite Farming

**Exploit:** Overleveled players farm free extraction floors for gold/loot with zero risk.

**Current Mitigation:** XP penalty exists, but gold/loot unpenalized.

**Required Fix:**

```
EARLY FLOOR FARMING PREVENTION
------------------------------

Add to existing level-gated penalties:

| Player Level | Floor 1 Effect        | Floor 2 Effect        |
|--------------|----------------------|----------------------|
| 1-5          | Full rewards         | Full rewards         |
| 6-10         | 50% XP, 75% gold     | Full rewards         |
| 11-15        | 50% XP, 50% gold     | 50% XP, 75% gold     |
| 16-20        | 50% XP, 25% gold     | 50% XP, 50% gold     |

Loot Quality Penalty:
- Level 10+: Floor 1 loot capped at Uncommon
- Level 15+: Floors 1-2 loot capped at Rare

Thematic Justification:
"The shallow depths hold nothing of interest for one of your experience."
```

---

### 2. Death-for-Item-Protection Abuse

**Exploit:** Find Epic item → Equip → Identify (25g) → Die intentionally = permanent stash item for 25 gold.

**Current Rule:** Equipped + Identified items survive death.

**Required Fix:**

```
ITEM PROTECTION REVISION
------------------------

Option A (Run Survival Requirement):
Items found during a run are NOT protected until:
- Player successfully EXTRACTS with item equipped
- THEN item gains [PROTECTED] status for future runs

Option B (Scaled Identification Cost):
| Rarity    | Identification Cost |
|-----------|---------------------|
| Common    | 10 gold             |
| Uncommon  | 25 gold             |
| Rare      | 50 gold             |
| Epic      | 100 gold            |
| Legendary | 250 gold            |

RECOMMENDATION: Option A - simpler, closes exploit completely
"Only items that escape the dungeon with you are truly yours."
```

---

### 3. Dread-Spike Loot Farming

**Exploit:** Reach 99 Dread for +49.5% loot quality bonus, use Clarity Potion to stay under Watcher spawn.

**Current Formula:** `Upgrade Chance = Floor Bonus + (Current Dread% × 0.5)`

**Required Fix:**

```
DREAD QUALITY BONUS REVISION
----------------------------

Change "Current Dread" to "Average Run Dread":

New Formula:
Upgrade Chance = Floor Bonus + (Average Dread × 0.5)

Where Average Dread = Total Dread Accumulated / Turns Elapsed

This prevents:
- Spiking Dread just before chest opening
- Using consumables to manipulate bonus timing

Alternative: Apply Dread bonus at room GENERATION, not item pickup
(Chest quality determined when you enter the room, not when you open it)
```

---

### 4. Insufficient Extraction Payment

**Exploit/Bug:** No rule for 0 gold + 0 items on Floor 3-4.

**Required Fix:**

```
EXTRACTION EDGE CASE RULES
--------------------------

Scenario: Player cannot pay Waystone cost (0 gold, 0 sacrificeable items)

Resolution Order:
1. Check gold (minimum 15/25)
2. Check unequipped inventory items
3. Check EQUIPPED items (last resort)
4. If truly nothing: FORCED DESCENT

"The Waystone demands payment. You have nothing to give.
 The stairs down beckon. There is no other way."

Player must descend to next floor. On Floor 4, this means facing Floor 5/Boss.

Equipped Item Sacrifice Rules:
- Player can sacrifice equipped items as last resort
- Prompt: "You have nothing else. Sacrifice [ITEM_NAME]? [Y/N]"
- Creates desperate choice, not soft-lock
```

---

### 5. Brought Items as Extraction Payment

**Exploit:** Bring worthless Common item from stash specifically to pay extraction cost.

**Required Fix:**

```
EXTRACTION PAYMENT RESTRICTION
------------------------------

Items brought from stash CANNOT be used for Waystone payment.
Only items FOUND during the current run are valid payment.

Thematic: "The Waystone demands what the dungeon gave, not what you brought."

Implementation:
- Items have "source" tag: STASH or FOUND
- Extraction UI only shows FOUND items for sacrifice
```

---

## Progression Issues

These affect player experience and session pacing.

### 1. Floor 3 Difficulty Spike ✓ RESOLVED

**Problem:** Floor 3 introduces Waystone cost + harder enemies + extra room simultaneously.

**Design Principle Violation:** "Each floor introduces ONE major new mechanic."

**Resolution (v1.4):** Hybrid approach combining best elements from rpg-game-designer and progression-pacing-auditor analysis:

```
FLOOR 3 REDESIGN - IMPLEMENTED
------------------------------

Approach: Reduce room count + smooth enemy distribution

Floor Architecture (Updated):
| Floor | Rooms | Key Introduction |
|-------|-------|------------------|
| 1     | 4     | Tutorial, free extract |
| 2     | 4     | Elites introduced (10%) |
| 3     | 4     | Waystone cost begins (single mechanic) |
| 4     | 5     | Room count increase + epic loot |
| 5     | 6     | Boss only exit |

Enemy Distribution (Updated):
- Shadow Stalker: 3-5 → 4-5 (ambush delayed)
- Fleshweaver: 3-5 → 4-5 (elite delayed)
- Floor 3 enemies: Armored Ghoul, Corpse Shambler (tough but learnable)

Session Timing:
- Total rooms: 24 → 23
- Standard Run (F1-4): 22 min → 20 min
- Deep Dive (F1-5): 30 min → 28 min

Design Principle Restored: Each floor introduces ONE major mechanic.
```

---

### 2. Session Time Overrun

**Problem:** Full clear = 32-35 minutes vs 20-30 minute target.

**Analysis:**
- Floor 1-4: 22 min (within target for "Standard")
- Floor 5: 10-12 min (boss adds 3-5 min)
- Total: 32-35 min

**Required Fix:**

```
SESSION TIME ADJUSTMENT
-----------------------

Option A (Reduce Floor 5):
- Floor 5 rooms: 5 (was 6) + boss
- Expected time: 8-9 min (was 10-12)
- New total: 30-32 min

Option B (Accept Longer Deep Dives):
- Update target: "Deep dive: 25-35 min"
- Document this is intentional for maximum risk/reward

Option C (Faster Combat):
- Reduce target fight length to 1-1.5 min (from 1.5-2 min)
- Requires damage/HP rebalancing

RECOMMENDATION: Option B - the extra time IS the deep dive
Update document targets to match reality
```

---

### 3. CUNNING Soft Cap ✓ RESOLVED

**Problem:** CUNNING 15 = 50% crit chance (unbounded).

**Resolution (v1.4):** Validated via game-balance-tuner analysis. Implemented soft cap at CUNNING 11+ with hard cap at 65% total.

```
CUNNING SOFT CAP - IMPLEMENTED
------------------------------

Crit Chance = 5% (base) + CUNNING Contribution + Gear Bonuses

CUNNING Contribution:
  Points 1-10:  +3% per point (unchanged)
  Points 11+:   +1.5% per point (diminishing returns)

TOTAL CRIT CAP: 65% (from all sources combined)

| CUNNING | Crit Chance (stats only) |
|---------|--------------------------|
| 3       | 14%                      |
| 10      | 35%                      |
| 15      | 42.5%                    |
| 20      | 50%                      |

Design Intent:
- Soft cap makes CUNNING 10 (35%) 86% as efficient as CUNNING 20 (50%)
- Prevents "max or nothing" investment patterns
- Hard cap (65%) prevents gear stacking from creating degenerate builds
- At 65%, crits feel powerful (~2 in 3) while 35% non-crit preserves variance
```

→ *Added to: character-progression.md, reference-numbers.md*

---

### 4. Item Pool Expansion Too Slow

**Problem:** +10 items after 5 runs doesn't outpace discovery rate.

**Required Fix:**

```
REVISED ITEM UNLOCK PACE
------------------------

Current:
- Runs 1-5: 30 items
- Run 6: +10 items = 40
- Each boss kill: +2-3 items

Revised:
- Runs 1-3: 30 items (learn basics)
- Run 4: +10 items = 40 (first expansion)
- Run 7: +15 items = 55 (significant growth)
- Run 10: +15 items = 70
- Each boss kill: +3-5 items
- Full pool (~100) by run 20-25

Front-load variety to maintain engagement through learning phase.
```

---

### 5. Potion Cost Creates Early-Run Starvation ✓ RESOLVED

**Problem:** 15g potions unaffordable when Floors 1-2 yield 70g total.

**Resolution (v1.4):** Adopted Option B (Free Starter Potion) as part of Merchant System specification.

- Each run starts with 1 free Healing Potion in consumable slots
- Additional potions remain at 15g
- Creates safety net without trivializing economy
- Thematic: *"The camp healer hands you a potion. 'You'll need it.'"*

→ *Full specification: [Reference Numbers](game-design/reference-numbers.md#merchant-system)*

---

## Missing Specifications

These need definition but are less critical than blockers.

### Merchant System ✓ RESOLVED

**Resolution (v1.4):** Comprehensive Merchant specification added via game-balance-tuner and rpg-game-designer agent analysis.

**Key Decisions:**
- **Free Starter Potion:** Each run begins with 1 free Healing Potion (prevents early-run starvation)
- **Accessories Only:** Merchant sells accessories, NOT weapons/armor/helms (preserves loot discovery)
- **Always Available:** 5 core items (Healing Potion, Antidote, Torch, Bandage, Calm Draught)
- **Rotating Stock:** 2-3 consumables + 1-2 accessories per run
- **Level Scaling:** Uncommon accessories unlock at level 5+, Common phases out at level 10+
- **Buyback System:** Session-based, 3-item limit, 50% markup
- **Floor 4 Modifier:** Removed (was orphan from deferred in-dungeon NPC concept)

**Price Contradictions Resolved:**
- Healing Potion: 25g (camp-system) → **15g** (with free starter)
- Common Equipment: 120g (camp-system), 20-40g (blocker draft) → **80-100g accessories only**
- ID Scroll: 40g → **30g**

→ *Full specification: [Reference Numbers](game-design/reference-numbers.md#merchant-system)*

---

### Speed/Turn Order System

```
TURN ORDER SPECIFICATION
------------------------

Speed Values:
- Fast: Acts before Normal
- Normal: Standard speed
- Slow: Acts after Normal

Turn Order Algorithm:
1. Player (unless ambushed)
2. Fast enemies (alphabetical tiebreak)
3. Normal enemies (alphabetical tiebreak)
4. Slow enemies (alphabetical tiebreak)

Ambush Rules:
- Triggered by: Rest site (% chance), certain events, some elites
- On ambush: Enemies act first, player cannot flee round 1
- Display: "AMBUSH! The [ENEMY] strikes before you can react!"
```

---

### Cursed Item Effects

```
CURSED ITEM SPECIFICATION
-------------------------

Curse Types:
| Curse          | Drawback                              |
|----------------|---------------------------------------|
| Bloodthirsty   | -5 HP after each combat               |
| Paranoid       | +3 Dread per floor                    |
| Fragile        | Item breaks after 5 combats (lost)    |
| Binding        | Cannot unequip until extraction       |
| Hungry         | -10 gold per floor                    |
| Whispered      | Random fake enemy appears in combat UI|

All cursed items have:
- +30% to primary stat (e.g., +30% damage for weapons)
- One curse from above table

Hollowed One Class Bonus:
- Curse drawbacks reduced by 50%
- Can sense curse type before equipping (CUNNING 5+ for others)
```

---

## Balance Corrections

Specific number changes for implementation.

### Combat Balance Updates

```
REVISED ENEMY STATS
-------------------

Bone Colossus (Boss):
- HP: 120 (unchanged)
- Damage: 15-20 per hit (was 25-35)
- Attacks: 2 per turn
- Ground Slam: 20-25 damage (was 20-30), always telegraphed
- Total damage/turn: 30-40 (was 50-70)

Bone Knight (Elite):
- HP: 45-55 (was 55-65)
- Damage: 18-24 (unchanged)
- Armor: 25% (unchanged)

Ghoul (Basic):
- HP: 20-24 (was 18-22) - slight increase for target TTK
- Damage: 8-12 (unchanged)
```

### Dread Adjustments

```
DREAD ADDITIONS
---------------

Boss Kill Dread:
- Bone Colossus: +10 Dread on kill
- "The abomination falls, but its death-scream echoes in your mind."

Watcher Clarifications:
- Dread caps at 100 (cannot exceed)
- Watcher is TRUE INVINCIBLE (damage always 0)
- Watcher does NOT despawn if Dread drops below 100
- Once noticed, always pursued until extraction or death
```

---

## Implementation Readiness Summary

### Ready for Implementation (No Changes Needed)

- [x] Extraction dilemma core loop
- [x] Dread threshold effects
- [x] Stamina economy
- [x] Status effect system
- [x] Veteran Knowledge progression
- [x] Stash risk/reward system
- [x] Death-as-discovery philosophy
- [x] Unreliable narrator mechanics

### Requires Specification (This Document)

- [x] Save/Load system ✓ *Added to game-design.md v1.4*
- [x] Camp UI flow ✓ *Added to game-design.md v1.4*
- [x] Multi-enemy combat ✓ *Deferred to post-MVP — MVP is 1v1 only (game-design.md v1.4)*
- [x] Ranged mechanics ✓ *Deferred to post-MVP — ranged is flavor only (game-design.md v1.4)*
- [x] Trap system ✓ *Deferred to post-MVP — removed from MVP scope (game-design.md v1.4)*
- [x] First-run experience ✓ *Deferred to post-MVP — Chronicler intro is sufficient (game-design.md v1.4)*

### Requires Balance Fixes

- [x] Bone Colossus damage reduction ✓ *HP 120→100, damage 25-35→18-24, pattern attack system (reference-numbers.md v1.4)*
- [x] Bone Knight HP reduction ✓ *HP 55-65→45-50 (reference-numbers.md v1.4)*
- [x] Enemy XP table ✓ *Completed in reference-numbers.md v1.4 — full 10-enemy roster with stats, XP values, and playtesting metrics*
- [ ] Floor 1-2 farming penalties
- [ ] Item protection revision

### Post-MVP (Defer)

- Death echoes
- Multiple dungeons
- Additional classes
- Mutators
- Camp upgrades
- Full narrative content
- Multi-enemy combat *(resolved v1.3)*
- Ranged combat mechanics *(resolved v1.3)*
- Trap system *(resolved v1.3)*
- Full tutorial system *(resolved v1.3)*
- Bounty Board system *(resolved v1.4)*
- Item affix system *(resolved v1.4)*
- Event outcome tables *(resolved v1.4)*
- Mimics *(resolved v1.4)*

---

## Action Items

### Before Sprint 1 (Must Complete)

1. ~~Review and approve Save System spec~~ ✓ *Approved and added to game-design.md v1.4*
2. ~~Review and approve Camp UI flow~~ ✓ *Approved and added to game-design.md v1.4*
3. ~~Review and approve Multi-Enemy Combat rules~~ ✓ *Deferred to post-MVP (game-design.md v1.4)*
4. ~~Confirm ranged combat approach~~ ✓ *Deferred to post-MVP (game-design.md v1.4)*
5. ~~Review Trap System spec~~ ✓ *Deferred to post-MVP (game-design.md v1.4)*
6. ~~Approve Bone Colossus/Knight balance changes~~ ✓ *Balanced per game-balance-tuner analysis (reference-numbers.md v1.4)*
7. ~~Add Enemy XP table to game-design.md~~ ✓ *Added to reference-numbers.md v1.4*

### During Sprint 1 (Can Parallel)

8. ~~Design first-run tutorial flow~~ ✓ *Deferred to post-MVP — Chronicler intro sufficient (game-design.md v1.4)*
9. ~~Finalize merchant specs~~ ✓ *Merchant resolved v1.4 — see reference-numbers.md*

### Before Playtesting

12. Implement anti-farming penalties
13. Test item protection revision
14. Validate session time targets
15. ~~Tune CUNNING soft cap~~ ✓ *Resolved v1.4 — soft cap at CUNNING 11+, hard cap at 65%*

---

*Document version: 1.4*
*Updated: 2026-01-15*
*Source: Multi-agent design review (RPG Designer, Mechanics Auditor, Progression Auditor, Balance Tuner)*

### Resolution Log
- **v1.1**: Save/Load system resolved — spec added to game-design.md v1.4
- **v1.2**: Camp UI flow resolved — spec added to game-design.md v1.4
- **v1.3**: Blockers 3-6 resolved — Multi-enemy combat, ranged mechanics, trap system, and tutorial deferred to post-MVP (game-design.md v1.4)
- **v1.4**: Blockers 7-9 fully resolved:
  - Bone Colossus rebalanced (HP 120→100, damage 25-35→18-24, 3-turn pattern attack system)
  - Bone Knight rebalanced (HP 55-65→45-50)
  - Enemy XP system completed with full 10-enemy MVP roster:
    - Added 4 missing enemies: Plague Ghoul (12 XP), Armored Ghoul (15 XP), Shadow Stalker (18 XP), Corpse Shambler (15 XP)
    - Full combat stats for all new enemies (HP, damage, speed, special abilities)
    - XP-to-effort ratios validated (Basic: 2.5-6.0, Elite: 7.0-12.9, Boss: 13.6)
    - Playtesting metrics added for all enemies and progression tracking
  - Fixed contradiction in death-discovery.md (Fleshweaver tip updated for 1v1 combat)
- **v1.4** (continued): Floor 3 Difficulty Spike resolved via hybrid approach:
  - Floor 3 rooms: 5 → 4 (reduces stacked difficulty)
  - Shadow Stalker floor range: 3-5 → 4-5 (delays ambush enemy)
  - Fleshweaver floor range: 3-5 → 4-5 (delays elite to later floors)
  - Session timing improved: Standard Run 22 min → 20 min, Deep Dive 30 min → 28 min
  - Total rooms reduced: 24 → 23
  - Design principle restored: "One major mechanic per floor"
- **v1.4** (continued): CUNNING Soft Cap resolved (Progression Issue #3):
  - Soft cap at CUNNING 11+: +1.5% crit per point (was +3%)
  - Hard cap at 65% total crit from all sources (stats + gear)
  - CUNNING 10 = 35% crit (soft cap threshold), CUNNING 20 = 50% crit (max from stats)
  - Validated via game-balance-tuner: prevents degenerate crit-stacking, maintains build parity with MIGHT
- **v1.4** (continued): Merchant System resolved via multi-agent analysis:
  - Free Starter Potion: Each run begins with 1 free Healing Potion (solves early-run starvation)
  - Equipment policy: Accessories only (weapons/armor/helms from drops only)
  - Always Available: 5 core consumables (Healing Potion 15g, Antidote 12g, Torch 8g, Bandage 10g, Calm Draught 18g)
  - Rotating Stock: 2-3 consumables + 1-2 accessories per run
  - Level Scaling: Common accessories level 1-9, Uncommon level 5+, Uncommon-only at level 10+
  - Buyback System: Session-based, 3-item limit, 50% markup
  - Price contradictions resolved: camp-system.md (25g potion, 120g helm) → reference-numbers.md (15g potion, 80-100g accessory)
  - Floor 4 NPC modifier (+25%): Removed from camp Merchant, deferred to post-MVP in-dungeon NPC concept
  - Full spec added to reference-numbers.md, camp-system.md updated to match
- **v1.4** (continued): Features deferred to post-MVP:
  - **Bounty Board:** Quest system deferred—MVP focuses on core extraction loop
  - **Item Affixes:** Affix system deferred—MVP items have fixed stats, affixes add complexity
  - **Event Outcome Tables:** Detailed event tables deferred—MVP events use simplified outcomes
  - **Mimics:** Mimic chest mechanic deferred—MVP uses standard treasure chests
  - Camp UI updated to remove Bounty Board menu option
  - Floor 4 mimic chance removed from dungeon structure
