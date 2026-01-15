# 10 - Dungeon System

## Purpose

Floor generation and room navigation engine. Generates dungeon layouts using a hybrid approach (fixed skeleton with random content), manages room states and transitions, and provides navigation options with preview information. Works with the Dread system to corrupt navigation previews at high Dread levels.

---

## Responsibilities

1. Generate dungeon layouts from templates (fixed floor count, room distribution)
2. Populate rooms with randomized content (enemies, loot, events)
3. Track room states (UNEXPLORED, ENTERED, CLEARED)
4. Provide navigation options with room type previews
5. Support backtracking to cleared rooms (with turn cost)
6. Manage floor transitions via stairwell rooms
7. Coordinate with Combat system for combat room encounters
8. Expose room data for Dread-based corruption by presentation layer

---

## Dependencies

- **01-foundation**: Types (`FloorNumber`, `RoomType`, `RoomState`, `EntityId`, `EnemyType`), `SeededRNG`, `Result`, `generateEntityId`
- **02-content-registry**: `DungeonTemplate`, `FloorTemplate`, `MonsterTemplate`, `EventTemplate`, `LootTable`
- **03-state-management**: `DungeonState`, `FloorState`, `RoomInstanceState`, `RoomContents`
- **04-event-system**: `EventBus`, navigation events (`ROOM_ENTERED`, `ROOM_CLEARED`, `FLOOR_DESCENDED`)
- **08-combat-system**: Combat initialization when entering combat rooms

---

## Interface Contracts

### Dungeon Generator

```typescript
// ==================== Dungeon Generation ====================

interface DungeonGenerator {
  /**
   * Generate a complete dungeon from a template.
   * Creates all floors with randomized room layouts and content.
   * @param template - Dungeon template from content registry
   * @param rng - Seeded RNG for deterministic generation
   * @returns Complete dungeon state ready for exploration
   */
  generateDungeon(
    template: DungeonTemplate,
    rng: SeededRNG
  ): DungeonState;

  /**
   * Generate a single floor from template.
   * @param floorTemplate - Floor configuration
   * @param floorNumber - Floor number (1-5)
   * @param monsterPool - Available monsters for this floor
   * @param eventPool - Available events for this floor
   * @param rng - Seeded RNG
   */
  generateFloor(
    floorTemplate: FloorTemplate,
    floorNumber: FloorNumber,
    monsterPool: readonly MonsterTemplate[],
    eventPool: readonly EventTemplate[],
    rng: SeededRNG
  ): FloorState;
}

/**
 * Create dungeon generator instance
 */
function createDungeonGenerator(
  contentRegistry: ContentRegistry
): DungeonGenerator;
```

### Navigation Manager

```typescript
// ==================== Navigation Management ====================

interface NavigationManager {
  /**
   * Get available navigation options from current room.
   * Returns connected rooms with preview information.
   * NOTE: Preview data may be corrupted by Dread - presentation layer handles this.
   */
  getNavigationOptions(
    dungeon: DungeonState,
    currentRoomId: string
  ): NavigationOption[];

  /**
   * Move to an adjacent room.
   * Validates the move and updates room states.
   * @returns Result with new dungeon state and events
   */
  moveToRoom(
    dungeon: DungeonState,
    targetRoomId: string
  ): Result<NavigationResult, NavigationError>;

  /**
   * Move to a previously cleared room (backtrack).
   * Incurs 1 exploration turn cost.
   * @returns Result with new dungeon state and events
   */
  backtrackToRoom(
    dungeon: DungeonState,
    targetRoomId: string
  ): Result<NavigationResult, NavigationError>;

  /**
   * Descend to the next floor via stairwell.
   * @returns Result with new dungeon state positioned at next floor start
   */
  descendFloor(
    dungeon: DungeonState
  ): Result<NavigationResult, NavigationError>;

  /**
   * Get all cleared rooms on current floor (for backtrack options).
   */
  getClearedRooms(
    dungeon: DungeonState
  ): readonly RoomInstanceState[];

  /**
   * Get current room state.
   */
  getCurrentRoom(
    dungeon: DungeonState
  ): RoomInstanceState;

  /**
   * Check if room is accessible from current position.
   */
  isRoomAccessible(
    dungeon: DungeonState,
    roomId: string
  ): boolean;
}

/**
 * Create navigation manager instance
 */
function createNavigationManager(
  eventBus: EventBus
): NavigationManager;
```

