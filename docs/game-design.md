# DARKDELVE MVP Game Design Document

> A CLI roguelike where each run asks "one more floor?" as your mind degrades and the dungeon lies to you.

---

## Core Design Pillars (Non-Negotiable)

1. **Extraction Dilemma** - Push deeper for better loot, or leave with what you have
2. **Dread System** - Mental strain makes the game itself unreliable at high levels
3. **Death as Discovery** - Dying unlocks bestiary entries for future runs

---

## The Game Loop

```
Camp (manage stash) --> Enter Dungeon -->
  For each floor:
    Explore rooms (combat/treasure/events) -->
    Choose: next room, descend, or extract?
  --> Death (lose items, gain bestiary) OR Extract (keep items)
--> Return to Camp
```

**Session target:** 10-20 minutes per run. Players control length by extraction timing.

---

## Combat

### Actions (4 total)

| Action | Effect |
|--------|--------|
| Attack | Deal weapon damage |
| Defend | Reduce damage taken this turn by 50%. 2-turn cooldown. |
| Use Item | Use a consumable |
| Flee | 70% success vs basic, 50% vs elite. +8 Dread on success, failed flee = enemy free attack. Cannot flee bosses or turn 1. |

### Enemy Tells

Enemies telegraph heavy attacks with visible warnings (e.g., "The Ghoul raises its claws..."). Defend becomes correct choice when tells appear. Makes combat tactical, not spam.

### Rules

- **Turn order:** Player first, then enemy
- **No stamina system**
- **No status effects** (poison, bleed, etc. deferred to post-MVP)
- **Target fight length:** 3-5 turns for basic enemies, 6-10 for boss

### Combat Stats

- HP = Base 35 + (VIGOR x 5) + gear bonuses
- Damage = Weapon base + MIGHT
- Crit Chance = 5% base + (CUNNING x 3%)
- Crit Damage = 2x

---

## Items (8 total)

### Equipment

| Item | Slot | Rarity | Stats |
|------|------|--------|-------|
| Rusty Sword | Weapon | Common | 5-8 damage |
| Iron Longsword | Weapon | Uncommon | 7-11 damage, +5% crit |
| Soulreaver Axe | Weapon | Rare | 9-14 damage, 10% lifesteal |
| Tattered Leathers | Armor | Common | +5 HP |
| Chainmail Shirt | Armor | Uncommon | +10 HP |

### Consumables

| Item | Rarity | Effect |
|------|--------|--------|
| Healing Potion | Common | Restore 20 HP |
| Torch | Uncommon | -5 Dread, max 3 uses per run |
| Clarity Potion | Uncommon | Remove Dread display corruption for 3 rooms |

### Item Rules

- Uncommon+ items drop on Floor 2+ (one guaranteed Uncommon on Floor 2)
- Max 1 consumable from stash per run
- Stash management only at Camp (cannot stash mid-run)

---

## Dread System

### Dread Range: 0-100

### Sources

| Source | Dread Gain |
|--------|------------|
| Room cleared (F1-2) | +5 |
| Room cleared (F3-4) | +8 |
| Room cleared (F5) | +10 |
| Trapped chest opened | +10 |

### Recovery

| Method | Effect |
|--------|--------|
| Stairwell reached | -5 Dread |
| Torch | -5 Dread (max 3/run) |
| Return to Camp | Reset to 0 |

### Thresholds

| Dread | Name | Effect |
|-------|------|--------|
| 0-49 | Calm | Normal gameplay |
| 50-69 | Uneasy | 5% of displayed info is wrong (enemy HP shown +/-20%) |
| 70-84 | Shaken | 15% wrong, whispers appear in text |
| 85-99 | Terrified | 25% wrong, hallucination messages |
| 100 | Breaking Point | The Watcher spawns |

### The Watcher

- **HP:** 80-100 (beatable with good gear + potions)
- **Damage:** 18-25 per hit
- **Cannot flee**
- **Has "tell" turns** where it doesn't attack (Defend windows)
- **Defeating it:** 50-75 gold + rare item

**Critical Rule:** Dread corrupts DISPLAY only. Actual game state is always correct. Player inputs always work.

---

## Dungeon Structure

### 5 Floors

| Floor | Rooms | Enemies |
|-------|-------|---------|
| 1 | 3 + stairwell | Plague Rat, Ghoul |
| 2 | 4 + stairwell | Plague Rat, Ghoul, Skeleton Archer |
| 3 | 4 + stairwell | Ghoul, Skeleton Archer, Armored Ghoul |
| 4 | 5 + stairwell | Skeleton Archer, Armored Ghoul, Shadow Stalker |
| 5 | 5 + boss room | Armored Ghoul, Shadow Stalker, Bone Colossus |

**Total: ~25 rooms per run**

### Room Types

| Type | Content |
|------|---------|
| Combat | Enemy encounter |
| Treasure | Chest with item |
| Empty | Flavor text only |
| Stairwell | Floor transition, extraction point |
| Boss | Floor 5 only |

### Extraction Rules

