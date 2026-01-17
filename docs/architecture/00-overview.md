# Architecture Overview

## Purpose

This document provides the high-level architecture for DARKDELVE, defining module boundaries, dependencies, and implementation order. Engineers should read this first before diving into specific module specifications.

---

## Architectural Principles

### 1. Core/Presentation Separation

The game core is a pure state machine with **no I/O operations**. It never:
- Reads from keyboard or files
- Writes to screen or files
- Makes network calls

All I/O happens in the presentation layer. The core only:
- Processes commands
- Updates state
- Emits events
- Returns results

### 2. Event-Driven Communication

Systems communicate through a central event bus. The core emits events for all significant state changes. Presentation layers subscribe to events for reactive updates.

### 3. Command-Based Input

All player actions flow through a unified command interface:
- Presentation parses user input into commands
- Core validates and executes commands
- Core returns results (success/failure + new state + events)

### 4. Data-Driven Configuration

All tunable values live in external JSON files:
- `configs/` - Balance values (damage formulas, thresholds, rates)
- `content/` - Game entities (items, monsters, events)

No magic numbers in code. If a designer might tweak it, it's in config.

### 5. Deterministic Core

Given the same inputs and RNG seed, the core produces identical outputs. This enables:
- Reproducible tests
- AI agent training
- Bug reproduction
- Replay functionality

---

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Strong typing, good for complex game state |
| Runtime | Node.js | Cross-platform, familiar ecosystem |
| Testing | Jest + TDD | Test-first ensures correctness |
| RNG | xorshift128+ | Fast, seedable, reproducible |
| State | Immutable patterns | Time-travel debugging, easy undo |
| Config | JSON | Human-readable, easy to edit |

---

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │   CLI Renderer   │  │   Agent Mode     │  │   Future: GUI/Web      │ │
│  │   (15-cli)       │  │   (16-agent)     │  │                        │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────┬────────────┘ │
└───────────┼─────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            ▼                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          GAME CORE API                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  GameSession                                                       │  │
│  │  ├─ executeCommand(command: GameCommand): CommandResult           │  │
│  │  ├─ getState(): GameState                                         │  │
│  │  ├─ getAvailableCommands(): AvailableCommand[]                    │  │
│  │  └─ subscribe(eventType, handler): Unsubscribe                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────────┐  ┌────────────────────┐  ┌────────────────────────┐
│   GAME SYSTEMS    │  │   GAME SYSTEMS     │  │    GAME SYSTEMS        │
│                   │  │                    │  │                        │
│  ┌─────────────┐  │  │  ┌──────────────┐  │  │  ┌──────────────────┐  │
│  │   Combat    │  │  │  │   Dungeon    │  │  │  │   Character      │  │
│  │   (08)      │  │  │  │   (10)       │  │  │  │   (06)           │  │
│  └──────┬──────┘  │  │  └──────┬───────┘  │  │  └────────┬─────────┘  │
│         │         │  │         │          │  │           │            │
│  ┌──────┴──────┐  │  │  ┌──────┴───────┐  │  │  ┌────────┴─────────┐  │
│  │   Dread     │  │  │  │  Extraction  │  │  │  │      Item        │  │
│  │   (09)      │  │  │  │   (11)       │  │  │  │      (07)        │  │
│  └─────────────┘  │  │  └──────────────┘  │  │  └──────────────────┘  │
└───────────────────┘  └────────────────────┘  └────────────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION LAYER                                 │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │   Camp System    │  │   Save System    │  │     Analytics          │ │
│  │   (12)           │  │   (13)           │  │     (14)               │ │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FOUNDATION LAYER                                  │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Content        │  │ State          │  │ Command System             │ │
│  │ Registry (02)  │  │ Management (03)│  │ (05)                       │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Event System   │  │ Foundation     │  │ RNG, Types, DI             │ │
│  │ (04)           │  │ (01)           │  │                            │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order

Modules must be implemented in dependency order. Each phase builds on the previous.

### Phase 1: Foundation (No dependencies)

| Order | Module | File | Description |
|-------|--------|------|-------------|
| 1 | Foundation | `01-foundation.md` | Core types, RNG, Result type, DI container |

### Phase 2: Infrastructure (Depends on Foundation)

| Order | Module | File | Description |
|-------|--------|------|-------------|
| 2 | Content Registry | `02-content-registry.md` | Load and validate all JSON content |
| 3 | State Management | `03-state-management.md` | Immutable state store with reducers |
| 4 | Event System | `04-event-system.md` | Pub/sub event bus |
| 5 | Command System | `05-command-system.md` | Command validation and execution |

### Phase 3: Core Game Systems (Depends on Infrastructure)

| Order | Module | File | Description |
|-------|--------|------|-------------|
| 6 | Character System | `06-character-system.md` | Stats, leveling, equipment |
| 7 | Item System | `07-item-system.md` | Items, effects, inventory, loot |
| 8 | Combat System | `08-combat-system.md` | Turn-based combat resolution |
| 9 | Dread System | `09-dread-system.md` | Dread mechanics, The Watcher |
| 10 | Dungeon System | `10-dungeon-system.md` | Floor generation, navigation |
| 11 | Extraction System | `11-extraction-system.md` | Extraction costs, death economy |

