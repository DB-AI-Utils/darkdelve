# System Architecture: DARKDELVE (High-Level Overview)

## 1. Context
DARKDELVE is a single-player, local-only CLI game with future UI expansion. The architecture must separate game logic from presentation, keep logic deterministic, and keep all balance and content data external.

## 2. Constraints
- TypeScript implementation.
- Local-only runtime and persistence.
- Single-player session model.
- CLI first, with future graphical and agent interfaces.
- No external integrations.
- Data-driven content and balance values.

## 3. Architectural Drivers (Ranked)
1. Separation of game core from presentation.
2. Data-driven tuning and content authoring.
3. Testability and deterministic runs.
4. Clear module ownership for iteration velocity.
5. Local persistence with minimal operational overhead.

## 4. Key Decisions and Trade-offs

### Decision: Overall architecture style
**Context:** Define how modules are organized for a local game.

**Option A: Modular monolith**
- Description: Single process with clear module boundaries and explicit APIs.
- Pros: Simpler debugging, no deployment complexity, fast iteration.
- Cons: Requires discipline to keep boundaries clean.
- Best when: Local-only, single-player, CLI-first.

**Option B: Service-oriented split**
- Description: Separate processes for core, UI, analytics.
- Pros: Strong isolation, UI can restart independently.
- Cons: Complex IPC, harder local setup, overkill for scope.
- Best when: Multi-client or remote services required.

**Recommendation:** Modular monolith.
**Decision required from:** Architect (this doc) and tech lead confirmation.

### Decision: Core and presentation communication
**Context:** Support CLI and future UIs without changing game logic.

**Option A: Command and query API with event stream**
- Description: Core exposes commands and state queries; emits events for presentation.
- Pros: Clean separation, easy to add UI adapters, testable.
- Cons: Requires consistent event schema.
- Best when: Multiple presentations or agent mode needed.

**Option B: Presentation-driven state mutation**
- Description: UI directly manipulates state objects.
- Pros: Simple in the short term.
- Cons: Tight coupling, brittle for future UI expansion.
- Best when: Single UI forever.

**Recommendation:** Command and query API with event stream.
**Decision required from:** Architect (this doc) and tech lead confirmation.

### Decision: Persistence approach
**Context:** Save profiles, runs, and unlocks locally.

**Option A: File-based JSON store**
- Description: Serialize domain state to local JSON files per profile.
- Pros: Human-readable, easy backups, no dependencies.
- Cons: Requires versioning and migration rules.
- Best when: Local-only with modest data size.

**Option B: Embedded database**
- Description: Use a local embedded DB for structured persistence.
- Pros: Stronger query support, transactional updates.
- Cons: More complexity, adds dependency and schema management.
- Best when: Large datasets or complex queries.

**Recommendation:** File-based JSON store with explicit versioning.
**Decision required from:** Tech lead confirmation.

### Decision: Data-driven content and balance
**Context:** Designers must tune without code changes.

**Option A: External JSON with a Content Registry**
- Description: Load content and configs from external JSON; systems query registry.
- Pros: Fast iteration, validation, easy modding.
- Cons: Requires robust validation and tooling.
- Best when: Balance is expected to change frequently.

**Option B: Hardcoded data in source**
- Description: Content defined in code constants.
- Pros: Simpler to implement initially.
- Cons: Slows iteration and blocks non-engineers.
- Best when: Toy prototypes.

**Recommendation:** External JSON with a Content Registry.
**Decision required from:** Architect (this doc) and tech lead confirmation.

## 5. System Overview
Actors:
- Human player (CLI).
- AI agent (structured output mode).

High-level flow:
- Presentation translates input into commands.
- Game Core validates commands, mutates state, emits events.
- Presentation queries state and renders output.
- Persistence stores and restores profiles and run state.
- Analytics captures structured events locally.

## 6. Component Architecture

