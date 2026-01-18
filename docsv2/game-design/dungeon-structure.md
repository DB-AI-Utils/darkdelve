# Dungeon Structure

> Part of the [DARKDELVE Game Design Document](../game-design.md)

---

## Room Navigation System

### Connectivity Model: Corridor-Based Graph

Rooms connect via corridors forming a directed graph with symmetric edges (if A connects to B, B connects to A). This allows designers to create interesting topology with dead ends, loops, and chokepoints.

### Movement Input Method

Players select numbered corridor options rather than cardinal directions:

```
Available Paths:
  [1] North  -> [TREASURE] A faint glint of metal ahead
  [2] East   -> [COMBAT]   Something stirs in the darkness
  [3] South  -> [CLEARED]  You've been here. Nothing remains.
  [B] Back to previous room (if cleared)
```

Input: Single digit (1-4) or 'B' for backtrack.

### Backtracking Rules

| Rule | Specification |
|------|---------------|
| Allowed to | CLEARED rooms only |
| Cost | 1 turn (Dread continues accumulating) |
| Blocked when | In COMBAT room until combat resolved |
| Blocked through | Uncleared rooms ("The sounds from that chamber... you can't go back that way.") |

### Room Entry State Transitions

**Entering UNEXPLORED room:**
1. Room state changes to ENTERED
2. Room contents revealed (type was known, specifics now shown)
3. If COMBAT: Combat begins immediately (no pre-fight menu)
4. If TREASURE/EVENT/REST: Choice menu appears
5. If STAIRS: Descent/extraction prompt appears

**Entering ENTERED (non-combat) room:**
- Show room with current state (chest opened, NPC gone, etc.)

**Entering CLEARED room:**
- Safe passage, no encounters
- Can loot remaining items if inventory was full before

### Dread Corruption of Navigation

| Dread Level | Navigation Corruption |
|-------------|----------------------|
| Calm (0-49) | Room type shown accurately, flavor text reliable |
| Uneasy (50-69) | 5% chance room type displayed WRONG |
| Shaken (70-84) | Room types hidden 30% of time (show as [?????]), number of exits may appear wrong (+/- 1) |
| Terrified (85+) | All unexplored rooms show as [?????], backtrack paths may flicker |

**Critical Rule:** Corruption affects DISPLAY only. Actual room contents are unchanged. Player input always works correctly.

---

## Floor Transition System

### Stairwell Room

Each floor has exactly ONE Stairwell room. The Stairwell counts as one of the floor's rooms.

**Stairwell contents vary by floor:**

| Floors | Stairwell Contains |
|--------|-------------------|
| 1-2 | Stairs Down + Free Extraction Portal |
| 3-4 | Stairs Down only (portal is dark/broken) |
| 5 | Stairs Down only (no extraction on final floor) |

Stairwell properties:
- Visible on map from start (marked with ↓)
- Always safe (no enemies, no events)
- Contains ambient flavor text about depth

### Waystone Chamber

On Floors 3-4, extraction requires finding the **Waystone Chamber** — a separate room type distinct from the Stairwell.

**Waystone Chamber properties:**
- Spawns once per floor (guaranteed)
- Spawns in rooms 5-8 of the floor (never first or last rooms, preventing frustration)
- Contains an ancient Waystone that allows extraction for a cost
- NOT visible on map from start (must be discovered through exploration)
- Always safe (no enemies)
- Marked with ◊ on map once discovered

**Extraction costs at Waystone Chamber:**
| Floor | Cost |
|-------|------|
| 3 | 10% of carried gold (min 15g) |
| 4 | 25% of carried gold (min 25g) OR 1 item |

→ *Full extraction rules: [Extraction System](extraction-system.md)*

### Descent Conditions

| Floor | Descent Rules |
|-------|---------------|
| 1-4 | Available immediately upon entering Stairwell. No minimum room clear requirement. |
| 5 | N/A (Floor 5 is final floor). Boss room is the only "exit". |

**Descent Blocked When:**
- The Watcher is active (must defeat or die first)
- In combat (must resolve combat first)

