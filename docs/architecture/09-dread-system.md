# 09 - Dread System

## Purpose

Manages the Dread mechanic - DARKDELVE's signature "unreliable narrator" system. Dread accumulates from combat, exploration, and eldritch encounters, progressively corrupting the information shown to the player while keeping their input controls reliable. At maximum Dread (100), The Watcher spawns as an effectively invincible pursuer that blocks all extraction.

This is **not** a damage system - it's an **information corruption** system. The player can always act; they just can't trust what they see.

---

## Architecture Approach

**This module has no stateful service.** All Dread-related state lives in `StateStore` (see 03-state-management.md). This module provides:

1. **Pure utility functions** for calculations (corruption, thresholds, Watcher checks)
2. **Type definitions** for Dread-related data
3. **Configuration schema** for tuning Dread behavior

State mutations happen via `StateAction` dispatches from command handlers or event processors.

---

## Responsibilities

1. Provide threshold calculation functions
2. Provide corruption/hallucination functions for presentation layer
3. Provide Watcher stun/escape calculations
4. Define Dread-related types and configuration schema
5. Document Dread gain/loss rules for command handlers to implement

---

## Dependencies

- **01-foundation**: Types (`DreadThreshold`, `EnemyType`, `FloorNumber`), `SeededRNG`, `Result`, `clamp`
- **02-content-registry**: `DreadConfig`, `DreadThresholdConfig`, config accessors

**Note:** This module does NOT depend on event-system or state-management. It provides pure functions that other modules call.

---

## State Ownership

All Dread-related state lives in `StateStore`:

```typescript
// In SessionState
interface SessionState {
  explorationTurns: number;    // Counts toward passive Dread gain
  torchActive: boolean;        // Reduces Dread gain while true
  torchActivatedFloor: FloorNumber | null;  // Floor where torch was lit
}

// In SessionPlayerState
interface SessionPlayerState {
  currentDread: number;        // 0-100, the core Dread value
}

// In DungeonState
interface DungeonState {
  watcherActive: boolean;      // Whether The Watcher has spawned
  watcherCombat: WatcherCombatState | null;  // Watcher fight state
}
```

**There is no DreadManager service.** Command handlers read state, call pure functions, and dispatch state actions.

---

## Interface Contracts

### Pure Calculation Functions