### Room State Manager

```typescript
// ==================== Room State Management ====================

interface RoomStateManager {
  /**
   * Mark a room as entered (first visit).
   * Transitions from UNEXPLORED to ENTERED.
   */
  enterRoom(
    dungeon: DungeonState,
    roomId: string
  ): DungeonState;

  /**
   * Mark a room as cleared.
   * Transitions from ENTERED to CLEARED.
   */
  clearRoom(
    dungeon: DungeonState,
    roomId: string
  ): DungeonState;

  /**
   * Update room contents (e.g., mark enemy defeated, chest opened).
   */
  updateRoomContents(
    dungeon: DungeonState,
    roomId: string,
    updater: (contents: RoomContents) => RoomContents
  ): DungeonState;

  /**
   * Get room by ID across all floors.
   */
  getRoomById(
    dungeon: DungeonState,
    roomId: string
  ): RoomInstanceState | undefined;

  /**
   * Get all rooms on a specific floor.
   */
  getRoomsOnFloor(
    dungeon: DungeonState,
    floor: FloorNumber
  ): readonly RoomInstanceState[];
}

/**
 * Create room state manager instance
 */
function createRoomStateManager(): RoomStateManager;
```

### Types

```typescript
// ==================== Floor Configuration ====================

/**
 * Floor layout specification from design document.
 * Fixed distribution ensures consistent experience.
 */
interface FloorConfig {
  floor: FloorNumber;
  roomCount: number;
  combatRooms: number;
  treasureRooms: number;
  eventRooms: number;
  restRooms: number;
  hasStairwell: boolean;
  hasThreshold: boolean;
  hasBoss: boolean;
  eliteSpawnChance: number;
}

/**
 * MVP floor configurations (from design doc).
 */
const FLOOR_CONFIGS: readonly FloorConfig[] = [
  {
    floor: 1,
    roomCount: 4,
    combatRooms: 2,
    treasureRooms: 1,
    eventRooms: 1,
    restRooms: 0,
    hasStairwell: true,
    hasThreshold: false,
    hasBoss: false,
    eliteSpawnChance: 0.00
  },
  {
    floor: 2,
    roomCount: 4,
    combatRooms: 2,
    treasureRooms: 1,
    eventRooms: 1,
    restRooms: 0,
    hasStairwell: true,
    hasThreshold: false,
    hasBoss: false,
    eliteSpawnChance: 0.10
  },
  {
    floor: 3,
    roomCount: 4,
    combatRooms: 2,
    treasureRooms: 1,
    eventRooms: 1,
    restRooms: 0,
    hasStairwell: true,
    hasThreshold: false,
    hasBoss: false,
    eliteSpawnChance: 0.10
  },
  {
    floor: 4,
    roomCount: 4,
    combatRooms: 2,
    treasureRooms: 1,
    eventRooms: 1,
    restRooms: 0,
    hasStairwell: true,
    hasThreshold: false,
    hasBoss: false,
    eliteSpawnChance: 0.10
  },
  {
    floor: 5,
    roomCount: 7,
    combatRooms: 4,
    treasureRooms: 1,
    eventRooms: 1,
    restRooms: 0,
    hasStairwell: false,
    hasThreshold: true,
    hasBoss: true,
    eliteSpawnChance: 0.10
  }
];

// ==================== Navigation Types ====================

interface NavigationOption {
  /** Target room ID */
  roomId: string;

  /** Direction from current room */
  direction: Direction;

  /** Room type (actual value - presentation layer corrupts if needed) */
  roomType: RoomType;

  /** Current room state */
  roomState: RoomState;

  /** Display number for player selection (1, 2, 3...) */
  optionNumber: number;

  /** Whether this is a backtrack option */
  isBacktrack: boolean;

  /** Turn cost (0 for forward, 1 for backtrack) */
  turnCost: number;

  /** Preview hint for unexplored rooms */
  preview: RoomPreview | null;
}

interface RoomPreview {
  /** Hint about room difficulty/value */
  dangerLevel: 'low' | 'medium' | 'high';

  /** Whether room contains treasure */
  hasTreasure: boolean;

  /** Whether room contains combat */
  hasCombat: boolean;

  /** Enemy type hint (if combat) */
  enemyTypeHint?: EnemyType;
}

type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

interface NavigationResult {
  /** Updated dungeon state */
  dungeon: DungeonState;

  /** Events generated by the move */
  events: readonly GameEvent[];

  /** New current room */
  currentRoom: RoomInstanceState;

  /** Whether this was first entry to the room */
  firstVisit: boolean;

  /** Exploration turns added (1 for backtrack, 0 for forward) */
  explorationTurnsAdded: number;

  /** Whether floor changed */
  floorChanged: boolean;
}

interface NavigationError {
  code: NavigationErrorCode;
  message: string;
}

type NavigationErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_NOT_ADJACENT'
  | 'ROOM_NOT_CLEARED'      // For backtrack to non-cleared room
  | 'CANNOT_DESCEND'        // Not at stairwell
  | 'COMBAT_IN_PROGRESS'    // Must resolve combat first
  | 'BOSS_NOT_DEFEATED';    // Cannot leave boss room until defeated

// ==================== Room Instance Types ====================

/**
 * Runtime room instance with generated content.
 * Extends base types from 03-state-management.
 */
interface RoomInstanceState {
  /** Unique room ID */
  readonly id: string;

  /** Room type */
  readonly type: RoomType;

  /** Current exploration state */
  readonly state: RoomState;

  /** Connected rooms */
  readonly connections: readonly RoomConnection[];

  /** Room-specific contents */
  readonly contents: RoomContents;

  /** Floor this room is on */
  readonly floor: FloorNumber;

  /** Position in floor layout (for consistent ordering) */
  readonly layoutIndex: number;
}

interface RoomConnection {
  /** Target room ID */
  readonly targetRoomId: string;

  /** Direction to reach target */
  readonly direction: Direction;
}

// ==================== Room Contents Types ====================

/**
 * Combat room contents.
 */
interface CombatRoomContents {
  readonly type: 'combat';

  /** Enemy template ID */
  readonly enemyTemplateId: string;

  /** Enemy instance ID (generated on room creation) */
  readonly enemyInstanceId: EntityId;

  /** Whether enemy is an elite */
  readonly isElite: boolean;

  /** Whether combat has been completed */
  readonly defeated: boolean;

  /** Loot drops (generated on enemy defeat) */
  readonly loot: readonly LootDropState[];

  /** Whether loot has been collected */
  readonly lootCollected: boolean;
}

/**
 * Treasure room contents.
 */
interface TreasureRoomContents {
  readonly type: 'treasure';

  /** Chest type affects loot quality */
  readonly chestType: 'standard' | 'locked' | 'ornate';

  /** Whether chest has been opened */
  readonly opened: boolean;

  /** Whether chest is trapped */
  readonly trapped: boolean;

  /** Whether trap was triggered */
  readonly trapTriggered: boolean;

  /** Loot contents (generated on chest open) */
  readonly loot: readonly LootDropState[];

  /** Whether loot has been collected */
  readonly lootCollected: boolean;

  /** Whether player examined chest before opening */
  readonly examined: boolean;
}

/**
 * Event room contents.
 */
interface EventRoomContents {
  readonly type: 'event';

  /** Event template ID */
  readonly eventTemplateId: string;

  /** Whether event has been completed */
  readonly completed: boolean;

  /** Choice made (null if not completed) */
  readonly choiceMade: string | null;
}

/**
 * Rest room contents.
 */
interface RestRoomContents {
  readonly type: 'rest';

  /** Type of rest area */
  readonly restType: 'safe_alcove' | 'corrupted';

  /** Whether rest has been used */
  readonly used: boolean;

  /** Whether ambush was triggered (corrupted rest) */
  readonly ambushTriggered: boolean;
}

/**
 * Stairwell room contents.
 */
interface StairwellRoomContents {
  readonly type: 'stairwell';

  /** Whether extraction is available */
  readonly canExtract: boolean;

  /** Extraction cost (null if free) */
  readonly extractionCost: ExtractionCostState | null;

  /** Whether this leads to next floor (vs exit) */
  readonly leadsToNextFloor: boolean;
}

/**
 * Threshold room contents (pre-boss checkpoint).
 */
interface ThresholdRoomContents {
  readonly type: 'threshold';

  /** Cost to retreat from this point */
  readonly retreatCost: RetreatCostState;

  /** Whether boss is ready to fight */
  readonly bossReady: boolean;

  /** Warning message about boss */
  readonly warningText: string;
}

/**
 * Boss room contents.
 */
interface BossRoomContents {
  readonly type: 'boss';

  /** Boss template ID */
  readonly bossTemplateId: string;

  /** Boss instance ID */
  readonly bossInstanceId: EntityId;

  /** Whether boss has been defeated */
  readonly defeated: boolean;

  /** Boss loot (generated on defeat) */
  readonly loot: readonly LootDropState[];

  /** Whether loot has been collected */
  readonly lootCollected: boolean;

  /** Post-boss extraction available */
  readonly exitUnlocked: boolean;
}

/**
 * Loot drop state.
 */
interface LootDropState {
  readonly id: EntityId;
  readonly type: 'item' | 'gold';
  readonly templateId?: string;
  readonly gold?: number;
  readonly collected: boolean;
}

/**
 * Extraction cost state.
 */
interface ExtractionCostState {
  readonly type: 'free' | 'gold' | 'item';
  readonly goldAmount?: number;
  readonly goldPercent?: number;
}

/**
 * Retreat cost state.
 */
interface RetreatCostState {
  readonly goldAmount: number;
  readonly goldPercent: number;
  readonly canPayWithItem: boolean;
}

// ==================== Generation Types ====================

/**
 * Room generation parameters.
 */
interface RoomGenerationParams {
  /** Room type to generate */
  type: RoomType;

  /** Floor number */
  floor: FloorNumber;

  /** Position in layout */
  layoutIndex: number;

  /** Available monsters for combat rooms */
  monsterPool: readonly MonsterTemplate[];

  /** Available events for event rooms */
  eventPool: readonly EventTemplate[];

  /** Elite spawn chance */
  eliteChance: number;

  /** Dungeon template ID */
  dungeonId: string;
}

/**
 * Floor layout graph.
 */
interface FloorLayout {
  /** All rooms in the floor */
  rooms: RoomInstanceState[];

  /** Starting room ID */
  startRoomId: string;

  /** Exit room ID (stairwell or boss) */
  exitRoomId: string;

  /** Room connections (edges in graph) */
  connections: RoomConnection[];
}
```

