# DARKDELVE MVP Architecture

> TypeScript/Node CLI roguelike with presentation-layer separation supporting both human (CLI) and AI (Agent/JSON) players.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript (Node.js, ES2022) | Fast iteration, excellent JSON handling, type safety |
| Presentation | Dual mode: CLI + Agent (JSON) | Enables automated playtesting from day one |
| Persistence | JSON files | Simple, human-readable, matches data-driven config approach |
| Analytics | Minimal events | Log deaths, extractions, combat outcomes for balance analysis |
| State Management | Immutable state + event emission | Predictable, testable, supports replay |
| RNG | Injectable, seedable | Deterministic tests, reproducible runs |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌─────────────────────┐       ┌─────────────────────────────┐  │
│  │   CLI Adapter       │       │   Agent Adapter (JSON)      │  │
│  │   - Input parsing   │       │   - JSON state output       │  │
│  │   - ASCII rendering │       │   - Command string input    │  │
│  │   - Color/format    │       │   - Structured responses    │  │
│  └──────────┬──────────┘       └──────────────┬──────────────┘  │
└─────────────┼──────────────────────────────────┼────────────────┘
              │                                  │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PresentationAdapter Interface                 │
│   render(state, dreadUncertainty) | getAction() | displayEvents │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Game Engine                              │
│   - State machine (CAMP → DUNGEON → COMBAT → DEAD/EXTRACTED)    │
│   - Coordinates subsystems                                       │
│   - Validates and executes actions                               │
│   - Emits events                                                 │
└─────────────────────────────┬───────────────────────────────────┘
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│  CombatSystem   │ │  DungeonSystem  │ │ DreadSystem │ │ Inventory   │
│  - Attack       │ │  - Generation   │ │ - Thresholds│ │ - Equipment │
│  - Defend       │ │  - Navigation   │ │ - Corruption│ │ - Items     │
│  - Flee         │ │  - Room state   │ │ - Watcher   │ │ - Gold      │
│  - Use item     │ │  - Extraction   │ │             │ │             │
└─────────────────┘ └─────────────────┘ └─────────────┘ └─────────────┘
              │               │               │               │
              └───────────────┼───────────────┴───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Content Registry                            │
│   - Loads JSON from configs/ and content/                        │
│   - Validates content at startup                                 │
│   - Provides typed accessors                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
darkdelve/
├── package.json
├── tsconfig.json
├── vitest.config.ts
│
├── configs/                       # Balance values (tunable)
│   ├── player.json               # Base stats, starting gear
│   ├── combat.json               # Flee chances, defend reduction
│   ├── dread.json                # Thresholds, gain rates
│   ├── extraction.json           # Floor costs
│   ├── stash.json                # Capacity
│   └── dungeon.json              # Rooms per floor
│
├── content/                       # Game entities (one file per entity)
│   ├── items/
│   │   ├── weapons/              # rusty_sword.json, iron_longsword.json, soulreaver_axe.json
│   │   ├── armor/                # tattered_leathers.json, chainmail_shirt.json
│   │   └── consumables/          # healing_potion.json, torch.json, clarity_potion.json
│   └── monsters/
│       ├── common/               # plague_rat, ghoul, skeleton_archer, armored_ghoul, shadow_stalker
│       └── bosses/               # bone_colossus.json, the_watcher.json
│
├── src/
│   ├── types/                    # Shared type definitions
│   │   ├── index.ts
│   │   ├── game-state.ts         # GameState, PlayerState, DungeonState, etc.
│   │   ├── actions.ts            # Action union type, ActionResult
│   │   ├── events.ts             # GameEvent union type
│   │   ├── content.ts            # ItemTemplate, MonsterTemplate
│   │   └── config.ts             # Config interfaces
│   │
│   ├── core/                     # Game logic (NO I/O)
│   │   ├── index.ts
│   │   ├── game-engine.ts        # Central state machine
│   │   ├── combat-system.ts      # Attack, Defend, Use Item, Flee
│   │   ├── dungeon-system.ts     # Floor/room generation, navigation
│   │   ├── dread-system.ts       # Thresholds, corruption calculation
│   │   ├── inventory-system.ts   # Equipment, consumables, gold
│   │   ├── stash-system.ts       # Persistent storage
│   │   ├── bestiary-system.ts    # Encounter tracking, unlocks
│   │   └── rng.ts                # Seedable PRNG
│   │
│   ├── content/                  # Content loading
│   │   ├── index.ts
│   │   ├── content-registry.ts   # Load, validate, cache, typed access
│   │   ├── loaders/
│   │   └── validators/
│   │
│   ├── presentation/             # UI layer
│   │   ├── index.ts
│   │   ├── adapter.ts            # PresentationAdapter interface
│   │   ├── cli/                  # CLI implementation
│   │   │   ├── cli-adapter.ts
│   │   │   ├── input-parser.ts
│   │   │   ├── renderer.ts
│   │   │   └── ascii-map.ts
│   │   └── agent/                # JSON output for AI players
│   │       └── agent-adapter.ts
│   │
│   ├── persistence/
│   │   ├── index.ts
│   │   └── json-persistence.ts   # Save/load to JSON files
│   │
│   ├── analytics/
│   │   ├── index.ts
│   │   ├── analytics-logger.ts   # Event logging to JSONL
│   │   └── analytics-types.ts    # AnalyticsEvent interface
│   │
│   └── main.ts
│
├── data/                          # Runtime data (gitignored)
│   ├── saves/
│   └── analytics/
│
└── tests/
    ├── core/
    ├── content/
    └── integration/
