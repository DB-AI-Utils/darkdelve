# 11 - Extraction System

## Purpose

Manages the core gameplay loop of DARKDELVE: the extraction dilemma. This module handles extraction costs by floor, Waystone payments, desperation extraction, death economy (item loss/preservation), the post-extraction "Taunt," Threshold Retreat, and the Lesson Learned mechanic. It is the system that makes "one more floor" a meaningful decision.

---

## Responsibilities

1. Calculate and validate extraction costs by floor
2. Process Waystone payments (gold, item, or Dread)
3. Handle free extraction on Floors 1-2
4. Manage Threshold Retreat from Floor 5
5. Process desperation extraction when resources are insufficient
6. Execute death economy: determine which items are lost/preserved
7. Generate the post-extraction "Taunt" (reveal next room contents)
8. Track and apply Lesson Learned damage bonus
9. Decrement Lesson Learned charge at expedition start
10. Emit extraction and death events for presentation layer

---

## Dependencies

- **01-foundation**: Types (`FloorNumber`, `EntityId`, `Rarity`, `RoomType`), `Result`, `SeededRNG`
- **02-content-registry**: `ExtractionConfig`, loot table access for Taunt generation
- **04-event-system**: Event emission (`EXTRACTION_*`, `ITEMS_LOST`, `LESSON_LEARNED_*`)
- **07-item-system**: `ItemInstance`, `ItemSource`, `ItemRiskStatus`, inventory/stash operations
- **09-dread-system**: `DreadManager` for extraction blocking (Watcher) and desperation Dread cost
- **10-dungeon-system**: `DungeonSystem` (facade providing navigation and room state for Taunt generation)

---

## Interface Contracts

### Extraction Cost Types

```typescript
// ==================== Cost Types ====================

/**
 * Floor-based extraction rules
 */
type ExtractionMethod =
  | 'free'          // Floors 1-2: No cost
  | 'waystone'      // Floors 3-4: Requires Waystone payment
  | 'boss'          // Floor 5: Must defeat boss to exit
  | 'threshold_retreat'; // Floor 5: Pay to retreat to Floor 4

/**
 * Payment options for Waystone extraction
 */
type WaystonePayment =
  | { type: 'gold'; amount: number }
  | { type: 'item'; itemId: EntityId; itemName: string }
  | { type: 'desperation'; dreadCost: number; equipmentSacrificed?: EntityId };

/**
 * Extraction cost calculation result
 */
interface ExtractionCost {
  /** Which floor extraction is from */
  floor: FloorNumber;

  /** The extraction method for this floor */
  method: ExtractionMethod;

  /** Gold cost if paying with gold (null if not applicable) */
  goldCost: number | null;

  /** Minimum gold required (prevents zero-gold exploit) */
  minimumGold: number | null;

  /** Whether item payment is available */
  canPayWithItem: boolean;

  /** Whether desperation extraction is available */
  desperationAvailable: boolean;

  /** Dread cost for desperation extraction */
  desperationDreadCost: number | null;

  /** Whether extraction is blocked (Watcher active) */
  blockedByWatcher: boolean;

  /** Human-readable explanation */
  description: string;
}

/**
 * Floor-specific extraction configuration
 */
interface FloorExtractionConfig {
  floor: FloorNumber;
  method: ExtractionMethod;
  goldPercentage: number;      // 0.10 for 10%, 0.25 for 25%
  minimumGold: number;         // 15g for F3, 25g for F4
  allowItemPayment: boolean;
  itemPaymentCount: number;    // Number of items required
}

const FLOOR_EXTRACTION_CONFIG: Record<FloorNumber, FloorExtractionConfig> = {
  1: { floor: 1, method: 'free', goldPercentage: 0, minimumGold: 0, allowItemPayment: false, itemPaymentCount: 0 },
  2: { floor: 2, method: 'free', goldPercentage: 0, minimumGold: 0, allowItemPayment: false, itemPaymentCount: 0 },
  3: { floor: 3, method: 'waystone', goldPercentage: 0.10, minimumGold: 15, allowItemPayment: true, itemPaymentCount: 1 },
  4: { floor: 4, method: 'waystone', goldPercentage: 0.25, minimumGold: 25, allowItemPayment: true, itemPaymentCount: 1 },
  5: { floor: 5, method: 'boss', goldPercentage: 0, minimumGold: 0, allowItemPayment: false, itemPaymentCount: 0 },
};

/**
 * Threshold Retreat configuration (Floor 5 only)
 */
interface ThresholdRetreatConfig {
  goldPercentage: number;      // 0.25 (25%)
  minimumGold: number;         // 25g
  allowItemPayment: boolean;   // true
  itemPaymentCount: number;    // 1
  returnFloor: FloorNumber;    // Floor 4
}

const THRESHOLD_RETREAT_CONFIG: ThresholdRetreatConfig = {
  goldPercentage: 0.25,
  minimumGold: 25,
  allowItemPayment: true,
  itemPaymentCount: 1,
  returnFloor: 4,
};
```