### Factory Function

```typescript
/**
 * Create dungeon system facade.
 * Combines generator, navigation, and state management.
 */
function createDungeonSystem(
  contentRegistry: ContentRegistry,
  eventBus: EventBus
): DungeonSystem;

interface DungeonSystem {
  readonly generator: DungeonGenerator;
  readonly navigation: NavigationManager;
  readonly roomState: RoomStateManager;
}
```

---

## Configuration Files

### configs/dungeon.json

```json
{
  "floors": [
    {
      "floor": 1,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "eliteChance": 0.00,
      "extractionCost": "free",
      "layoutType": "linear"
    },
    {
      "floor": 2,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "eliteChance": 0.10,
      "extractionCost": "free",
      "layoutType": "linear"
    },
    {
      "floor": 3,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "eliteChance": 0.10,
      "extractionCost": {
        "goldPercent": 0.15,
        "minGold": 10
      },
      "layoutType": "linear"
    },
    {
      "floor": 4,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "eliteChance": 0.10,
      "hasArmoredEnemies": true,
      "extractionCost": {
        "goldPercent": 0.25,
        "minGold": 20,
        "allowItem": true
      },
      "layoutType": "linear"
    },
    {
      "floor": 5,
      "roomCount": 7,
      "combatRooms": 4,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "eliteChance": 0.10,
      "hasBoss": true,
      "hasThreshold": true,
      "layoutType": "linear"
    }
  ],

  "generation": {
    "roomIdPrefix": "room",
    "connectionStyle": "corridor",
    "guaranteeStartSafe": true,
    "shuffleRoomOrder": true
  },

  "backtracking": {
    "turnCost": 1,
    "requiresCleared": true
  },

  "dreadEliteScaling": {
    "enabled": true,
    "baseChance": 0.05,
    "maxChance": 0.25,
    "dreadThreshold": 100,
    "scalingStart": 0
  }
}
```

