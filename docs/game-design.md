# DARKDELVE: Game Design Document

> A CLI-based dark fantasy roguelike where the dungeon corrupts your mind as much as your body.

---

## Table of Contents

### Overview (This Document)
1. [Vision](#vision)
2. [Core Design Pillars](#core-design-pillars)
3. [Gameplay Loop](#gameplay-loop)
4. [Narrative Design](#narrative-design)
5. [CLI Interface Design](#cli-interface-design)
6. [MVP Scope](#mvp-scope)
7. [Design Risks & Mitigations](#design-risks--mitigations)

### Detailed System Documents
- [The Extraction System](game-design/extraction-system.md) - Push-your-luck extraction mechanics
- [The Dread System](game-design/dread-system.md) - Mental strain, unreliable narrator, The Watcher
- [Combat](game-design/combat.md) - Stamina-based turn combat, status effects, flee mechanics
- [Character & Progression](game-design/character-progression.md) - Stats, gear, stash, veteran knowledge
- [Save System](game-design/save-system.md) - Auto-save triggers, persistence rules
- [Dungeon Structure](game-design/dungeon-structure.md) - Floors, rooms, ASCII maps, pre-boss warnings
- [Dungeon Generation](game-design/dungeon-generation.md) - Hybrid procedural generation
- [Death & Discovery](game-design/death-discovery.md) - Death economy, The Chronicler, unlocks
- [Camp System](game-design/camp-system.md) - Full UI specification, menus, expedition flow
- [Reference Numbers](game-design/reference-numbers.md) - Stats, balance data, changelog

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

→ *Full details: [Extraction System](game-design/extraction-system.md)*

### 2. The Dread System
Your mind degrades alongside your body. High Dread makes the game itself untrustworthy—enemy counts blur, item stats become uncertain, whispers appear in the margins.

**Critical rule:** Information becomes unreliable, but player INPUT never breaks. You can always act; you just can't always trust what you see.

→ *Full details: [Dread System](game-design/dread-system.md)*

### 3. Death as Discovery
Death is not punishment—it's reconnaissance. Every death unlocks information: enemy weaknesses, lore fragments, warnings for future runs. The framing is "Lessons Learned," not "Failures."

→ *Full details: [Death & Discovery](game-design/death-discovery.md)*

### 4. Meaningful Risk
Every interaction is a decision with consequences. Chests might alert enemies or contain treasures. Strangers might help or rob you. Combat can be avoided—but so can rewards.

---

## Gameplay Loop

```
                    ┌─────────────────────────────────────┐
                    │             CAMP                    │
                    │  - Manage inventory                 │
                    │  - Review bestiary                  │
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
| Standard run | 1-4 | 17 | 14-20 min | Medium |
| Deep dive | 1-5 | 23 | 20-28 min | High |

Players control session length by choosing when to extract. Combat must average 1.5-2 minutes to hit these targets.

→ *Full details: [Dungeon Structure](game-design/dungeon-structure.md), [Combat](game-design/combat.md)*

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

→ *Full details: [Camp System](game-design/camp-system.md)*

---

## MVP Scope

### Include in MVP

| Feature | Priority | Notes |
|---------|----------|-------|
| 1 dungeon (5 floors) | P0 | The Ossuary |
| Core extraction loop | P0 | Free/Waystone/Boss extraction |
| Basic combat | P0 | 4 actions, stamina, status effects |
| 8-10 enemy types | P0 | Base types + variants (see [Reference Numbers](game-design/reference-numbers.md)) |
| 1 boss | P0 | Bone Colossus |
| 50+ items | P0 | Across all rarities (weapons, armor, accessories, consumables) |
| Camp hub | P0 | Full UI navigation (see [Camp System](game-design/camp-system.md)) |
| Stash system | P0 | 12 slots, bring up to 2 items per run |
| Save system | P0 | Auto-save on commit actions (see [Save System](game-design/save-system.md)) |
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
| Skeleton Archer | Basic | 2-4 | High damage, fragile |
| Armored Ghoul | Variant | 3-4 | Tanky ghoul variant |
| Shadow Stalker | Basic | 4-5 | Ambush, high damage |
| Corpse Shambler | Basic | 3-5 | Slow tank |
| Fleshweaver | Elite | 4-5 | Caster, life drain |
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
| Multi-enemy combat | MVP is 1v1 only; group encounters add UI/balance complexity |
| Ranged combat mechanics | MVP has no positioning system; ranged is flavor only |
| Trap system | Adds complexity without core loop value; defer to post-MVP |
| Tutorial system | First-time player experience via Chronicler is sufficient for MVP |

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

*Document version: 1.4*
*Last updated: 2026-01-15 — Features deferred to post-MVP: Bounty Board, Item Affixes, Events, Mimics*

→ *Full changelog: [Reference Numbers](game-design/reference-numbers.md#changelog)*