```

---

## Core Interfaces

### GameState (src/types/game-state.ts)

```typescript
type GamePhase = 'CAMP' | 'DUNGEON' | 'COMBAT' | 'DEAD' | 'EXTRACTED';

interface GameState {
  phase: GamePhase;
  player: PlayerState;
  dungeon: DungeonState | null;
  combat: CombatState | null;
  session: SessionState;
  persistent: PersistentState;
}

interface PlayerState {
  hp: number;
  maxHp: number;
  stats: { vigor: number; might: number; cunning: number };
  equipment: { weapon: ItemInstance | null; armor: ItemInstance | null };
  consumables: ItemInstance[];
  gold: number;
  dread: number;
}

interface DungeonState {
  floor: number;
  currentRoomId: string;
  rooms: Map<string, RoomState>;
  roomsCleared: number;
}

interface RoomState {
  id: string;
  type: 'combat' | 'treasure' | 'empty' | 'stairwell' | 'boss';
  explored: boolean;
  adjacentRoomIds: string[];
  enemy?: EnemyInstance;              // For combat rooms (null if defeated)
  chest?: { opened: boolean; trapped: boolean };
  flavorText?: string;
}

interface EnemyInstance {
  templateId: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: [number, number];
  currentPhase: number;               // For bosses with phases
  attacksFirst: boolean;
  damageReduction: number;
  ambushTriggered: boolean;
  telegraphs: string[];
  canFlee: boolean;
}

interface ItemInstance {
  id: string;                         // Unique instance ID (uuid)
  templateId: string;
  usesRemaining?: number;             // For consumables with limited uses (torch)
}

interface SessionState {
  runNumber: number;
  seed: number;
  goldEarnedThisRun: number;
  itemsFoundThisRun: string[];
  torchUsesThisRun: number;
  consumablesBroughtFromStash: number;
}

interface BestiaryState {
  entries: Map<string, BestiaryEntry>;
}

interface BestiaryEntry {
  monsterId: string;
  encounters: number;
  kills: number;
  deathsTo: number;
  tier: 1 | 2 | 3;                    // 1=name, 2=stats, 3=abilities
}

interface MonsterPhase {
  hpThreshold: number;                // Phase activates when HP <= this
  damageBonus: number;
  attacksPerTurn: number;
  telegraph?: string;
}

interface AvailableActions {
  phase: GamePhase;
  actions: Action[];
}