### Extraction Service

```typescript
// ==================== Extraction Service ====================

interface ExtractionService {
  // === Cost Calculation ===

  /**
   * Calculate extraction cost for current floor
   */
  calculateExtractionCost(params: ExtractionCostParams): ExtractionCost;

  /**
   * Check if player can afford extraction
   */
  canAffordExtraction(params: AffordabilityParams): AffordabilityResult;

  /**
   * Get available payment options for current floor
   */
  getPaymentOptions(params: PaymentOptionsParams): PaymentOption[];

  // === Extraction Execution ===

  /**
   * Execute extraction with specified payment
   */
  executeExtraction(params: ExecuteExtractionParams): Result<ExtractionResult, GameError>;

  /**
   * Execute threshold retreat (Floor 5 -> Floor 4)
   */
  executeThresholdRetreat(params: ThresholdRetreatParams): Result<ThresholdRetreatResult, GameError>;

  /**
   * Execute desperation extraction
   */
  executeDesperationExtraction(params: DesperationParams): Result<ExtractionResult, GameError>;

  // === Validation ===

  /**
   * Check if extraction is currently possible
   */
  canExtract(params: CanExtractParams): CanExtractResult;

  /**
   * Check if threshold retreat is available
   */
  canRetreat(params: CanRetreatParams): CanRetreatResult;

  // === Taunt Generation ===

  /**
   * Generate the post-extraction "Taunt"
   * Shows what was in the next room
   */
  generateTaunt(params: TauntParams): ExtractionTaunt;
}

// ==================== Parameter Types ====================

interface ExtractionCostParams {
  currentFloor: FloorNumber;
  carriedGold: number;
  watcherActive: boolean;
}

interface AffordabilityParams {
  currentFloor: FloorNumber;
  carriedGold: number;
  carriedItems: readonly ItemInstance[];
  equippedItems: readonly ItemInstance[];
}

interface PaymentOptionsParams {
  currentFloor: FloorNumber;
  carriedGold: number;
  carriedItems: readonly ItemInstance[];
  equippedItems: readonly ItemInstance[];
  currentDread: number;
}

interface ExecuteExtractionParams {
  currentFloor: FloorNumber;
  payment: WaystonePayment;
  carriedGold: number;
  carriedItems: readonly ItemInstance[];
  equippedItems: readonly ItemInstance[];
  runStats: RunStats;
}

interface ThresholdRetreatParams {
  payment: WaystonePayment;
  carriedGold: number;
  carriedItems: readonly ItemInstance[];
  equippedItems: readonly ItemInstance[];
}

interface DesperationParams {
  currentFloor: FloorNumber;
  currentDread: number;
  equippedItems: readonly ItemInstance[];
  hasOnlyWeapon: boolean;
}

interface CanExtractParams {
  currentFloor: FloorNumber;
  currentRoomType: RoomType;
  bossDefeated: boolean;
  watcherActive: boolean;
  inCombat: boolean;
}

interface CanRetreatParams {
  currentFloor: FloorNumber;
  currentRoomType: RoomType;
  bossDefeated: boolean;
  carriedGold: number;
  carriedItems: readonly ItemInstance[];
  equippedItems: readonly ItemInstance[];
}

interface TauntParams {
  currentFloor: FloorNumber;
  nextRoomType: RoomType;
  nextRoomContents: NextRoomContents;
  rng: SeededRNG;
}

// ==================== Result Types ====================

interface AffordabilityResult {
  canAfford: boolean;
  canAffordGold: boolean;
  canAffordItem: boolean;
  canAffordDesperation: boolean;
  goldShortfall: number;
  reason: string | null;
}

interface PaymentOption {
  type: 'gold' | 'item' | 'desperation';
  cost: number | string;           // Gold amount or item name or "Dread"
  available: boolean;
  reason: string | null;           // Why unavailable
}

interface ExtractionResult {
  success: true;
  floor: FloorNumber;
  paymentMade: WaystonePayment;
  goldRemaining: number;
  itemsKept: ExtractedItemInfo[];
  runStats: RunStats;
  taunt: ExtractionTaunt;
}

interface ThresholdRetreatResult {
  success: true;
  paymentMade: WaystonePayment;
  goldRemaining: number;
  returnFloor: FloorNumber;
  floor5ProgressLost: boolean;
}

interface CanExtractResult {
  canExtract: boolean;
  reason: string | null;
  method: ExtractionMethod;
  requiresPayment: boolean;
}

interface CanRetreatResult {
  canRetreat: boolean;
  reason: string | null;
  paymentOptions: PaymentOption[];
}

interface ExtractedItemInfo {
  itemId: EntityId;
  templateId: string;
  displayName: string;
  identified: boolean;
  source: ItemSource;
}

interface ExtractionTaunt {
  /** What was in the next room */
  nextRoomType: RoomType;

  /** Human-readable hint about contents */
  contentHint: string;

  /** Rarity of item if treasure room (never Legendary) */
  itemRarity: Rarity | null;

  /** Full taunt message for display */
  message: string;
}

interface NextRoomContents {
  roomType: RoomType;
  hasChest: boolean;
  chestRarity: Rarity | null;
  enemyName: string | null;
  eventType: string | null;
}

interface RunStats {
  enemiesKilled: number;
  goldCollected: number;
  xpGained: number;
  floorsExplored: number;
  itemsFound: number;
  maxDreadReached: number;
}
```

