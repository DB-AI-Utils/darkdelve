# 04 - Event System

## Purpose

Pub/sub event bus for decoupled communication between game systems and presentation layers. The core emits events for all significant game occurrences; presentation layers subscribe to visualize them.

---

## Responsibilities

1. Provide typed event definitions for all game events
2. Implement publish/subscribe mechanism
3. Support multiple subscribers per event type
4. Maintain event log for debugging/replay
5. Handle subscriber errors gracefully

---

## Dependencies

- **01-foundation**: Types, Timestamp

---

## Interface Contracts

### Event Bus

```typescript
// ==================== Event Bus Interface ====================

interface EventBus {
  /**
   * Emit an event to all subscribers
   */
  emit(event: GameEvent): void;

  /**
   * Subscribe to a specific event type
   * @returns Unsubscribe function
   */
  subscribe<T extends GameEvent['type']>(
    eventType: T,
    handler: EventHandler<Extract<GameEvent, { type: T }>>
  ): Unsubscribe;

  /**
   * Subscribe to all events
   * @returns Unsubscribe function
   */
  subscribeAll(handler: EventHandler<GameEvent>): Unsubscribe;

  /**
   * Get all emitted events (for debugging/testing)
   */
  getEventLog(): readonly GameEvent[];

  /**
   * Clear event log
   */
  clearEventLog(): void;

  /**
   * Set max event log size (0 = unlimited)
   */
  setEventLogSize(size: number): void;

  /**
   * Get subscriber count for an event type
   */
  getSubscriberCount(eventType: GameEvent['type']): number;

  /**
   * Remove all subscribers (for cleanup)
   */
  clearAllSubscribers(): void;
}

type EventHandler<T extends GameEvent> = (event: T) => void;
type Unsubscribe = () => void;

/**
 * Create a new event bus instance
 */
function createEventBus(options?: EventBusOptions): EventBus;

interface EventBusOptions {
  /** Max events to keep in log (default: 1000) */
  maxLogSize?: number;

  /** Log events to console (default: false) */
  debugLogging?: boolean;

  /** Continue on handler errors (default: true) */
  continueOnError?: boolean;

  /** Custom error handler */
  onError?: (error: Error, event: GameEvent) => void;
}
```

### Game Events