### Phase 4: Integration (Depends on Core Systems)

| Order | Module | File | Description |
|-------|--------|------|-------------|
| 12 | Camp System | `12-camp-system.md` | Hub menus, merchant, prep |
| 13 | Save System | `13-save-system.md` | Persistence, profiles |
| 14 | Analytics | `14-analytics.md` | Event logging (P1) |

### Phase 5: Presentation (Depends on All Core)

| Order | Module | File | Description |
|-------|--------|------|-------------|
| 15 | CLI Presentation | `15-cli-presentation.md` | Human-readable CLI |
| 16 | Agent Mode | `16-agent-mode.md` | JSON API for AI agents (P1) |

---

## Module Dependencies Matrix

| Module | Depends On |
|--------|------------|
| 01-Foundation | (none) |
| 02-Content Registry | 01 |
| 03-State Management | 01, 02 |
| 04-Event System | 01 |
| 05-Command System | 01, 03, 04 |
| 06-Character | 01, 02, 03, 05 |
| 07-Item | 01, 02, 06 |
| 08-Combat | 01, 02, 04, 06, 07 |
| 09-Dread | 01, 02, 04, 06 |
| 10-Dungeon | 01, 02, 03, 04, 08 |
| 11-Extraction | 01, 02, 04, 07, 09, 10 |
| 12-Camp | 01, 02, 03, 04, 05, 06, 07 |
| 13-Save | 01, 02, 03 |
| 14-Analytics | 01, 03, 04 |
| 15-CLI | All Core (01-13) |
| 16-Agent Mode | All Core (01-13) |

---

## Directory Structure

```
darkdelve/
├── src/
│   ├── core/                    # Game core (no I/O)
│   │   ├── foundation/          # 01 - Types, RNG, DI
│   │   ├── content/             # 02 - Content registry
│   │   ├── state/               # 03 - State management
│   │   ├── events/              # 04 - Event system
│   │   ├── commands/            # 05 - Command system
│   │   ├── character/           # 06 - Character system
│   │   ├── items/               # 07 - Item system
│   │   ├── combat/              # 08 - Combat system
│   │   ├── dread/               # 09 - Dread system
│   │   ├── dungeon/             # 10 - Dungeon system
│   │   ├── extraction/          # 11 - Extraction system
│   │   ├── camp/                # 12 - Camp system
│   │   ├── save/                # 13 - Save system
│   │   ├── analytics/           # 14 - Analytics
│   │   └── index.ts             # GameSession entry point
│   │
│   ├── presentation/            # Presentation layers (I/O here)
│   │   ├── cli/                 # 15 - CLI renderer
│   │   └── agent/               # 16 - Agent mode API
│   │
│   └── index.ts                 # Application entry point
│
├── configs/                     # Balance configuration
│   ├── game.json
│   ├── combat.json
│   ├── dread.json
│   ├── extraction.json
│   ├── progression.json
│   ├── merchant.json
│   └── analytics.json
│
├── content/                     # Game content definitions
│   ├── items/
│   │   ├── weapons/
│   │   ├── armor/
│   │   ├── helms/
│   │   ├── accessories/
│   │   └── consumables/
│   ├── monsters/
│   │   ├── common/
│   │   ├── elites/
│   │   └── bosses/
│   ├── status_effects/
│   ├── events/
│   ├── dungeons/
│   └── loot_tables/
│
├── profiles/                    # Player save data
│   └── default/
│       ├── profile.json
│       ├── save.json
│       ├── stash.json
│       └── analytics/
│
├── tests/                       # Test files mirror src/
│   ├── core/
│   └── presentation/
│
└── docs/
    ├── game-design/             # Game design documents
    └── architecture/            # This folder
```

---

## Cross-Cutting Concerns

### Error Handling

All operations that can fail return `Result<T, E>`:

```typescript
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
```

Never throw exceptions for expected failure cases. Exceptions are only for programmer errors.

### Logging

- Use structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Include context: module, operation, relevant IDs
- Analytics logging is separate from debug logging

### Testing Strategy

Each module defines its test strategy. General approach:
- **Unit tests**: Pure functions, isolated logic
- **Integration tests**: Module interactions
- **Property tests**: Invariants (e.g., damage always positive)
- **Snapshot tests**: Rendered output

### Performance Considerations

- Content registry loads once at startup, serves from memory
- State updates are O(1) with structural sharing
- RNG is stateless function calls
- No hot paths in presentation (core is fast)

---

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Consumable source | Both stash AND merchant | Flexibility for players |
| Mid-dungeon equip | Yes, anytime | Reduces friction, more tactical |
| Event memory | Global | Simplifies state, feels magical |
| Crash recovery | Return to camp, run lost | Prevents save-scum, simpler |
| State management | Immutable | Easier debugging, time travel |
| RNG | Injected, seeded | Reproducibility for tests/AI |
| Config format | JSON | Human-readable, no build step |
| Module boundaries | By domain | Independent development |

---

## Getting Started

1. **Engineers**: Start with `01-foundation.md`, implement in order
2. **For each module**: Read the spec, implement interfaces, write tests first
3. **Integration**: Each module exports its public interface from `index.ts`
4. **Testing**: Run tests continuously, no merging with failing tests

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026 | Initial architecture specification |
