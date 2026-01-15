# 03 - State Management

## Purpose

Immutable game state representation with atomic updates via reducers. All state changes produce new state objects, enabling time-travel debugging, easy undo/redo, and reliable save/load.

---

## Responsibilities

1. Define complete game state structure
2. Provide state store with subscription mechanism
3. Implement reducers for all state transitions
4. Ensure immutability of state objects
5. Support state serialization for save/load

---

## Dependencies

- **01-foundation**: Types, EntityId, Result

---

## Interface Contracts

### Game State

```typescript
// ==================== Root State ====================

/**
 * Complete game state at any point in time.
 * Immutable - all changes create new state objects.
 */
interface GameState {
  /** Schema version for migrations */
  readonly version: string;

  /** Current player profile */
  readonly profile: ProfileState;

  /** Active dungeon session (null when at camp) */
  readonly session: SessionState | null;

  /** Current game phase */
  readonly phase: GamePhase;
}

type GamePhase =
  // Camp phases
  | 'camp_main'
  | 'camp_stash'
  | 'camp_equipment'
  | 'camp_merchant'
  | 'camp_chronicler'
  | 'camp_character'

  // Expedition prep
  | 'expedition_prep'
  | 'expedition_confirm'

  // Dungeon phases
  | 'dungeon_exploring'
  | 'dungeon_combat'
  | 'dungeon_treasure'
  | 'dungeon_event'
  | 'dungeon_rest'
  | 'dungeon_stairwell'
  | 'dungeon_threshold'
  | 'dungeon_boss'

  // Terminal phases
  | 'extracting'
  | 'dead'
  | 'game_over';
```

### Profile State