### content/dungeons/ossuary.json (Example)

```json
{
  "id": "ossuary",
  "name": "The Ossuary",
  "description": "Ancient catacombs filled with restless dead.",
  "floorCount": 5,

  "floors": [
    {
      "floor": 1,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "layoutType": "linear",
      "eliteChance": 0.00,
      "lootMultiplier": 1.0
    },
    {
      "floor": 2,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "layoutType": "linear",
      "eliteChance": 0.10,
      "lootMultiplier": 1.2
    },
    {
      "floor": 3,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "layoutType": "linear",
      "eliteChance": 0.10,
      "lootMultiplier": 1.4
    },
    {
      "floor": 4,
      "roomCount": 4,
      "combatRooms": 2,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "layoutType": "linear",
      "eliteChance": 0.10,
      "lootMultiplier": 1.6
    },
    {
      "floor": 5,
      "roomCount": 7,
      "combatRooms": 4,
      "treasureRooms": 1,
      "eventRooms": 1,
      "restRooms": 0,
      "layoutType": "linear",
      "eliteChance": 0.10,
      "lootMultiplier": 2.0
    }
  ],

  "monsterPool": [
    "plague_rat",
    "ghoul",
    "skeletal_warrior",
    "tomb_wraith",
    "bone_horror"
  ],

  "elitePool": [
    "giant_rat",
    "ghoul_alpha",
    "bone_knight"
  ],

  "eventPool": [
    "treasure_standard_chest",
    "npc_hooded_figure",
    "shrine_vitality",
    "shrine_might"
  ],

  "bossId": "the_ossuary_keeper",

  "unlocked": true,
  "unlockCondition": null
}
```

