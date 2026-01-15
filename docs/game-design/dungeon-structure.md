# Dungeon Structure

> Part of the [DARKDELVE Game Design Document](../game-design.md)

---

## Floor Architecture

Each dungeon has 5 floors with escalating risk and reward:

| Floor | Rooms | Duration | Difficulty | Key Feature |
|-------|-------|----------|------------|-------------|
| 1 | 4 | ~4 min | Easy | Introductory floor, free extract |
| 2 | 4 | ~5 min | Medium | Elites introduced (10% spawn) |
| 3 | 4 | ~5 min | Hard | Waystone extraction costs begin |
| 4 | 5 | ~6 min | Very Hard | Room count increase, epic loot |
| 5 | 6 | ~8 min | Extreme | Boss, Legendary chance |

**Total: 23 rooms for full clear = 20-28 minutes**

**Mechanic Introduction Principle:** Each floor introduces ONE major new mechanic. Never stack multiple new challenges simultaneously.

**Floor Introduction Sequence:**
1. **Floor 1-2:** Core mechanics, free extraction (safe learning zone)
2. **Floor 3:** Waystone cost begins (economic pressure)
3. **Floor 4:** Room count increases + epic loot (duration matched with reward)
4. **Floor 5:** Boss guards only exit (all-or-nothing finale)

---

## Pre-Boss Warning UX

**Design Principle:** Use diegetic (in-world) warnings rather than UI pop-ups. The Dark Souls fog gate pattern - a visual barrier that forces acknowledgment without breaking immersion.

### Two-Stage Boss Approach

1. **Threshold Chamber** (Room before boss): Distinct room that signals finality
2. **Point of No Return**: Explicit confirmation required before boss entry

### Threshold Chamber Display

```
═══════════════════════════════════════════════════════════════
                    THE SANCTUM THRESHOLD
═══════════════════════════════════════════════════════════════

The corridor ends at massive iron doors, sealed with chains of
bone. Beyond them, something ancient waits.

    "None return through these doors. None."

WARNING: Beyond this threshold, there is no retreat.
         Floor 5 has NO Waystone extraction.
         Victory or death are your only exits.

───────────────────────────────────────────────────────────────
READINESS CHECK:
  HP:      ████████░░ 80%+ recommended     [PASS]
  Dread:   ████░░░░░░ <50 recommended      [PASS]
  Damage:  ███░░░░░░░ 15+ recommended      [MARGINAL]
  Healing: ██░░░░░░░░ 2+ potions advised   [WARNING]
───────────────────────────────────────────────────────────────

[1] ENTER THE SANCTUM (No return)
[2] Return to Floor 5 exploration
[3] Use Waystone to extract now (last chance)
```

### Readiness Indicator Thresholds

| Metric | PASS | MARGINAL | WARNING |
|--------|------|----------|---------|
| HP | 80%+ of max | 50-79% | <50% |
| Dread | <50 | 50-69 | 70+ |
| Damage | 15+ average | 10-14 | <10 |
| Healing | 2+ potions | 1 potion | 0 potions |

**Display Rules:**
- Readiness check is INFORMATIONAL, not gating (players can enter regardless)
- MARGINAL and WARNING states use color coding (yellow/red)
- First-time players see extended warning text; veterans see condensed version
- Extraction option (3) only available if player has Waystone charges

### Floor 5 Extraction Rules

- NO Waystone extraction available on Floor 5 (boss guards the only exit)
- The Threshold Chamber is the LAST extraction opportunity
- This must be communicated clearly before the player commits

---

## Floor Layout

Room breakdown by floor (designed for 1-1.5 min/room average):

| Floor | Combat | Treasure | Event | Rest/Special | Total |
|-------|--------|----------|-------|--------------|-------|
| 1 | 2 | 1 | 1 | 0 | 4 |
| 2 | 2 | 1 | 1 | 0 | 4 |
| 3 | 2 | 1 | 1 | 0 | 4 |
| 4 | 2-3 | 1 | 1 | 0-1 | 5 |
| 5 | 3 | 1 | 1 | 1 (+ boss) | 6 |

**Room Time Budget:**
- Combat rooms: 1.5-2 minutes (4-8 turns)
- Event rooms: 30-60 seconds
- Treasure rooms: 30-60 seconds
- Rest sites: 15-30 seconds

---

## Room Types

### Combat Room