```typescript
// ==================== Profile State ====================

/**
 * Persistent player profile - survives between sessions.
 */
interface ProfileState {
  /** Unique profile identifier */
  readonly id: string;

  /** Profile display name */
  readonly name: string;

  /** Creation timestamp */
  readonly createdAt: Timestamp;

  /** Last played timestamp */
  readonly lastPlayed: Timestamp;

  /** Player type (for analytics separation) */
  readonly playerType: 'human' | 'ai_agent';

  /** AI agent identifier (if playerType is ai_agent) */
  readonly agentId?: string;

  /** Character progression */
  readonly character: CharacterState;

  /** Persistent item storage */
  readonly stash: StashState;

  /** Persistent gold (at camp) */
  readonly gold: number;

  /** Monster knowledge from encounters */
  readonly veteranKnowledge: VeteranKnowledgeState;

  /** Discovered monster entries */
  readonly bestiary: BestiaryState;

  /** Unlocked content */
  readonly unlocks: UnlocksState;

  /** Gameplay statistics */
  readonly statistics: StatisticsState;

  /** Active "Lesson Learned" bonus */
  readonly lessonLearned: LessonLearnedState | null;

  /** Event memory flags */
  readonly eventMemory: EventMemoryState;

  /** Profile-specific settings */
  readonly settings: ProfileSettings;
}

// ==================== Character State ====================

interface CharacterState {
  /** Character class */
  readonly class: CharacterClass;

  /** Character level */
  readonly level: number;

  /** Current XP */
  readonly xp: number;

  /** Base stats (without equipment) */
  readonly baseStats: StatBlock;

  /** Currently equipped items */
  readonly equipment: EquipmentState;
}

interface EquipmentState {
  readonly weapon: EquippedItem;
  readonly armor: EquippedItem | null;
  readonly helm: EquippedItem | null;
  readonly accessory: EquippedItem | null;
}

interface EquippedItem {
  /** Runtime instance ID */
  readonly id: EntityId;

  /** Template ID for content lookup */
  readonly templateId: string;

  /** Whether item has been identified */
  readonly identified: boolean;

  /** Source of this item (for death economy) */
  readonly source: ItemSource;
}

type ItemSource = 'starting' | 'found' | 'purchased' | 'brought';

// ==================== Stash State ====================

interface StashState {
  /** Items in stash */
  readonly items: readonly StashedItem[];

  /** Maximum capacity */
  readonly capacity: number;
}

interface StashedItem {
  readonly id: EntityId;
  readonly templateId: string;
  readonly identified: boolean;
}

// ==================== Knowledge State ====================

interface VeteranKnowledgeState {
  /** Knowledge per monster type */
  readonly monsters: Readonly<Record<string, MonsterKnowledge>>;
}

interface MonsterKnowledge {
  /** Number of encounters with this monster */
  readonly encounters: number;

  /** Number of deaths to this monster */
  readonly deaths: number;

  /** Current knowledge tier (0 = unknown) */
  readonly tier: 0 | 1 | 2 | 3;
}

interface BestiaryState {
  /** Monster IDs that have been discovered */
  readonly discovered: readonly string[];
}

// ==================== Unlocks State ====================

interface UnlocksState {
  /** Unlocked character classes */
  readonly classes: readonly CharacterClass[];

  /** Unlocked item template IDs */
  readonly items: readonly string[];

  /** Unlocked mutator IDs */
  readonly mutators: readonly string[];
}

// ==================== Statistics State ====================

interface StatisticsState {
  /** Runs completed via extraction */
  readonly runsCompleted: number;

  /** Runs ended by death */
  readonly runsFailed: number;

  /** Total gold earned across all runs */
  readonly totalGoldEarned: number;

  /** Enemies killed by type */
  readonly enemiesKilled: Readonly<Record<string, number>>;

  /** Deepest floor reached */
  readonly deepestFloor: FloorNumber;

  /** Bosses defeated count */
  readonly bossesDefeated: number;

  /** Total play time in seconds */
  readonly totalPlayTime: number;

  /** Fastest boss kill time in seconds */
  readonly fastestBossKill: number | null;
}

// ==================== Lesson Learned State ====================

interface LessonLearnedState {
  /** Monster type that killed the player */
  readonly enemyType: string;

  /** Damage bonus against this type (e.g., 0.10 for 10%) */
  readonly damageBonus: number;

  /** Runs remaining before expiration */
  readonly runsRemaining: number;
}

// ==================== Event Memory State ====================

interface EventMemoryState {
  /** Helped the wounded adventurer */
  readonly woundedAdventurerHelped: boolean;

  /** Desecrated a shrine */
  readonly shrineDesecrated: boolean;

  /** Encountered the hooded figure */
  readonly hoodedFigureEncountered: boolean;

  // Add more flags as events are implemented
}

// ==================== Profile Settings ====================

interface ProfileSettings {
  /** Preferred difficulty mutators */
  readonly activeMutators: readonly string[];

  /** UI preferences */
  readonly showDamageNumbers: boolean;
  readonly showCombatLog: boolean;
  readonly confirmDestructiveActions: boolean;
}
```

### Session State