---

## Events Emitted

The dungeon system emits the following events through the EventBus:

| Event Type | When Emitted |
|------------|--------------|
| `ROOM_ENTERED` | Player enters any room |
| `ROOM_CLEARED` | Room marked as cleared |
| `FLOOR_DESCENDED` | Player descends to next floor |

### Event Definitions

```typescript
interface RoomEnteredEvent {
  type: 'ROOM_ENTERED';
  timestamp: Timestamp;
  roomId: string;
  roomType: RoomType;
  floor: FloorNumber;
  firstVisit: boolean;
}

interface RoomClearedEvent {
  type: 'ROOM_CLEARED';
  timestamp: Timestamp;
  roomId: string;
  roomType: RoomType;
}

interface FloorDescendedEvent {
  type: 'FLOOR_DESCENDED';
  timestamp: Timestamp;
  fromFloor: FloorNumber;
  toFloor: FloorNumber;
  dreadGained: number;
}
```

---

## Events Subscribed

| Event | Response |
|-------|----------|
| `COMBAT_ENDED` | If victory, mark combat room enemy as defeated, generate loot |
| `EVENT_RESOLVED` | Mark event room as completed |
| `EXTRACTION_COMPLETED` | Session ends, dungeon state discarded |
| `PLAYER_KILLED` | Session ends, dungeon state discarded |

---

## State Managed

The dungeon system manages state within `DungeonState` (part of `SessionState`):

```typescript
interface DungeonState {
  /** Dungeon template ID */
  readonly dungeonId: string;

  /** Current floor (1-5) */
  readonly currentFloor: FloorNumber;

  /** Current room ID */
  readonly currentRoomId: string;

  /** All floors with room data */
  readonly floors: Readonly<Record<FloorNumber, FloorState>>;

  /** Whether Watcher is active (managed by Dread system) */
  readonly watcherActive: boolean;

  /** Watcher combat state (if fighting Watcher) */
  readonly watcherCombat: WatcherCombatState | null;
}

interface FloorState {
  readonly floorNumber: FloorNumber;
  readonly rooms: Readonly<Record<string, RoomInstanceState>>;
  readonly startRoomId: string;
  readonly exitRoomId: string;
}
```

---

## Edge Cases and Error Handling

### Navigation Edge Cases

| Case | Handling |
|------|----------|
| Move to non-adjacent room | Return `ROOM_NOT_ADJACENT` error |
| Backtrack to uncleared room | Return `ROOM_NOT_CLEARED` error |
| Descend from non-stairwell | Return `CANNOT_DESCEND` error |
| Move while in combat | Return `COMBAT_IN_PROGRESS` error |
| Leave boss room before defeating | Return `BOSS_NOT_DEFEATED` error |
| Navigate to room on different floor | Only allowed via stairwell |
| Backtrack adds 1 exploration turn | Applied via Dread system |

