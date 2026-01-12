# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A dark fantasy action RPG inspired by Diablo. Initially CLI-based with potential for graphical interface expansion.

## Development Workflow

This project uses a strict architect-engineer separation:

1. **Architect Phase** (`/architect` skill): Design decisions, trade-offs, boundaries, and interfaces. No code, no folder structures—only decisions and specifications.

2. **Engineer Phase** (`/engineer` skill): Implement exactly what the architecture specifies. Stop and escalate on any ambiguity—don't assume.

**Key principle**: Unclear = Stop. Never guess. Ask first.

**Architect reference**: See `for-architect.md` for cross-cutting concerns (analytics, data-driven design requirements).

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

## Game Design Reference

Full design document: `docs/game-design.md`

### Core Mechanics (DARKDELVE)

| Mechanic | Description |
|----------|-------------|
| **Extraction Dilemma** | Primary hook: "Go deeper for better loot, or extract now?" Floors 1-2 free, deeper floors cost gold/items via Waystones |
| **Dread System** | Mental strain resource. At high Dread, CLI becomes unreliable narrator (enemy counts blur, stats hidden). Never break INPUT—only corrupt INFORMATION |
| **Death as Discovery** | Deaths unlock bestiary entries, lore, warnings for future runs. Frame as "Lessons Learned" not failures |
| **Hybrid Progression** | Meta-progression adds both power (leveling: +5 HP/+1 stat per level) and variety (classes, items, mutators). Character grows stronger AND player skill improves |
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
- **Permanent progression**: Hybrid—leveling provides power (+5 HP/+1 stat per level), Veteran Knowledge provides information advantages