### One-Way Transitions

**Floor transitions are permanent:**
- Cannot return to previous floors
- Thematic: "The stairs crumble behind you"
- Prevents safe farming of early floors then descending
- Simplifies floor state management

**Within-floor backtracking:**
- Allowed to any CLEARED room on current floor
- After boss dies, can explore remaining Floor 5 rooms before extracting

### Descent Dread Cost

Descending a floor: **+5 Dread**
Applied immediately upon descent, before first room of new floor.

### Stairwell UI Display

**Floors 1-2 (with free extraction portal):**
```
═══════════════════════════════════════════════════════════════
                    THE STAIRWELL
═══════════════════════════════════════════════════════════════

Cold air rises from the depths below. The darkness beckons.
A shimmering portal hums softly beside the descending stairs.

───────────────────────────────────────────────────────────────
FLOOR 2 SUMMARY:
  Rooms Explored: 3/4
  Enemies Slain:  2
  Gold Found:     34
───────────────────────────────────────────────────────────────

  [1] DESCEND TO FLOOR 3
      Warning: +5 Dread. No free extraction below.

  [2] EXTRACT NOW (Free)
      "Step through the portal. Live to delve another day."

  [3] RETURN TO FLOOR
      "There may be rooms you haven't explored."

───────────────────────────────────────────────────────────────
HP: 42/50 | Dread: 28 | Gold: 34
> _
```

**Floors 3-4 (no extraction portal):**
```
═══════════════════════════════════════════════════════════════
                    THE STAIRWELL
═══════════════════════════════════════════════════════════════

Cold air rises from the depths below. The darkness beckons.
The portal archway stands dark and silent—broken long ago.

───────────────────────────────────────────────────────────────
FLOOR 3 SUMMARY:
  Rooms Explored: 3/5
  Enemies Slain:  2
  Gold Found:     67
  Waystone: NOT FOUND
───────────────────────────────────────────────────────────────

  [1] DESCEND TO FLOOR 4
      Warning: +5 Dread. You have not found the Waystone.

  [2] RETURN TO FLOOR
      "The Waystone must be here somewhere..."

───────────────────────────────────────────────────────────────
HP: 38/50 | Dread: 41 | Gold: 67
> _
```

### Waystone Chamber UI Display

```
═══════════════════════════════════════════════════════════════
                 THE WAYSTONE CHAMBER
═══════════════════════════════════════════════════════════════

An ancient stone hums with power, runes flickering across its
surface. The air tastes of ozone and distant places.

"The Waystone demands tribute for passage."

───────────────────────────────────────────────────────────────
EXTRACTION COST: 7 gold (10% of 67, min 15 → 15 gold)
───────────────────────────────────────────────────────────────

  [1] PAY 15 GOLD - EXTRACT NOW
      "Leave with what you have. The dungeon releases you."

  [2] SACRIFICE ITEM INSTEAD
      "The Waystone accepts material offerings."

  [3] RETURN TO FLOOR
      "Not yet. There's more to find."

───────────────────────────────────────────────────────────────
HP: 38/50 | Dread: 41 | Gold: 67
> _
```

---

## Floor Architecture

Each dungeon has 5 floors with escalating risk and reward:

| Floor | Rooms | Duration | Difficulty | Key Feature |
|-------|-------|----------|------------|-------------|
| 1 | 5 | ~4 min | Easy | Introductory floor, free extract at Stairwell |
| 2 | 5 | ~5 min | Medium | Elites introduced (10% base; higher on deeper floors) |
| 3 | 5 | ~5 min | Hard | Waystone Chamber (must find to extract) |
| 4 | 5 | ~5 min | Very Hard | Armored enemies, Shadow Stalker ambush, epic loot |
| 5 | 8 | ~9 min | Extreme | Room count increase, Boss guards only exit |

**Total: 28 rooms for full clear = 20-28 minutes**

**Mechanic Introduction Principle:** Each floor introduces ONE major new mechanic. Never stack multiple new challenges simultaneously.

