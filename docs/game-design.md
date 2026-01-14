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

| Run Type | Floors | Time | Risk Level |
|----------|--------|------|------------|
| Quick raid | 1-2 | 5-10 min | Low |
| Standard run | 3-4 | 15-20 min | Medium |
| Deep dive | 5 | 25-30 min | High |

Players control session length by choosing when to extract.

---

## The Extraction System

The extraction mechanic is the game's primary hook—a constant push-your-luck decision.

### Extraction Rules by Floor

| Floor | Extraction Method | Cost |
|-------|-------------------|------|
| 1-2 | Free extraction at any stairwell | None |
| 3 | Must find Waystone | 10% of carried gold |
| 4 | Must find Waystone | 25% gold OR 1 item |
| 5 | Boss guards the exit | Defeat boss |

### Floor Depth Effects

The deeper you go, the more the dungeon corrupts what you find:

| Floor | Curse Chance | Additional Effect |
|-------|--------------|-------------------|
| 1 | 5% | None |
| 2 | 10% | None |
| 3 | 15% | 10% mimic chance |
| 4 | 20% | NPC prices +25% |
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
- Can be stunned for 1 turn with 30+ damage hit
- Pursues until extraction or death

**Design Philosophy:** We corrupt INFORMATION, never INPUT. The player can always act; they just can't trust what they see. The Watcher adds mechanical danger at maximum Dread without taking control away from the player.

### The Unreliable Narrator

At Shaken (51+) Dread, the game's text becomes untrustworthy:

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
| Heavy Attack | 3 Stam | 2x damage, -10% accuracy |
| Dodge | 1 Stam | Avoid next attack, +1 Stam next turn |
| Block | 2 Stam | Reduce incoming damage by 50% |
| Item | 0 Stam | Use consumable, ends turn |
| Flee | 0 Stam | Success chance varies by enemy |

### Status Effects

| Status | Effect | Duration |
|--------|--------|----------|
| Poisoned | -3 HP/turn | 3 turns |
| Bleeding | -2 HP/turn, stacks | Until healed |
| Stunned | Skip next turn | 1 turn |
| Weakened | -25% damage dealt | 3 turns |
| Cursed | Cannot heal | Until cured |

Status effects can cascade dangerously. Poisoned + Bleeding can kill faster than direct damage.

### Combat Pacing

- **Target fight length:** 1-3 minutes (4-8 turns)
- **Average turns to kill basic enemy:** 3-4
- **Boss fights:** 8-12 turns

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

---

## Character & Progression

### The Three-Stat System

Only three stats matter. This is intentional—we want decisions in the dungeon, not in menus.

| Stat | Primary Effect | Secondary Effect |
|------|----------------|------------------|
| **VIGOR** | Max HP (+5 per point) | Poison/Bleed resistance |
| **MIGHT** | Physical damage (+2 per point) | Carry capacity |
| **CUNNING** | Crit chance (+3% per point) | Trap detection, special dialogue |

### No Skill Trees

Your "build" is determined by what you FIND, not what you CHOOSE in a menu. This keeps decisions in the moment and prevents analysis paralysis.

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

### Item Identification

- Items drop UNIDENTIFIED
- Identification costs gold at camp OR rare scrolls in dungeon
- Unidentified items are lost on death
- Identified items are kept on death
- Creates tension: spend resources to secure loot, or gamble?

### Level System