```typescript
// ==================== Threshold Functions ====================

/**
 * Get the threshold for a given Dread value
 */
function getThresholdForDread(dread: number): DreadThreshold;

/**
 * Get configuration for a threshold
 */
function getThresholdConfig(
  threshold: DreadThreshold,
  config: DreadConfig
): DreadThresholdConfig;

/**
 * Check if Dread is at or above a specific threshold
 */
function isAtThreshold(dread: number, threshold: DreadThreshold): boolean;

/**
 * Get distance to next/previous threshold
 */
function getThresholdDistance(dread: number): ThresholdDistance;

// ==================== Dread Change Functions ====================

/**
 * Calculate Dread change after applying modifiers
 * Returns the actual delta to apply (may differ from requested due to torch, etc.)
 */
function calculateDreadChange(
  request: DreadChangeRequest,
  currentState: { torchActive: boolean },
  config: DreadConfig
): DreadChangeCalculation;

/**
 * Check if a Dread change would trigger Watcher spawn
 */
function wouldTriggerWatcher(
  currentDread: number,
  delta: number,
  watcherActive: boolean
): boolean;

// ==================== Corruption Functions ====================
//
// IMPORTANT: All corruption functions accept an RNG parameter for randomization.
// When called from the presentation layer, this MUST be a PresentationRNG
// (derived from game state), NOT the gameplay RNG. This ensures:
// - Rendering never affects gameplay determinism
// - Same game state produces consistent visual corruption
// See 15-cli-presentation.md for PresentationRNG creation.

/**
 * Get hallucination chance for current Dread level
 */
function getHallucinationChance(dread: number, config: DreadConfig): number;

/**
 * Roll for hallucination based on current Dread
 * NOTE: Rendering code must pass an isolated SeededRNG instance (see createPresentationRNG)
 */
function shouldHallucinate(dread: number, config: DreadConfig, rng: SeededRNG): boolean;

/**
 * Apply corruption to a numeric value
 * Returns original, corrupted display, or "???" based on threshold
 * NOTE: Rendering code must pass an isolated SeededRNG instance (see createPresentationRNG)
 */
function corruptNumericValue(
  value: number,
  dread: number,
  context: CorruptionContext,
  config: DreadConfig,
  rng: SeededRNG
): CorruptedValue<number>;

/**
 * Apply corruption to a string value (e.g., enemy name)
 * NOTE: Rendering code must pass an isolated SeededRNG instance (see createPresentationRNG)
 */
function corruptStringValue(
  value: string,
  alternatives: readonly string[],
  dread: number,
  context: CorruptionContext,
  config: DreadConfig,
  rng: SeededRNG
): CorruptedValue<string>;

/**
 * Apply corruption to room type preview
 * NOTE: Rendering code must pass an isolated SeededRNG instance (see createPresentationRNG)
 */
function corruptRoomType(
  roomType: RoomType,
  dread: number,
  config: DreadConfig,
  rng: SeededRNG
): CorruptedValue<RoomType | 'unknown'>;

/**
 * Generate whisper message for combat log
 * Returns null if no whisper should appear
 * NOTE: Rendering code must pass an isolated SeededRNG instance (see createPresentationRNG)
 */
function generateWhisper(
  dread: number,
  context: WhisperContext,
  config: DreadConfig,
  rng: SeededRNG
): string | null;

// ==================== Watcher Functions ====================

/**
 * Check if The Watcher should spawn (Dread reached 100)
 */
function shouldSpawnWatcher(
  currentDread: number,
  watcherActive: boolean,
  inBossFight: boolean
): WatcherSpawnCheck;

/**
 * Calculate Watcher stun result from damage dealt
 */
function calculateWatcherStun(
  damageDealt: number,
  watcherState: WatcherCombatState,
  config: DreadConfig
): WatcherStunResult;

/**
 * Calculate Watcher damage to player
 */
function calculateWatcherDamage(
  watcherState: WatcherCombatState,
  playerBlocking: boolean,
  playerArmor: number,
  config: DreadConfig
): number;

/**
 * Check if extraction is blocked by Watcher
 */
function isExtractionBlockedByWatcher(watcherState: WatcherCombatState | null): boolean;

// ==================== Dread Source Calculations ====================

/**
 * Get Dread gain for killing an enemy
 */
function getDreadGainForKill(enemyType: EnemyType, config: DreadConfig): number;

/**
 * Get Dread gain for exploration turns
 * Returns gain amount if threshold reached, 0 otherwise
 */
function getDreadGainForExploration(
  explorationTurns: number,
  config: DreadConfig
): number;

/**
 * Get Dread gain for floor descent
 */
function getDreadGainForDescent(
  fromFloor: FloorNumber,
  toFloor: FloorNumber,
  config: DreadConfig
): number;

/**
 * Get Dread recovery for rest
 */
function getDreadRecoveryForRest(config: DreadConfig): number;

/**
 * Get Dread recovery for consumable
 */
function getDreadRecoveryForConsumable(
  consumableId: string,
  config: DreadConfig
): number;
```

### Types