```typescript
// ==================== Session Events ====================

interface SessionStartedEvent {
  type: 'SESSION_STARTED';
  timestamp: Timestamp;
  runId: string;
  dungeonId: string;
  characterLevel: number;
  broughtItems: EntityId[];
}

interface SessionEndedEvent {
  type: 'SESSION_ENDED';
  timestamp: Timestamp;
  runId: string;
  result: 'extraction' | 'death' | 'quit';
  floor: FloorNumber;
  goldCollected: number;
  xpCollected: number;
  enemiesKilled: number;
  dreadFinal: number;
}

// ==================== Navigation Events ====================

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

// ==================== Combat Events ====================

interface CombatStartedEvent {
  type: 'COMBAT_STARTED';
  timestamp: Timestamp;
  enemyId: string;
  enemyName: string;
  enemyType: EnemyType;
  enemyHP: number;
  playerHP: number;
  playerDread: number;
  isAmbush: boolean;
}

interface CombatEndedEvent {
  type: 'COMBAT_ENDED';
  timestamp: Timestamp;
  result: 'victory' | 'defeat' | 'fled';
  enemyId: string;
  turnsElapsed: number;
  damageDealt: number;
  damageTaken: number;
  xpGained: number;
  goldGained: number;
}

interface PlayerAttackedEvent {
  type: 'PLAYER_ATTACKED';
  timestamp: Timestamp;
  attackType: 'light' | 'heavy';
  hit: boolean;
  damage: number;
  critical: boolean;
  blocked: boolean;
  staggered: boolean;
  staminaSpent: number;
  breakdown: DamageBreakdown;
}

interface EnemyAttackedEvent {
  type: 'ENEMY_ATTACKED';
  timestamp: Timestamp;
  abilityName: string;
  damage: number;
  blocked: boolean;
  dodged: boolean;
  statusApplied: string | null;
}

interface DamageDealtEvent {
  type: 'DAMAGE_DEALT';
  timestamp: Timestamp;
  target: 'player' | 'enemy';
  amount: number;
  source: string;
  isCritical: boolean;
  isDoT: boolean;
}

interface HealingReceivedEvent {
  type: 'HEALING_RECEIVED';
  timestamp: Timestamp;
  target: 'player' | 'enemy';
  amount: number;
  actualHealing: number;
  source: string;
  wasOverheal: boolean;
}

interface StatusAppliedEvent {
  type: 'STATUS_APPLIED';
  timestamp: Timestamp;
  target: 'player' | 'enemy';
  effectId: string;
  effectName: string;
  stacks: number;
  duration: number;
  source: 'player' | 'enemy' | 'environment';
}

interface StatusRemovedEvent {
  type: 'STATUS_REMOVED';
  timestamp: Timestamp;
  target: 'player' | 'enemy';
  effectId: string;
  effectName: string;
  reason: 'expired' | 'cleansed' | 'overwritten';
}

interface CriticalHitEvent {
  type: 'CRITICAL_HIT';
  timestamp: Timestamp;
  attacker: 'player' | 'enemy';
  multiplier: number;
  baseDamage: number;
  critDamage: number;
}

interface EnemyStaggeredEvent {
  type: 'ENEMY_STAGGERED';
  timestamp: Timestamp;
  enemyId: string;
  staggerCount: number;
}

interface FleeAttemptedEvent {
  type: 'FLEE_ATTEMPTED';
  timestamp: Timestamp;
  success: boolean;
  baseChance: number;
  dreadCost: number;
  blocked: boolean;
  blockedReason?: 'turn_1' | 'ambush' | 'boss' | 'watcher';
}

interface EnemyKilledEvent {
  type: 'ENEMY_KILLED';
  timestamp: Timestamp;
  enemyId: string;
  enemyName: string;
  enemyType: EnemyType;
  xpAwarded: number;
  goldDropped: number;
  dreadChange: number;
  killedByDoT: boolean;
}

interface PlayerKilledEvent {
  type: 'PLAYER_KILLED';
  timestamp: Timestamp;
  killedBy: string;
  killerType: EnemyType;
  floor: FloorNumber;
  dreadAtDeath: number;
  wasOverkill: boolean;
}

// ==================== Item Events ====================

interface ItemFoundEvent {
  type: 'ITEM_FOUND';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  rarity: Rarity;
  slot: ItemSlot;
  source: 'enemy' | 'chest' | 'event' | 'shrine';
}

interface ItemPickedUpEvent {
  type: 'ITEM_PICKED_UP';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  inventorySlotUsed: number;
}

interface ItemDroppedEvent {
  type: 'ITEM_DROPPED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  reason: 'player_choice' | 'inventory_full';
}

interface ItemEquippedEvent {
  type: 'ITEM_EQUIPPED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  slot: EquipmentSlot;
  previousItem: string | null;
}

interface ItemUnequippedEvent {
  type: 'ITEM_UNEQUIPPED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  slot: EquipmentSlot;
}

interface ItemIdentifiedEvent {
  type: 'ITEM_IDENTIFIED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  revealedName: string;
  wasCursed: boolean;
  goldSpent: number;
}

interface ItemUsedEvent {
  type: 'ITEM_USED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  effectDescription: string;
  inCombat: boolean;
}

interface ItemSoldEvent {
  type: 'ITEM_SOLD';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  goldReceived: number;
}

interface ItemPurchasedEvent {
  type: 'ITEM_PURCHASED';
  timestamp: Timestamp;
  templateId: string;
  itemName: string;
  goldSpent: number;
  fromBuyback: boolean;
}

interface StashItemAddedEvent {
  type: 'STASH_ITEM_ADDED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  stashSlotIndex: number;
}

interface StashItemRemovedEvent {
  type: 'STASH_ITEM_REMOVED';
  timestamp: Timestamp;
  itemId: EntityId;
  templateId: string;
  itemName: string;
  destination: 'inventory' | 'equipped';
}

// ==================== Progression Events ====================

interface XPGainedEvent {
  type: 'XP_GAINED';
  timestamp: Timestamp;
  amount: number;
  source: string;
  multiplier: number;
  totalXP: number;
  toNextLevel: number;
}

interface LevelUpEvent {
  type: 'LEVEL_UP';
  timestamp: Timestamp;
  newLevel: number;
  statChoices: StatName[];
  hpGained: number;
}

interface StatIncreasedEvent {
  type: 'STAT_INCREASED';
  timestamp: Timestamp;
  stat: StatName;
  oldValue: number;
  newValue: number;
  source: 'level_up' | 'item' | 'buff' | 'event';
}

interface GoldChangedEvent {
  type: 'GOLD_CHANGED';
  timestamp: Timestamp;
  delta: number;
  newTotal: number;
  source: string;
}

// ==================== Dread Events ====================

interface DreadChangedEvent {
  type: 'DREAD_CHANGED';
  timestamp: Timestamp;
  delta: number;
  newTotal: number;
  source: string;
  wasModified: boolean;
  modifierSource?: string;
}

interface DreadThresholdCrossedEvent {
  type: 'DREAD_THRESHOLD_CROSSED';
  timestamp: Timestamp;
  fromThreshold: DreadThreshold;
  toThreshold: DreadThreshold;
  direction: 'up' | 'down';
  currentDread: number;
}

interface WatcherWarningEvent {
  type: 'WATCHER_WARNING';
  timestamp: Timestamp;
  severity: 'noticed' | 'approaching' | 'imminent';
  currentDread: number;
  message: string;
}

interface WatcherSpawnedEvent {
  type: 'WATCHER_SPAWNED';
  timestamp: Timestamp;
  floor: FloorNumber;
  roomId: string;
  dreadAtSpawn: number;
}

interface WatcherStunnedEvent {
  type: 'WATCHER_STUNNED';
  timestamp: Timestamp;
  stunCount: number;
  stunsRemaining: number;
  damageDealt: number;
  escapeWindowTurns: number;
}

interface WatcherEnragedEvent {
  type: 'WATCHER_ENRAGED';
  timestamp: Timestamp;
  damageMultiplier: number;
}

interface ExtractionBlockedEvent {
  type: 'EXTRACTION_BLOCKED';
  timestamp: Timestamp;
  blockedBy: 'watcher';
  canStun: boolean;
}

interface ExtractionUnblockedEvent {
  type: 'EXTRACTION_UNBLOCKED';
  timestamp: Timestamp;
  turnsToEscape: number;
}

// ==================== Knowledge Events ====================

interface VeteranKnowledgeUnlockedEvent {
  type: 'VETERAN_KNOWLEDGE_UNLOCKED';
  timestamp: Timestamp;
  monsterId: string;
  monsterName: string;
  tier: 1 | 2 | 3;
  reveals: string[];
  triggeredBy: 'encounters' | 'death';
}

interface BestiaryEntryUnlockedEvent {
  type: 'BESTIARY_ENTRY_UNLOCKED';
  timestamp: Timestamp;
  monsterId: string;
  monsterName: string;
  firstEncounter: boolean;
}

interface LessonLearnedActivatedEvent {
  type: 'LESSON_LEARNED_ACTIVATED';
  timestamp: Timestamp;
  enemyType: string;
  enemyName: string;
  damageBonus: number;
  runsRemaining: number;
}

interface LessonLearnedExpiredEvent {
  type: 'LESSON_LEARNED_EXPIRED';
  timestamp: Timestamp;
  enemyType: string;
  wasUsed: boolean;
}

// ==================== Extraction Events ====================

interface ExtractionStartedEvent {
  type: 'EXTRACTION_STARTED';
  timestamp: Timestamp;
  floor: FloorNumber;
  costType: 'free' | 'gold' | 'item' | 'desperation';
  goldPaid?: number;
  itemSacrificed?: string;
  dreadCost?: number;
}

interface ExtractionCompletedEvent {
  type: 'EXTRACTION_COMPLETED';
  timestamp: Timestamp;
  floor: FloorNumber;
  itemsKept: number;
  goldKept: number;
  xpGained: number;
  enemiesKilled: number;
  lessonLearnedDecremented: boolean;
}

interface ExtractionTauntEvent {
  type: 'EXTRACTION_TAUNT';
  timestamp: Timestamp;
  nextRoomType: RoomType;
  contentHint: string;
  chestType?: 'standard' | 'locked' | 'ornate';
}

// ==================== Death Events ====================

interface DeathOccurredEvent {
  type: 'DEATH_OCCURRED';
  timestamp: Timestamp;
  killedBy: string;
  killerType: EnemyType;
  floor: FloorNumber;
  dreadAtDeath: number;
}

// Full loss on death: all items in dungeon are lost equally.
// No reason needed - matches LostItemInfo from Item System (07).
interface ItemsLostEvent {
  type: 'ITEMS_LOST';
  timestamp: Timestamp;
  items: Array<{
    itemId: EntityId;
    templateId: string;
    itemName: string;
  }>;
}

// NOTE: ItemsPreservedEvent removed. With full loss on death, no items
// are preserved from dungeon. Stash items are never at risk during a run.

// ==================== Event Room Events ====================

interface EventStartedEvent {
  type: 'EVENT_STARTED';
  timestamp: Timestamp;
  eventId: string;
  eventType: EventType;
  title: string;
  choicesAvailable: number;
}

interface EventChoiceMadeEvent {
  type: 'EVENT_CHOICE_MADE';
  timestamp: Timestamp;
  eventId: string;
  choiceId: string;
  choiceText: string;
}

interface EventOutcomeEvent {
  type: 'EVENT_OUTCOME';
  timestamp: Timestamp;
  eventId: string;
  success: boolean;
  description: string;
  rewards: string[];
  costs: string[];
}

// ==================== Shrine Events ====================

interface ShrineBlessingReceivedEvent {
  type: 'SHRINE_BLESSING_RECEIVED';
  timestamp: Timestamp;
  blessingId: string;
  blessingName: string;
  effect: string;
  duration: string;
}

interface ShrineBlessingReplacedEvent {
  type: 'SHRINE_BLESSING_REPLACED';
  timestamp: Timestamp;
  oldBlessingId: string;
  oldBlessingName: string;
  newBlessingId: string;
  newBlessingName: string;
}

interface ShrineCurseReceivedEvent {
  type: 'SHRINE_CURSE_RECEIVED';
  timestamp: Timestamp;
  shrineType: string;
  curseEffect: string;
}

// ==================== Unlock Events ====================

interface ClassUnlockedEvent {
  type: 'CLASS_UNLOCKED';
  timestamp: Timestamp;
  classId: CharacterClass;
  className: string;
  unlockedBy: string;
}

interface ItemUnlockedEvent {
  type: 'ITEM_UNLOCKED';
  timestamp: Timestamp;
  templateId: string;
  itemName: string;
  unlockedBy: string;
}

interface MutatorUnlockedEvent {
  type: 'MUTATOR_UNLOCKED';
  timestamp: Timestamp;
  mutatorId: string;
  mutatorName: string;
  unlockedBy: string;
}

// ==================== System Events ====================

interface GameSavedEvent {
  type: 'GAME_SAVED';
  timestamp: Timestamp;
  profileId: string;
  trigger: string;
}

interface GameLoadedEvent {
  type: 'GAME_LOADED';
  timestamp: Timestamp;
  profileId: string;
  lastPlayed: Timestamp;
}

interface ProfileCreatedEvent {
  type: 'PROFILE_CREATED';
  timestamp: Timestamp;
  profileName: string;
  playerType: 'human' | 'ai_agent';
}

interface ProfileDeletedEvent {
  type: 'PROFILE_DELETED';
  timestamp: Timestamp;
  profileName: string;
}

interface SaveRecoveryAttemptedEvent {
  type: 'SAVE_RECOVERY_ATTEMPTED';
  timestamp: Timestamp;
  profileName: string;
  success: boolean;
  method: 'backup' | 'partial' | 'reset';
}

interface WhisperEvent {
  type: 'WHISPER';
  timestamp: Timestamp;
  text: string;
  isHint: boolean;
  dreadLevel: number;
}

// ==================== Union Type ====================

type GameEvent =
  // Session
  | SessionStartedEvent
  | SessionEndedEvent

  // Navigation
  | RoomEnteredEvent
  | RoomClearedEvent
  | FloorDescendedEvent

  // Combat
  | CombatStartedEvent
  | CombatEndedEvent
  | PlayerAttackedEvent
  | EnemyAttackedEvent
  | DamageDealtEvent
  | HealingReceivedEvent
  | StatusAppliedEvent
  | StatusRemovedEvent
  | CriticalHitEvent
  | EnemyStaggeredEvent
  | FleeAttemptedEvent
  | EnemyKilledEvent
  | PlayerKilledEvent

  // Items
  | ItemFoundEvent
  | ItemPickedUpEvent
  | ItemDroppedEvent
  | ItemEquippedEvent
  | ItemUnequippedEvent
  | ItemIdentifiedEvent
  | ItemUsedEvent
  | ItemSoldEvent
  | ItemPurchasedEvent
  | StashItemAddedEvent
  | StashItemRemovedEvent

  // Progression
  | XPGainedEvent
  | LevelUpEvent
  | StatIncreasedEvent
  | GoldChangedEvent

  // Dread
  | DreadChangedEvent
  | DreadThresholdCrossedEvent
  | WatcherWarningEvent
  | WatcherSpawnedEvent
  | WatcherStunnedEvent
  | WatcherEnragedEvent
  | ExtractionBlockedEvent
  | ExtractionUnblockedEvent

  // Knowledge
  | VeteranKnowledgeUnlockedEvent
  | BestiaryEntryUnlockedEvent
  | LessonLearnedActivatedEvent
  | LessonLearnedExpiredEvent

  // Extraction
  | ExtractionStartedEvent
  | ExtractionCompletedEvent
  | ExtractionTauntEvent

  // Death
  | DeathOccurredEvent
  | ItemsLostEvent

  // Events
  | EventStartedEvent
  | EventChoiceMadeEvent
  | EventOutcomeEvent

  // Shrines
  | ShrineBlessingReceivedEvent
  | ShrineBlessingReplacedEvent
  | ShrineCurseReceivedEvent

  // Unlocks
  | ClassUnlockedEvent
  | ItemUnlockedEvent
  | MutatorUnlockedEvent

  // System
  | GameSavedEvent
  | GameLoadedEvent
  | ProfileCreatedEvent
  | ProfileDeletedEvent
  | SaveRecoveryAttemptedEvent
  | WhisperEvent;
```