### Generation Edge Cases

| Case | Handling |
|------|----------|
| Monster pool empty for floor | Use fallback basic enemy |
| Event pool empty for floor | Use generic event template |
| Elite chance at 0 Dread | Use base elite chance only |
| Elite chance at 100 Dread | Use max elite chance (25%) |
| Room count mismatch | Log warning, adjust to available types |
| No path to exit | Generation ensures linear connectivity |

### Room State Edge Cases

| Case | Handling |
|------|----------|
| Enter already-entered room | No state change, not first visit |
| Clear already-cleared room | No state change |
| Combat in cleared room | Not possible (enemy defeated) |
| Loot in undefeated combat room | Not accessible until enemy defeated |
| Multiple visits to event room | Event already completed |

### Dread Corruption (Handled by Dread System, Not This Module)

| Dread Level | Navigation Corruption |
|-------------|----------------------|
| 0-49 (Calm) | Accurate previews |
| 50-69 (Uneasy) | 5% chance of wrong room type display |
| 70-84 (Shaken) | 10% chance, some rooms hidden |
| 85-99 (Terrified) | 20% chance, many rooms show "???" |
| 100 (Breaking) | All unexplored rooms show "[?????]" |

**Note**: The dungeon system provides accurate data. Corruption is applied by the presentation layer using the Dread system's corruption methods. This keeps the core logic pure.

---

## Test Strategy

### Unit Tests

1. **Generation Tests**
   - Generate floor with correct room count
   - Generate floor with correct room type distribution
   - Elite spawn respects chance parameter
   - All rooms are connected (no isolated rooms)
   - Start and exit rooms are correctly identified
   - Monster pool filtering by floor

2. **Navigation Tests**
   - Get options returns only adjacent rooms
   - Move to adjacent room succeeds
   - Move to non-adjacent room fails
   - Backtrack to cleared room succeeds
   - Backtrack to uncleared room fails
   - Descend from stairwell succeeds
   - Descend from non-stairwell fails

3. **Room State Tests**
   - Enter room transitions UNEXPLORED to ENTERED
   - Clear room transitions ENTERED to CLEARED
   - Cannot transition backwards
   - First visit flag correct
   - Room contents update correctly

4. **Layout Tests**
   - Linear layout has sequential connections
   - All rooms reachable from start
   - Exit reachable from all rooms
   - Connection directions consistent

### Integration Tests

1. **Full Dungeon Generation**
   - Generate complete 5-floor dungeon
   - Verify all floors have correct structure
   - Verify boss on floor 5 only
   - Verify threshold before boss

2. **Navigation Flow**
   - Navigate through entire floor
   - Clear all rooms
   - Descend to next floor
   - Backtrack mid-floor

3. **Combat Integration**
   - Enter combat room triggers combat
   - Victory marks room cleared
   - Loot generated on victory

### Property Tests

```typescript
property("all rooms reachable from start", (seed) => {
  const rng = createRNG(seed);
  const dungeon = generator.generateDungeon(template, rng);

  for (const floor of Object.values(dungeon.floors)) {
    const reachable = new Set<string>();
    const queue = [floor.startRoomId];

    while (queue.length > 0) {
      const roomId = queue.shift()!;
      if (reachable.has(roomId)) continue;
      reachable.add(roomId);

      const room = floor.rooms[roomId];
      for (const conn of room.connections) {
        queue.push(conn.targetRoomId);
      }
    }

    // All rooms should be reachable
    if (reachable.size !== Object.keys(floor.rooms).length) {
      return false;
    }
  }
  return true;
});

property("room type counts match config", (seed, floorNum) => {
  const floor = Math.max(1, Math.min(5, Math.abs(floorNum) % 5 + 1)) as FloorNumber;
  const config = FLOOR_CONFIGS[floor - 1];
  const rng = createRNG(seed);
  const floorState = generator.generateFloor(
    template.floors[floor - 1],
    floor,
    monsters,
    events,
    rng
  );

  const counts = { combat: 0, treasure: 0, event: 0, rest: 0 };
  for (const room of Object.values(floorState.rooms)) {
    if (room.type in counts) {
      counts[room.type as keyof typeof counts]++;
    }
  }

  return (
    counts.combat === config.combatRooms &&
    counts.treasure === config.treasureRooms &&
    counts.event === config.eventRooms
  );
});

property("backtrack always costs 1 turn", (navigation) => {
  const result = navigationManager.backtrackToRoom(dungeon, clearedRoomId);
  if (result.success) {
    return result.value.explorationTurnsAdded === 1;
  }
  return true; // Failed backtracks don't add turns
});

property("elite chance bounded by config", (seed, dread) => {
  const clampedDread = Math.max(0, Math.min(100, dread));
  const eliteChance = calculateEliteChance(clampedDread);
  return eliteChance >= 0.05 && eliteChance <= 0.25;
});
```