```typescript
// ==================== Session State ====================

/**
 * State of an active dungeon run.
 * Created when expedition starts, destroyed on extraction/death.
 */
interface SessionState {
  /** Unique run identifier */
  readonly runId: string;

  /** RNG state for reproducibility */
  readonly rngState: RNGState;

  /** Dungeon state */
  readonly dungeon: DungeonState;

  /** Player state during run */
  readonly player: SessionPlayerState;

  /** Carried inventory */
  readonly inventory: InventoryState;

  /** Consumable slots */
  readonly consumables: ConsumableSlotState;

  /** Items brought from stash (at risk) */
  readonly broughtItems: readonly EntityId[];

  /** Active temporary buffs */
  readonly activeBuffs: readonly ActiveBuff[];

  /** Current combat (null if not in combat) */
  readonly combat: CombatState | null;

  /** Current event (null if not in event) */
  readonly event: EventState | null;

  /** Gold collected this run */
  readonly goldCollected: number;

  /** XP collected this run */
  readonly xpCollected: number;

  /** Enemies killed this run */
  readonly enemiesKilledThisRun: number;

  /** Exploration turn counter (for Dread) */
  readonly explorationTurns: number;
}

interface SessionPlayerState {
  /** Current HP */
  readonly currentHP: number;

  /** Max HP (calculated) */
  readonly maxHP: number;

  /** Current Dread */
  readonly currentDread: number;

  /** Active status effects (persist between combats if applicable) */
  readonly statusEffects: readonly ActiveStatusEffect[];
}

// ==================== Dungeon State ====================

interface DungeonState {
  /** Dungeon template ID */
  readonly dungeonId: string;

  /** Current floor (1-5) */
  readonly currentFloor: FloorNumber;

  /** Current room ID */
  readonly currentRoomId: string;

  /** All floors */
  readonly floors: Readonly<Record<FloorNumber, FloorState>>;

  /** Whether Watcher is active */
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

interface RoomInstanceState {
  readonly id: string;
  readonly type: RoomType;
  readonly state: RoomState;
  readonly connections: readonly RoomConnection[];
  readonly contents: RoomContents;
}

interface RoomConnection {
  readonly targetRoomId: string;
  readonly direction: Direction;
}

type Direction = 'north' | 'south' | 'east' | 'west';

// ==================== Room Contents ====================

type RoomContents =
  | CombatRoomContents
  | TreasureRoomContents
  | EventRoomContents
  | RestRoomContents
  | StairwellRoomContents
  | ThresholdRoomContents
  | BossRoomContents;

interface CombatRoomContents {
  readonly type: 'combat';
  readonly enemyTemplateId: string;
  readonly enemyInstanceId: EntityId;
  readonly defeated: boolean;
  readonly loot: readonly LootDropState[];
  readonly lootCollected: boolean;
}

interface TreasureRoomContents {
  readonly type: 'treasure';
  readonly chestType: 'standard' | 'locked' | 'ornate';
  readonly opened: boolean;
  readonly trapped: boolean;
  readonly trapTriggered: boolean;
  readonly loot: readonly LootDropState[];
  readonly lootCollected: boolean;
  readonly examined: boolean;
}

interface EventRoomContents {
  readonly type: 'event';
  readonly eventTemplateId: string;
  readonly completed: boolean;
  readonly choiceMade: string | null;
}

interface RestRoomContents {
  readonly type: 'rest';
  readonly restType: 'safe_alcove' | 'corrupted';
  readonly used: boolean;
  readonly ambushTriggered: boolean;
}

interface StairwellRoomContents {
  readonly type: 'stairwell';
  readonly canExtract: boolean;
  readonly extractionCost: ExtractionCostState | null;
}

interface ThresholdRoomContents {
  readonly type: 'threshold';
  readonly retreatCost: RetreatCostState;
  readonly bossReady: boolean;
}

interface BossRoomContents {
  readonly type: 'boss';
  readonly bossTemplateId: string;
  readonly bossInstanceId: EntityId;
  readonly defeated: boolean;
  readonly loot: readonly LootDropState[];
  readonly lootCollected: boolean;
}

interface LootDropState {
  readonly id: EntityId;
  readonly type: 'item' | 'gold';
  readonly templateId?: string;
  readonly gold?: number;
  readonly collected: boolean;
}

interface ExtractionCostState {
  readonly type: 'free' | 'gold' | 'item';
  readonly goldAmount?: number;
  readonly goldPercent?: number;
}

interface RetreatCostState {
  readonly goldAmount: number;
  readonly goldPercent: number;
  readonly canPayWithItem: boolean;
}

// ==================== Inventory State ====================

interface InventoryState {
  readonly items: readonly InventoryItem[];
  readonly capacity: number;
}

interface InventoryItem {
  readonly id: EntityId;
  readonly templateId: string;
  readonly identified: boolean;
}

interface ConsumableSlotState {
  readonly slots: readonly ConsumableStack[];
  readonly maxSlots: number;
}

interface ConsumableStack {
  readonly templateId: string;
  readonly count: number;
  readonly maxStack: number;
}

// ==================== Buff State ====================

interface ActiveBuff {
  readonly id: string;
  readonly buffType: BuffType;
  readonly source: string;
  readonly remainingDuration: number | 'until_extraction';
  readonly effects: readonly BuffEffect[];
}

type BuffType =
  | 'shrine_blessing'
  | 'potion_effect'
  | 'weapon_coating'
  | 'event_reward';

interface BuffEffect {
  readonly effectType: EffectType;
  readonly magnitude: number;
}

// ==================== Combat State ====================

interface CombatState {
  /** Current turn number */
  readonly turn: number;

  /** Current combat phase */
  readonly phase: CombatPhase;

  /** Player combat state */
  readonly player: PlayerCombatState;

  /** Enemy combat state */
  readonly enemy: EnemyCombatState;

  /** Combat log for this fight */
  readonly log: readonly CombatLogEntry[];

  /** Last player action (for enemy AI) */
  readonly lastPlayerAction: CombatAction | null;

  /** Whether player acted this turn */
  readonly playerActedThisTurn: boolean;

  /** Whether enemy acted this turn */
  readonly enemyActedThisTurn: boolean;
}

interface PlayerCombatState {
  readonly currentHP: number;
  readonly maxHP: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly statusEffects: readonly ActiveStatusEffect[];
  readonly isBlocking: boolean;
  readonly isDodging: boolean;
}

interface EnemyCombatState {
  readonly instanceId: EntityId;
  readonly templateId: string;
  readonly currentHP: number;
  readonly maxHP: number;
  readonly armor: number;
  readonly speed: EnemySpeed;
  readonly statusEffects: readonly ActiveStatusEffect[];
  readonly isStaggered: boolean;
  readonly staggerCount: number;
  readonly abilityCooldowns: Readonly<Record<string, number>>;
  readonly turnsSinceLastAbility: Readonly<Record<string, number>>;
}

interface ActiveStatusEffect {
  readonly id: string;
  readonly templateId: string;
  readonly stacks: number;
  readonly remainingDuration: number;
  readonly source: 'player' | 'enemy' | 'environment';
}

interface CombatLogEntry {
  readonly turn: number;
  readonly timestamp: Timestamp;
  readonly actor: 'player' | 'enemy' | 'system';
  readonly action: string;
  readonly details: CombatLogDetails;
}

interface CombatLogDetails {
  readonly damage?: number;
  readonly healing?: number;
  readonly critical?: boolean;
  readonly blocked?: boolean;
  readonly dodged?: boolean;
  readonly missed?: boolean;
  readonly staggered?: boolean;
  readonly statusApplied?: string;
  readonly statusRemoved?: string;
  readonly damageBreakdown?: DamageBreakdown;
}

interface DamageBreakdown {
  readonly baseDamage: number;
  readonly mightBonus: number;
  readonly skillMultiplier: number;
  readonly bonusPercent: number;
  readonly critMultiplier: number;
  readonly armorReduction: number;
  readonly lessonLearnedBonus: number;
  readonly finalDamage: number;
}

type CombatAction =
  | { type: 'light_attack' }
  | { type: 'heavy_attack' }
  | { type: 'dodge' }
  | { type: 'block' }
  | { type: 'pass' }
  | { type: 'use_item'; itemId: EntityId }
  | { type: 'flee' };

// ==================== Watcher State ====================

interface WatcherCombatState {
  readonly currentHP: number;
  readonly stunCount: number;
  readonly isStunned: boolean;
  readonly stunTurnsRemaining: number;
  readonly isEnraged: boolean;
  readonly isImmune: boolean;
}

// ==================== Event State ====================

interface EventState {
  readonly eventId: string;
  readonly templateId: string;
  readonly availableChoices: readonly string[];
  readonly outcomeResolved: boolean;
  readonly outcome: EventOutcomeState | null;
}

interface EventOutcomeState {
  readonly choiceId: string;
  readonly success: boolean;
  readonly description: string;
  readonly effects: readonly AppliedEffect[];
}

interface AppliedEffect {
  readonly type: string;
  readonly value: unknown;
  readonly applied: boolean;
}
```