interface CombatState {
  enemy: EnemyInstance;
  turn: number;
  playerDefendCooldown: number;
  canFlee: boolean;
  enemyTelegraph: string | null;
  playerDefending: boolean;
}

interface PersistentState {
  stash: ItemInstance[];
  gold: number;
  bestiary: BestiaryState;
  totalRuns: number;
  totalDeaths: number;
  totalExtractions: number;
}
```

### Actions (src/types/actions.ts)

```typescript
type Action =
  // Camp actions
  | { type: 'ENTER_DUNGEON'; itemsToBring: string[] }
  | { type: 'VIEW_STASH' }
  | { type: 'VIEW_BESTIARY' }
  | { type: 'DEPOSIT_TO_STASH'; itemId: string }
  | { type: 'WITHDRAW_FROM_STASH'; itemId: string }
  // Dungeon actions
  | { type: 'MOVE_TO_ROOM'; roomId: string }
  | { type: 'DESCEND_FLOOR' }
  | { type: 'EXTRACT' }
  | { type: 'OPEN_CHEST' }
  // Combat actions
  | { type: 'ATTACK' }
  | { type: 'DEFEND' }
  | { type: 'USE_ITEM'; itemId: string }
  | { type: 'FLEE' };

interface ActionResult {
  success: boolean;
  error?: string;
  events: GameEvent[];
  newState: GameState;
}
```

### Events (src/types/events.ts)

```typescript
type GameEvent =
  // Combat events
  | { type: 'DAMAGE_DEALT'; source: 'player' | 'enemy'; amount: number; isCrit: boolean }
  | { type: 'DAMAGE_BLOCKED'; originalAmount: number; reducedTo: number }
  | { type: 'ENEMY_DIED'; enemyId: string; goldDropped: number; itemDropped: string | null }
  | { type: 'PLAYER_DIED'; cause: string; floor: number; dread: number }
  | { type: 'FLEE_ATTEMPTED'; success: boolean; dreadGained: number }
  | { type: 'COMBAT_STARTED'; enemyId: string; enemyName: string }
  | { type: 'COMBAT_ENDED'; outcome: 'VICTORY' | 'FLED' | 'DEATH' }

  // Dread events
  | { type: 'DREAD_CHANGED'; oldValue: number; newValue: number; source: string }
  | { type: 'DREAD_THRESHOLD_CROSSED'; threshold: DreadThreshold }
  | { type: 'WATCHER_SPAWNED' }

  // Exploration events
  | { type: 'ROOM_ENTERED'; roomId: string; roomType: string }
  | { type: 'FLOOR_DESCENDED'; newFloor: number }
  | { type: 'EXTRACTION_COMPLETED'; goldEarned: number; itemsKept: string[] }

  // Item events
  | { type: 'ITEM_FOUND'; itemId: string; itemName: string }
  | { type: 'ITEM_USED'; itemId: string; effect: string }

  // Bestiary events
  | { type: 'BESTIARY_UNLOCKED'; monsterId: string; tier: 1 | 2 | 3 };
```

### GameEngine (src/core/game-engine.ts)

```typescript
interface GameEngine {
  // State queries
  getState(): GameState;
  getAvailableActions(): AvailableActions;
  getDreadUncertainty(): DreadUncertainty;

  // Commands
  executeAction(action: Action): ActionResult;
  startNewRun(config: RunConfig): void;

  // Event subscription
  subscribe(callback: (event: GameEvent) => void): () => void;

  // Serialization
  serialize(): SerializedGameState;
  static deserialize(data: SerializedGameState, deps: GameDependencies): GameEngine;
}

interface RunConfig {
  itemsToBring: string[];  // Item instance IDs from stash (max 2, max 1 consumable)
  seed?: number;           // Optional RNG seed for reproducibility
}