```
You enter a collapsed crypt. Bones crunch underfoot.

A Ghoul rises from the rubble, hunger in its hollow eyes.

[F]ight  [R]etreat (costs 5 turns)
```

### Treasure Room

```
An ornate chest sits in the corner, dust thick upon its lid.

[1] Pick lock carefully  (Lockpick, safe, common loot)
[2] Force it open        (Noisy, 30% alerts enemies, better loot)
[3] Smash it             (Guaranteed loot, always alerts enemies)
[4] Examine first        (Requires CUNNING 8+, reveals contents)
[5] Leave it
```

### Event Room

```
A hooded figure blocks the passage.

"Spare some gold, traveler? Just 50 pieces.
 I know secrets of what lies below..."

[1] Give 50 gold
[2] Refuse and pass
[3] Threaten them
[4] Give 100 gold
```

### Rest Site

```
A small alcove, sheltered from the darkness.
You could rest here—but something might find you.

[1] Rest fully       (+50% HP, 20% ambush chance)
[2] Rest briefly     (+25% HP, 5% ambush chance)
[3] Don't rest
```

### Shrine

```
A blood-stained altar to a forgotten god.
Dark power hums in the air.

[1] Pray for strength  (+3 MIGHT until extraction, +15 Dread)
[2] Pray for fortune   (Next 3 chests upgrade rarity, +10 Dread)
[3] Pray for insight   (Reveal floor map, +5 Dread)
[4] Desecrate shrine   (50 gold, chance of curse)
[5] Leave
```

### Shrine Blessing Rules

- Only ONE shrine blessing can be active at a time
- Receiving a new blessing replaces the previous one
- When already blessed, player is prompted with choice:

```
"The altar pulses with power.
 You already carry the Blessing of Might.

 [1] Accept Blessing of Fortune (replaces current)
 [2] Keep current blessing"
```

Thematic justification: "The gods are jealous - you may serve only one."

---

## ASCII Map

```
THE OSSUARY - Floor 2
═══════════════════════

  ┌───┬───┬───┐
  │ ? │ ! │ ▣ │
  ├───┼───┼───┤
  │ ☠ │ . │ $ │
  ├───┼───┼───┤
  │ ↓ │ . │ * │
  └───┴───┴───┘

Legend:
  ▣ = Your location
  ? = Unexplored (unknown type)
  ! = Combat (danger detected)
  ☠ = Cleared (enemies dead)
  $ = Treasure
  * = Event
  ↓ = Stairs down / Exit
  . = Empty (explored)

Torches: 2  |  HP: 35/50  |  Dread: 28
```

---

## Room Preview UX

**Design Principle:** Show room TYPE before entry, but not specifics. Players should plan generally but face specific uncertainty (aligned with Hades/Slay the Spire transparent choice architecture).

### Room Preview Display

```
Available Paths:
  [1] North  -> [TREASURE] - You see a faint glint of metal
  [2] East   -> [COMBAT]   - Something stirs in the darkness
  [3] South  -> [?????]    - Complete silence (high Dread hides info)
```

### Preview Information by Dread Level

| Dread Level | Information Shown |
|-------------|-------------------|
| Calm (0-49) | Room type + flavor hint |
| Uneasy (50-69) | Room type, hints may be inaccurate (5%) |
| Shaken (70-84) | Room type hidden 30% of time, hints unreliable |
| Terrified (85+) | All rooms show as [?????] |

### CUNNING Scouting Mechanic

High CUNNING reveals additional information about adjacent rooms:

| CUNNING | Scouting Benefit |
|---------|------------------|
| 5+ | See room types through one additional wall |
| 8+ | Combat rooms show enemy count (not type) |
| 12+ | Treasure rooms hint at rarity tier |

### Pacing Guarantee

After every 2 consecutive combat rooms, at least 1 non-combat option (treasure, event, or rest) must be available. This prevents exhaustion spirals and respects the extraction tension by giving players breathing room to make extraction decisions.

### Implementation Notes

- Room types determined at floor generation, not on entry
- Preview flavor text pulled from themed pool per dungeon
- Dread corruption applied at display time, not generation time

---

## Related Systems

- [Dungeon Generation](dungeon-generation.md) - How floors are procedurally created
- [Extraction System](extraction-system.md) - Extraction rules by floor
- [Dread System](dread-system.md) - Room preview degradation at high Dread
- [Combat](combat.md) - What happens in combat rooms