### State Store

```typescript
// ==================== State Store ====================

/**
 * Central state store with subscription support.
 */
interface StateStore {
  /** Get current immutable state */
  getState(): GameState;

  /** Dispatch action to update state */
  dispatch(action: StateAction): void;

  /** Subscribe to state changes */
  subscribe(listener: StateListener): Unsubscribe;

  /** Get state history (for debugging) */
  getHistory(): readonly GameState[];

  /** Undo last action (if history available) */
  undo(): boolean;

  /** Clear history (to save memory) */
  clearHistory(): void;
}

type StateListener = (state: GameState, previousState: GameState) => void;
type Unsubscribe = () => void;

/**
 * Create a new state store
 */
function createStateStore(initialState: GameState, options?: StateStoreOptions): StateStore;

interface StateStoreOptions {
  /** Max history entries to keep (0 = no history) */
  historySize?: number;

  /** Enable debug logging */
  debug?: boolean;
}

// ==================== State Actions ====================

/**
 * All possible state mutations.
 * Each action is processed by a reducer to produce new state.
 */
type StateAction =
  // Profile actions
  | { type: 'PROFILE_LOADED'; payload: ProfileState }
  | { type: 'PROFILE_SETTINGS_UPDATED'; payload: Partial<ProfileSettings> }

  // Character actions
  | { type: 'CHARACTER_XP_GAINED'; payload: { amount: number } }
  | { type: 'CHARACTER_LEVEL_UP'; payload: { statChoice: StatName } }
  | { type: 'CHARACTER_STAT_CHANGED'; payload: { stat: StatName; delta: number } }

  // Equipment actions
  | { type: 'ITEM_EQUIPPED'; payload: { item: EquippedItem; slot: EquipmentSlot } }
  | { type: 'ITEM_UNEQUIPPED'; payload: { slot: EquipmentSlot } }
  | { type: 'ITEM_IDENTIFIED'; payload: { itemId: EntityId } }

  // Stash actions
  | { type: 'STASH_ITEM_ADDED'; payload: { item: StashedItem } }
  | { type: 'STASH_ITEM_REMOVED'; payload: { itemId: EntityId } }

  // Gold actions
  | { type: 'GOLD_CHANGED'; payload: { delta: number; source: string } }

  // Session actions
  | { type: 'SESSION_STARTED'; payload: { session: SessionState } }
  | { type: 'SESSION_ENDED'; payload: { result: 'extraction' | 'death' } }

  // Player state actions
  | { type: 'PLAYER_HP_CHANGED'; payload: { delta: number; source: string } }
  | { type: 'PLAYER_DREAD_CHANGED'; payload: { delta: number; source: string } }
  | { type: 'PLAYER_STATUS_APPLIED'; payload: { effect: ActiveStatusEffect } }
  | { type: 'PLAYER_STATUS_REMOVED'; payload: { effectId: string } }
  | { type: 'PLAYER_STATUS_TICK'; payload: { effectId: string } }

  // Inventory actions
  | { type: 'INVENTORY_ITEM_ADDED'; payload: { item: InventoryItem } }
  | { type: 'INVENTORY_ITEM_REMOVED'; payload: { itemId: EntityId } }
  | { type: 'CONSUMABLE_ADDED'; payload: { templateId: string; count: number } }
  | { type: 'CONSUMABLE_USED'; payload: { slotIndex: number } }

  // Buff actions
  | { type: 'BUFF_APPLIED'; payload: { buff: ActiveBuff } }
  | { type: 'BUFF_REMOVED'; payload: { buffId: string } }
  | { type: 'BUFF_TICK'; payload: { buffId: string } }

  // Navigation actions
  | { type: 'ROOM_ENTERED'; payload: { roomId: string } }
  | { type: 'ROOM_CLEARED'; payload: { roomId: string } }
  | { type: 'FLOOR_CHANGED'; payload: { floor: FloorNumber } }

  // Combat actions
  | { type: 'COMBAT_STARTED'; payload: { combat: CombatState } }
  | { type: 'COMBAT_ACTION_EXECUTED'; payload: { action: CombatAction; result: CombatActionResult } }
  | { type: 'COMBAT_TURN_ADVANCED'; payload: {} }
  | { type: 'COMBAT_ENDED'; payload: { result: 'victory' | 'defeat' | 'fled' } }
  | { type: 'COMBAT_LOG_ADDED'; payload: { entry: CombatLogEntry } }

  // Loot actions
  | { type: 'LOOT_COLLECTED'; payload: { lootId: EntityId } }
  | { type: 'LOOT_ALL_COLLECTED'; payload: { roomId: string } }

  // Event actions
  | { type: 'EVENT_STARTED'; payload: { event: EventState } }
  | { type: 'EVENT_CHOICE_MADE'; payload: { choiceId: string } }
  | { type: 'EVENT_RESOLVED'; payload: { outcome: EventOutcomeState } }

  // Knowledge actions
  | { type: 'MONSTER_ENCOUNTERED'; payload: { monsterId: string } }
  | { type: 'MONSTER_KILLED'; payload: { monsterId: string } }
  | { type: 'DEATH_TO_MONSTER'; payload: { monsterId: string } }
  | { type: 'KNOWLEDGE_TIER_UNLOCKED'; payload: { monsterId: string; tier: 1 | 2 | 3 } }
  | { type: 'BESTIARY_DISCOVERED'; payload: { monsterId: string } }

  // Statistics actions
  | { type: 'STATISTIC_INCREMENTED'; payload: { stat: keyof StatisticsState; amount: number } }
  | { type: 'ENEMY_KILL_RECORDED'; payload: { enemyType: string } }

  // Lesson Learned actions
  | { type: 'LESSON_LEARNED_SET'; payload: { lesson: LessonLearnedState } }
  | { type: 'LESSON_LEARNED_DECREMENTED'; payload: {} }
  | { type: 'LESSON_LEARNED_CLEARED'; payload: {} }

  // Unlock actions
  | { type: 'CLASS_UNLOCKED'; payload: { classId: CharacterClass } }
  | { type: 'ITEM_UNLOCKED'; payload: { itemId: string } }
  | { type: 'MUTATOR_UNLOCKED'; payload: { mutatorId: string } }

  // Event memory actions
  | { type: 'EVENT_MEMORY_SET'; payload: { key: keyof EventMemoryState; value: boolean } }

  // Watcher actions
  | { type: 'WATCHER_SPAWNED'; payload: {} }
  | { type: 'WATCHER_STUNNED'; payload: {} }
  | { type: 'WATCHER_ENRAGED'; payload: {} }
  | { type: 'WATCHER_DEFEATED'; payload: {} }

  // Phase actions
  | { type: 'PHASE_CHANGED'; payload: { phase: GamePhase } };

interface CombatActionResult {
  hit: boolean;
  damage: number;
  critical: boolean;
  blocked: boolean;
  dodged: boolean;
  staggered: boolean;
  statusApplied: string[];
  enemyDefeated: boolean;
  playerDefeated: boolean;
}
```

