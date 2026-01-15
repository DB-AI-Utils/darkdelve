# The Dread System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Dread is DARKDELVE's signature mechanic—a second resource representing mental strain.

---

## Dread Display

```
HP:    ████████████░░░░░░░░ 60/100
DREAD: ████████░░░░░░░░░░░░ 40/100
```

---

## Starting Dread

**First-ever run:** Characters begin at **0 Dread** (blissfully ignorant).

**Subsequent runs:** Dread persists between runs. Resting at camp reduces Dread by 25 but cannot go below 10. Experienced adventurers can never fully forget the dungeon's horrors.

**Run Start Dread Calculation:**
- First run ever: 0 Dread
- After extraction: Previous run's end Dread, then apply rest (-25, min 10)
- After death: Previous run's end Dread -25 (min 10) — same as extraction

**Design Note:** Death and extraction now have identical Dread recovery. Death's penalty is purely item/gold loss, not Dread management. This prevents the perverse incentive where dying at high Dread was mechanically optimal for Dread reset.

---

## Dread Sources

*Values reduced by 30% from initial estimates to target 40-60 Dread at healthy extraction.*

| Source | Dread Gain |
|--------|------------|
| Killing basic enemy | +1 |
| Killing elite enemy | +3 |
| Killing eldritch enemy | +5 |
| Turn in darkness (no torch) | +1-2 (escalating) |
| Every 5 exploration turns | +1 |
| Reading forbidden text | +8 |

**Exploration Turn:** An exploration turn is counted each time the player enters a room (new or previously visited). Combat rounds do NOT count as exploration turns.
| Horror encounter | +5-10 |
| Descending a floor | +5 |

---

## Dread Recovery

*Camp no longer fully resets Dread - some persistence creates strategic decisions.*

| Method | Dread Loss | Notes |
|--------|------------|-------|
| Rest at camp | -25 (min 10) | Cannot reduce below 10 |
| Torch (consumable) | -5 Dread gain | For 1 floor duration |
| Shrine blessing | -15 | With tradeoff |
| Calm Draught | -15 | Always available (18g) |
| Clarity Potion | -20 | Rotating stock (20g) |

**Torch Mechanic:** Torch reduces Dread GAIN (not current Dread). While active, all Dread sources are reduced by 5 points. Duration: 1 floor.

---

## Dread Thresholds

*Progressive hallucination rates scale with Dread level.*

| Level | Range | Hallucination Rate | Effects |
|-------|-------|-------------------|---------|
| Calm | 0-49 | 0% | Full accuracy |
| Uneasy | 50-69 | 5% | Enemy count blur, damage variance |
| Shaken | 70-84 | 15% | Above + fake sound cues, inventory flicker |
| Terrified | 85-99 | 25% | Above + stat corruption, false item names, Watcher warnings |
| Breaking | 100 | 25% + Watcher | Complete unreliability, **The Watcher spawns** |

---

## The Watcher (100 Dread)

At maximum Dread, the abyss notices you. A unique elite enemy called **The Watcher** spawns and pursues the player relentlessly.

### Warning Phase

- 85 Dread: "Something stirs in the darkness. You feel watched." + visual flicker
- 90 Dread: "The Watcher has noticed you. LEAVE NOW." + heartbeat audio
- 100 Dread: The Watcher spawns

### Watcher Stats

- HP: 999 (effectively invincible)
- Damage: 50 per hit (guaranteed hit)
- Behavior: Pursues across rooms, prioritizes blocking extraction
- Pursues until extraction or death

### The Watcher's Gaze - Extraction Blocking

When The Watcher is active:
- ALL extraction points are sealed (including free extraction on Floors 1-2)
- The Watcher must be stunned to create an escape window
- This prevents "trigger 100 Dread on Floor 1, extract for free" farming

### Watcher Stun Mechanics

```
THE WATCHER STUN RULES
----------------------
Stun Threshold: 20+ damage in a single hit
Stun 1: Full duration (1 turn), Watcher recoils, extraction unsealed
Stun 2: Full duration (1 turn), Watcher becomes ENRAGED
Stun 3+: IMMUNE - "The Watcher learns your tricks. It will not be deterred again."
```

**Design Validation (v1.6):**
At 20 damage threshold, a starter Mercenary (8-11 base damage) has ~51% chance to stun with Heavy Attack:
- Heavy Attack: 16-22 damage (2x base)
- Need 20+ to stun: 3 out of 7 possible outcomes (43%)
- Plus 14% crit chance adds ~8% more
- Total: ~51% success rate per Heavy Attack

This ensures new players CAN escape with skilled play, but escape is not guaranteed.

### Watcher Combat Rules

| Mechanic | Rule |
|----------|------|
| Guaranteed Hit | Dodge does NOT avoid Watcher attacks |
| Block Works | Block reduces Watcher damage by 50% (25 damage instead of 50) |
| Armor Stacks | Player armor reduction applies normally |
| No Flee | Cannot flee from The Watcher (extraction blocking) |
| Smoke Bomb | Does NOT bypass Watcher extraction block (flee restrictions only) |