| Floor | Extraction |
|-------|------------|
| 1-2 | Free (no extraction bonus) |
| 3 | 30 gold cost |
| 4 | 60 gold cost |
| 5 | Must defeat boss OR 100 gold + mini-boss |

### Navigation

- ASCII map shows floor layout
- Player chooses adjacent room to enter
- Can backtrack
- Room state persists (fled enemies remain)

---

## Enemies (5 + Boss)

| Enemy | Floor | HP | Damage | Special |
|-------|-------|-----|--------|---------|
| Plague Rat | 1-2 | 12-15 | 5-8 | Fast (attacks first on turn 1) |
| Ghoul | 1-3 | 20-25 | 8-12 | Standard |
| Skeleton Archer | 2-4 | 15-18 | 10-14 | High damage, fragile |
| Armored Ghoul | 3-5 | 25-28 | 8-12 | Takes 25% less damage |
| Shadow Stalker | 4-5 | 25-30 | 10-14 | Ambush (1 free attack), pre-combat warning shown |
| **Bone Colossus** | 5 | 100 | 12-16 | Phase 2 at 40 HP: +2 damage, attacks twice |

---

## Character

### Stats (3 only)

| Stat | Effect |
|------|--------|
| VIGOR | +5 HP per point |
| MIGHT | +1 damage per point |
| CUNNING | +3% crit chance per point, +5% flee chance |

### Starting Character

- **HP:** 55 (35 base + 15 from 3 VIGOR + 5 from Tattered Leathers)
- **Stats:** 3 VIGOR, 3 MIGHT, 3 CUNNING
- **Equipment:** Rusty Sword, Tattered Leathers
- **No leveling** - power comes from gear

---

## Stash & Persistence

### Stash

- 10 slots for storing items between runs
- Bring up to 2 items from stash into a run
- **Gear fear:** Items brought into dungeon are LOST on death
- Items left in stash are always safe

### What Persists Between Runs

- Stash contents
- Bestiary unlocks
- Gold (earned on successful extraction)

### What Does NOT Persist

- Character stats (no leveling)
- Items carried when you die

---

## Death as Discovery

### On Death

1. Lose all carried items
2. Lose gold earned this run
3. **Unlock bestiary entry** for the killing enemy

### Bestiary (Tiered Unlocks)

| Unlock | Requirement |
|--------|-------------|
| Name only | First encounter |
| HP + damage range | 3 encounters OR 1 death |
| Special abilities | 6 encounters OR 2 deaths |

### Framing

Deaths are "Lessons Learned," not failures. The game explicitly tells you:
```
LESSON LEARNED
--------------
The Shadow Stalker's ambush claimed you.
Now you know: they strike twice before you can react.
[Bestiary Updated]
```

---

## Gold

### Drop Amounts

| Source | Gold |
|--------|------|
| Plague Rat | 2-5 |
| Ghoul | 4-8 |
| Skeleton Archer | 5-10 |
| Armored Ghoul | 8-15 |
| Shadow Stalker | 12-20 |
| Treasure Chest | 10-25 (floor-scaled) |
| Extraction Bonus | Floor × 15 |

### Rules

- Gold only kept on successful extraction
- Persists at camp between runs

---

## Camp (Between Runs)

```
DARKDELVE - CAMP
================

Gold: 247

[1] Enter Dungeon
[2] Manage Stash (4/10 items)
[3] View Bestiary (3/6 enemies known)
[4] Quit

> _
```

**No NPCs for MVP.** Camp is purely functional menus.

---

## What's Cut from Old Docs

| System | Status | Reason |
|--------|--------|--------|
| Stamina system | Cut | Simplifies combat significantly |
| Status effects | Cut | No poison, bleed, stun tracking |
| Identification | Cut | Items are immediately usable |
| Camp NPCs | Cut | Chronicler, Smith, Merchant deferred |
| Veteran Knowledge tiers | Simplified | 3-tier bestiary (name → stats → abilities) |
| Classes/unlocks | Cut | Single starting character |
| 12+ additional items | Cut | 8 items total for MVP |
| Multi-enemy combat | Cut | 1v1 only |
| Tiered extraction | Simplified | Free/gold-cost/boss-only |

---

## MVP Success Criteria

1. **Extraction tension works:** Players hesitate at "one more floor"
2. **Sessions hit target:** Runs complete in 10-20 minutes
3. **Death feels productive:** Players restart immediately to use bestiary knowledge
4. **Dread creates unease:** High-Dread runs feel genuinely uncertain
5. **Combat is snappy:** Fights complete in under 2 minutes

---

## Implementation Order

1. Core game loop (camp -> dungeon -> extract/death -> camp)
2. Basic combat (4 actions, no specials)
3. Dungeon navigation (5 floors, room types, ASCII map)
4. Items (8 items, stash system)
5. Enemies (5 types + boss)
6. Dread system (thresholds, display corruption, The Watcher)
7. Death/bestiary system
8. Polish (CLI formatting, dopamine moments)

---

*Document version: 2.2 (Red Team Balance Pass Applied)*
*Updated: 2026-01-24*