---

## Implementation Notes

### Layout Generation Algorithm

The dungeon uses a linear corridor-based layout for MVP:

```
1. Create room list with required types (combat, treasure, event, etc.)
2. Shuffle room order (but keep stairwell/boss at end)
3. Connect rooms sequentially (room 1 -> room 2 -> room 3 -> ...)
4. Mark first room as start, last room as exit
5. Assign directions based on position (alternating north/south/east/west)
```

```typescript
function generateLinearLayout(roomTypes: RoomType[], rng: SeededRNG): FloorLayout {
  // Separate exit room (stairwell/boss/threshold)
  const exitType = roomTypes.find(t =>
    t === 'stairwell' || t === 'boss' || t === 'threshold'
  );
  const contentRooms = roomTypes.filter(t =>
    t !== 'stairwell' && t !== 'boss' && t !== 'threshold'
  );

  // Shuffle content rooms
  const shuffled = rng.shuffled(contentRooms);

  // Add exit at end
  const orderedTypes = [...shuffled];
  if (exitType) {
    orderedTypes.push(exitType);
  }

  // Generate rooms
  const rooms: RoomInstanceState[] = orderedTypes.map((type, index) => ({
    id: generateEntityId(),
    type,
    state: 'unexplored',
    floor: floorNumber,
    layoutIndex: index,
    connections: [],
    contents: generateRoomContents(type, params)
  }));

  // Connect sequentially
  const connections: RoomConnection[] = [];
  for (let i = 0; i < rooms.length - 1; i++) {
    const direction = getDirection(i);
    rooms[i].connections.push({
      targetRoomId: rooms[i + 1].id,
      direction
    });
    rooms[i + 1].connections.push({
      targetRoomId: rooms[i].id,
      direction: getOppositeDirection(direction)
    });
  }

  return {
    rooms,
    startRoomId: rooms[0].id,
    exitRoomId: rooms[rooms.length - 1].id,
    connections
  };
}
```

### Elite Spawn Chance Calculation

Elite chance scales with Dread (from design doc):

```typescript
function calculateEliteChance(
  baseDread: number,
  baseChance: number,
  config: DreadEliteConfig
): number {
  if (!config.enabled) {
    return baseChance;
  }

  // Linear scaling from base (5%) to max (25%) based on Dread 0-100
  const dreadFactor = Math.min(baseDread, config.dreadThreshold) / config.dreadThreshold;
  const scaledChance = config.baseChance +
    (config.maxChance - config.baseChance) * dreadFactor;

  return Math.max(baseChance, scaledChance);
}
```

### Room Contents Generation

```typescript
function generateRoomContents(
  type: RoomType,
  params: RoomGenerationParams,
  rng: SeededRNG
): RoomContents {
  switch (type) {
    case 'combat':
      return generateCombatContents(params, rng);
    case 'treasure':
      return generateTreasureContents(params, rng);
    case 'event':
      return generateEventContents(params, rng);
    case 'rest':
      return generateRestContents(params, rng);
    case 'stairwell':
      return generateStairwellContents(params);
    case 'threshold':
      return generateThresholdContents(params);
    case 'boss':
      return generateBossContents(params);
    default:
      throw new Error(`Unknown room type: ${type}`);
  }
}

function generateCombatContents(
  params: RoomGenerationParams,
  rng: SeededRNG
): CombatRoomContents {
  // Roll for elite
  const isElite = rng.chance(params.eliteChance);

  // Select monster from pool
  const pool = isElite
    ? params.monsterPool.filter(m => m.type === 'elite')
    : params.monsterPool.filter(m => m.type === 'basic');

  const monster = rng.pick(pool);

  return {
    type: 'combat',
    enemyTemplateId: monster.id,
    enemyInstanceId: generateEntityId(),
    isElite,
    defeated: false,
    loot: [],
    lootCollected: false
  };
}
```