### State Utilities

```typescript
// ==================== State Utilities ====================

/**
 * Create initial game state for a new profile
 */
function createInitialState(profileName: string, playerType: 'human' | 'ai_agent'): GameState;

/**
 * Create initial character state for a class
 */
function createCharacterState(classId: CharacterClass, registry: ContentRegistry): CharacterState;

/**
 * Serialize state for save file
 */
function serializeState(state: GameState): string;

/**
 * Deserialize state from save file
 */
function deserializeState(json: string): Result<GameState, string>;

/**
 * Compute derived values from state (not stored, computed on demand)
 */
interface DerivedState {
  /** Computed max HP */
  maxHP: number;

  /** Computed damage range */
  damage: NumericRange;

  /** Computed crit chance */
  critChance: number;

  /** Computed armor */
  armor: number;

  /** Computed stat totals (base + equipment) */
  effectiveStats: StatBlock;

  /** Current dread threshold */
  dreadThreshold: DreadThreshold;

  /** Available inventory slots */
  inventorySpace: number;

  /** Available stash slots */
  stashSpace: number;
}

function computeDerivedState(state: GameState, registry: ContentRegistry): DerivedState;
```

---

## Events Emitted/Subscribed

The state store itself doesn't use the event bus. State changes are communicated via the `subscribe` mechanism. However, other modules may emit events in response to state changes.