- **Level cap:** 20
- **XP per level:** Scales linearly (100 × level)
- **Per level gain:** +5 Max HP, +1 to chosen stat

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
| Flagellant | Reach 85+ Dread, extract alive | High risk/reward, damage bonuses at low HP |
| Hollowed One | Die at 100 Dread | Can use cursed items safely, Dread manipulation |

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
┌─────────────────────────────────────────────────────────────┐
│  STASH (10-15 slots) - Items here are SAFE                  │
│                                                             │
│  Before Run: Select up to 2 items to BRING                  │
│  → Items brought are AT RISK                                │
│                                                             │
│  If you DIE:    Brought items LOST FOREVER from stash       │
│  If you EXTRACT: Keep brought items + deposit found items   │
└─────────────────────────────────────────────────────────────┘
```

**Stash Rules:**

| Rule | Value | Rationale |
|------|-------|-----------|
| Capacity | 10-15 slots | Forces curation, prevents hoarding |
| Bring limit | 2 items per run | Caps power spike, forces choices |
| Legendary restriction | Cannot stash legendaries | Must use them or lose them |

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

| Tier | Encounters | Information Unlocked |
|------|------------|---------------------|
| 1 | 5 | Name, HP range, damage range |
| 2 | 15 | Attack patterns, resistances, weaknesses |
| 3 | 25 | Exact stats, optimal strategies, lore entry |

**Boss Knowledge:**

| Knowledge | Unlock Condition | What You Learn |
|-----------|------------------|----------------|
| Telegraph | 2 deaths OR 5 encounters | Attack pattern hints shown in combat |
| Weakness | 3 deaths OR use correct element once | Bonus damage type revealed |

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

---

## Dungeon Structure

### Floor Architecture

Each dungeon has 5 floors with escalating risk and reward:

| Floor | Duration | Difficulty | Key Feature |
|-------|----------|------------|-------------|
| 1 | ~5 min | Easy | Tutorial floor, free extract |
| 2 | ~5 min | Medium | First real challenge |
| 3 | ~7 min | Hard | Mini-boss, extraction costs begin |
| 4 | ~8 min | Very Hard | Epic loot chance |
| 5 | ~10 min | Extreme | Boss, Legendary chance |

### Floor Layout

Each floor contains 4-6 rooms:
- 1-2 Combat rooms (required)
- 1 Treasure room (trapped/guarded)
- 1 Event room (narrative choice)
- 0-1 Rest site
- 0-1 Special (shrine/merchant)

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

### ASCII Map

```
THE OSSUARY - Floor 2
═══════════════════════

  ┌───┬───┬───┐
  │ ? │ ! │ ▣ │
  ├───┼───┼───┤
  │ ☠ │ . │ $ │
  ├───┼───┼───┤
  │ ↓ │ . │ ? │
  └───┴───┴───┘

Legend:
  ▣ = Your location
  ? = Unexplored
  ! = Danger detected
  ☠ = Cleared (enemies dead)
  $ = Treasure
  ↓ = Stairs down / Exit
  . = Empty (explored)

Torches: 2  |  HP: 35/50  |  Dread: 28
```

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

**What you LOSE:**
- All UNIDENTIFIED items
- All carried (unequipped) items
- Brought stash items (if any)
- Carried gold
- Current run progress

**What you KEEP:**
- Equipped items (return to stash)
- All IDENTIFIED items
- All meta-unlocks (bestiary, classes, etc.)
- XP gained this run
- Character level

**New Mechanic - Lesson Learned:**
Next run starts with +10% damage against enemy type that killed you (persists 1 run). Creates narrative continuity and reduces frustration.

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
| 3 enemy types | P0 | Ghoul, Plague Rat, Fleshweaver |
| 1 boss | P0 | Bone Colossus |
| 20-30 items | P0 | Across all rarities |
| Basic Dread | P1 | Thresholds, unreliable narrator |
| Death bestiary | P1 | Chronicler unlocks |
| Item identification | P1 | Risk/reward for loot |
| ASCII map | P1 | Floor navigation |

### Defer Post-MVP

| Feature | Reason |
|---------|--------|
| Multiple dungeons | Content expansion, not core |
| Class unlocks | Need base game first |
| Mutators | Veteran content |
| Full narrative | Can add incrementally |
| Camp upgrades | Complexity layer |
| Death echoes | Nice-to-have |

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

### Character Baseline
- Starting HP: 50
- Max HP at Level 20: 150
- Starting Damage: 5-8
- Stamina: 4 (regen 2/turn)
- Potion capacity: 3

### Combat Balance
- Light Attack: 1 Stamina, base damage
- Heavy Attack: 3 Stamina, 2x damage
- Average enemy HP: 12-25 (basic), 40-60 (elite), 100+ (boss)
- Average fight duration: 4-8 turns

### Economy
- Gold per floor: 20-50 (early), 50-100 (late)
- Item identification: 25 gold
- Potion cost: 15 gold
- Extraction sacrifice (floor 3): 10% gold
- Extraction sacrifice (floor 4): 25% gold OR 1 item

### Timing
- Combat encounter: 1-3 minutes
- Full floor: 5-8 minutes
- Full dungeon: 25-35 minutes

---

*Document version: 1.2*
*Last updated: 2026-01-14 — All open questions resolved via collaborative design review*

### Changelog

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