### Death Economy Service

```typescript
// ==================== Death Economy ====================

/**
 * Death Economy follows a simple rule: FULL LOSS ON DEATH.
 * All items in the dungeon (equipped, carried, brought) are lost.
 * Only the stash (at camp) is safe.
 *
 * This simplification strengthens the extraction dilemma and
 * eliminates complex survival rule processing.
 */
interface DeathEconomyService {
  /**
   * Process death: all items lost, grant Lesson Learned.
   * Delegates item loss to ItemSystem's StashService.
   */
  processPlayerDeath(params: DeathParams): DeathResult;
}

interface DeathParams {
  /** Items currently equipped */
  equippedItems: readonly ItemInstance[];

  /** Items in carried inventory (not equipped) */
  carriedItems: readonly ItemInstance[];

  /** Gold carried */
  carriedGold: number;

  /** What killed the player */
  killedBy: KilledByInfo;

  /** Current Dread at death */
  dreadAtDeath: number;

  /** Current floor */
  floor: FloorNumber;
}

interface KilledByInfo {
  enemyId: string;
  enemyName: string;
  enemyType: EnemyType;
}

interface DeathResult {
  /** All items lost (full loss on death) */
  itemsLost: LostItemInfo[];

  /** Gold lost */
  goldLost: number;

  /** Lesson Learned granted */
  lessonLearned: LessonLearnedInfo;

  /** Death summary for display */
  summary: DeathSummary;
}

// NOTE: Veteran Knowledge updates are NOT included in DeathResult.
// KnowledgeService (06-character-system) is the single owner of all
// VeteranKnowledge state mutations. It subscribes to PLAYER_KILLED
// events and handles death-based knowledge updates independently.
// This prevents double-application of knowledge updates.

/**
 * LostItemInfo imported from 07-item-system (canonical definition).
 * Simple structure: itemId, templateId, displayName.
 * No "reason" needed - all items are lost on death.
 */

interface DeathSummary {
  totalItemsLost: number;
  goldLost: number;
  floor: FloorNumber;
  killedBy: string;
  lessonLearnedGranted: boolean;
}
```

### Lesson Learned Service

```typescript
// ==================== Lesson Learned ====================

interface LessonLearnedService {
  /**
   * Grant Lesson Learned after death
   */
  grantLessonLearned(killedBy: KilledByInfo): LessonLearnedInfo;

  /**
   * Check if Lesson Learned is active
   */
  isLessonLearnedActive(): boolean;

  /**
   * Get current Lesson Learned info (null if none)
   */
  getCurrentLessonLearned(): LessonLearnedInfo | null;

  /**
   * Decrement Lesson Learned charge (called at expedition start)
   */
  decrementLessonLearned(): LessonLearnedDecrementResult;

  /**
   * Apply Lesson Learned damage bonus
   */
  applyDamageBonus(
    baseDamage: number,
    targetEnemyType: string
  ): LessonLearnedDamageResult;

  /**
   * Clear Lesson Learned (runs expired)
   */
  clearLessonLearned(): void;
}

interface LessonLearnedInfo {
  /** Enemy type that killed player */
  enemyType: string;

  /** Enemy display name */
  enemyName: string;

  /** Damage bonus percentage (0.10 = 10%) */
  damageBonus: number;

  /** Runs remaining (starts at 1, consumed at expedition start) */
  runsRemaining: number;

  /** When granted */
  grantedAt: Timestamp;
}

interface LessonLearnedDecrementResult {
  /** Whether a charge was active */
  hadCharge: boolean;

  /** Charge was decremented */
  decremented: boolean;

  /** Charge is now exhausted */
  exhausted: boolean;

  /** Updated lesson info (null if exhausted) */
  lessonLearned: LessonLearnedInfo | null;
}

interface LessonLearnedDamageResult {
  /** Original damage */
  baseDamage: number;

  /** Bonus damage from Lesson Learned */
  bonusDamage: number;

  /** Total damage after bonus */
  totalDamage: number;

  /** Whether bonus was applied */
  bonusApplied: boolean;

  /** Enemy type matched */
  enemyTypeMatched: string | null;
}

// VeteranKnowledgeUpdate is NOT defined here.
// KnowledgeService (06-character-system) is the single owner of all
// veteran knowledge types and state mutations.
```