---

## State Managed

This IS the state management module. It manages the entire game state tree.

---

## Edge Cases and Error Handling

| Case | Handling |
|------|----------|
| Invalid action type | Log error, return unchanged state |
| Missing required payload | Log error, return unchanged state |
| Action in wrong phase | Log warning, return unchanged state |
| Negative HP | Clamp to 0 |
| HP over max | Clamp to max |
| Dread over 100 | Clamp to 100 |
| Dread below 0 | Clamp to 0 |
| Inventory overflow | Reject action, return unchanged |
| Stash overflow | Reject action, return unchanged |
| Undo with no history | Return false, no change |
| Deserialize invalid JSON | Return error result |
| Deserialize old version | Migrate or return error |

---

## Test Strategy

### Unit Tests

1. **Reducer Tests** (one per action type)
   - Test state changes correctly
   - Test immutability (original unchanged)
   - Test invalid action handling

2. **Store Tests**
   - Subscribe receives updates
   - Unsubscribe stops updates
   - History tracking works
   - Undo restores previous state

3. **Serialization Tests**
   - Round-trip serialization
   - Handle missing fields (migration)
   - Handle corrupt data

4. **Derived State Tests**
   - Max HP calculation
   - Damage calculation
   - Crit chance with diminishing returns
   - Armor stacking