interface DreadUncertainty {
  level: 'CALM' | 'UNEASY' | 'SHAKEN' | 'TERRIFIED' | 'BREAKING_POINT';
  corruptionChance: number;
  corruptedEnemyHp?: {
    actual: number;
    displayRange: [number, number];
  };
}
```

### PresentationAdapter (src/presentation/adapter.ts)

```typescript
interface PresentationAdapter {
  initialize(): Promise<void>;
  render(state: GameState, dreadUncertainty: DreadUncertainty): void;
  getAction(available: AvailableActions): Promise<Action>;
  displayEvents(events: GameEvent[]): void;
  displayError(message: string): void;
  shutdown(): void;
}
```

### ContentRegistry (src/content/content-registry.ts)

```typescript
interface ContentRegistry {
  // Items
  getItem(id: string): ItemTemplate;
  getItemsBySlot(slot: ItemTemplate['slot']): ItemTemplate[];
  getItemsByRarity(rarity: ItemTemplate['rarity']): ItemTemplate[];
  getDroppableItems(floor: number): ItemTemplate[];

  // Monsters
  getMonster(id: string): MonsterTemplate;
  getMonstersForFloor(floor: number): MonsterTemplate[];

  // Configs
  getPlayerConfig(): PlayerConfig;
  getCombatConfig(): CombatConfig;
  getDreadConfig(): DreadConfig;
  getExtractionConfig(): ExtractionConfig;
  getStashConfig(): StashConfig;
  getDungeonConfig(): DungeonConfig;

  // Validation
  validate(): ValidationResult;
}
```

---

## Content Types

### ItemTemplate (src/types/content.ts)

```typescript
interface ItemTemplate {
  id: string;
  name: string;
  flavorText: string;
  slot: 'weapon' | 'armor' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare';

  // Weapon properties
  damage?: [number, number];
  critBonus?: number;
  lifesteal?: number;

  // Armor properties
  hpBonus?: number;

  // Consumable properties
  healAmount?: number;
  dreadReduction?: number;
  clearsDreadCorruption?: number;     // Duration in rooms (e.g., 3)
  maxUsesPerRun?: number;

  // Drop info
  dropFloorMin?: number;
  sellValue: number;
}
```

### MonsterTemplate (src/types/content.ts)

```typescript
interface MonsterTemplate {
  id: string;
  name: string;
  flavorText: string;
  type: 'common' | 'boss';

  hp: [number, number];
  damage: [number, number];

  // Special abilities
  attacksFirst?: boolean;           // Plague Rat
  damageReduction?: number;         // Armored Ghoul (0.25)
  ambush?: boolean;                 // Shadow Stalker
  phases?: MonsterPhase[];          // Bone Colossus

  // Spawn info
  spawnFloors: number[];

  // Loot
  goldDrop: [number, number];
  itemDropChance: number;

  // Tells
  telegraphs?: string[];

  // Flags
  canFlee: boolean;
}
```

---

## Dread System Architecture

The Dread system's "unreliable narrator" effect is split between Core and Presentation:

| Layer | Responsibility |
|-------|----------------|
| **Core** | Calculate Dread level, determine what information is uncertain |
| **Presentation** | Render uncertainty appropriately (CLI: wrong values, whispers; Agent: ranges) |

```typescript
// Core returns uncertainty info
interface DreadUncertainty {
  level: 'CALM' | 'UNEASY' | 'SHAKEN' | 'TERRIFIED' | 'BREAKING_POINT';
  corruptionChance: number;  // 0, 0.05, 0.15, 0.25
  corruptedEnemyHp?: {
    actual: number;
    displayRange: [number, number];  // e.g., actual 20 → display "16-24"
  };
}

// CLI renders:
// "The Ghoul has 18 HP"  (actually 20)

