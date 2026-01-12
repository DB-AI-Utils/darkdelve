# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A dark fantasy action RPG inspired by Diablo. Initially CLI-based with potential for graphical interface expansion.

## Development Workflow

This project uses a strict architect-engineer separation:

1. **Architect Phase** (`/architect` skill): Design decisions, trade-offs, boundaries, and interfaces. No code, no folder structures—only decisions and specifications.

2. **Engineer Phase** (`/engineer` skill): Implement exactly what the architecture specifies. Stop and escalate on any ambiguity—don't assume.

**Key principle**: Unclear = Stop. Never guess. Ask first.

## Specialized Agents

Use the Task tool with these agents for specialized work:

| Agent | Purpose |
|-------|---------|
| `rpg-game-designer` | Game mechanics, balance, progression systems, loot design, player experience |
| `dark-fantasy-narrative` | Quest text, item descriptions, monster lore, NPC dialogue, world-building |
| `research-analyst` | Market research, technology evaluation, fact-checking |

## Game Design Considerations

When designing game systems, analyze through these lenses:
- **Player Fantasy**: Does it reinforce the power fantasy?
- **Meaningful Choice**: Are players making interesting decisions?
- **CLI Constraints**: How does it work in text-based interface?
- **Scope Realism**: Is it implementable?

Watch for red flags: stat soup, illusion of choice, grind walls, complexity for complexity's sake.

## Narrative Style

Dark fantasy tone with these characteristics:
- Evocative but economical prose
- World has teeth, hope is scarce
- Horror from implication not gore
- Writing serves gameplay—use mechanical placeholders like `[DAMAGE_VALUE]`, `[ITEM_NAME]`

## CLI-First Design

Text-based interface patterns:
- ASCII art for visual elements (maps, combat, inventory)
- Scannable combat logs with clear hierarchies
- Status effects and stats presented cleanly
- Terminal color/formatting used sparingly but effectively

## Data-Driven Configuration

**All game balance values must be in external JSON config files, NOT hardcoded in source.**

Store configs in a `configs/` folder. Files should be human-readable and easily modifiable without touching code.

**Config files to create:**

| File | Contents |
|------|----------|
| `configs/player.json` | Base stats, level-up gains, stamina values |
| `configs/combat.json` | Damage formulas, status effect durations, flee chances |
| `configs/dread.json` | Thresholds, effects per level, gain/decay rates |
| `configs/extraction.json` | Corruption rates, Waystone costs, floor extraction rules |
| `configs/stash.json` | Capacity, bring limits, legendary restrictions |
| `configs/loot.json` | Drop rates, rarity weights, item pool definitions |
| `configs/veteran_knowledge.json` | Unlock thresholds for all knowledge types |
| `configs/dungeons/*.json` | Per-dungeon: enemy roster, floor layout, boss stats |

**Why:** Enables rapid balance iteration without code changes. Designer can tweak values directly.

## Game Design Reference

Full design document: `docs/game-design.md`

### Core Mechanics (DARKDELVE)

| Mechanic | Description |
|----------|-------------|
| **Extraction Dilemma** | Primary hook: "Go deeper for better loot, or extract now?" Floors 1-2 free, deeper floors cost gold/items via Waystones |
| **Dread System** | Mental strain resource. At high Dread, CLI becomes unreliable narrator (enemy counts blur, stats hidden). Never break INPUT—only corrupt INFORMATION |
| **Death as Discovery** | Deaths unlock bestiary entries, lore, warnings for future runs. Frame as "Lessons Learned" not failures |
| **Sidegrade Progression** | Meta-progression adds variety (classes, items, mutators), never power. Player skill improves, not character strength |
| **Stash System** | Safe storage (10-15 slots). Bring up to 2 items per run—if you die, brought items lost forever. Creates "gear fear" pre-run decision |
| **Veteran Knowledge** | Permanent information unlocks (not power). Deaths/encounters teach boss telegraphs, enemy resistances, trap locations. You get smarter, not stronger |

### Key Design Rules

1. **Session length**: 5-30 minutes max. Players control length via extraction timing.
2. **Three stats only**: VIGOR (HP), MIGHT (damage), CUNNING (crit/detection). No skill trees.
3. **Gear slots**: 4 total (weapon, armor, helm, accessory). Depth from effects, not complexity.
4. **Combat pacing**: 1-3 minute fights, 4-8 turns average. Stamina prevents button mashing.

### Implementation Priorities

1. Core extraction loop (defines the game)
2. Basic combat + exploration
3. Dread system (the differentiator)
4. Death-as-discovery (retention)
5. Meta-progression unlocks
6. CLI polish (dopamine feedback)

### Dungeon Generation (Hybrid Approach)

**Principle**: Fixed skeleton, random flesh. Structure provides mastery, variation provides tension.

**Fixed** (dungeon identity): Theme, floor count, boss, story beats, monster roster, room type distribution

**Random** (per-run variance): Room order, enemy composition, loot, events, shrines

**Dread-linked**: Higher Dread = more variance, better rewards, less predictability. Elite spawn chance scales from 5% (0 Dread) to 25% (100 Dread).

### Verified Design Decisions

- **Narrative depth**: Moderate (NPC dialogues, lore codex, episodic quest text)
- **Complexity curve**: Gradual unlock over first 5-10 runs
- **Permadeath**: No—losing run progress is sufficient tension
- **Dungeon generation**: Hybrid (fixed structure + randomized content per run)
- **Item persistence**: Stash system with risk (bring items = risk losing them)
- **Permanent progression**: Information only (Veteran Knowledge), no power increases