### Factory Function

```typescript
/**
 * Create extraction service instance.
 * Uses DungeonSystem facade for next room queries (Taunt generation).
 */
function createExtractionService(
  config: ExtractionConfig,
  eventBus: EventBus,
  itemService: ItemService,
  dreadManager: DreadManager,
  dungeonSystem: DungeonSystem
): ExtractionService;

/**
 * Create death economy service instance.
 * Simple implementation: all items lost on death.
 */
function createDeathEconomyService(
  config: DeathEconomyConfig,
  eventBus: EventBus
): DeathEconomyService;

/**
 * Create lesson learned service instance
 */
function createLessonLearnedService(
  config: LessonLearnedConfig,
  eventBus: EventBus
): LessonLearnedService;
```

---

## Configuration Files

### configs/extraction.json

```json
{
  "floors": {
    "1": {
      "method": "free",
      "goldPercentage": 0,
      "minimumGold": 0,
      "allowItemPayment": false,
      "itemPaymentCount": 0
    },
    "2": {
      "method": "free",
      "goldPercentage": 0,
      "minimumGold": 0,
      "allowItemPayment": false,
      "itemPaymentCount": 0
    },
    "3": {
      "method": "waystone",
      "goldPercentage": 0.10,
      "minimumGold": 15,
      "allowItemPayment": true,
      "itemPaymentCount": 1
    },
    "4": {
      "method": "waystone",
      "goldPercentage": 0.25,
      "minimumGold": 25,
      "allowItemPayment": true,
      "itemPaymentCount": 1
    },
    "5": {
      "method": "boss",
      "goldPercentage": 0,
      "minimumGold": 0,
      "allowItemPayment": false,
      "itemPaymentCount": 0
    }
  },

  "thresholdRetreat": {
    "goldPercentage": 0.25,
    "minimumGold": 25,
    "allowItemPayment": true,
    "itemPaymentCount": 1,
    "returnFloor": 4
  },

  "desperation": {
    "dreadCost": 20,
    "allowEquipmentSacrifice": true,
    "protectedSlots": ["weapon"],
    "freeExtractionIfOnlyWeapon": true
  },

  "extractionLocations": ["stairwell", "waystone"],

  "taunt": {
    "enabled": true,
    "neverShowLegendary": true,
    "showItemRarity": true,
    "showEnemyHint": true,
    "showEventHint": true
  }
}
```

### configs/death-economy.json

```json
{
  "rule": "full_loss",
  "description": "All items in dungeon lost on death. Only stash is safe.",

  "riskStatusTags": {
    "safe": { "color": "green", "description": "In stash, will not be lost" },
    "at_risk": { "color": "red", "description": "In dungeon, lost on death" }
  }
}
```

### configs/lesson-learned.json

```json
{
  "damageBonus": 0.10,
  "duration": {
    "runs": 1,
    "decrementsAt": "expedition_start"
  },
  "display": {
    "deathScreen": true,
    "runStart": true,
    "combatLog": true
  },
  "stacking": "overwrite"
}
```

---

## Events Emitted

### EXTRACTION_STARTED

Emitted when extraction begins.

```typescript
interface ExtractionStartedEvent {
  type: 'EXTRACTION_STARTED';
  timestamp: Timestamp;
  floor: FloorNumber;
  costType: 'free' | 'gold' | 'item' | 'desperation';
  goldPaid?: number;
  itemSacrificed?: string;
  dreadCost?: number;
}
```

### EXTRACTION_COMPLETED

Emitted when extraction successfully completes.