### Event Utilities

```typescript
// ==================== Event Utilities ====================

/**
 * Create an event with auto-populated timestamp
 */
function createEvent<T extends GameEvent['type']>(
  type: T,
  data: Omit<Extract<GameEvent, { type: T }>, 'type' | 'timestamp'>
): Extract<GameEvent, { type: T }>;

/**
 * Type guard for specific event type
 */
function isEventType<T extends GameEvent['type']>(
  event: GameEvent,
  type: T
): event is Extract<GameEvent, { type: T }>;

/**
 * Filter events by type from log
 */
function filterEventsByType<T extends GameEvent['type']>(
  events: readonly GameEvent[],
  type: T
): Extract<GameEvent, { type: T }>[];

/**
 * Get events within time range
 */
function filterEventsByTimeRange(
  events: readonly GameEvent[],
  start: Timestamp,
  end: Timestamp
): GameEvent[];

/**
 * Get last event of a type
 */
function getLastEventOfType<T extends GameEvent['type']>(
  events: readonly GameEvent[],
  type: T
): Extract<GameEvent, { type: T }> | undefined;
```

---

## Configuration Files

None. The event system is pure infrastructure.

---

## Events Emitted/Subscribed

This IS the event system. It doesn't subscribe to itself.

---

## State Managed