**Floor Introduction Sequence:**
1. **Floor 1-2:** Core mechanics, free extraction at Stairwell (safe learning zone)
2. **Floor 3:** Waystone Chamber introduced (must find + pay to extract)
3. **Floor 4:** Armored enemies (Heavy Attack requirement), Shadow Stalker ambush mechanic, epic loot potential
4. **Floor 5:** Room count increase, Boss guards only exit (all-or-nothing finale)

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
[3] RETREAT to Floor 4 (25% gold or 1 item)
    "The Waystone cannot extract you from these depths,
     but it can pull you back to shallower ground."
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
- Retreat option (3) always available at Threshold Chamber

### Floor 5 Extraction Rules

- **NO Waystone extraction available on Floor 5** (boss guards the only exit)
- Floor 5 rewards can ONLY be extracted by defeating the boss
- **Watcher Interaction:** If Dread reaches 100 during the boss fight, The Watcher spawn is deferred until after the boss is defeated. See [Dread System](dread-system.md#watcher--boss-interaction-rules) for full rules.

### Threshold Retreat Mechanic

The Threshold Chamber offers a **Retreat** option—NOT extraction. This returns the player to Floor 4.

| Aspect | Specification |
|--------|---------------|
| Cost | 25% of carried gold (min 25g) OR 1 item |
| Destination | Floor 4 Stairwell |
| Consequence | ALL Floor 5 progress lost (rooms reset) |
| Then | Normal Floor 4 extraction available |

**Design Rationale:**
- Maintains "Floor 5 has no extraction" as TRUE (retreat goes to F4, not camp)
- Prevents Floor 5 farming without boss commitment
- Provides safety valve for underprepared players
- Retreat feels like player choice, not forced death

**Validation Metrics:**
| Metric | Target | Red Flag |
|--------|--------|----------|
| Retreat usage rate | <15% | >25% (boss may be overtuned) |
| Boss attempt rate | >85% of Threshold arrivals | <75% (rewards may be insufficient) |

---

## Floor Layout

Room breakdown by floor (encounter rooms designed for 1-1.5 min/room average; Stairwell/Waystone are shorter):

> **MVP Scope**: MVP uses 0 rest rooms on Floor 5. The rest/special room is a post-MVP addition.

| Floor | Combat | Treasure | Event | Waystone | Rest/Special | Stairwell | Boss | Total |
|-------|--------|----------|-------|----------|--------------|-----------|------|-------|
| 1 | 2 | 1 | 1 | 0 | 0 | 1 | 0 | 5 |
| 2 | 2 | 1 | 1 | 0 | 0 | 1 | 0 | 5 |
| 3 | 2 | 1 | 0 | 1 | 0 | 1 | 0 | 5 |
| 4 | 2 | 1 | 0 | 1 | 0 | 1 | 0 | 5 |
| 5 | 4 | 1 | 1 | 0 | 0 | 1 | 1 | 8 |

*Floors 3-4: Waystone Chamber replaces 1 Event room (maintains 5 rooms per floor)*
*MVP Floor 5: 4 combat, 1 treasure, 1 event, 0 waystone, 0 rest, 1 stairwell, 1 boss = 8 rooms total*

**Room Time Budget:**
- Combat rooms: 1.5-2 minutes (4-8 turns)
- Event rooms: 30-60 seconds
- Treasure rooms: 30-60 seconds
- Rest sites: 15-30 seconds
- Stairwell rooms: 15-30 seconds

---

## Room Types

**Shrine Placement:**
Shrines appear within EVENT rooms. The event pool for each floor may include shrine events alongside NPC and other event types.

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

### Waystone Chamber (Floors 3-4 Only)

```
An ancient Waystone rises from cracked flagstones,
runes pulsing with faint blue light.

"The stone remembers the way home. But it demands tribute."

[1] Pay extraction cost  (Gold or item)
[2] Examine the runes    (Lore fragment)
[3] Leave
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
  ◊ = Waystone Chamber (Floors 3-4)
  ↓ = Stairs down (Stairwell)
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
