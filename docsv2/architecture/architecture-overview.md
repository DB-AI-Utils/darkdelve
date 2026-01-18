# System Architecture: DARKDELVE (High-Level Overview)

## 1. Context
DARKDELVE is a single-player, local-only CLI game with future UI expansion. The architecture must separate game logic from presentation, keep logic deterministic, and keep all balance and content data external.

## 2. Constraints
- TypeScript implementation.
- Local-only runtime and persistence.
- Single-player session model.
- Single local profile (one save file).
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
- Architecture style: modular monolith for a local-only, single-process runtime.
- Core/presentation boundary: command and query API with an event stream.
- Persistence: single JSON save file with explicit versioning; no mid-dungeon saves.
- Content and balance source: external JSON with a Content Registry.
- Validation timing: fail fast at startup; dev hot-reload keeps last known good data.
- Analytics: minimal local JSON event set.
- Agent mode: included in MVP with structured JSON output.

## 5. System Overview
Actors:
- Human player (CLI).
- AI agent (structured output mode).

High-level flow:
- Presentation translates input into commands.
- Game Core validates commands, mutates state, emits events.
- Presentation queries state and renders output.
- Persistence stores and restores the single profile; mid-dungeon run state is not persisted.
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
- Event System: resolve event rooms, choices, and outcomes.
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
- Profile Store: local persistence for the single profile, saves, stash, unlocks (no mid-run saves).
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

### Module: Event System
**Responsibility:** Resolve EVENT rooms via data-driven definitions; present options and outcomes with deterministic pre-rolls.
**Boundaries:**
- OWNS: event instantiation, option availability, outcome resolution.
- DOES NOT OWN: room generation, combat resolution, persistence, rendering.
**Interfaces:**
- Provides: startEvent, getEventState, chooseOption.
- Requires: content registry, RNG, core systems for effect application.

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
**Responsibility:** Inventory, drops, identification, equip eligibility.
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
**Responsibility:** Persist profile state and camp checkpoints (no mid-run snapshots).
**Boundaries:**
- OWNS: serialization formats and versioning.
- DOES NOT OWN: gameplay rules.
**Interfaces:**
- Provides: loadProfile, saveProfile.
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

## 11. Next Steps for Engineer
- Confirm module boundaries and the command/query interface shape.
- Define concrete TypeScript types for core commands, state snapshots, and event payloads.
- Implement content validation rules for the registry and error handling strategy.