```typescript
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
```

### EXTRACTION_TAUNT

Emitted to show what was missed.

```typescript
interface ExtractionTauntEvent {
  type: 'EXTRACTION_TAUNT';
  timestamp: Timestamp;
  nextRoomType: RoomType;
  contentHint: string;
  rarity?: Rarity;
}
```

### THRESHOLD_RETREAT_STARTED

Emitted when player begins retreat from Floor 5.

```typescript
interface ThresholdRetreatStartedEvent {
  type: 'THRESHOLD_RETREAT_STARTED';
  timestamp: Timestamp;
  costType: 'gold' | 'item';
  goldPaid?: number;
  itemSacrificed?: string;
}
```

### THRESHOLD_RETREAT_COMPLETED

Emitted when retreat completes.

```typescript
interface ThresholdRetreatCompletedEvent {
  type: 'THRESHOLD_RETREAT_COMPLETED';
  timestamp: Timestamp;
  returnFloor: FloorNumber;
  goldRemaining: number;
  floor5ProgressLost: boolean;
}
```

### DEATH_OCCURRED

Emitted when player dies.

```typescript
interface DeathOccurredEvent {
  type: 'DEATH_OCCURRED';
  timestamp: Timestamp;
  killedBy: string;
  killerType: EnemyType;
  floor: FloorNumber;
  dreadAtDeath: number;
}
```

### ITEMS_LOST

Emitted with details of lost items (all items in dungeon on death).

```typescript
interface ItemsLostEvent {
  type: 'ITEMS_LOST';
  timestamp: Timestamp;
  items: Array<{
    itemId: EntityId;
    templateId: string;
    itemName: string;
  }>;
  goldLost: number;
}
```

### LESSON_LEARNED_GRANTED

Emitted when Lesson Learned is gained.

```typescript
interface LessonLearnedGrantedEvent {
  type: 'LESSON_LEARNED_GRANTED';
  timestamp: Timestamp;
  enemyType: string;
  enemyName: string;
  damageBonus: number;
  runsRemaining: number;
}
```

### LESSON_LEARNED_ACTIVATED

Emitted at expedition start when Lesson Learned is active.

```typescript
interface LessonLearnedActivatedEvent {
  type: 'LESSON_LEARNED_ACTIVATED';
  timestamp: Timestamp;
  enemyType: string;
  enemyName: string;
  damageBonus: number;
  runsRemaining: number;
}
```

### LESSON_LEARNED_EXPIRED

Emitted when Lesson Learned charge is exhausted.

```typescript
interface LessonLearnedExpiredEvent {
  type: 'LESSON_LEARNED_EXPIRED';
  timestamp: Timestamp;
  enemyType: string;
  wasUsed: boolean;
}
```

---

## Events Subscribed

| Event | Response |
|-------|----------|
| `SESSION_STARTED` | Decrement Lesson Learned charge |
| `PLAYER_KILLED` | Process death economy, grant Lesson Learned |
| `COMBAT_ENDED` | Check if Lesson Learned damage bonus applied |
| `WATCHER_SPAWNED` | Block extraction until Watcher defeated/stunned |
| `WATCHER_STUNNED` | Temporarily unblock extraction |

---

## State Managed

This module operates on state managed by `03-state-management`:

```typescript
// In SessionState
interface SessionState {
  /** Current extraction availability */
  extractionState: ExtractionState;

  /** Items brought from stash this run */
  broughtItemIds: EntityId[];

  /** Run statistics for extraction summary */
  runStats: RunStats;
}

interface ExtractionState {
  /** Whether extraction is currently available */
  available: boolean;

  /** Why extraction is blocked (if blocked) */
  blockedReason: ExtractionBlockedReason | null;

  /** Current extraction cost (cached) */
  currentCost: ExtractionCost | null;
}

type ExtractionBlockedReason =
  | 'in_combat'
  | 'watcher_active'
  | 'boss_alive'
  | 'wrong_room_type'
  | 'floor_5_no_retreat';

// In PersistentPlayerState
interface PersistentPlayerState {
  /** Active Lesson Learned */
  lessonLearned: LessonLearnedInfo | null;
}
```

---

## Edge Cases and Error Handling

### Extraction Cost Edge Cases

| Case | Handling |
|------|----------|
| Zero gold on Floor 3-4 | Offer item payment or desperation |
| Gold exactly equals minimum | Allow extraction (15g = 15g min passes) |
| Gold below minimum but above percentage | Use minimum (12g with 150g total still costs 15g) |
| No items to sacrifice | Offer desperation extraction |
| No equipped items except weapon | Free extraction with +20 Dread |
| Extraction during Watcher fight | Blocked until Watcher stunned |
| Multiple valid payment options | Present all options to player |

