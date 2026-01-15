# Combat System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Turn-based combat with stamina management. Fast, tactical, and always risky.

**MVP Scope:** All combat encounters are 1v1 (player vs single enemy). Multi-enemy encounters are deferred to post-MVP to keep combat UI simple and balance manageable. Some enemies (like Bone Colossus) have multi-attack abilities that provide tactical variety within the 1v1 framework.

---

## Turn Order System

Combat uses **Player-First Default with Speed Exceptions**.

### Default Turn Structure

```
Standard Turn Cycle:
  A. Start of Turn
     - Status effects tick (Poison, Bleed damage)
     - Stamina regenerates (+2)
     - Buffs/debuffs duration decrements
  B. Player Action Phase
     - Player selects and executes action
  C. Enemy Action Phase
     - Enemy executes action
  D. End of Turn
     - Check for combat end (0 HP)
     - Increment turn counter
```

### Enemy Speed Effects

| Speed | Turn 1 Behavior | After Turn 1 | Additional Effect |
|-------|-----------------|--------------|-------------------|
| SLOW | Player first | Normal | +25% damage taken from Heavy Attack |
| NORMAL | Player first | Normal | Standard combat |
| FAST | Enemy first-strike, then player | Normal | - |
| AMBUSH | Enemy gets 2 free actions, then player | Normal | Cannot flee Turn 1 |

**First-Strike (FAST enemies):** Enemy attacks BEFORE player's first action on Turn 1 only. Display: "The Plague Rat lunges before you can react!"

**Ambush (Shadow Stalker):** Enemy gets TWO free actions before combat begins. Player cannot flee on Turn 1.

### Speed by Enemy Type

| Enemy | Speed | First Turn |
|-------|-------|------------|
| Plague Rat | Fast | Enemy first-strike |
| Ghoul, Skeleton Archer, Bone Knight | Normal | Player first |
| Armored Ghoul, Corpse Shambler, Fleshweaver | Slow | Player first |
| Shadow Stalker | Fast + Ambush | 2x enemy actions |
| Bone Colossus (Boss) | Slow | Player first |

### Stagger and Stun Effects

**Staggered (enemy):** Enemy skips their next action phase. One-time skip, does not affect subsequent turns.

**Stunned (player):** Player skips their action phase. Enemy acts, then turn ends. Player recovers automatically.

**Boss Stagger Resistance:** Bosses require 2 staggers within 3 turns to trigger stagger effect.

---

## Combat Interface

```
════════════════════════════════════════════════════════════════
                    COMBAT: PLAGUE RAT
════════════════════════════════════════════════════════════════

    Enemy:  ████████████░░░░░░░░  12/15 HP
    You:    ████████████████░░░░  45/50 HP

    Status: POISONED (2 turns remaining)

    Stamina: ███░  3/4

────────────────────────────────────────────────────────────────
    [1] SLASH        (1 Stam)  5-8 damage
    [2] HEAVY CUT    (3 Stam)  12-16 damage
    [3] DODGE        (1 Stam)  Avoid next attack, +1 Stam next turn
    [4] ANTIDOTE     (Item)    Cure poison, uses turn
    [5] FLEE         (Free)    60% success, enemy gets free attack
────────────────────────────────────────────────────────────────
> _
```

---

## Stamina System

- **Maximum:** 4 points
- **Regeneration:** +2 per turn
- **Design goal:** Prevent button mashing, force tactical choices

---

## Action Types

| Action | Cost | Effect |
|--------|------|--------|
| Light Attack | 1 Stam | Base weapon damage |
| Heavy Attack | 3 Stam | 2x damage, 50% stagger chance, 25% armor penetration |
| Dodge | 1 Stam | Avoid ONE incoming attack, +1 Stam next turn |
| Block | 1 Stam | Reduce ALL incoming damage this turn by 50% (does not prevent status effects) |
| Pass | 0 Stam | Skip action, +2 Stamina regeneration still applies |
| Item | 0 Stam | Use consumable, ends turn |
| Flee | 0 Stam | Success chance varies by enemy |

### Heavy Attack vs Light Attack Trade-off

- Light Attack spam: 4 Stam = 4 attacks = 4x base damage over 2 turns
- Heavy Attack: 3 Stam = 1 attack = 2x base damage + 50% stagger + armor pen
- Heavy wins when: Enemy has armor, or stagger breaks enemy combo, or enemy is SLOW
- Light wins when: Need consistent damage, enemy has no armor

**Balance Validation (v1.5):**

Heavy Attack is intentionally weaker against unarmored enemies (~83% damage efficiency vs Light spam). This creates correct tactical choices:

| Situation | Light Efficiency | Heavy Efficiency | Preferred |
|-----------|------------------|------------------|-----------|
| Unarmored, Normal speed | 100% | 83% | Light (intended) |
| 15% Armor (Armored Ghoul) | 85% | 177% | Heavy |
| 25% Armor (Bone Knight) | 75% | 171% | Heavy |
| SLOW enemy (any armor) | 100% | 104-221% | Heavy |

**Target Usage Rate:** 20-40% of combat actions should be Heavy Attack. If playtesting shows <20%, consider graduated buffs (see [Reference Numbers](reference-numbers.md#balance-validation-checklist)).

### Block vs Dodge Trade-off

- Dodge (1 Stam): Avoids one attack completely, prevents status effects
- Block (1 Stam): Halves ALL attacks this turn, does NOT prevent status effects
- Dodge wins when: Single strong attack, enemy applies status effects
- Block wins when: Multi-hit enemies (2+ attacks per turn), no status risk

**Stagger Effect:** Staggered enemies skip their next attack (1 turn). Bosses have stagger resistance (requires 2 staggers in 3 turns to trigger).

### Pass Action

The PASS action allows players to bank stamina for future turns:
- Cost: 0 Stamina
- Effect: Skip your action, +2 Stamina regeneration still applies
- Use case: Player has 1 Stamina, wants Heavy Attack (3 Stam) next turn

**Design Note:** PASS is never strategically dominant because enemies still attack during your turn. It's a tactical option for stamina management, not a way to avoid combat.

---

## Status Effects

| Status | Effect | Duration |
|--------|--------|----------|
| Poisoned | -3 HP/turn | 3 turns |
| Bleeding | -2 HP/turn per stack | Until healed |
| Stunned | Skip next turn | 1 turn |
| Weakened | -25% damage dealt | 3 turns |
| Cursed | Cannot heal | Until cured |

Status effects can cascade dangerously. Poisoned + Bleeding can kill faster than direct damage.

### Status Effect Stacking Rules

| Status | Stacking Behavior | Cap | Notes |
|--------|-------------------|-----|-------|
| Poisoned | Duration extends, damage flat | 6 turns max | New poison adds +3 turns (capped at 6), always 3 damage/turn |
| Bleeding | Stacks increase damage | 5 stacks max | 2/4/6/8/10 damage per turn at 1/2/3/4/5 stacks |
| Stunned | Does not stack | N/A | Subsequent stuns refresh to 1 turn |
| Weakened | Duration extends | 6 turns max | New application adds +3 turns |
| Cursed | Does not stack | N/A | Already cursed = no effect |

### Counterplay

- Poison: Antidote (consumable) clears all stacks
- Bleeding: Bandage (consumable) clears all stacks, or rest at camp
- Cursed: Purification Shrine or Purging Stone (rare consumable)

### Status Effect Persistence Between Combats

| Effect Type | Persistence Rule |
|-------------|------------------|
| Poisoned | Ends when combat ends |
| Bleeding | Ends when combat ends |
| Stunned | N/A (1 turn only) |
| Weakened | Ends when combat ends |
| Cursed | Persists until cured (extraction, shrine, or consumable) |
| Shrine Blessings | Persist until extraction/death |
| Protection (Shrine) | Counter persists between combats, decrements per combat |

**Design Rationale:** Most status effects END when combat ends. This prevents punishing players for fighting defensively (long fights don't accumulate DoT across rooms). Cursed is the exception because it's a severe, story-relevant condition.

**Flee vs Combat End:** Fleeing does NOT count as "combat ending." If you flee while poisoned, you remain poisoned. Combat only "ends" when the enemy is defeated.

---

## Combat Pacing

- **Target fight length:** 1.5-2 minutes (4-8 turns)
- **Average turns to kill basic enemy:** 3-4
- **Boss fights:** 8-12 turns

**Critical for Session Length:** Combat must average 1.5-2 minutes to hit 20-28 minute full dungeon target. If fights consistently exceed 2.5 minutes, session length bloats beyond target.

---

## Enemy AI Behavior System

Each enemy type uses a **priority-based decision system**. On their turn, enemies evaluate conditions from top to bottom and execute the first action whose condition is met.

### AI Decision Framework

```
ENEMY TURN DECISION
-------------------
1. Check special ability conditions (top priority)
2. Check defensive conditions
3. Execute default attack
```

### Basic Enemy AI

#### Plague Rat
**Speed:** Fast (first-strike on Turn 1)
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Always | Light Attack (5-8 damage, 30% Poison) |

**AI Notes:** Pure aggression. The 30% Poison on every hit is the real threat over multiple turns.

#### Ghoul
**Speed:** Normal
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Always | Light Attack (8-12 damage) |

**AI Notes:** Baseline enemy. No special mechanics.

#### Plague Ghoul
**Speed:** Normal
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Player NOT poisoned | Venomous Bite (6-10 damage, 100% Poison) |
| 2 | Player IS poisoned | Light Attack (6-10 damage, 30% Poison refresh) |

**AI Notes:** Prioritizes applying poison, then maintains it.

#### Skeleton Archer
**Speed:** Normal
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Roll 1-10 (10% chance) | Aimed Shot (10-14 damage, guaranteed crit = 20-28 damage) |
| 2 | Default | Arrow Shot (10-14 damage, 10% crit) |

**AI Notes:** 10% "Aimed Shot" is telegraphed: "The Archer draws back, taking careful aim..."

#### Armored Ghoul
**Speed:** Slow (+25% damage from Heavy Attack)
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Own HP < 50% | Desperate Lunge (10-14 damage, loses 15% armor) |
| 2 | Default | Armored Strike (10-14 damage) |

**AI Notes:** At low HP, trades armor for aggression.

#### Shadow Stalker
**Speed:** Fast + Ambush (2 free actions before combat)
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Turn 1-2 (Ambush turns) | Surprise Strike (14-18 damage, +50% crit chance) |
| 2 | Player HP < 30% | Finishing Strike (14-18 damage, +100% crit chance) |
| 3 | Default | Shadow Strike (14-18 damage) |

**AI Notes:** Extremely dangerous opener. Rewards bringing defensive items.

#### Corpse Shambler
**Speed:** Slow (+25% damage from Heavy Attack)
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Always | Crushing Blow (6-10 damage) |

**AI Notes:** Cannot be staggered (Relentless trait). High HP, low damage war of attrition.

### Elite Enemy AI

#### Fleshweaver
**Speed:** Slow
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Own HP <= 50% AND Life Drain not used | Life Drain (10 damage, heal 15 HP) |
| 2 | Default | Soul Tear (15-20 damage) |

**AI Notes:** Life Drain triggers ONCE at 50% HP. Telegraphed one turn before: "The Fleshweaver's eyes glow with hunger..."

#### Bone Knight
**Speed:** Normal
| Priority | Condition | Action |
|----------|-----------|--------|
| 1 | Player just used Heavy Attack | Shield Bash (18-24 damage, 30% stun) |
| 2 | Own HP < 30% | Desperate Charge (18-24 damage, drops armor to 15%) |
| 3 | Default | Sword Strike (18-24 damage) |

**AI Notes:** Punishes Heavy Attack spam. Optimal play: vary attack patterns.

### Boss AI: Bone Colossus

**Attack Cycle (3-turn):**
| Cycle Turn | Action | Damage | Notes |
|------------|--------|--------|-------|
| 1 | Standard Strike | 18-24 | Single attack |
| 2 | Telegraph | 0 | Safe damage window |
| 3 | Crushing Blow | 36-48 | Double attack (18-24 x2) |

**Ground Slam:** Replaces Standard Strike every 4th cycle. 15-20 damage, 50% stun chance.

**Stagger Resistance:** Requires 2 staggers within 3 turns to trigger.

---

## Combat Balance Formulas

### Damage Calculation

```
Final Damage = (Weapon Base + MIGHT Bonus) x Skill Multiplier x (1 + Bonus%) x Crit Multiplier x (1 - Effective Armor%)

Where:
- Weapon Base: The weapon's base damage range (e.g., 5-8 for starter weapon)
- MIGHT Bonus: MIGHT stat x 1 (so 3 MIGHT = +3 damage)
- Skill Multiplier: 1.0 for Light Attack, 2.0 for Heavy Attack
- Bonus%: Sum of all additive damage bonuses (item effects, buffs)
- Crit Multiplier: 2.5 on critical hit, 1.0 otherwise (v1.6: increased from 2.0x)
- Effective Armor%: See Armor System below
```

### Armor System

Armor provides percentage-based damage reduction. Armor penetration reduces the effectiveness of armor.

```
ARMOR FORMULA
=============

Effective Armor% = Base Armor% × (1 - Armor Penetration%)

Damage After Armor = Raw Damage × (1 - Effective Armor%)

Rounding: Always round to nearest integer (0.5 rounds up)
Minimum Effective Armor: 0% (penetration cannot make armor negative)
```

**Enemy Armor Values:**

| Enemy | Base Armor | vs Light Attack | vs Heavy Attack (25% pen) |
|-------|------------|-----------------|---------------------------|
| Armored Ghoul | 15% | 15% reduction | 11.25% reduction |
| Bone Knight | 25% | 25% reduction | 18.75% reduction |

**Worked Examples:**

*Light Attack vs Bone Knight (9 base damage):*
```
Effective Armor: 25% × (1 - 0%) = 25%
Final Damage: 9 × (1 - 0.25) = 6.75 → 7 damage
```

*Heavy Attack vs Bone Knight (18 base damage, 25% pen):*
```
Effective Armor: 25% × (1 - 0.25) = 18.75%
Final Damage: 18 × (1 - 0.1875) = 14.625 → 15 damage
```

**Player Armor from Gear:**

Players do NOT have a base armor stat. Armor is gained ONLY from gear effects.

| Rarity | Armor Range | Example |
|--------|-------------|---------|
| Common | 5-10% | Tattered Leathers: +5 HP, no armor |
| Uncommon | 10-15% | Chainmail: +8 HP, 10% armor |
| Rare | 15-20% | Plate Cuirass: +10 HP, 18% armor |
| Legendary | 20-25% | Unique effects |

**Player Armor Cap:** 40% (hard cap from all sources combined)

### Example Calculation (Starter Mercenary vs Plague Rat)

```
Weapon Base: 6 (average of 5-8)
MIGHT Bonus: +3 (from 3 MIGHT)
Light Attack: 1.0 multiplier
No bonuses: 1.0
No crit: 1.0

Final Damage = (6 + 3) x 1.0 x 1.0 x 1.0 = 9 damage
Plague Rat HP: 12-15
Turns to kill: 2 hits (12 HP) to 2 hits (15 HP) = 2 turns
```

### Survivability Formula

```
Turns Survivable = Player HP / Average Enemy Damage

Target: 4-6 turns survivable against basic enemies without healing
- 50 HP / 8 damage (Ghoul avg) = 6.25 turns (within target)
- 50 HP / 6.5 damage (Plague Rat avg) = 7.7 turns (comfortable)
```

### Critical Hit System

```
Crit Damage = 2.5x base damage (applied after all additive bonuses)

Crit Chance = 5% (base) + CUNNING Contribution + Gear Bonuses

CUNNING Contribution (soft cap at 11+):
  Points 1-10:  +3% per point
  Points 11+:   +1.5% per point (diminishing returns)

TOTAL CRIT CAP: 65% (from all sources combined)

At 3 CUNNING:  5% + 9% = 14% crit chance (starting Mercenary)
At 10 CUNNING: 5% + 30% = 35% crit chance (soft cap threshold)
At 15 CUNNING: 5% + 37.5% = 42.5% crit chance
At 20 CUNNING: 5% + 45% = 50% crit chance (max from stats)
```

**Balance Rationale (v1.6):**

Crit multiplier increased from 2.0x to 2.5x to address MIGHT vs CUNNING imbalance:

| Build (Level 20) | DPS Increase | Trade-offs |
|------------------|--------------|------------|
| Pure MIGHT | +133% | Consistent damage, no secondary benefits |
| Pure CUNNING | +45% | Variable damage, loot detection, dialogue options |
| Hybrid (10/10) | +80% | Balanced approach, some of each benefit |

The 3x gap between pure builds is intentional: MIGHT is the "combat" stat, CUNNING is the "utility" stat with combat side benefits.

→ *Full details: [Character & Progression](character-progression.md#cunning-crit-scaling-soft-cap)*

---

## Flee Mechanics

Fleeing is always an option but never free:

| Enemy Type | Success Chance | On Success | On Failure |
|------------|----------------|------------|------------|
| Basic | 70% | +5 Dread | +2 Dread, lose turn |
| Elite | 50% | +5 Dread | +2 Dread, lose turn |
| Boss | 0% | Cannot flee | N/A |

**Restrictions:**
- Cannot flee on round 1
- Cannot flee during ambush

Fleeing should be a meaningful decision, not a safety valve. The Dread penalty on successful flee creates tension even when escape succeeds (aligned with Darkest Dungeon's 25 stress on retreat).

### Room State Rules (Flee Consequences)

```
ROOM STATE RULES
----------------
1. Room contents generated on FIRST entry
2. Contents persist until cleared (enemies, loot, etc.)
3. Fled rooms RETAIN their state - same enemies remain

"You fled this chamber. The enemies within still wait.
 You may return, but they remember your cowardice."
```

This prevents the "flee-reset exploit" where players could flee combat, re-enter the room, and get different RNG for potentially better outcomes. Room state is seeded on first entry and persists until the room is cleared or the run ends.

---

## Related Systems

- [Character & Progression](character-progression.md) - Stats that affect combat (VIGOR, MIGHT, CUNNING)
- [Dread System](dread-system.md) - Flee increases Dread
- [Reference Numbers](reference-numbers.md) - Detailed enemy stats and balance validation