```typescript
// ==================== Dread Change Types ====================

interface DreadChangeRequest {
  /** Base amount before modifiers (positive = gain, negative = loss) */
  amount: number;

  /** Source of the Dread change */
  source: DreadSource;

  /** Whether this change can be modified by torch (default true) */
  modifiable?: boolean;
}

type DreadSource =
  // Combat sources
  | { type: 'kill_enemy'; enemyType: EnemyType }

  // Exploration sources
  | { type: 'exploration_turns' }
  | { type: 'floor_descent' }

  // Event sources
  | { type: 'forbidden_text' }
  | { type: 'horror_encounter' }
  | { type: 'flee_attempt' }

  // Recovery sources
  | { type: 'rest' }
  | { type: 'shrine_blessing' }
  | { type: 'consumable'; consumableId: string }

  // Special
  | { type: 'watcher_presence' }
  | { type: 'debug_override' };

interface DreadChangeCalculation {
  /** Original requested amount */
  requestedAmount: number;

  /** Actual amount after modifiers */
  actualAmount: number;

  /** Whether torch modifier was applied */
  torchApplied: boolean;
}

interface ThresholdDistance {
  current: DreadThreshold;
  toNextUp: number | null;
  toNextDown: number | null;
}

// ==================== Corruption Types ====================

interface CorruptionContext {
  valueType: 'hp' | 'damage' | 'count' | 'stat' | 'name' | 'room_type';
  hasVeteranKnowledge?: boolean;
  veteranTier?: 1 | 2 | 3;
  inCombat?: boolean;
}

interface CorruptedValue<T> {
  actual: T;
  display: T | NumericRange | '???';
  wasCorrupted: boolean;
  corruptionType: CorruptionType | null;
  veteranOverride?: T;
}

type CorruptionType =
  | 'blur'
  | 'variance'
  | 'hallucination'
  | 'unknown'
  | 'false_name';

// ==================== Whisper Types ====================

interface WhisperContext {
  phase: 'exploration' | 'combat' | 'event';
  recentEvents: readonly WhisperTrigger[];
  combatTurn?: number;
}

type WhisperTrigger =
  | 'damage_taken'
  | 'enemy_killed'
  | 'item_found'
  | 'room_entered'
  | 'near_death'
  | 'high_dread';

// ==================== Watcher Types ====================

interface WatcherSpawnCheck {
  shouldSpawn: boolean;
  deferred: boolean;  // True if in boss fight
  reason: 'dread_max' | 'already_active' | 'below_threshold' | 'deferred_boss';
}

interface WatcherStunResult {
  success: boolean;
  damageDealt: number;
  thresholdNeeded: number;
  blockedByImmunity: boolean;
  newStunCount: number;
  becameEnraged: boolean;
  becameImmune: boolean;
  escapeWindowTurns: number;
  extractionUnblocked: boolean;
}

// ==================== Threshold Constants ====================

interface DreadThresholdRange {
  threshold: DreadThreshold;
  min: number;
  max: number;
}

const DREAD_THRESHOLDS: readonly DreadThresholdRange[] = [
  { threshold: 'calm', min: 0, max: 49 },
  { threshold: 'uneasy', min: 50, max: 69 },
  { threshold: 'shaken', min: 70, max: 84 },
  { threshold: 'terrified', min: 85, max: 99 },
  { threshold: 'breaking', min: 100, max: 100 },
];
```

---

## Configuration Files

### configs/dread.json

```json
{
  "maxDread": 100,
  "minDreadAfterRest": 10,

  "thresholds": {
    "calm": {
      "min": 0,
      "max": 49,
      "hallucinationChance": 0,
      "roomCorruptionChance": 0,
      "statCorruptionChance": 0
    },
    "uneasy": {
      "min": 50,
      "max": 69,
      "hallucinationChance": 0.05,
      "roomCorruptionChance": 0.05,
      "statCorruptionChance": 0.05
    },
    "shaken": {
      "min": 70,
      "max": 84,
      "hallucinationChance": 0.15,
      "roomCorruptionChance": 0.10,
      "statCorruptionChance": 0.15
    },
    "terrified": {
      "min": 85,
      "max": 99,
      "hallucinationChance": 0.25,
      "roomCorruptionChance": 0.20,
      "statCorruptionChance": 0.25
    },
    "breaking": {
      "min": 100,
      "max": 100,
      "hallucinationChance": 0.25,
      "roomCorruptionChance": 0.25,
      "statCorruptionChance": 0.25
    }
  },

  "sources": {
    "killBasic": 1,
    "killElite": 3,
    "killEldritch": 5,
    "explorationPerTurns": 1,
    "explorationTurnCount": 5,
    "floorDescent": 5,
    "forbiddenText": 8,
    "horrorEncounter": { "min": 5, "max": 10 },
    "flee": 5
  },

  "recovery": {
    "rest": -25,
    "torch": -5,
    "shrine": -15,
    "calmDraught": -15,
    "clarityPotion": -20
  },

  "torchDreadReduction": 0.5,

  "watcher": {
    "hp": 999,
    "damage": 50,
    "stunThreshold": 20,
    "maxStuns": 2,
    "enrageDamageMultiplier": 1.5,
    "escapeWindowTurns": 2
  },

  "whispers": {
    "baseChance": 0.15,
    "combatBonus": 0.10,
    "nearDeathBonus": 0.20
  }
}
```