### Threshold Retreat Edge Cases

| Case | Handling |
|------|----------|
| Boss already defeated | Retreat not available (use normal extraction) |
| Insufficient resources | Same desperation rules as normal extraction |
| Retreat during Watcher spawn | Watcher pursues to Floor 4 |
| Floor 5 progress | Lost (rooms reset, loot remains in inventory) |

### Death Economy Edge Cases

| Case | Handling |
|------|----------|
| Any item in dungeon | Lost (full loss on death) |
| Equipped items | Lost |
| Carried items | Lost |
| Brought from stash | Lost |
| Gold at exactly 0 | No gold lost (nothing to lose) |
| Stash items | Safe (stash is never affected by death) |

### Lesson Learned Edge Cases

| Case | Handling |
|------|----------|
| Die to same enemy type twice | Overwrite previous Lesson Learned |
| Die to different enemy type | Replace with new enemy type |
| Quit mid-run | Charge already consumed at start |
| Extract successfully | Charge already consumed at start |
| Lesson Learned vs variant | Match base type (Plague Ghoul matches Ghoul) |
| Die to environment (trap) | No Lesson Learned granted |
| Die to The Watcher | Lesson Learned granted for "watcher" type |

### Taunt Edge Cases

| Case | Handling |
|------|----------|
| Next room is boss | Show boss hint, no item rarity |
| Next room has Legendary | Show Epic instead (never show Legendary) |
| Next room is empty | Show room type only |
| Next room is stairwell | Show "deeper darkness awaits" |
| No next room (end of floor) | Skip taunt |

---

## Test Strategy

### Unit Tests

1. **Extraction Cost Tests**
   - Floor 1-2 are free
   - Floor 3 costs 10% (min 15g)
   - Floor 4 costs 25% (min 25g)
   - Floor 5 requires boss defeat
   - Minimum gold enforced correctly
   - Item payment offered when applicable

2. **Payment Processing Tests**
   - Gold payment deducts correctly
   - Item payment removes item from inventory
   - Desperation adds Dread correctly
   - Equipment sacrifice removes from equipped

3. **Threshold Retreat Tests**
   - Only available on Floor 5
   - Returns to Floor 4 stairwell
   - Costs same as Floor 4 extraction
   - Progress on Floor 5 lost

4. **Death Economy Tests**
   - All equipped items lost
   - All carried items lost
   - All brought items lost
   - All gold lost
   - Stash unchanged

5. **Lesson Learned Tests**
   - Granted on death
   - +10% damage bonus
   - Decrements at expedition start
   - Not restored on death
   - Overwrites previous

6. **Taunt Tests**
   - Never shows Legendary
   - Shows correct room type
   - Shows item rarity (non-Legendary)
   - Shows enemy hint
   - Shows event hint

### Property-Based Tests

```typescript
property("extraction cost >= minimum for Waystone floors", (gold: number, floor: 3 | 4) => {
  const cost = calculateExtractionCost({ floor, carriedGold: gold, watcherActive: false });
  if (cost.method === 'waystone' && cost.goldCost !== null) {
    return cost.goldCost >= cost.minimumGold!;
  }
  return true;
});

property("all items lost on death", (equippedItems: ItemInstance[], carriedItems: ItemInstance[]) => {
  const result = processPlayerDeath({
    equippedItems,
    carriedItems,
    carriedGold: 100,
    killedBy: mockEnemy,
    dreadAtDeath: 50,
    floor: 3,
  });

  const totalItems = equippedItems.length + carriedItems.length;
  return result.itemsLost.length === totalItems;
});

property("all gold lost on death", (carriedGold: number) => {
  const result = processPlayerDeath({
    equippedItems: [],
    carriedItems: [],
    carriedGold,
    killedBy: mockEnemy,
    dreadAtDeath: 50,
    floor: 3,
  });

  return result.goldLost === carriedGold;
});

property("lesson learned damage bonus is 10%", (baseDamage: number) => {
  const result = applyDamageBonus(baseDamage, 'ghoul');
  if (result.bonusApplied) {
    return Math.abs(result.bonusDamage - baseDamage * 0.10) < 0.01;
  }
  return true;
});

property("taunt never shows legendary", (roomContents: NextRoomContents) => {
  const taunt = generateTaunt({
    currentFloor: 3,
    nextRoomType: roomContents.roomType,
    nextRoomContents: roomContents,
    rng: createRNG(12345),
  });

  return taunt.itemRarity !== 'legendary';
});
```