**Presentation Layer**
- CLI Adapter: parses input, renders text and ASCII.
- Agent Adapter: emits structured JSON state and accepts deterministic commands.

**Game Core API**
- Command interface (actions such as move, attack, use item, extract).
- Query interface (state snapshots, available actions).
- Event stream for presentation and analytics.

**Core Systems**
- Run Orchestrator: transitions between camp, dungeon run, extraction, death.
- Dungeon System: dungeon structure, room traversal, exploration state.
- Combat System: turn resolution, stamina, status effects.
- Dread System: mental strain and information uncertainty rules.
- Extraction System: push-your-luck exit logic.
- Items and Loot: inventory, drops, identification.
- Character and Progression: stats, leveling, veteran knowledge.
- Death and Discovery: bestiary unlocks, lessons learned.
- Camp System: meta hub, NPC interactions, stash access.

**Shared Services**
- Content Registry: loads and validates external content and configs.
- RNG Service: seed control for reproducible runs.
- Rule Evaluation: shared rules for validation and calculations.

**Persistence and Analytics**
- Profile Store: local persistence for profiles, saves, stash, unlocks.
- Analytics Logger: local event capture for later analysis.

## 7. Module Boundaries (High Level)

### Module: Game Core API
**Responsibility:** Single entry point for commands, queries, and events.
**Boundaries:**
- OWNS: validation of actions, core event stream.
- DOES NOT OWN: rendering or input parsing.
**Interfaces:**
- Provides: executeAction, getState, getAvailableActions, onEvent.
- Requires: Core systems, persistence, content registry.

### Module: Presentation Adapters
**Responsibility:** Translate inputs to commands and render outputs.
**Boundaries:**
- OWNS: input parsing, formatting, CLI/agent output.
- DOES NOT OWN: game rules, state mutation.
**Interfaces:**
- Provides: user input -> core commands.
- Requires: core queries and events.

### Module: Run Orchestrator
**Responsibility:** Manage the high-level loop (camp -> run -> extraction/death).
**Boundaries:**
- OWNS: run lifecycle and transitions.
- DOES NOT OWN: combat rules or loot math.
**Interfaces:**
- Provides: startNewRun, endRun, transition actions.
- Requires: dungeon, combat, extraction, persistence.

### Module: Dungeon System
**Responsibility:** Structure, rooms, navigation, encounters.
**Boundaries:**
- OWNS: dungeon topology and exploration state.
- DOES NOT OWN: combat resolution.
**Interfaces:**
- Provides: current room state, room transitions.
- Requires: content registry, RNG.

### Module: Combat System
**Responsibility:** Turn-based combat resolution.
**Boundaries:**
- OWNS: turn order, stamina, damage, status effects.
- DOES NOT OWN: rendering or input parsing.
**Interfaces:**
- Provides: resolveAction, combat state updates.
- Requires: content registry, RNG, dread rules.

### Module: Dread System
**Responsibility:** Dread accumulation and uncertainty rules.
**Boundaries:**
- OWNS: dread level and thresholds.
- DOES NOT OWN: how uncertainty is displayed.
**Interfaces:**
- Provides: applyDread, computeInformationUncertainty.
- Requires: config values.

### Module: Extraction System
**Responsibility:** Exit rules and risk calculations.
**Boundaries:**
- OWNS: extraction eligibility and outcomes.
- DOES NOT OWN: dungeon traversal.
**Interfaces:**
- Provides: canExtract, resolveExtraction.
- Requires: dungeon state, dread level, inventory state.

### Module: Items and Loot
**Responsibility:** Inventory, drops, identification.
**Boundaries:**
- OWNS: item state and loot selection.
- DOES NOT OWN: combat math.
**Interfaces:**
- Provides: addItem, removeItem, rollLoot.
- Requires: content registry, RNG.