### content/whispers.json (Optional Content)

```json
{
  "generic": [
    "...the walls remember your name...",
    "...turn back...",
    "...it sees you...",
    "...deeper...",
    "...the dark is patient..."
  ],
  "combat": [
    "...your blood calls to them...",
    "...pain is a door...",
    "...they know your weakness..."
  ],
  "nearDeath": [
    "...so close now...",
    "...we're waiting...",
    "...just let go..."
  ],
  "hints": [
    "...the torch holds them back...",
    "...rest brings clarity...",
    "...the stairs whisper escape..."
  ]
}
```

---

## How Dread Changes Flow

Since there's no DreadManager service, here's how Dread changes work:

### Example: Enemy Killed

```
1. Combat system resolves enemy death
2. Command handler calls: getDreadGainForKill(enemy.type, config)
3. Command handler calls: calculateDreadChange({ amount, source }, state, config)
4. Command handler dispatches: { type: 'PLAYER_DREAD_CHANGED', delta, source }
5. Reducer updates SessionPlayerState.currentDread
6. Command handler checks: wouldTriggerWatcher(newDread, 0, watcherActive)
7. If true, dispatches: { type: 'WATCHER_SPAWNED' }
```

### Example: Torch Activated

```
1. Player uses torch item
2. Command handler dispatches: { type: 'TORCH_ACTIVATED' }
3. Reducer sets SessionState.torchActive = true, torchActivatedFloor = currentFloor
4. Future Dread gains automatically reduced (calculateDreadChange checks torchActive)
```

### Example: Floor Descent

```
1. Player descends stairs
2. Command handler dispatches: { type: 'TORCH_DEACTIVATED' } (torch expires on floor change)
3. Command handler calls: getDreadGainForDescent(fromFloor, toFloor, config)
4. Command handler dispatches: { type: 'PLAYER_DREAD_CHANGED', delta, source }
```

### Example: Presentation Layer Corruption

```
1. CLI needs to display enemy HP
2. CLI calls: corruptNumericValue(enemy.currentHP, state.player.currentDread, context, config, rng)
3. CLI displays result.display (may be corrupted)
4. If veteranOverride exists, CLI shows: "HP: 15-25 [Veteran: 20]"
```

---

## Events Emitted

The Dread system itself doesn't emit events. However, other systems may emit these events when Dread-related state changes occur:

| Event | When Emitted | Emitter |
|-------|--------------|---------|
| `DREAD_CHANGED` | After PLAYER_DREAD_CHANGED action | State change listener (optional) |
| `DREAD_THRESHOLD_CROSSED` | When crossing threshold boundary | State change listener (optional) |
| `WATCHER_WARNING` | At 85/90/95 Dread | Command handler |
| `WATCHER_SPAWNED` | When Watcher spawns | Command handler |
| `WATCHER_STUNNED` | When player stuns Watcher | Combat handler |
| `WHISPER` | When whisper should display | Presentation layer |

These events are for analytics/logging. State mutations happen via StateActions, not events.

---

## Edge Cases and Error Handling

### Dread Value Edge Cases

| Case | Handling |
|------|----------|
| Dread goes negative | Clamp to 0 in reducer |
| Dread exceeds 100 | Clamp to 100 in reducer |
| Multiple threshold crosses in one change | Emit events for each crossed threshold in order |
| Recovery brings Dread to exactly threshold boundary | Threshold is the lower one (49 = calm, not uneasy) |
| Dread change of 0 | Skip dispatch, no state change needed |

### Watcher Edge Cases

| Case | Handling |
|------|----------|
| Reach 100 Dread during boss fight | shouldSpawnWatcher returns deferred=true |
| Player dies during Watcher fight | Standard death handling |
| Watcher stun at exactly threshold | Stun succeeds (>= not >) |
| Third stun attempt | calculateWatcherStun returns blockedByImmunity=true |

### Corruption Edge Cases

| Case | Handling |
|------|----------|
| Player has Tier 3 knowledge + hallucination | Show corrupted value with veteran override |
| Room type corruption | Never corrupt current room, only previews |
| Corruption during Watcher fight | Watcher stats are NOT corrupted |