### Integration Tests

1. **Full Extraction Flow**
   - Calculate cost -> Choose payment -> Execute -> Generate taunt
   - Verify items transferred to stash
   - Verify run stats recorded

2. **Death Flow**
   - Die in combat -> Process death economy -> Grant lesson learned
   - Verify all items lost (full loss)
   - Verify all gold lost
   - Verify lesson learned active next run
   - Verify stash unchanged

3. **Lesson Learned Flow**
   - Die to enemy -> Start new expedition -> Verify charge decremented
   - Fight same enemy type -> Verify damage bonus applied
   - Die again -> Verify new lesson learned overwrites

4. **Threshold Retreat Flow**
   - Reach Floor 5 -> Choose retreat -> Pay cost -> Return to Floor 4
   - Verify Floor 5 progress lost
   - Verify can re-enter Floor 5

---

## Implementation Notes

### Extraction Atomicity

Extraction is atomic once initiated:

```typescript
function executeExtraction(params: ExecuteExtractionParams): Result<ExtractionResult, GameError> {
  // Validate first
  const validation = validateExtraction(params);
  if (!validation.success) {
    return validation;
  }

  // Once validation passes, extraction completes regardless of interrupts
  // Even if HP would drop to 0 during animation, player extracts at 1 HP
  const result = performExtraction(params);

  // Generate taunt after successful extraction
  const taunt = generateTaunt({
    currentFloor: params.currentFloor,
    nextRoomType: getNextRoomType(params.currentFloor),
    nextRoomContents: getNextRoomContents(params.currentFloor),
    rng: params.rng,
  });

  return ok({
    ...result,
    taunt,
  });
}
```

### Death Economy - Full Loss

Death processing is simple: all items in the dungeon are lost.

```typescript
function processPlayerDeath(params: DeathParams): DeathResult {
  // Full loss: all items in dungeon are lost
  const itemsLost: LostItemInfo[] = [
    ...params.equippedItems.map(item => ({
      itemId: item.id,
      templateId: item.templateId,
      displayName: getDisplayName(item),
    })),
    ...params.carriedItems.map(item => ({
      itemId: item.id,
      templateId: item.templateId,
      displayName: getDisplayName(item),
    })),
  ];

  // All gold lost
  const goldLost = params.carriedGold;

  // NOTE: Veteran Knowledge updates are handled by KnowledgeService
  // listening to the PLAYER_KILLED event. We do NOT update knowledge here
  // to avoid double-application.

  return {
    itemsLost,
    goldLost,
    lessonLearned: grantLessonLearned(params.killedBy),
    summary: {
      totalItemsLost: itemsLost.length,
      goldLost,
      floor: params.floor,
      killedBy: params.killedBy.enemyName,
      lessonLearnedGranted: true,
    },
  };
}
```

### Lesson Learned Decrement at Expedition Start

Critical: Charge decrements at expedition START, not end:

```typescript
function onExpeditionStart(state: GameState): GameState {
  const lessonLearned = state.persistentPlayer.lessonLearned;

  if (!lessonLearned) {
    return state;
  }

  // Decrement charge
  const newRunsRemaining = lessonLearned.runsRemaining - 1;

  // Emit activation event
  eventBus.emit(createEvent('LESSON_LEARNED_ACTIVATED', {
    enemyType: lessonLearned.enemyType,
    enemyName: lessonLearned.enemyName,
    damageBonus: lessonLearned.damageBonus,
    runsRemaining: newRunsRemaining,
  }));

  // Check if exhausted
  if (newRunsRemaining <= 0) {
    eventBus.emit(createEvent('LESSON_LEARNED_EXPIRED', {
      enemyType: lessonLearned.enemyType,
      wasUsed: false, // Will be set true if bonus applies during run
    }));

    return {
      ...state,
      persistentPlayer: {
        ...state.persistentPlayer,
        lessonLearned: null,
      },
    };
  }

  // Update runs remaining
  return {
    ...state,
    persistentPlayer: {
      ...state.persistentPlayer,
      lessonLearned: {
        ...lessonLearned,
        runsRemaining: newRunsRemaining,
      },
    },
  };
}
```

### Taunt Generation

Never show Legendary items:

```typescript
function generateTaunt(params: TauntParams): ExtractionTaunt {
  const { nextRoomType, nextRoomContents, rng } = params;

  let contentHint: string;
  let itemRarity: Rarity | null = null;

  switch (nextRoomType) {
    case 'treasure':
      // Downgrade Legendary to Epic for taunt
      itemRarity = nextRoomContents.chestRarity === 'legendary'
        ? 'epic'
        : nextRoomContents.chestRarity;
      contentHint = itemRarity
        ? `An ornate chest glows with ${itemRarity} light.`
        : 'A chest sits unopened.';
      break;

    case 'combat':
      contentHint = nextRoomContents.enemyName
        ? `Something stirs in the darkness... ${nextRoomContents.enemyName}?`
        : 'Danger awaits.';
      break;

    case 'event':
      contentHint = 'A mysterious presence beckons.';
      break;

    case 'boss':
      contentHint = 'The final guardian awaits.';
      break;

    default:
      contentHint = 'The unknown stretches before you.';
  }

  const message = buildTauntMessage(nextRoomType, contentHint, itemRarity);

  return {
    nextRoomType,
    contentHint,
    itemRarity,
    message,
  };
}

function buildTauntMessage(
  roomType: RoomType,
  contentHint: string,
  rarity: Rarity | null
): string {
  const intro = 'Through the shimmering portal, you glimpse the chamber beyond:';
  const rarityTag = rarity ? `[${rarity.toUpperCase()} RARITY DETECTED]` : '';
  const outro = "The portal seals. You'll never know what was inside.";

  return `${intro}\n\n    ${contentHint}\n    ${rarityTag}\n\n${outro}`;
}
```

---

## Public Exports

```typescript
// src/core/extraction/index.ts

export type {
  // Cost types
  ExtractionMethod,
  WaystonePayment,
  ExtractionCost,
  FloorExtractionConfig,
  ThresholdRetreatConfig,

  // Service interfaces
  ExtractionService,
  DeathEconomyService,
  LessonLearnedService,

  // Parameter types
  ExtractionCostParams,
  AffordabilityParams,
  PaymentOptionsParams,
  ExecuteExtractionParams,
  ThresholdRetreatParams,
  DesperationParams,
  CanExtractParams,
  CanRetreatParams,
  TauntParams,
  DeathParams,
  KilledByInfo,

  // Result types
  AffordabilityResult,
  PaymentOption,
  ExtractionResult,
  ThresholdRetreatResult,
  CanExtractResult,
  CanRetreatResult,
  ExtractedItemInfo,
  ExtractionTaunt,
  NextRoomContents,
  RunStats,
  DeathResult,
  DeathSummary,
  // Note: ItemRiskStatus and LostItemInfo are imported from 07-item-system
  LessonLearnedInfo,
  LessonLearnedDecrementResult,
  LessonLearnedDamageResult,
  // Note: VeteranKnowledgeUpdate is NOT exported here.
  // KnowledgeService (06-character-system) owns all veteran knowledge types.

  // State types
  ExtractionState,
  ExtractionBlockedReason,
};

export {
  // Factory functions
  createExtractionService,
  createDeathEconomyService,
  createLessonLearnedService,

  // Constants
  FLOOR_EXTRACTION_CONFIG,
  THRESHOLD_RETREAT_CONFIG,
};
```

---

## Design Philosophy

### The Extraction Dilemma

The extraction system exists to create one question: "Do I push deeper, or take what I have and leave?"

Every mechanic supports this tension:
- **Escalating costs**: Floors 1-2 free, 3-4 costly, 5 requires boss
- **The Taunt**: Shows what you missed, creates "one more run" regret
- **Death economy**: Items at risk creates real stakes
- **Lesson Learned**: Death has value, softens the blow

### Fairness in Full Loss

The death economy must feel FAIR:
- Rule is explicit and simple: death = lose everything in dungeon
- Risk status is binary and always visible: stash is safe, dungeon is risky
- No hidden mechanics or edge cases
- Player controls when to extract and end the risk

When a player loses items, they should think "I pushed too far" not "the rules cheated me."

Full loss actually strengthens fairness because there are no confusing survival rules to misunderstand.

### Lesson Learned as Consolation

Lesson Learned exists to soften death's sting:
- Immediate benefit: +10% damage
- Narrative continuity: "You learned from your death"
- Prevents frustration spirals
- Encourages retry, not ragequit

The charge decrements at expedition START to prevent:
- Infinite retries with bonus
- "Die until you win" exploits
- Devaluing the mechanic

### The Taunt as Hook

The Taunt is psychological engineering:
- Shows what you missed
- Creates regret (fuel for "one more run")
- Never shows Legendary (would feel punishing)
- Hints, doesn't reveal (maintains mystery)

The goal is "I should have stayed" not "I hate this game."