// Agent returns:
// { "enemyHp": { "uncertain": true, "range": [16, 24] } }
```

**Critical rule**: Dread corrupts DISPLAY only. Actual game state is always correct. Player inputs always work.

---

## Dungeon Generation

Each floor is a graph of rooms with adjacency connections.

```typescript
interface FloorTemplate {
  floor: number;
  roomCount: number;                  // Excluding stairwell
  roomDistribution: {
    combat: number;                   // e.g., 0.6 = 60% combat rooms
    treasure: number;
    empty: number;
  };
  monsterPool: string[];              // Monster IDs that can spawn
  guaranteedRooms?: string[];         // e.g., "boss" for floor 5
}
```

**Generation algorithm** (per floor):

1. Create `roomCount` rooms with types per distribution
2. Always add one stairwell room (floor 5: boss room instead)
3. Connect rooms as a graph (each room has 1-3 adjacencies, all rooms reachable)
4. Place player at entrance room (first combat or empty room)
5. Populate combat rooms with random monsters from pool
6. Populate treasure rooms with chests (10% trapped)

**Room IDs**: `f{floor}_r{index}` (e.g., `f1_r0`, `f1_r1`)

---

## RNG Interface

```typescript
interface RNG {
  random(): number;                            // [0, 1)
  rollRange(min: number, max: number): number; // Inclusive integers
  rollChance(percent: number): boolean;        // 0-100
  pick<T>(array: T[]): T;                      // Random element
  shuffle<T>(array: T[]): T[];                 // Fisher-Yates
}

function createSeededRNG(seed: number): RNG;
function createRandomRNG(): RNG;
```

Seedable RNG enables:
- Deterministic tests
- Reproducible runs for debugging
- AI agent strategy comparison

---

## State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Presentation calls engine.getState()                        │
│     └─> Returns current GameState                               │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Presentation calls engine.getDreadUncertainty()             │
│     └─> Returns corruption info for display                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Presentation renders state + uncertainty                    │
│     └─> CLI: ASCII with colors | Agent: JSON                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Presentation calls engine.getAvailableActions()             │
│     └─> Returns valid actions for current phase                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Presentation gets action from user/agent                    │
│     └─> getAction() prompts and parses input                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Presentation calls engine.executeAction(action)             │
│     └─> Returns ActionResult { success, events, newState }      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Presentation displays events                                │
│     └─> displayEvents() renders damage, loot, etc.              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                          Loop back to 1
```

---

## Event System

Events are:
- **Facts** - describe what happened, not what should happen
- **Synchronous** - emitted during action execution, included in ActionResult
- **For presentation** - Core doesn't care if anyone is listening
- **For analytics** - same events drive both display and logging

```
executeAction(ATTACK)
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  CombatSystem.resolveAttack()                                   │
│    ├─> events.push({ type: 'DAMAGE_DEALT', amount: 12, ... })   │
│    └─> if enemy.hp <= 0:                                        │
│          events.push({ type: 'ENEMY_DIED', goldDropped: 8 })    │
│          events.push({ type: 'DREAD_CHANGED', +5 })             │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  return ActionResult { events: [...], newState: ... }           │
└─────────────────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
┌──────────────────────┐            ┌─────────────────────────────┐
│  Presentation        │            │  Analytics                  │
│  displayEvents()     │            │  logEvents()                │
└──────────────────────┘            └─────────────────────────────┘
```

---

## Analytics Events

All events logged to JSONL with context for balance analysis.

```typescript
interface AnalyticsEvent {
  timestamp: string;
  gameVersion: string;
  playerType: 'human' | 'ai_agent';
  runId: string;
  event: AnalyticsEventData;
  context: {
    floor: number;
    dread: number;
    hp: number;
    gold: number;
  };
}

type AnalyticsEventData =
  | { type: 'RUN_STARTED'; seed: number; itemsBrought: string[] }
  | { type: 'COMBAT_RESOLVED'; enemyId: string; outcome: 'victory' | 'fled' | 'death'; turns: number; damageDealt: number; damageTaken: number }
  | { type: 'EXTRACTION_DECISION'; floor: number; goldAtRisk: number; itemsAtRisk: number; dread: number; choice: 'continue' | 'extract' }
  | { type: 'RUN_ENDED'; outcome: 'death' | 'extraction'; floor: number; goldEarned: number; itemsKept: string[]; durationSeconds: number }
  | { type: 'DREAD_THRESHOLD'; threshold: string; floor: number };
```