- **Event log**: Ring buffer of recent events
- **Subscriber registry**: Map of event types to handlers

---

## Edge Cases and Error Handling

| Case | Handling |
|------|----------|
| Handler throws error | Log error, continue to other handlers |
| Subscribe during emit | Handler added but not called for current emit |
| Unsubscribe during emit | Handler removed, won't be called if not yet reached |
| Emit with no subscribers | No-op, event still logged |
| Log overflow | Oldest events removed (ring buffer) |
| Subscribe to invalid type | TypeScript prevents at compile time |
| Double unsubscribe | No-op (idempotent) |

---

## Test Strategy

### Unit Tests

1. **Subscription Tests**
   - Subscribe receives events of correct type
   - Subscribe doesn't receive wrong types
   - Unsubscribe stops delivery
   - Multiple subscribers all receive event
   - subscribeAll receives all event types

2. **Emit Tests**
   - Event delivered to all subscribers
   - Event added to log
   - Handler errors don't break other handlers
   - Events delivered in order

3. **Log Tests**
   - Events stored in log
   - Log respects max size
   - Clear log works
   - Filter utilities work

### Integration Tests

1. Emit from one module, receive in another
2. Event ordering across multiple emitters
3. Performance with many subscribers

---

## Implementation Notes

### Subscriber Storage