### Module: Character and Progression
**Responsibility:** Stats, leveling, veteran knowledge.
**Boundaries:**
- OWNS: player attributes and meta progression.
- DOES NOT OWN: save serialization.
**Interfaces:**
- Provides: applyXP, applyLevelUp, unlockKnowledge.
- Requires: config values.

### Module: Death and Discovery
**Responsibility:** Death outcomes and bestiary unlocks.
**Boundaries:**
- OWNS: lessons learned and unlock tracking.
- DOES NOT OWN: combat rules.
**Interfaces:**
- Provides: onDeath, unlocksUpdate.
- Requires: content registry.

### Module: Camp System
**Responsibility:** Meta hub interactions and stash access.
**Boundaries:**
- OWNS: camp menu logic and NPC interactions.
- DOES NOT OWN: dungeon generation.
**Interfaces:**
- Provides: camp actions and selections.
- Requires: profile store, content registry.

### Module: Content Registry
**Responsibility:** Load and validate all configs and content.
**Boundaries:**
- OWNS: data parsing, validation, lookup APIs.
- DOES NOT OWN: gameplay logic.
**Interfaces:**
- Provides: getItem, getMonster, getConfig, rollLootTable.
- Requires: external JSON sources.

### Module: Profile Store
**Responsibility:** Persist profile state and run snapshots.
**Boundaries:**
- OWNS: serialization formats and versioning.
- DOES NOT OWN: gameplay rules.
**Interfaces:**
- Provides: loadProfile, saveProfile, listProfiles.
- Requires: local filesystem.

### Module: Analytics Logger
**Responsibility:** Capture structured event data locally.
**Boundaries:**
- OWNS: event schema, storage format.
- DOES NOT OWN: event generation logic.
**Interfaces:**
- Provides: logEvent.
- Requires: event stream, profile context.

## 8. Data Flow (Examples)
- Start run: Presentation -> Game Core API -> Run Orchestrator -> Dungeon System -> emits events -> Presentation renders state.
- Combat action: Presentation -> executeAction -> Combat System -> Items/Dread updates -> events -> Analytics Logger and Presentation.
- Extraction: Presentation -> Extraction System -> Run Orchestrator -> Profile Store -> events -> Presentation.
- Death: Combat System -> Death and Discovery -> Profile Store -> events -> Presentation.

## 9. Interface Contracts (TypeScript)
```ts
interface GameCore {
  getState(): GameState;
  getAvailableActions(): Action[];
  executeAction(action: Action): ActionResult;
  startNewRun(config: RunConfig): void;
  onEvent(eventType: EventType, handler: (event: GameEvent) => void): void;
}
```

## 10. Cross-Cutting Concerns
- Deterministic core with injected RNG and explicit seeds.
- No I/O in core modules.
- Event stream used for presentation and analytics.
- All tunable values are externalized.

## 11. Decision Log
| Decision | Options Considered | Choice | Rationale |
| --- | --- | --- | --- |
| Architecture style | Modular monolith, service split | Modular monolith | Local-only scope, simple deployment |
| Core/presentation boundary | Command-query API, direct state mutation | Command-query API | Future UI support, testability |
| Persistence | JSON files, embedded DB | JSON files | Low complexity, local-only |
| Content source | External JSON, hardcoded | External JSON | Data-driven iteration |
| MVP module scope | Core-only subset, all modules with phased depth | All modules listed in Section 6 | MVP covers all systems, with depth limited by design MVP scope |
| Content validation timing | Fail fast at startup, lazy/partial validation | Fail fast at startup | Early error detection; avoids mid-run corruption |
| Analytics schema & retention | Minimal subset, full event stream | Minimal subset (local JSON) | Keeps scope light while enabling later analysis |
| Agent mode timing | Post-MVP, MVP | MVP | Required for AI playtesting and analysis |

## 12. Next Steps for Engineer
- Confirm module boundaries and the command/query interface shape.
- Define concrete TypeScript types for core commands, state snapshots, and event payloads.
- Implement content validation rules for the registry and error handling strategy.
