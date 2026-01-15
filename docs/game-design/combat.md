# Combat System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Turn-based combat with stamina management. Fast, tactical, and always risky.

**MVP Scope:** All combat encounters are 1v1 (player vs single enemy). Multi-enemy encounters are deferred to post-MVP to keep combat UI simple and balance manageable. Some enemies (like Bone Colossus) have multi-attack abilities that provide tactical variety within the 1v1 framework.

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
| Item | 0 Stam | Use consumable, ends turn |
| Flee | 0 Stam | Success chance varies by enemy |

### Heavy Attack vs Light Attack Trade-off

- Light Attack spam: 4 Stam = 4 attacks = 4x base damage over 2 turns
- Heavy Attack: 3 Stam = 1 attack = 2x base damage + 50% stagger + armor pen
- Heavy wins when: Enemy has armor, or stagger breaks enemy combo
- Light wins when: Need consistent damage, enemy has no armor

### Block vs Dodge Trade-off

- Dodge (1 Stam): Avoids one attack completely, prevents status effects
- Block (1 Stam): Halves ALL attacks this turn, does NOT prevent status effects
- Dodge wins when: Single strong attack, enemy applies status effects
- Block wins when: Multi-hit enemies (2+ attacks per turn), no status risk

**Stagger Effect:** Staggered enemies skip their next attack (1 turn). Bosses have stagger resistance (requires 2 staggers in 3 turns to trigger).

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

---

## Combat Pacing

- **Target fight length:** 1.5-2 minutes (4-8 turns)
- **Average turns to kill basic enemy:** 3-4
- **Boss fights:** 8-12 turns

**Critical for Session Length:** Combat must average 1.5-2 minutes to hit 20-28 minute full dungeon target. If fights consistently exceed 2.5 minutes, session length bloats beyond target.

---

## Combat Balance Formulas

### Damage Calculation

```
Final Damage = (Weapon Base + MIGHT Bonus) x Skill Multiplier x (1 + Bonus%) x Crit Multiplier

Where:
- Weapon Base: The weapon's base damage range (e.g., 5-8 for starter weapon)
- MIGHT Bonus: MIGHT stat x 1 (so 3 MIGHT = +3 damage)
- Skill Multiplier: 1.0 for Light Attack, 2.0 for Heavy Attack
- Bonus%: Sum of all additive damage bonuses (item effects, buffs)
- Crit Multiplier: 2.0 on critical hit, 1.0 otherwise
```

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
Crit Damage = 2x base damage (applied after all additive bonuses)

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