```typescript
// Internal structure
Map<GameEvent['type'], Set<EventHandler<any>>>
Set<EventHandler<GameEvent>> // For subscribeAll
```

### Event Log

Use a ring buffer for O(1) append with bounded memory:

```typescript
class RingBuffer<T> {
  private items: T[];
  private head: number = 0;
  private size: number;

  push(item: T): void { /* ... */ }
  toArray(): T[] { /* ... */ }
  clear(): void { /* ... */ }
}
```

### Thread Safety

Not required for single-threaded JS, but emit should be reentrant (handler can emit).

---

## Public Exports

```typescript
// src/core/events/index.ts

export type {
  EventBus,
  EventBusOptions,
  EventHandler,

  // All event types
  GameEvent,
  SessionStartedEvent,
  SessionEndedEvent,
  RoomEnteredEvent,
  RoomClearedEvent,
  FloorDescendedEvent,
  CombatStartedEvent,
  CombatEndedEvent,
  PlayerAttackedEvent,
  EnemyAttackedEvent,
  DamageDealtEvent,
  HealingReceivedEvent,
  StatusAppliedEvent,
  StatusRemovedEvent,
  CriticalHitEvent,
  EnemyStaggeredEvent,
  FleeAttemptedEvent,
  EnemyKilledEvent,
  PlayerKilledEvent,
  ItemFoundEvent,
  ItemPickedUpEvent,
  ItemDroppedEvent,
  ItemEquippedEvent,
  ItemUnequippedEvent,
  ItemIdentifiedEvent,
  ItemUsedEvent,
  ItemSoldEvent,
  ItemPurchasedEvent,
  StashItemAddedEvent,
  StashItemRemovedEvent,
  XPGainedEvent,
  LevelUpEvent,
  StatIncreasedEvent,
  GoldChangedEvent,
  DreadChangedEvent,
  DreadThresholdCrossedEvent,
  WatcherWarningEvent,
  WatcherSpawnedEvent,
  WatcherStunnedEvent,
  WatcherEnragedEvent,
  ExtractionBlockedEvent,
  ExtractionUnblockedEvent,
  VeteranKnowledgeUnlockedEvent,
  BestiaryEntryUnlockedEvent,
  LessonLearnedActivatedEvent,
  LessonLearnedExpiredEvent,
  ExtractionStartedEvent,
  ExtractionCompletedEvent,
  ExtractionTauntEvent,
  DeathOccurredEvent,
  ItemsLostEvent,
  EventStartedEvent,
  EventChoiceMadeEvent,
  EventOutcomeEvent,
  ShrineBlessingReceivedEvent,
  ShrineBlessingReplacedEvent,
  ShrineCurseReceivedEvent,
  ClassUnlockedEvent,
  ItemUnlockedEvent,
  MutatorUnlockedEvent,
  GameSavedEvent,
  GameLoadedEvent,
  ProfileCreatedEvent,
  ProfileDeletedEvent,
  SaveRecoveryAttemptedEvent,
  WhisperEvent,
};

export {
  createEventBus,
  createEvent,
  isEventType,
  filterEventsByType,
  filterEventsByTimeRange,
  getLastEventOfType,
};
```