---

## Test Strategy

### Unit Tests

All functions are pure, making testing straightforward:

```typescript
// Threshold tests
test('getThresholdForDread returns calm for 49', () => {
  expect(getThresholdForDread(49)).toBe('calm');
});

test('getThresholdForDread returns uneasy for 50', () => {
  expect(getThresholdForDread(50)).toBe('uneasy');
});

// Dread change tests
test('calculateDreadChange applies torch reduction', () => {
  const result = calculateDreadChange(
    { amount: 10, source: { type: 'kill_enemy', enemyType: 'basic' } },
    { torchActive: true },
    config
  );
  expect(result.actualAmount).toBe(5); // 50% reduction
  expect(result.torchApplied).toBe(true);
});

// Corruption tests
test('corruptNumericValue returns exact value at calm', () => {
  const result = corruptNumericValue(100, 30, context, config, rng);
  expect(result.wasCorrupted).toBe(false);
  expect(result.display).toBe(100);
});

// Watcher tests
test('calculateWatcherStun succeeds at threshold', () => {
  const result = calculateWatcherStun(20, watcherState, config);
  expect(result.success).toBe(true);
});

test('calculateWatcherStun fails below threshold', () => {
  const result = calculateWatcherStun(19, watcherState, config);
  expect(result.success).toBe(false);
});
```

### Property Tests

```typescript
property("Dread threshold matches value", (dread: number) => {
  const clamped = clamp(dread, 0, 100);
  const threshold = getThresholdForDread(clamped);
  const range = DREAD_THRESHOLDS.find(t => t.threshold === threshold)!;
  return clamped >= range.min && clamped <= range.max;
});

property("Corruption never affects actual value", (value: number, dread: number) => {
  const result = corruptNumericValue(value, dread, context, config, rng);
  return result.actual === value;
});

property("Watcher stun count never exceeds 3", (attempts: number[]) => {
  let state = initialWatcherState;
  for (const damage of attempts) {
    const result = calculateWatcherStun(damage, state, config);
    state = applyStunResult(state, result);
  }
  return state.stunCount <= 3;
});
```

---

## Public Exports

```typescript
// src/core/dread/index.ts

export {
  // Threshold functions
  getThresholdForDread,
  getThresholdConfig,
  isAtThreshold,
  getThresholdDistance,

  // Dread change functions
  calculateDreadChange,
  wouldTriggerWatcher,
  getDreadGainForKill,
  getDreadGainForExploration,
  getDreadGainForDescent,
  getDreadRecoveryForRest,
  getDreadRecoveryForConsumable,

  // Corruption functions
  getHallucinationChance,
  shouldHallucinate,
  corruptNumericValue,
  corruptStringValue,
  corruptRoomType,
  generateWhisper,

  // Watcher functions
  shouldSpawnWatcher,
  calculateWatcherStun,
  calculateWatcherDamage,
  isExtractionBlockedByWatcher,

  // Constants
  DREAD_THRESHOLDS,
};

export type {
  DreadChangeRequest,
  DreadSource,
  DreadChangeCalculation,
  ThresholdDistance,
  CorruptionContext,
  CorruptedValue,
  CorruptionType,
  WhisperContext,
  WhisperTrigger,
  WatcherSpawnCheck,
  WatcherStunResult,
  DreadThresholdRange,
};

// Re-export threshold type from foundation
export type { DreadThreshold } from '../foundation';
```

---

## Design Philosophy

### Information Corruption, Not Input Corruption

The cardinal rule: **never break input reliability**. When a player presses "attack", they attack. The corruption only affects what they SEE:

- Enemy HP shown might be wrong
- Room type preview might lie
- Item stats might be uncertain
- Whispers might mislead

But commands ALWAYS execute as intended. This preserves player agency while creating paranoia.

### Pure Functions Enable Reliable Testing

With no stateful DreadManager:
- Every function is deterministic given inputs
- No mocking of services needed
- No state synchronization bugs possible
- Presentation layer can call corruption functions without side effects

### State Lives in StateStore

All mutable Dread-related state (`currentDread`, `torchActive`, `watcherActive`) lives in StateStore. This module provides the math; state management provides the storage.