---

## Config File Examples

### configs/player.json

```json
{
  "baseHp": 35,
  "startingStats": {
    "vigor": 3,
    "might": 3,
    "cunning": 3
  },
  "statBonuses": {
    "vigorHpPerPoint": 5,
    "mightDamagePerPoint": 1,
    "cunningCritPerPoint": 3,
    "cunningFleePerPoint": 5
  },
  "baseCritChance": 5,
  "critMultiplier": 2,
  "startingEquipment": {
    "weapon": "rusty_sword",
    "armor": "tattered_leathers"
  }
}
```

### configs/dread.json

```json
{
  "thresholds": {
    "uneasy": 50,
    "shaken": 70,
    "terrified": 85,
    "breakingPoint": 100
  },
  "corruptionChances": {
    "calm": 0,
    "uneasy": 0.05,
    "shaken": 0.15,
    "terrified": 0.25
  },
  "hpCorruptionRange": 0.2,
  "gains": {
    "roomClearedFloor1_2": 5,
    "roomClearedFloor3_4": 8,
    "roomClearedFloor5": 10,
    "trappedChest": 10,
    "fleeSuccess": 8
  },
  "recovery": {
    "stairwellReached": -5,
    "torch": -5,
    "torchMaxPerRun": 3
  }
}
```

### configs/combat.json

```json
{
  "defendDamageReduction": 0.5,
  "defendCooldown": 2,
  "fleeChances": {
    "basic": 70,
    "elite": 50
  },
  "fleeDreadGain": 8,
  "canFleeOnTurn1": false,
  "canFleeBosses": false
}
```

### configs/extraction.json

```json
{
  "floorCosts": {
    "1": 0,
    "2": 0,
    "3": 30,
    "4": 60
  },
  "floor5Extraction": {
    "requiresBossOrAlternative": true,
    "alternativeGoldCost": 100,
    "alternativeSpawnsMiniBoss": "shadow_stalker"
  },
  "extractionBonusPerFloor": 15
}
```

### configs/dungeon.json

```json
{
  "floors": [
    { "floor": 1, "roomCount": 3, "roomDistribution": { "combat": 0.7, "treasure": 0.2, "empty": 0.1 }, "monsterPool": ["plague_rat", "ghoul"] },
    { "floor": 2, "roomCount": 4, "roomDistribution": { "combat": 0.6, "treasure": 0.25, "empty": 0.15 }, "monsterPool": ["plague_rat", "ghoul", "skeleton_archer"] },
    { "floor": 3, "roomCount": 4, "roomDistribution": { "combat": 0.7, "treasure": 0.2, "empty": 0.1 }, "monsterPool": ["ghoul", "skeleton_archer", "armored_ghoul"] },
    { "floor": 4, "roomCount": 5, "roomDistribution": { "combat": 0.7, "treasure": 0.2, "empty": 0.1 }, "monsterPool": ["skeleton_archer", "armored_ghoul", "shadow_stalker"] },
    { "floor": 5, "roomCount": 5, "roomDistribution": { "combat": 0.8, "treasure": 0.1, "empty": 0.1 }, "monsterPool": ["armored_ghoul", "shadow_stalker"], "guaranteedRooms": ["boss"] }
  ],
  "trappedChestChance": 0.1,
  "guaranteedUncommonFloor": 2
}
```

---

## Content File Examples

### content/monsters/common/ghoul.json

```json
{
  "id": "ghoul",
  "name": "Ghoul",
  "flavorText": "A corpse that forgot to stop moving.",
  "type": "common",
  "hp": [20, 25],
  "damage": [8, 12],
  "spawnFloors": [1, 2, 3],
  "goldDrop": [4, 8],
  "itemDropChance": 0.15,
  "canFlee": true,
  "telegraphs": [
    "The Ghoul raises its claws...",
    "The Ghoul's eyes flash with hunger..."
  ]
}
```