**Damage Calculation vs The Watcher:**
```
Normal: 50 damage (bypasses Dodge)
If Block: 50 * 0.5 = 25 damage
If Block + 20% Armor: 25 * 0.8 = 20 damage

Enraged: 75 damage
If Block: 75 * 0.5 = 37.5 -> 38 damage
```

### Watcher Enrage (after 2nd stun)

- +50% damage (now 75 per hit)
- +50% speed (acts first in turn order)
- Cannot be stunned for remainder of run

**Escape Window:** After stunning The Watcher, player has 2 turns to reach an extraction point before it recovers. This creates tactical gameplay rather than infinite stun-lock abuse.

### Watcher + Boss Interaction Rules

The Watcher and the Floor 5 boss have special interaction rules to prevent softlocks and undefined behavior:

| Rule | Specification |
|------|---------------|
| Spawn Deferral | The Watcher CANNOT spawn during boss encounters |
| Dread Tracking | Dread can reach 100 during boss fight, but spawn is deferred |
| Warning Display | At 100 Dread during boss: "The Watcher stirs beyond the threshold..." |
| Post-Boss Spawn | If Dread was 100+ during boss fight, Watcher spawns immediately after boss defeat |
| Death Override | If player dies to boss, standard death rules apply (no Watcher spawn) |

**Post-Boss Watcher Mechanics:**
- Extraction IS available after boss death (boss was the gatekeeper)
- Watcher blocks extraction until stunned
- Player must stun Watcher once to escape
- This is NOT redundant—Watcher adds final challenge after boss

**Thematic Framing:**
```
The Bone Colossus falls. Silence. Then—
The Watcher emerges from the shadows. Your mind called it here.
You must break its gaze to escape.
```

**Design Rationale:** The boss room is a sealed arena; thematically, the boss demands full attention. The Watcher's deferred spawn creates a potential "double gauntlet" for players who pushed too hard, rewarding skilled play while punishing greed.

**Design Philosophy:** We corrupt INFORMATION, never INPUT. The player can always act; they just can't trust what they see. The Watcher adds mechanical danger at maximum Dread without taking control away from the player.

---

## The Unreliable Narrator

At Shaken (70+) Dread, the game's text becomes untrustworthy:

**Normal (Calm):**
```
A Ghoul blocks the corridor ahead.
```

**Shaken:**
```
A Ghoul blocks the corridor... or is it two? The shadows play tricks.
```

**Terrified:**
```
Something blocks the corridor. Ghoul? Shadow? You can't tell anymore.
```

**Item Uncertainty:**
```
Calm:     Damage: 24
Shaken:   Damage: 20-28
Terrified: Damage: ???
```

---

## The Whispering

At high Dread, messages appear in combat logs:

```
[You attack the Ghoul for 15 damage]

    ...the walls remember your name...

[The Ghoul attacks you for 8 damage]
```

Some whispers contain useful hints. Most are noise. This creates paranoia—you might miss something important, or chase phantoms.

---

## Design Philosophy

**Never break input reliability.** The player must always be able to ACT. We only corrupt INFORMATION. When a player presses "attack," they attack—always. The unreliable narrator affects what they SEE, not what they DO.

The Dread system works because:
1. It's a unique CLI advantage (text can lie; graphics can't)
2. It creates emergent stories ("I thought there were 3, there were 5, I died")
3. It rewards careful play without punishing aggressive play
4. At maximum Dread, The Watcher provides mechanical danger without breaking agency

---

## Dread + Veteran Knowledge Interaction

When a player has Veteran Knowledge but is also experiencing Dread hallucinations, both systems coexist through layered display:

```
COMBAT: Ghoul
---------------------------------
HP: 22...no, 18...maybe 24? [Veteran: 18-22]
Damage: 8-12 [Veteran: confirmed]

Status: Your hands shake. You can't trust your eyes.
        But you've fought these before. You KNOW them.
```

**Display Rules:**
1. Corrupted perception shows FIRST (the hallucination)
2. Veteran Knowledge shows SECOND (in brackets, styled differently)
3. Player must mentally reconcile the two

**By Dread Level:**

| Dread Level | Display Without Knowledge | Display With Tier 3 Knowledge |
|-------------|--------------------------|-------------------------------|
| Calm (0-49) | HP: 20 | HP: 20 [exact] |
| Uneasy (50-69) | HP: 18-22 | HP: 19...20? [Veteran: 20] |
| Shaken (70-84) | HP: 15?...25? | HP: 15?...25? [Veteran: 20] |
| Terrified (85-99) | HP: ??? | HP: ??? [Veteran: 20, but can you trust yourself?] |

**Design Philosophy:** At Terrified level, even with knowledge, flavor text questions whether veteran knowledge is reliable. This preserves horror while rewarding investment. Experience fights against madness, but madness always has the final word at extreme levels.

---

## Related Systems

- [Extraction System](extraction-system.md) - Dread creates time pressure for extraction decisions
- [Character & Progression](character-progression.md) - Veteran Knowledge system
- [Dungeon Generation](dungeon-generation.md) - Dread as randomization accelerator
