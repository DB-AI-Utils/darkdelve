# DARKDELVE: Game Design Document

> A CLI-based dark fantasy roguelike where the dungeon corrupts your mind as much as your body.

---

## Table of Contents

1. [Vision](#vision)
2. [Core Design Pillars](#core-design-pillars)
3. [Gameplay Loop](#gameplay-loop)
4. [The Extraction System](#the-extraction-system)
5. [The Dread System](#the-dread-system)
6. [Combat](#combat)
7. [Character & Progression](#character--progression)
8. [Dungeon Structure](#dungeon-structure)
9. [Dungeon Generation](#dungeon-generation)
10. [Death & Discovery](#death--discovery)
11. [Narrative Design](#narrative-design)
12. [CLI Interface Design](#cli-interface-design)
13. [MVP Scope](#mvp-scope)
14. [Design Risks & Mitigations](#design-risks--mitigations)

---

## Vision

DARKDELVE is a CLI-based dark fantasy action RPG inspired by Diablo and modern roguelikes like Slay the Spire and Hades. It's designed for 5-30 minute sessions where every run is a tense negotiation between greed and survival.

**What makes it unique:** The text-based format isn't a limitation—it's the game's secret weapon. At high stress, the CLI becomes an **unreliable narrator**, lying about enemy counts, hiding item stats, and whispering things that may or may not be real. This is something only a text game can do.

### Target Experience

Players should feel:
- **Constant tension** from the extraction dilemma ("one more floor?")
- **Genuine risk** in every choice (chests, strangers, combat)
- **Progress even in failure** through the death-as-discovery system
- **Mastery over time** as they learn enemy patterns and dungeon secrets

### Design Constraints

| Constraint | Rationale |
|------------|-----------|
| CLI-first | Text allows unreliable narration; potential for future graphical expansion |
| 5-30 min sessions | Respects player time; supports "one more run" addiction |
| Simple character building | Depth from decisions, not spreadsheets |
| Hybrid progression | Character grows stronger AND player skill improves |

---

## Core Design Pillars

### 1. The Extraction Dilemma
The central question every run: **"Do I push deeper, or take what I have and leave?"**

Every floor deeper means better loot but harder escape. The dungeon wants you to stay. You want to leave rich. This tension drives everything.

### 2. The Dread System
Your mind degrades alongside your body. High Dread makes the game itself untrustworthy—enemy counts blur, item stats become uncertain, whispers appear in the margins.

**Critical rule:** Information becomes unreliable, but player INPUT never breaks. You can always act; you just can't always trust what you see.

### 3. Death as Discovery
Death is not punishment—it's reconnaissance. Every death unlocks information: enemy weaknesses, lore fragments, warnings for future runs. The framing is "Lessons Learned," not "Failures."

### 4. Meaningful Risk
Every interaction is a decision with consequences. Chests might be trapped or contain treasures. Strangers might help or rob you. Combat can be avoided—but so can rewards.

---

## Gameplay Loop

```
                    ┌─────────────────────────────────────┐
                    │             CAMP                    │
                    │  - Manage inventory                 │
                    │  - Review bestiary                  │
                    │  - Check bounty board               │
                    │  - Talk to NPCs                     │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         SELECT DUNGEON              │
                    │  (Level-gated by character power)   │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
         ┌────────────────────────────────────────────────────────┐
         │                    DUNGEON RUN                         │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │ FLOOR LOOP:                                      │  │
         │  │  1. Enter room                                   │  │
         │  │  2. Face encounter (combat/event/treasure)       │  │
         │  │  3. Collect rewards, manage resources            │  │
         │  │  4. Choose: next room, descend, or extract?      │  │
         │  └──────────────────────────────────────────────────┘  │
         └────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
         ┌───────────────────┐       ┌───────────────────┐
         │    EXTRACTION     │       │      DEATH        │
         │  - Keep all loot  │       │  - Lose unIDed    │
         │  - Complete quests│       │  - Gain bestiary  │
         │  - See what you   │       │  - Leave echo     │
         │    missed         │       │  - Unlock content │
         └─────────┬─────────┘       └─────────┬─────────┘
                   └───────────────────────────┘
                                  │
                                  ▼
                           Return to CAMP
```

### Session Length Targets

| Run Type | Floors | Rooms | Time | Risk Level |
|----------|--------|-------|------|------------|
| Quick raid | 1-2 | 8 | 5-10 min | Low |
| Standard run | 3-4 | 17 | 12-18 min | Medium |
| Deep dive | 5 | 24 | 20-30 min | High |

Players control session length by choosing when to extract. Combat must average 1.5-2 minutes to hit these targets.

---

## The Extraction System

The extraction mechanic is the game's primary hook—a constant push-your-luck decision.

### Extraction Rules by Floor

| Floor | Extraction Method | Cost |
|-------|-------------------|------|
| 1-2 | Free extraction at any stairwell | None |
| 3 | Must find Waystone | 10% of carried gold (minimum 15 gold) |
| 4 | Must find Waystone | 25% gold (minimum 25 gold) OR 1 item |
| 5 | Boss guards the exit | Defeat boss |

**Extraction Cost Rules:**
- Minimum costs prevent "zero-gold" exploit (spending all gold before extraction)
- If player has insufficient gold on Floor 3-4, they may sacrifice 1 item instead
- Item sacrifice creates meaningful choice: "Is this item worth the extraction cost?"
- Thematic justification: "The Waystone demands payment"

### Floor Depth Effects

The deeper you go, the more the dungeon corrupts what you find:

| Floor | Curse Chance | Additional Effect |
|-------|--------------|-------------------|
| 1 | 5% | None |
| 2 | 10% | Elites can spawn (10% base chance) |
| 3 | 15% | Waystone extraction cost begins |
| 4 | 20% | 10% mimic chance, NPC prices +25% |
| 5 | 25% | No merchant (boss floor) |

**Cursed item design:** +30% primary stat, negative secondary effect (makes curses interesting choices, not just bad luck).

Note: Time pressure comes from Dread accumulation (+1 Dread per 5 turns), not a separate Corruption system.

### The Taunt

After successful extraction, reveal what was in the NEXT room:

```
You step onto the Waystone. The extraction ritual begins.

Through the shimmering portal, you glimpse the chamber beyond:

    An ornate chest sits unopened, glowing with purple light.
    [EPIC RARITY DETECTED]

The portal seals. You'll never know what was inside.
```

This creates regret and drives "one more run" behavior. Design note: Never show Legendary items here—that would feel punishing rather than intriguing.

---

## The Dread System

Dread is DARKDELVE's signature mechanic—a second resource representing mental strain.

### Dread Display

```
HP:    ████████████░░░░░░░░ 60/100
DREAD: ████████░░░░░░░░░░░░ 40/100
```

### Starting Dread

Characters begin each run at **0 Dread**. The camp's "minimum 10" Dread after resting represents that adventurers who have experienced the dungeon can never fully forget its horrors, but first-time delvers are blissfully ignorant.

### Dread Sources

*Values reduced by 30% from initial estimates to target 40-60 Dread at healthy extraction.*

| Source | Dread Gain |
|--------|------------|
| Killing basic enemy | +1 |
| Killing elite enemy | +3 |
| Killing eldritch enemy | +5 |
| Turn in darkness (no torch) | +1-2 (escalating) |
| Every 5 turns elapsed | +1 |
| Reading forbidden text | +8 |
| Horror encounter | +5-10 |
| Descending a floor | +5 |

### Dread Recovery

*Camp no longer fully resets Dread - some persistence creates strategic decisions.*

| Method | Dread Loss | Notes |
|--------|------------|-------|
| Rest at camp | -25 (min 10) | Cannot reduce below 10 |
| Consume ration | -8 | |
| Lit torch (passive) | -1 per 10 turns | |
| Shrine blessing | -15 | With tradeoff |
| Clarity potion | -10 | New consumable |

### Dread Thresholds

*Progressive hallucination rates scale with Dread level.*

| Level | Range | Hallucination Rate | Effects |
|-------|-------|-------------------|---------|
| Calm | 0-49 | 0% | Full accuracy |
| Uneasy | 50-69 | 5% | Enemy count blur, damage variance |
| Shaken | 70-84 | 15% | Above + fake sound cues, inventory flicker |
| Terrified | 85-99 | 25% | Above + stat corruption, false item names, Watcher warnings |
| Breaking | 100 | 25% + Watcher | Complete unreliability, **The Watcher spawns** |

### The Watcher (100 Dread)

At maximum Dread, the abyss notices you. A unique elite enemy called **The Watcher** spawns and pursues the player relentlessly.

**Warning Phase:**
- 85 Dread: "Something stirs in the darkness. You feel watched." + visual flicker
- 90 Dread: "The Watcher has noticed you. LEAVE NOW." + heartbeat audio
- 100 Dread: The Watcher spawns

**Watcher Stats:**
- HP: 999 (effectively invincible)
- Damage: 50 per hit (guaranteed hit)
- Behavior: Pursues across rooms, prioritizes blocking extraction
- Pursues until extraction or death

**The Watcher's Gaze - Extraction Blocking:**
When The Watcher is active:
- ALL extraction points are sealed (including free extraction on Floors 1-2)
- The Watcher must be stunned to create an escape window
- This prevents "trigger 100 Dread on Floor 1, extract for free" farming

**Watcher Stun Mechanics:**
```
THE WATCHER STUN RULES
----------------------
Stun Threshold: 30+ damage in a single hit
Stun 1: Full duration (1 turn), Watcher recoils, extraction unsealed
Stun 2: Full duration (1 turn), Watcher becomes ENRAGED
Stun 3+: IMMUNE - "The Watcher learns your tricks. It will not be deterred again."
```

**Watcher Enrage (after 2nd stun):**
- +50% damage (now 75 per hit)
- +50% speed (acts first in turn order)
- Cannot be stunned for remainder of run

**Escape Window:** After stunning The Watcher, player has 2 turns to reach an extraction point before it recovers. This creates tactical gameplay rather than infinite stun-lock abuse.

**Design Philosophy:** We corrupt INFORMATION, never INPUT. The player can always act; they just can't trust what they see. The Watcher adds mechanical danger at maximum Dread without taking control away from the player.

### The Unreliable Narrator

At Shaken (70+) Dread, the game's text becomes untrustworthy:

**Normal (Calm):**
```
You see 3 Ghouls blocking the corridor.
```

**Shaken:**
```
You see 3... no, 4 Ghouls? The shadows play tricks.
```

**Terrified:**
```
You see 3(?) Ghouls. Or perhaps one is just a shadow.
You can't tell anymore.
```

**Item Uncertainty:**
```
Calm:     Damage: 24
Shaken:   Damage: 20-28
Terrified: Damage: ???
```

### The Whispering

At high Dread, messages appear in combat logs:

```
[You attack the Ghoul for 15 damage]

    ...the walls remember your name...

[The Ghoul attacks you for 8 damage]
```

Some whispers contain useful hints. Most are noise. This creates paranoia—you might miss something important, or chase phantoms.

### Design Philosophy

**Never break input reliability.** The player must always be able to ACT. We only corrupt INFORMATION. When a player presses "attack," they attack—always. The unreliable narrator affects what they SEE, not what they DO.

The Dread system works because:
1. It's a unique CLI advantage (text can lie; graphics can't)
2. It creates emergent stories ("I thought there were 3, there were 5, I died")
3. It rewards careful play without punishing aggressive play
4. At maximum Dread, The Watcher provides mechanical danger without breaking agency

---

## Combat

Turn-based combat with stamina management. Fast, tactical, and always risky.

### Combat Interface

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

### Stamina System

- **Maximum:** 4 points
- **Regeneration:** +2 per turn
- **Design goal:** Prevent button mashing, force tactical choices

### Action Types

| Action | Cost | Effect |
|--------|------|--------|
| Light Attack | 1 Stam | Base weapon damage |
| Heavy Attack | 3 Stam | 2x damage, 50% stagger chance, 25% armor penetration |
| Dodge | 1 Stam | Avoid ONE incoming attack, +1 Stam next turn |
| Block | 1 Stam | Reduce ALL incoming damage this turn by 50% (does not prevent status effects) |
| Item | 0 Stam | Use consumable, ends turn |
| Flee | 0 Stam | Success chance varies by enemy |

**Heavy Attack vs Light Attack Trade-off:**
- Light Attack spam: 4 Stam = 4 attacks = 4x base damage over 2 turns
- Heavy Attack: 3 Stam = 1 attack = 2x base damage + 50% stagger + armor pen
- Heavy wins when: Enemy has armor, or stagger breaks enemy combo
- Light wins when: Need consistent damage, enemy has no armor

**Block vs Dodge Trade-off:**
- Dodge (1 Stam): Avoids one attack completely, prevents status effects
- Block (1 Stam): Halves ALL attacks this turn, does NOT prevent status effects
- Dodge wins when: Single strong attack, enemy applies status effects
- Block wins when: Multi-hit enemies (2+ attacks per turn), no status risk

**Stagger Effect:** Staggered enemies skip their next attack (1 turn). Bosses have stagger resistance (requires 2 staggers in 3 turns to trigger).

### Status Effects

| Status | Effect | Duration |
|--------|--------|----------|
| Poisoned | -3 HP/turn | 3 turns |
| Bleeding | -2 HP/turn per stack | Until healed |
| Stunned | Skip next turn | 1 turn |
| Weakened | -25% damage dealt | 3 turns |
| Cursed | Cannot heal | Until cured |

Status effects can cascade dangerously. Poisoned + Bleeding can kill faster than direct damage.

**Status Effect Stacking Rules:**

| Status | Stacking Behavior | Cap | Notes |
|--------|-------------------|-----|-------|
| Poisoned | Duration extends, damage flat | 6 turns max | New poison adds +3 turns (capped at 6), always 3 damage/turn |
| Bleeding | Stacks increase damage | 5 stacks max | 2/4/6/8/10 damage per turn at 1/2/3/4/5 stacks |
| Stunned | Does not stack | N/A | Subsequent stuns refresh to 1 turn |
| Weakened | Duration extends | 6 turns max | New application adds +3 turns |
| Cursed | Does not stack | N/A | Already cursed = no effect |

**Counterplay:**
- Poison: Antidote (consumable) clears all stacks
- Bleeding: Bandage (consumable) clears all stacks, or rest at camp
- Cursed: Purification Shrine or Purging Stone (rare consumable)

### Combat Pacing

- **Target fight length:** 1.5-2 minutes (4-8 turns)
- **Average turns to kill basic enemy:** 3-4
- **Boss fights:** 8-12 turns

**Critical for Session Length:** Combat must average 1.5-2 minutes to hit 20-30 minute full dungeon target. If fights consistently exceed 2.5 minutes, session length bloats beyond target.

### Combat Balance Formulas

**Damage Calculation:**

```
Final Damage = (Weapon Base + MIGHT Bonus) x Skill Multiplier x (1 + Bonus%) x Crit Multiplier

Where:
- Weapon Base: The weapon's base damage range (e.g., 5-8 for starter weapon)
- MIGHT Bonus: MIGHT stat x 1 (so 3 MIGHT = +3 damage)
- Skill Multiplier: 1.0 for Light Attack, 2.0 for Heavy Attack
- Bonus%: Sum of all additive damage bonuses (item effects, buffs)
- Crit Multiplier: 2.0 on critical hit, 1.0 otherwise
```

**Example Calculation (Starter Mercenary vs Plague Rat):**
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

**Survivability Formula:**
```
Turns Survivable = Player HP / Average Enemy Damage

Target: 4-6 turns survivable against basic enemies without healing
- 50 HP / 8 damage (Ghoul avg) = 6.25 turns (within target)
- 50 HP / 6.5 damage (Plague Rat avg) = 7.7 turns (comfortable)
```

**Critical Hit System:**
```
Crit Chance = Base 5% + (CUNNING x 3%)
Crit Damage = 2x base damage (applied after all additive bonuses)

At 3 CUNNING: 5% + 9% = 14% crit chance
At 10 CUNNING: 5% + 30% = 35% crit chance (soft cap via diminishing CUNNING gains)
```

### Flee Mechanics

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

**Room State Rules (Flee Consequences):**

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

## Character & Progression

### The Three-Stat System

Only three stats matter. This is intentional—we want decisions in the dungeon, not in menus.

| Stat | Primary Effect | Secondary Effect |
|------|----------------|------------------|
| **VIGOR** | Max HP (+5 per point) | Poison/Bleed resistance |
| **MIGHT** | Physical damage (+1 per point) | Carry capacity |
| **CUNNING** | Crit chance (+3% per point) | Trap detection, special dialogue |

### No Skill Trees

Your "build" is determined by what you FIND, not what you CHOOSE in a menu. This keeps decisions in the moment and prevents analysis paralysis.

### Inventory System

**Carried Inventory (during run):** 8 slots for unequipped items
**Equipped Slots:** 4 (weapon, armor, helm, accessory) - do not count against carry capacity
**Consumable Slots:** 3 (separate from inventory, dedicated for potions/items)
**Gold:** Does not take inventory slots - tracked as currency

```
INVENTORY (5/8 slots)
+-- Cursed Dagger [UNIDENTIFIED]
+-- Iron Helm [+5 HP]
+-- Tattered Cloak [UNIDENTIFIED]
+-- Gold Ring [+1 CUNNING]
+-- Torch x3

CONSUMABLES (2/3)
+-- Healing Potion x2
+-- Antidote
```

**Inventory Rules:**
- Cannot pick up items when inventory is full - must drop or equip something first
- Equipping an item frees an inventory slot
- Equipped items do not consume inventory space

### Gear System

**Slots:** Weapon, Armor, Helm, Accessory (4 total)

**Rarity Tiers:**

| Rarity | Visual | Stats | Effects | Drop Rate |
|--------|--------|-------|---------|-----------|
| Common | `+---+` | 1 basic | None | 60% |
| Uncommon | `│   │` | 1 stat | 1 minor bonus | 25% |
| Rare | `╒═══╕` | 2 stats | 1 notable effect | 12% |
| Epic | `╔═══╗` | 2-3 stats | 1 powerful effect | 2.5% |
| Legendary | `▓▓▓▓▓` | Named | Unique ability | 0.5% |

**Boss Legendary rate:** 3%

**Loot Rarity by Floor:**

Base drop rates shift based on floor depth. Dread provides an additional quality bonus.

| Floor | Common | Uncommon | Rare | Epic | Legendary |
|-------|--------|----------|------|------|-----------|
| 1 | 70% | 22% | 7% | 1% | 0% |
| 2 | 65% | 25% | 8% | 1.5% | 0.5% |
| 3 | 55% | 28% | 13% | 3% | 1% |
| 4 | 45% | 30% | 18% | 5.5% | 1.5% |
| 5 | 35% | 30% | 22% | 10% | 3% |

**Dread Quality Bonus Formula:**
```
Upgrade Chance = Floor Bonus + (Current Dread% x 0.5)

Example: Floor 3 at 60 Dread
- Floor Bonus: 13% (from table, Rare+ chance)
- Dread Bonus: 60 x 0.5 = 30%
- Total upgrade chance: 43%

When upgrade triggers: Roll shifts one tier up (Common -> Uncommon, etc.)
```

This means "+50% loot quality at max Dread" translates to a 50% chance for any drop to upgrade one rarity tier.

### Item Identification

- Items drop UNIDENTIFIED
- Identification costs 25 gold at camp OR rare scrolls in dungeon
- Creates tension: spend resources to understand loot, or gamble on unknown gear?

**What Identification Does:**
- Reveals true stats and effects
- Enables selling at full value (unidentified = 50% value)
- Required to equip items with active abilities
- Protects EQUIPPED items from death loss (see Death Economy)

**What Identification Does NOT Do:**
- Protect CARRIED (unequipped) items from death loss
- Transfer items directly to stash
- Make items "safe" if they were BROUGHT from stash

**Key Rule:** Identification only protects items you are WEARING. If you identify an item but keep it in your carried inventory (not equipped), it is still lost on death. This prevents "pay 25g for permanent item safety" exploits.

### Level System

- **Level cap:** 20
- **XP per level:** Scales linearly (100 x level)
- **Per level gain:** +5 Max HP, +1 to chosen stat

**Floor-Based XP Multipliers:**

To reward deep runs over grinding early floors, enemy XP scales with floor depth:

| Floor | XP Multiplier | Rationale |
|-------|---------------|-----------|
| 1 | 1.0x | Base XP rate |
| 2 | 1.5x | Slight reward for progression |
| 3 | 2.0x | Waystone cost offset |
| 4 | 3.0x | Deep runs become efficient |
| 5 | 4.0x | Maximum risk = maximum reward |

**Example:** A Ghoul worth 10 base XP gives 10 XP on Floor 1, but 40 XP on Floor 5.

**Level-Gated XP Reduction (Anti-Grinding):**

To prevent safe XP grinding on early floors with free extraction:

| Player Level | XP Penalty |
|--------------|------------|
| Levels 1-5 | Full XP from all floors |
| Levels 6-10 | Floor 1 gives 50% XP |
| Levels 11-15 | Floors 1-2 give 50% XP |
| Levels 16-20 | Floors 1-3 give 50% XP |

This ensures higher-level characters must engage with deeper, riskier content to progress efficiently. Safe grinding on early floors becomes time-inefficient rather than impossible, preserving player agency while discouraging degenerate play patterns.

This prevents the XP grind wall at high levels by making deep runs the most efficient leveling method, aligning with the extraction dilemma (deeper = better rewards).

Levels provide modest power but mainly serve as gating for dungeon access.

### Meta-Progression

Meta-progression provides both **power growth** (leveling) and **variety expansion** (unlocks):

**Gradual Item Pool Expansion:**
- First 5 runs: 30-item pool (simple, learnable)
- After 5 runs: +10 items unlock
- Each boss killed: +2-3 specific items
- Full pool: ~100 items

**Class Unlocks:**

*Mixed unlock methods - survival AND death. Both fit the "death as discovery" philosophy.*

| Class | Unlock Condition | Playstyle |
|-------|------------------|-----------|
| Mercenary | Default | Balanced, standard stats |
| Flagellant | Extract while at 85+ Dread | High risk/reward, damage bonuses at low HP |
| Hollowed One | Die at 100 Dread on Floor 3+ | Can use cursed items safely, Dread manipulation |

**Class Unlock Clarifications:**
- **Flagellant:** Uses state tracking - Dread must be 85+ at the moment of extraction, not just at any point during the run. This prevents "spike to 85, reduce with potions, extract safely" cheese strategies.
- **Hollowed One:** Must die on Floor 3 or deeper to prevent trivial Floor 1 farming. The Floor requirement ensures meaningful investment before unlock.

**Narrative frames:**
- Flagellant: "You walked the edge and returned. You Awakened."
- Hollowed One: "The abyss claimed you, but you came back... changed."

**Mutators (Difficulty Modifiers):**
- Unlocked by specific achievements
- Add challenge for veterans seeking variety
- Examples: "The Whispering Dark" (darker but better loot), "Iron Will" (no saves)

### The Stash System

A permanent storage for items between runs, with risk/reward mechanics for bringing gear into dungeons.

```
+-------------------------------------------------------------+
|  STASH (12 slots) - Items here are SAFE                     |
|                                                             |
|  Before Run: Select up to 2 items to BRING                  |
|  -> Items brought are AT RISK                               |
|                                                             |
|  If you DIE:    Brought items LOST FOREVER                  |
|  If you EXTRACT: Keep brought items + deposit found items   |
+-------------------------------------------------------------+
```

**Stash Rules:**

| Rule | Value | Rationale |
|------|-------|-----------|
| Capacity | 12 slots | Forces curation, prevents hoarding |
| Bring limit | 2 items per run | Caps power spike, forces choices |
| Stash overflow | Must sell or discard before next run | Cannot exceed capacity |

**The Core Tension:**

This creates "gear fear" — a meaningful pre-run decision:
- Bring best gear → powerful run, but risk permanent loss
- Bring nothing → weaker run, but no risk
- Bring medium gear → balanced risk/reward

**Red Flag to Watch:** If players NEVER bring items, loss is too painful — needs tuning.

### Veteran Knowledge System

Permanent **information** unlocks from experience. You get smarter, not stronger.

This extends the "death as discovery" philosophy — deaths literally teach you things that persist forever.

**Three-Tiered Enemy Knowledge:**

| Tier | Unlock Condition | Information Unlocked |
|------|------------------|---------------------|
| 1 | 8 encounters OR 1 death | Name, HP range, damage range |
| 2 | 20 encounters OR 2 deaths | Attack patterns, resistances, weaknesses |
| 3 | 35 encounters OR 3 deaths | Exact stats, optimal strategies, lore entry |

**Death-Linked Acceleration:** Deaths to an enemy type accelerate knowledge unlocks, making death feel productive. A player who dies once to Ghouls immediately learns their basic stats, while a cautious player needs 8 encounters.

**Boss Knowledge:**

| Knowledge | Unlock Condition | What You Learn |
|-----------|------------------|----------------|
| Telegraph | 1 death OR 3 encounters | Attack pattern hints shown in combat |
| Weakness | 2 deaths OR use correct element once | Bonus damage type revealed |

**Dungeon Knowledge:**

| Knowledge | Unlock Condition | What You Learn |
|-----------|------------------|----------------|
| Trap Locations | 3 visits | Traps shown on minimap |
| Elite Spawns | 7 visits | Elite spawn areas revealed |

**Why This Works:**

- Maintains sidegrade principle (no power increase)
- Makes death feel productive (you learned something)
- Helps struggling players through knowledge, not crutches
- Skilled players face same mechanical challenge
- Thematically fits ("veteran delver" fantasy)

**Design Note:** Veteran Knowledge is information advantage, NOT stat advantage. A player with full knowledge still faces the same enemy HP, damage, and mechanics.

### Veteran Knowledge + Dread Interaction

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

## Dungeon Structure

### Floor Architecture

Each dungeon has 5 floors with escalating risk and reward:

| Floor | Rooms | Duration | Difficulty | Key Feature |
|-------|-------|----------|------------|-------------|
| 1 | 4 | ~4 min | Easy | Tutorial floor, free extract |
| 2 | 4 | ~5 min | Medium | Elites introduced (10% spawn) |
| 3 | 5 | ~6 min | Hard | Waystone extraction costs begin |
| 4 | 5 | ~7 min | Very Hard | Mimic chance (10%), epic loot |
| 5 | 6 | ~8 min | Extreme | Boss, Legendary chance |

**Total: 24 rooms for full clear = 20-30 minutes**

**Mechanic Introduction Principle:** Each floor introduces ONE major new mechanic. Never stack multiple new challenges simultaneously.

### Pre-Boss Warning UX

**Design Principle:** Use diegetic (in-world) warnings rather than UI pop-ups. The Dark Souls fog gate pattern - a visual barrier that forces acknowledgment without breaking immersion.

**Two-Stage Boss Approach:**

1. **Threshold Chamber** (Room before boss): Distinct room that signals finality
2. **Point of No Return**: Explicit confirmation required before boss entry

**Threshold Chamber Display:**

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

**Readiness Indicator Thresholds:**

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

**Floor 5 Extraction Rules:**
- NO Waystone extraction available on Floor 5 (boss guards the only exit)
- The Threshold Chamber is the LAST extraction opportunity
- This must be communicated clearly before the player commits

### Floor Layout

Room breakdown by floor (designed for 1-1.5 min/room average):

| Floor | Combat | Treasure | Event | Rest/Special | Total |
|-------|--------|----------|-------|--------------|-------|
| 1 | 2 | 1 | 1 | 0 | 4 |
| 2 | 2 | 1 | 1 | 0 | 4 |
| 3 | 2-3 | 1 | 1 | 0-1 | 5 |
| 4 | 2-3 | 1 | 1 | 0-1 | 5 |
| 5 | 3 | 1 | 1 | 1 (+ boss) | 6 |

**Room Time Budget:**
- Combat rooms: 1.5-2 minutes (4-8 turns)
- Event rooms: 30-60 seconds
- Treasure rooms: 30-60 seconds
- Rest sites: 15-30 seconds

### Room Types

**Combat Room:**
```
You enter a collapsed crypt. Bones crunch underfoot.

Three Ghouls rise from the rubble, hunger in their hollow eyes.

[F]ight  [R]etreat (costs 5 turns)
```

**Treasure Room:**
```
An ornate chest sits atop a pressure plate.

[1] Pick lock carefully  (Lockpick, safe, common loot)
[2] Force it open        (30% trap, 70% better loot)
[3] Smash it             (Guaranteed loot, alerts enemies)
[4] Examine first        (Requires CUNNING 8+)
[5] Leave it
```

**Event Room:**
```
A hooded figure blocks the passage.

"Spare some gold, traveler? Just 50 pieces.
 I know secrets of what lies below..."

[1] Give 50 gold
[2] Refuse and pass
[3] Threaten them
[4] Give 100 gold
```

**Rest Site:**
```
A small alcove, sheltered from the darkness.
You could rest here—but something might find you.

[1] Rest fully       (+50% HP, 20% ambush chance)
[2] Rest briefly     (+25% HP, 5% ambush chance)
[3] Don't rest
```

**Shrine:**
```
A blood-stained altar to a forgotten god.
Dark power hums in the air.

[1] Pray for strength  (+3 MIGHT until extraction, +15 Dread)
[2] Pray for fortune   (Next 3 chests upgrade rarity, +10 Dread)
[3] Pray for insight   (Reveal floor map, +5 Dread)
[4] Desecrate shrine   (50 gold, chance of curse)
[5] Leave
```

**Shrine Blessing Rules:**
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

### ASCII Map

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

### Room Preview UX

**Design Principle:** Show room TYPE before entry, but not specifics. Players should plan generally but face specific uncertainty (aligned with Hades/Slay the Spire transparent choice architecture).

**Room Preview Display:**

```
Available Paths:
  [1] North  -> [TREASURE] - You see a faint glint of metal
  [2] East   -> [COMBAT]   - Something stirs in the darkness
  [3] South  -> [?????]    - Complete silence (high Dread hides info)
```

**Preview Information by Dread Level:**

| Dread Level | Information Shown |
|-------------|-------------------|
| Calm (0-49) | Room type + flavor hint |
| Uneasy (50-69) | Room type, hints may be inaccurate (5%) |
| Shaken (70-84) | Room type hidden 30% of time, hints unreliable |
| Terrified (85+) | All rooms show as [?????] |

**CUNNING Scouting Mechanic:**

High CUNNING reveals additional information about adjacent rooms:

| CUNNING | Scouting Benefit |
|---------|------------------|
| 5+ | See room types through one additional wall |
| 8+ | Combat rooms show enemy count (not type) |
| 12+ | Treasure rooms hint at rarity tier |

**Pacing Guarantee:**

After every 2 consecutive combat rooms, at least 1 non-combat option (treasure, event, or rest) must be available. This prevents exhaustion spirals and respects the extraction tension by giving players breathing room to make extraction decisions.

**Implementation Notes:**
- Room types determined at floor generation, not on entry
- Preview flavor text pulled from themed pool per dungeon
- Dread corruption applied at display time, not generation time

---

## Dungeon Generation

Dungeons use a **hybrid approach**: fixed skeleton, random flesh. Structure provides mastery, variation provides tension.

### The Core Principle

Players should be able to **plan generally** but face **specific uncertainty**:

| Approach | Player Experience | Problem |
|----------|------------------|---------|
| Fully handcrafted | "I know exactly what's behind that door" | Extraction becomes solved, grinding is autopilot |
| Fully procedural | "No idea what's next, might as well gamble" | Session length unpredictable, narrative impossible |
| **Hybrid** | "I know there's a shrine somewhere, but is the next room 3 archers or 1 brute?" | Real dilemma |

### What's Fixed (Dungeon Identity)

| Element | Why Fixed |
|---------|-----------|
| Dungeon theme/name | "The Ossuary" must always feel like The Ossuary |
| Number of floors | 5 — players know the journey length |
| Boss identity + mechanics | The dungeon's signature challenge |
| Key story beats | Floor 1 intro, Floor 3 midpoint, Floor 5 climax |
| Monster roster | Which enemy TYPES can appear (thematic coherence) |
| Room type distribution | Floor 1 easier than Floor 4 (guaranteed progression) |

### What's Randomized (Per-Run Variance)

| Element | How It Varies |
|---------|---------------|
| Room order within floors | Rooms shuffle, connections change |
| Enemy composition | Different combinations from the dungeon's roster |
| Loot contents | Pulls from dungeon loot pool, rarity weighted by floor |
| Events/encounters | Selected from thematic pool per dungeon |
| Shrine types | Random selection from available shrines |
| Minor flavor text | Cosmetic variety in descriptions |

### Dread as Randomization Accelerator

Higher Dread increases unpredictability — the longer you stay, the wilder things get:

| Dread Level | Effect on Dungeon |
|-------------|-------------------|
| 0-25% | Standard variance, predictable runs |
| 26-50% | Elite spawn chance increases (+10%), dangerous events more likely |
| 51-75% | New enemy variants appear, treasure quality increases |
| 76-100% | "Twisted" room variants possible, maximum chaos + maximum reward |

**Concrete Numbers:**
- Elite spawn chance: `5% base + (Dread% × 0.2)` = 5% at 0 Dread, 25% at 100 Dread
- Dangerous event weight: `1.0 base + (Dread% × 0.02)` = 1x at 0 Dread, 3x at 100 Dread
- Loot quality bonus: `+0% base + (Dread% × 0.5)` = +50% at max Dread

This creates the extraction dilemma organically: *"Stay longer for better loot, but the dungeon becomes less predictable."*

### Variety Math

To avoid "seed exhaustion" (players seeing all variants quickly):

```
4 room templates × 3 floor layouts × 5 enemy compositions
= 60 combinations minimum per floor
= hundreds of thousands of possible dungeon runs
```

### Implementation Phases

**Phase 1: Minimal Viable Hybrid (MVP)**
- Fixed 5-floor structure with boss on floor 5
- Randomized room ORDER within floors (3-5 rooms per floor)
- Enemy composition from fixed roster, scaled by floor
- Single event pool
- Basic loot tables per dungeon

**Phase 2: Rich Variance**
- Multiple room templates per type
- Enemy modifiers and elite variants
- Dread-influenced spawning
- Curated event pools with theming

**Phase 3: Narrative Integration**
- Fixed first-run story events
- Story-aware event restrictions
- Boss variant mechanics

### Generation Red Flags

| Risk | Mitigation |
|------|------------|
| Randomization theater | If changes don't affect decisions, they're not adding value |
| Seed exhaustion | Need enough combinations that players don't see repeats by run 15 |
| Narrative whiplash | Random events must respect fixed story state |
| First-run quality gap | Random events need equal design care as fixed story beats |

---

## Death & Discovery

### Death Economy

Death in DARKDELVE follows a clear priority system to resolve what happens to items:

**Death Item Resolution Priority (highest to lowest):**

```
DEATH ITEM RESOLUTION
---------------------
1. BROUGHT from stash -> ALWAYS LOST (overrides everything)
   "You risked it, you lost it."

2. EQUIPPED + IDENTIFIED -> SAFE (returns to stash)
   "You understood it, you keep it."

3. EQUIPPED but UNIDENTIFIED -> LOST
   "You never truly knew what you held."

4. CARRIED (not equipped) -> LOST (regardless of ID status)
   "Only what you wore survives the journey back."

5. GOLD -> LOST (all carried gold)
   "The dungeon claims its toll."
```

### Item Risk State Indicators

**Design Principle:** Communicate item risk status BEFORE runs begin and consistently throughout gameplay. Loss must feel FAIR - rules must be clear and consistent.

**Risk State Tags:**

| Tag | Meaning | Visual | When Applied |
|-----|---------|--------|--------------|
| [SAFE] | In stash, will not be lost | Green | Items sitting in stash |
| [AT RISK] | Brought from stash, lost on death | Red | Stash items selected for run |
| [PROTECTED] | Equipped + identified, survives death | Blue | Found items that meet safety criteria |
| [VULNERABLE] | Equipped but unidentified, lost on death | Yellow | Found items not yet identified |
| [DOOMED] | Carried (not equipped), lost on death | Gray | Inventory items regardless of ID status |

**Pre-Run Equipment Check Display:**

```
═══════════════════════════════════════════════════════════════
                    EQUIPMENT CHECK
═══════════════════════════════════════════════════════════════

BRINGING FROM STASH:
  [!] Soulreaver's Edge        [AT RISK] - Lost if you die
  [!] Ring of Fortune          [AT RISK] - Lost if you die

CURRENTLY EQUIPPED:
  [~] Tattered Leathers        [PROTECTED] - Identified, survives death
  [?] Iron Helm                [VULNERABLE] - Unidentified, lost on death

WARNING: Items brought from stash are PERMANENTLY LOST on death.
         This cannot be reversed. Proceed with caution.

───────────────────────────────────────────────────────────────
[1] Begin expedition
[2] Return items to stash
[3] Review stash
```

**In-Dungeon Item Display:**

When viewing inventory during a run, each item shows its risk state:

```
INVENTORY (5/8 slots)
  [DOOMED] Cursed Dagger [UNIDENTIFIED]
  [DOOMED] Gold Ring [+1 CUNNING]
  [DOOMED] Torch x3

EQUIPPED:
  [AT RISK] Soulreaver's Edge [24-31 dmg] - Brought from stash
  [PROTECTED] Tattered Leathers [+5 HP] - Identified
  [VULNERABLE] Iron Helm [UNIDENTIFIED]
```

**Death Screen Item Summary:**

```
═══════════════════════════════════════════════════════════════
                    YOU HAVE FALLEN
═══════════════════════════════════════════════════════════════

ITEMS LOST:
  [X] Soulreaver's Edge        - Brought from stash (AT RISK)
  [X] Iron Helm                - Unidentified (VULNERABLE)
  [X] Cursed Dagger            - Not equipped (DOOMED)
  [X] Gold Ring                - Not equipped (DOOMED)
  [X] 147 gold

ITEMS PRESERVED:
  [+] Tattered Leathers        - Equipped + Identified (PROTECTED)

───────────────────────────────────────────────────────────────
LESSON LEARNED: +10% damage vs Bone Knight (next run only)
```

**Anti-Gear-Fear Monitoring:**

Track the percentage of runs where players bring stash items:
- **Healthy:** 40-60% of runs include at least 1 stash item
- **Gear Fear:** <30% of runs include stash items (loss too painful)
- **No Tension:** >80% of runs include stash items (loss not meaningful)

If gear fear is detected (<30%), consider adding:
- Partial recovery system (50% chance to recover 1 lost item)
- "Insurance" consumable that protects 1 brought item
- Reduced stash item power to lower stakes

**Example Scenarios:**

| Scenario | Outcome |
|----------|---------|
| Find Epic armor, equip, die | Lost (unidentified) |
| Find Epic armor, equip, identify, die | Safe (returns to stash) |
| Bring Epic armor from stash, equip, identify, die | Lost (brought overrides all) |
| Find Legendary, equip, identify, extract | Safe (now in stash) |
| Bring Legendary from stash, die | Lost forever |
| Carry identified item (not equipped), die | Lost (not equipped) |

**What you ALWAYS KEEP:**
- All meta-unlocks (bestiary, classes, etc.)
- XP gained this run
- Character level
- Veteran Knowledge progress

**Lesson Learned Mechanic:**
Next run starts with +10% damage against enemy type that killed you (persists 1 run). Creates narrative continuity and reduces frustration. Display prominently on death screen and at run start.

### The Chronicler

An NPC at camp who records your deaths and turns them into knowledge:

```
The Chronicler looks up from her tome.

"Ah, the Fleshweaver claimed you. Let me tell you
what I know of their kind..."

╔═══════════════════════════════════════════════════╗
║  BESTIARY UNLOCKED: Fleshweaver                   ║
╠═══════════════════════════════════════════════════╣
║  Weakness: Fire, Severing                         ║
║  Resists: Poison, Necrotic                        ║
║  Behavior: Summons minions at 50% HP              ║
║  Tip: Kill the minions first—they heal it         ║
╚═══════════════════════════════════════════════════╝

"Perhaps next time, you'll know their tricks."
```

### Death Echoes

Your ghost leaves warnings for future runs:

```
As you enter the chamber, a spectral warning appears:

    "The chest was a mimic. I died here.
     - Your Ghost, Run #23"

The echo fades.
```

Echoes are auto-generated from death circumstances. 1-2 appear per run from your own history.

### Death-Triggered Unlocks

Specific deaths unlock specific rewards:

| Death Condition | Unlock |
|-----------------|--------|
| First death to a boss | Item that counters that boss |
| First death to a trap | Trap-detection skill option |
| Death with full inventory | "Last Stand" ability |
| Death at exactly 1 HP | "Desperate Gamble" item |
| Death at 100 Dread | Hollowed One class |

### Framing

The death counter reads: **"Expeditions Failed: 47 | Lessons Learned: 47"**

---

## Narrative Design

### Approach: Moderate Depth

- NPC dialogues at camp
- Lore codex filled by exploration
- Episodic quest text per dungeon
- Environmental storytelling through item descriptions

Story enhances but doesn't dominate gameplay.

### Camp NPCs

| NPC | Function | Narrative Role |
|-----|----------|----------------|
| The Chronicler | Bestiary, lore | Records your deaths, knows dungeon history |
| The Smith | Gear repair/upgrade | Pragmatic survivor, dark humor |
| The Merchant | Buy/sell | Mysterious, knows too much |
| The Bounty Board | Quests | Community requests, world events |

### Lore Delivery

- **Item descriptions:** Dark, evocative, hint at world
- **Death reveals:** Chronicler shares lore on each new enemy
- **Event text:** Encounters reveal world through action
- **Environmental:** Room descriptions, found notes

### Episodic Structure

Each dungeon is self-contained but connected:
- Own story arc (mini-narrative)
- References other dungeons
- Shared world lore
- Can be played in various orders (within level range)

### Tone Guidelines

- Dark fantasy: world has teeth, hope is scarce
- Horror from implication, not gore
- Economical prose: evocative but brief
- Mechanical integration: `[DAMAGE_VALUE]`, `[ITEM_NAME]` placeholders

---

## CLI Interface Design

### Design Principles

1. **Scannable in 2-3 seconds** - No walls of text
2. **Consistent symbols** - Same icons throughout
3. **Color for hierarchy** - Not decoration
4. **ASCII art sparingly** - For impact moments only

### Color Scheme

| Color | Usage |
|-------|-------|
| White | Normal text |
| Green | Healing, positive, Uncommon items |
| Red | Damage, danger, warnings |
| Yellow | Gold, important info, Rare items |
| Blue | Information, magic effects |
| Purple | Epic items, eldritch |
| Gold | Legendary items |
| Gray | Flavor text, less important |

### Dopamine Moments

**Number Escalation:**
```
You swing Soulreaver's Edge at the Fleshweaver...

    Base damage:      15
    Critical hit:    x2   = 30
    Weakness (Fire): +12
    Bleeding target: +5
    ─────────────────────
    TOTAL DAMAGE:    62  ████████████████████████

The Fleshweaver REELS from the blow!
```

**Kill Celebration:**
```
  ██████████████████████████████████████
  █                                    █
  █          F A T A L   B L O W       █
  █                                    █
  ██████████████████████████████████████

The Fleshweaver collapses, ichor pooling at your feet.

  +45 XP | +12 Gold | Dropped: Tattered Flesh
```

**Legendary Reveal:**
```
The ancient chest creaks open...

╔═══════════════════════════════════════════════╗
║                                               ║
║        SOULREAVER'S EDGE                      ║
║        ═══════════════════                    ║
║        Legendary Longsword                    ║
║                                               ║
║        Damage: 24-31                          ║
║        +15% Critical Chance                   ║
║        Lifesteal: 10%                         ║
║                                               ║
║        "Forged in the Pit of Endless          ║
║         Screaming, where hope goes to die."   ║
║                                               ║
╚═══════════════════════════════════════════════╝

A legendary find! Perhaps there's hope after all.
```

**Extraction Climax:**
```
You step onto the Waystone. The ritual begins.

The dungeon SCREAMS.

Tendrils of shadow claw at your legs—

  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  EXTRACTION: 60%

The light burns brighter. The shadows retreat—

  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  EXTRACTION: 85%

You feel yourself pulled UPWARD—

  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  EXTRACTION: 100%

═══════════════════════════════════════════════════
              S A F E   A T   C A M P
═══════════════════════════════════════════════════

You escaped with:
  - 3 items (2 identified, 1 unknown)
  - 147 gold
  - Your sanity (barely)
  - Bounty "Slay 3 Ghouls" COMPLETED (+50 gold)
```

### Sound Through Text

Use onomatopoeia and rhythm:
```
The Bone Colossus raises its massive fist—

  CRACK.

Your shield splinters. The blow continues through.

  CRUNCH.

You stagger. 28 damage. Your vision swims.
```

Short sentences. Hard consonants. The FEEL of impact.

---

## MVP Scope

### Include in MVP

| Feature | Priority | Notes |
|---------|----------|-------|
| 1 dungeon (5 floors) | P0 | The Ossuary |
| Core extraction loop | P0 | Free/Waystone/Boss extraction |
| Basic combat | P0 | 4 actions, stamina, status effects |
| 8-10 enemy types | P0 | Base types + variants (see Enemy Content below) |
| 1 boss | P0 | Bone Colossus |
| 50+ items | P0 | Across all rarities (weapons, armor, accessories, consumables) |
| Camp hub | P0 | Navigation menu (stash, bestiary, begin run) |
| Stash system | P0 | 12 slots, bring up to 2 items per run |
| Character persistence | P0 | Save level, XP, stats, equipped gear between sessions |
| Gold tracking | P0 | Per-run gold and persistent gold (at camp) |
| Basic Dread | P1 | Thresholds, unreliable narrator |
| Death bestiary | P1 | Chronicler unlocks (binary: unknown/known for MVP) |
| Item identification | P1 | Risk/reward for loot |
| ASCII map | P1 | Floor navigation with room type preview |
| Item risk indicators | P1 | [SAFE], [AT RISK], [PROTECTED], [VULNERABLE], [DOOMED] tags |
| Pre-boss warning | P1 | Threshold Chamber with readiness check |

**MVP Enemy Content (Minimum for Replay Value):**

Research shows 3 enemy types is a SEVERE content gap. Target 8-10 minimum:

| Enemy | Type | Floor | Role |
|-------|------|-------|------|
| Plague Rat | Basic | 1-2 | Swarm, poison |
| Ghoul | Basic | 1-3 | Standard melee |
| Plague Ghoul | Variant | 2-3 | Ghoul + poison (variant, not new asset) |
| Skeleton Archer | Basic | 2-4 | Ranged threat |
| Armored Ghoul | Variant | 3-4 | Tanky ghoul variant |
| Shadow Stalker | Basic | 3-5 | Ambush, high damage |
| Corpse Shambler | Basic | 3-5 | Slow tank |
| Fleshweaver | Elite | 3-5 | Caster, summons |
| Bone Knight | Elite | 4-5 | Armored elite |
| Bone Colossus | Boss | 5 | Final boss |

**Variant Strategy:** Create 3 entries from 1 base type (Ghoul, Plague Ghoul, Armored Ghoul). This is how Hades achieves 133 "enemies" from ~30 base types.

**Item Content Minimum:**
- Weapons: 10-15
- Armor: 8-10
- Accessories: 8-10
- Consumables: 15-20
- Total: 50+ items for adequate variety

### Defer Post-MVP

| Feature | Reason |
|---------|--------|
| Multiple dungeons | Content expansion, not core |
| Class unlocks | Need base game first |
| Mutators | Veteran content |
| Full narrative | Can add incrementally |
| Camp upgrades | Complexity layer |
| Death echoes | Nice-to-have (prioritize bestiary first) |
| Tiered Veteran Knowledge | MVP uses binary (unknown/known); 3-tier system is post-MVP |
| CUNNING scouting bonuses | Room preview is P1; advanced scouting is post-MVP |

### MVP Success Criteria

1. **Extraction tension works:** Players visibly hesitate at "one more floor"
2. **Sessions hit target:** Runs fit 5-30 minute window
3. **Death feels productive:** Players restart immediately, not ragequit
4. **Dread is clear:** Players understand when perception is compromised
5. **Combat is snappy:** Fights complete in 1-3 minutes

---

## Design Risks & Mitigations

| Risk | Level | Mitigation |
|------|-------|------------|
| Unreliable narrator frustrates players | HIGH | Only corrupt information, never input. Always signal when perception is compromised ("Your vision swims..."). |
| Show missed loot feels punishing | MEDIUM | Never show Legendary items. Frame as "adventure hook" not punishment. |
| The Watcher feels unfair | MEDIUM | Clear visual/text signals before spawn. Give player time to react. Ensure fleeing The Watcher is possible (it pursues, not instakills). |
| Turn-based combat feels slow | MEDIUM | Keep fights to 4-8 turns. Snappy UI. Show damage calculation as mini-celebration. |
| Extraction makes deep floors feel optional | LOW | Best loot is floor 4-5 exclusive. Bounties require deep runs. Boss has Legendary chance. |
| Stash items never used ("gear fear") | MEDIUM | Monitor usage rates. If <30% of runs bring items, consider partial recovery system. |

---

## Appendix: Reference Numbers

### Starting Stats (Mercenary Class)

| Stat | Value | Derived Effect |
|------|-------|----------------|
| VIGOR | 3 | 35 base HP + (3 x 5) = **50 HP** |
| MIGHT | 3 | +3 damage per attack |
| CUNNING | 3 | 5% + (3 x 3%) = **14% crit chance** |

**Starting Equipment:**
- Weapon: Rusty Sword (5-8 damage, Common)
- Armor: Tattered Leathers (+5 HP, Common)
- Helm: None
- Accessory: None

**Derived Stats:**
- Starting HP: 50 (35 base + 15 from VIGOR)
- Starting Damage: 8-11 (5-8 weapon + 3 MIGHT)
- Crit Chance: 14%
- Stamina: 4 (regen 2/turn)
- Potion capacity: 3

### Enemy Stats (MVP Roster)

**Basic Enemies:**

| Enemy | HP | Damage | Speed | Special | Floors |
|-------|-----|--------|-------|---------|--------|
| Plague Rat | 12-15 | 5-8 | Fast | 30% Poison on hit | 1-3 |
| Ghoul | 18-22 | 8-12 | Normal | None | 1-4 |
| Skeleton Archer | 14-18 | 10-14 | Normal | Ranged (no melee penalty) | 2-4 |

**Elite Enemies:**

| Enemy | HP | Damage | Speed | Special | Floors |
|-------|-----|--------|-------|---------|--------|
| Fleshweaver | 40-50 | 15-20 | Slow | Summons 2 Ghouls at 50% HP | 3-5 |
| Bone Knight | 55-65 | 18-24 | Normal | 25% armor (reduces damage taken) | 4-5 |

**Boss:**

| Enemy | HP | Damage | Speed | Special |
|-------|-----|--------|-------|---------|
| Bone Colossus | 120 | 25-35 | Slow | Multi-attack (2 hits/turn), Ground Slam (AoE, 3-turn cooldown) |

**Ground Slam:** Deals 20-30 damage, 50% stun chance. Telegraphed 1 turn in advance ("The Colossus raises both fists...").

**Boss Design for Underpowered Players:**

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

### Combat Balance

- Light Attack: 1 Stamina, base damage
- Heavy Attack: 3 Stamina, 2x damage + 50% stagger + 25% armor penetration
- Block: 1 Stamina, 50% damage reduction on ALL attacks this turn
- Dodge: 1 Stamina, avoid ONE attack + prevent status effects
- Average enemy HP: 12-25 (basic), 40-65 (elite), 120 (boss)
- Average fight duration: 4-8 turns

### Economy

- Gold per floor: 20-50 (early), 50-100 (late)
- Item identification: 25 gold
- Potion cost: 15 gold
- Extraction cost (floor 3): 10% of carried gold
- Extraction cost (floor 4): 25% gold OR 1 item (player choice)

### Timing

- Combat encounter: 1.5-2 minutes (target), 2.5 minutes (max acceptable)
- Full floor: 4-8 minutes (varies by room count: Floor 1-2 = 4-5 min, Floor 5 = 8 min)
- Full dungeon: 20-30 minutes (24 rooms total)

### Balance Validation Checklist

Use these metrics during playtesting:

| Metric | Target | Red Flag |
|--------|--------|----------|
| Turns to kill Plague Rat | 2-3 | >4 (too tanky) or 1 (too easy) |
| Turns to kill Ghoul | 3-4 | >5 (too tanky) or 1-2 (too easy) |
| Player HP after Ghoul fight | 60-80% | <40% (too punishing) or 100% (no threat) |
| Boss fight duration | 8-12 turns | >15 (slog) or <6 (anticlimactic) |
| Heavy Attack usage rate | 20-40% of attacks | <10% (underpowered) or >60% (dominant) |
| Block vs Dodge usage | ~50/50 situational | >80% one option (imbalanced) |
| Dread at healthy extraction | 40-60 | <30 (not enough tension) or >80 (too punishing) |

---

*Document version: 1.3*
*Last updated: 2026-01-15 — Comprehensive balance, UX, and specification pass*

### Changelog

**v1.3 (2026-01-15)**

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
- Staggered mechanic introductions: Elites (F2), Waystone cost (F3), Mimics (F4)
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
- Increased item requirement from 20-30 to 50+ items
- Added P0 infrastructure: Camp hub, Stash system, Character persistence, Gold tracking
- Added P1 UX features: Item risk indicators, Pre-boss warning, Room type preview
- Simplified MVP bestiary to binary unknown/known (3-tier system is post-MVP)
- Updated Defer Post-MVP: Death echoes deprioritized, Tiered Veteran Knowledge deferred

**v1.2 (2026-01-14)**
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

**v1.1 (2026-01-13)**
- Unified Corruption into Dread system (time adds +1 Dread per 5 turns)
- Removed "character disobeys commands" mechanic — replaced with The Watcher at 100 Dread
- Changed from "sidegrade only" to hybrid progression (power + variety)
- Updated flee mechanics (capped at 70%, gold drop on success)
- Added Floor Depth Effects (curse chance tied to floor, not time)
- Added design risks for The Watcher and gear fear
- Created `docs/open-questions.md` for unresolved decisions