### content/items/weapons/soulreaver_axe.json

```json
{
  "id": "soulreaver_axe",
  "name": "Soulreaver Axe",
  "flavorText": "It drinks what it cleaves.",
  "slot": "weapon",
  "rarity": "rare",
  "damage": [9, 14],
  "lifesteal": 0.1,
  "dropFloorMin": 3,
  "sellValue": 75
}
```

---

## Implementation Order

### Phase 1: Foundation

1. **Project setup**
   - Initialize package.json, tsconfig.json
   - Install dependencies (chalk for CLI colors)
   - Configure Vitest, ESLint, Prettier

2. **Type definitions** (`src/types/`)
   - game-state.ts
   - actions.ts
   - events.ts
   - content.ts
   - config.ts

3. **Config files** (`configs/`)
   - player.json, combat.json, dread.json
   - extraction.json, stash.json, dungeon.json

4. **Content Registry skeleton**
   - Basic loading mechanism
   - Typed accessors (stubs)

### Phase 2: Core Systems

5. **RNG module** (`src/core/rng.ts`)
6. **GameEngine skeleton** (`src/core/game-engine.ts`)
7. **Combat system** (`src/core/combat-system.ts`)
8. **Dungeon system** (`src/core/dungeon-system.ts`)
9. **Dread system** (`src/core/dread-system.ts`)

### Phase 3: Content and Persistence

10. **Content JSON files** (`content/`)
11. **Content Registry full implementation**
12. **Inventory system** (`src/core/inventory-system.ts`)
13. **Stash system** (`src/core/stash-system.ts`)
14. **Bestiary system** (`src/core/bestiary-system.ts`)
15. **JSON persistence** (`src/persistence/`)

### Phase 4: Presentation

16. **CLI Adapter** (`src/presentation/cli/`)
17. **Agent Adapter** (`src/presentation/agent/`)
18. **Dread display corruption**

### Phase 5: Polish

19. **Analytics logging** (`src/analytics/`)
20. **Death flow** ("Lesson Learned" screen)
21. **Extraction flow**
22. **Tests**

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/core/game-engine.ts` | Central state machine, everything depends on this |
| `src/types/game-state.ts` | Core type definitions shared across all modules |
| `src/content/content-registry.ts` | Loads all JSON, combat/dungeon depend on it |
| `src/core/combat-system.ts` | The 4 combat actions (heart of gameplay) |
| `src/presentation/adapter.ts` | Interface contract for CLI and Agent mode |

---

## Verification

| Check | Command/Method |
|-------|----------------|
| Unit tests | `npm test` - core systems should have >80% coverage |
| Seeded runs | Same seed produces identical run outcomes |
| CLI mode | `npm start` - play through camp → dungeon → extract/death |
| Agent mode | `npm start -- --agent` - verify JSON output |
| Persistence | Quit and restart - stash/bestiary/gold preserved |
| Dread corruption | At 50+ Dread, enemy HP displays should vary from actual |

---

## Module Responsibilities

| Module | Responsibility | Depends On |
|--------|----------------|------------|
| `GameEngine` | State machine, action dispatch, event emission | All systems, ContentRegistry |
| `CombatSystem` | Combat resolution, damage calculation | ContentRegistry, RNG |
| `DungeonSystem` | Floor/room generation, navigation | ContentRegistry, RNG |
| `DreadSystem` | Dread tracking, threshold effects | ContentRegistry |
| `InventorySystem` | Player items, equipment slots | ContentRegistry |
| `StashSystem` | Persistent item storage | InventorySystem |
| `BestiarySystem` | Encounter tracking, unlocks | ContentRegistry |
| `ContentRegistry` | Content and config loading | File system (at startup only) |
| `CLIAdapter` | Human-readable I/O | GameEngine |
| `AgentAdapter` | JSON I/O | GameEngine |
| `Persistence` | Save/load game state | File system |
| `Analytics` | Event logging | File system |

---

*Document version: 1.1*
*Updated: 2026-01-25*