### Backtracking Logic

```typescript
function backtrackToRoom(
  dungeon: DungeonState,
  targetRoomId: string
): Result<NavigationResult, NavigationError> {
  const currentFloor = dungeon.floors[dungeon.currentFloor];
  const targetRoom = currentFloor.rooms[targetRoomId];

  // Validate target exists
  if (!targetRoom) {
    return err({
      code: 'ROOM_NOT_FOUND',
      message: `Room ${targetRoomId} not found on current floor`
    });
  }

  // Validate target is cleared
  if (targetRoom.state !== 'cleared') {
    return err({
      code: 'ROOM_NOT_CLEARED',
      message: 'Can only backtrack to cleared rooms'
    });
  }

  // Move to room (no state change since already cleared)
  const newDungeon = {
    ...dungeon,
    currentRoomId: targetRoomId
  };

  // Emit event and return
  return ok({
    dungeon: newDungeon,
    events: [createEvent('ROOM_ENTERED', {
      roomId: targetRoomId,
      roomType: targetRoom.type,
      floor: dungeon.currentFloor,
      firstVisit: false
    })],
    currentRoom: targetRoom,
    firstVisit: false,
    explorationTurnsAdded: 1, // Backtrack costs 1 turn
    floorChanged: false
  });
}
```

---

## Public Exports

```typescript
// src/core/dungeon/index.ts

export type {
  // Main interfaces
  DungeonGenerator,
  NavigationManager,
  RoomStateManager,
  DungeonSystem,

  // Configuration
  FloorConfig,

  // Navigation
  NavigationOption,
  RoomPreview,
  Direction,
  NavigationResult,
  NavigationError,
  NavigationErrorCode,

  // Room types
  RoomInstanceState,
  RoomConnection,
  CombatRoomContents,
  TreasureRoomContents,
  EventRoomContents,
  RestRoomContents,
  StairwellRoomContents,
  ThresholdRoomContents,
  BossRoomContents,
  LootDropState,
  ExtractionCostState,
  RetreatCostState,

  // Generation
  RoomGenerationParams,
  FloorLayout,
};

export {
  createDungeonGenerator,
  createNavigationManager,
  createRoomStateManager,
  createDungeonSystem,
  FLOOR_CONFIGS,
};

// Re-export types from foundation
export type { FloorNumber, RoomType, RoomState } from '../foundation';
```

---

## Design Philosophy

### Fixed Skeleton, Random Flesh

The dungeon uses a hybrid generation approach to balance mastery with tension:

**Fixed (per dungeon):**
- Total floor count (5)
- Room count per floor (4, 4, 4, 4, 7)
- Room type distribution (2 combat, 1 treasure, 1 event per floor 1-4)
- Boss identity
- Extraction costs per floor

**Random (per run):**
- Room order within floor
- Which specific monster spawns in combat rooms
- Elite vs basic enemy rolls
- Which event spawns in event rooms
- Treasure chest contents
- Loot drops

This ensures players can learn the dungeon structure while each run still feels fresh.

### Corridor-Based Graph, Not Grid

The dungeon is a graph of connected rooms, not a 2D grid:

- Rooms have numbered exits (1, 2, 3...) not compass directions
- Players select by number, not by typing "north"
- Simplifies navigation in CLI
- Allows future expansion to branching paths

### Dread Corruption is Presentation Layer

The dungeon system provides **accurate data**. It's the presentation layer's responsibility to:

1. Query the Dread system for corruption settings
2. Apply corruption to room previews before display
3. Show corrupted values to player

This keeps the core logic pure and testable while still enabling the "unreliable narrator" experience.

### Backtracking as Tactical Choice

Backtracking costs 1 exploration turn (feeds into Dread), creating a tactical decision:

- Return for missed loot?
- Risk Dread gain for completionism?
- Or push forward to extraction?

This small cost adds meaningful weight to navigation decisions.