### Property Tests

```typescript
property("state is always immutable", (actions) => {
  const store = createStateStore(initialState);
  const snapshots = [];

  for (const action of actions) {
    snapshots.push(store.getState());
    store.dispatch(action);
  }

  // All snapshots should be unchanged
  return snapshots.every((s, i) =>
    JSON.stringify(s) === JSON.stringify(snapshots[i])
  );
});

property("HP never negative", (damageActions) => {
  const store = createStateStore(initialState);
  for (const action of damageActions) {
    store.dispatch(action);
  }
  return store.getState().session?.player.currentHP >= 0;
});
```

---

## Implementation Notes

### Immutability

Use spread operators and `Object.freeze` for shallow immutability. For deep updates, use a helper function:

```typescript
function updateIn<T>(obj: T, path: string[], value: unknown): T {
  // Implementation creates new objects along the path
}
```

### Reducer Pattern

Each action type has a corresponding reducer function:

```typescript
type Reducer<A extends StateAction> = (state: GameState, action: A) => GameState;

const reducers: Record<StateAction['type'], Reducer<any>> = {
  'GOLD_CHANGED': (state, action) => {
    return {
      ...state,
      profile: {
        ...state.profile,
        gold: state.profile.gold + action.payload.delta
      }
    };
  },
  // ... more reducers
};
```

### Performance

- Use structural sharing (only copy changed branches)
- Memoize derived state computations
- Keep history bounded (configurable max size)

---

## Public Exports

```typescript
// src/core/state/index.ts

export type {
  // Root state
  GameState,
  GamePhase,

  // Profile state
  ProfileState,
  CharacterState,
  EquipmentState,
  EquippedItem,
  ItemSource,
  StashState,
  StashedItem,
  VeteranKnowledgeState,
  MonsterKnowledge,
  BestiaryState,
  UnlocksState,
  StatisticsState,
  LessonLearnedState,
  EventMemoryState,
  ProfileSettings,

  // Session state
  SessionState,
  SessionPlayerState,
  DungeonState,
  FloorState,
  RoomInstanceState,
  RoomConnection,
  Direction,
  RoomContents,
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
  InventoryState,
  InventoryItem,
  ConsumableSlotState,
  ConsumableStack,
  ActiveBuff,
  BuffType,
  BuffEffect,

  // Combat state
  CombatState,
  PlayerCombatState,
  EnemyCombatState,
  ActiveStatusEffect,
  CombatLogEntry,
  CombatLogDetails,
  DamageBreakdown,
  CombatAction,
  WatcherCombatState,

  // Event state
  EventState,
  EventOutcomeState,
  AppliedEffect,

  // Store
  StateStore,
  StateListener,
  Unsubscribe,
  StateStoreOptions,
  StateAction,
  CombatActionResult,

  // Utilities
  DerivedState,
};

export {
  createStateStore,
  createInitialState,
  createCharacterState,
  serializeState,
  deserializeState,
  computeDerivedState,
};
```
