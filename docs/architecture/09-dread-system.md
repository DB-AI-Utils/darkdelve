# 09 - Dread System

## Purpose

Manages the Dread mechanic - DARKDELVE's signature "unreliable narrator" system. Dread accumulates from combat, exploration, and eldritch encounters, progressively corrupting the information shown to the player while keeping their input controls reliable. At maximum Dread (100), The Watcher spawns as an effectively invincible pursuer that blocks all extraction.

This is **not** a damage system - it's an **information corruption** system. The player can always act; they just can't trust what they see.

---

## Responsibilities

1. Track and modify Dread value (0-100)
2. Calculate Dread changes from all sources (combat, exploration, events, items)
3. Apply Dread modifiers (torch, equipment effects)
4. Determine current Dread threshold
5. Generate perception corruption based on threshold
6. Emit threshold crossing events
7. Manage Watcher spawn, pursuit, and combat mechanics
8. Block/unblock extraction based on Watcher state
9. Provide corruption filters for presentation layer queries

---

## Dependencies

- **01-foundation**: Types (`DreadThreshold`, `EnemyType`, `FloorNumber`), `SeededRNG`, `Result`, `clamp`
- **02-content-registry**: `DreadConfig`, `DreadThresholdConfig`, config accessors
- **04-event-system**: Event emission (`DREAD_CHANGED`, `DREAD_THRESHOLD_CROSSED`, `WATCHER_*`)
- **06-character-system**: Current player equipment (for Dread reduction modifiers)

---

## Interface Contracts

### Dread Manager

```typescript
// ==================== Main Interface ====================

interface DreadManager {
  // === Dread Value Operations ===

  /**
   * Get current Dread value
   */
  getCurrentDread(): number;

  /**
   * Get current Dread threshold
   */
  getCurrentThreshold(): DreadThreshold;

  /**
   * Apply Dread change from a source
   * Handles modifiers (torch, equipment) automatically
   * Returns the actual change after modifiers
   */
  applyDreadChange(change: DreadChangeRequest): DreadChangeResult;

  /**
   * Calculate what Dread change would be after modifiers (without applying)
   */
  previewDreadChange(change: DreadChangeRequest): number;

  // === Threshold Queries ===

  /**
   * Get configuration for a threshold
   */
  getThresholdConfig(threshold: DreadThreshold): DreadThresholdConfig;

  /**
   * Check if Dread is at or above a specific threshold
   */
  isAtThreshold(threshold: DreadThreshold): boolean;

  /**
   * Get distance to next threshold (positive) or from previous (negative)
   */
  getThresholdDistance(): ThresholdDistance;

  // === Perception Corruption ===

  /**
   * Get current hallucination chance (0-1)
   */
  getHallucinationChance(): number;

  /**
   * Roll for hallucination based on current Dread
   */
  shouldHallucinate(rng: SeededRNG): boolean;

  /**
   * Apply corruption to a numeric value
   * Returns original, corrupted display, or "???" based on threshold
   */
  corruptNumericValue(
    value: number,
    context: CorruptionContext,
    rng: SeededRNG
  ): CorruptedValue<number>;

  /**
   * Apply corruption to a string value (e.g., enemy name)
   */
  corruptStringValue(
    value: string,
    alternatives: readonly string[],
    context: CorruptionContext,
    rng: SeededRNG
  ): CorruptedValue<string>;

  /**
   * Apply corruption to room type preview
   */
  corruptRoomType(
    roomType: RoomType,
    rng: SeededRNG
  ): CorruptedValue<RoomType | 'unknown'>;

  /**
   * Generate whisper message for combat log
   * Returns null if no whisper should appear
   */
  generateWhisper(context: WhisperContext, rng: SeededRNG): string | null;

  // === Watcher Management ===

  /**
   * Check if The Watcher should spawn
   */
  shouldSpawnWatcher(): boolean;

  /**
   * Check if The Watcher is currently active
   */
  isWatcherActive(): boolean;

  /**
   * Get Watcher combat state (null if not active)
   */
  getWatcherState(): WatcherState | null;

  /**
   * Process Watcher stun from damage dealt
   * Returns whether stun was successful
   */
  processWatcherStun(damageDealt: number): WatcherStunResult;

  /**
   * Check if extraction is blocked by The Watcher
   */
  isExtractionBlocked(): boolean;

  /**
   * Get turns remaining in escape window (0 if not stunned)
   */
  getEscapeWindowTurns(): number;

  // === Modifiers ===

  /**
   * Get total Dread gain reduction from active effects
   */
  getDreadGainReduction(): number;

  /**
   * Check if torch is active
   */
  isTorchActive(): boolean;

  /**
   * Activate torch effect (reduces Dread gain)
   */
  activateTorch(): void;

  /**
   * Deactivate torch (on floor change)
   */
  deactivateTorch(): void;
}
```

### Types

```typescript
// ==================== Dread Change Types ====================

interface DreadChangeRequest {
  /** Base amount before modifiers (positive = gain, negative = loss) */
  amount: number;

  /** Source of the Dread change */
  source: DreadSource;

  /** Whether this change can be modified (default true) */
  modifiable?: boolean;

  /** Floor where change occurred (for analytics) */
  floor?: FloorNumber;
}

type DreadSource =
  // Combat sources
  | { type: 'kill_enemy'; enemyType: EnemyType; enemyId: string }
  | { type: 'combat_damage_taken'; amount: number }

  // Exploration sources
  | { type: 'exploration_turns'; turnCount: number }
  | { type: 'floor_descent'; fromFloor: FloorNumber; toFloor: FloorNumber }
  | { type: 'darkness'; turnsInDarkness: number }

  // Event sources
  | { type: 'forbidden_text'; eventId: string }
  | { type: 'horror_encounter'; eventId: string }
  | { type: 'flee_attempt'; success: boolean }

  // Recovery sources
  | { type: 'rest'; restType: 'camp' | 'dungeon' }
  | { type: 'shrine_blessing'; shrineId: string }
  | { type: 'consumable'; itemId: string; itemName: string }

  // Special
  | { type: 'watcher_presence' }
  | { type: 'debug_override' };

interface DreadChangeResult {
  /** Original requested amount */
  requestedAmount: number;

  /** Actual amount after modifiers */
  actualAmount: number;

  /** Previous Dread value */
  previousDread: number;

  /** New Dread value */
  newDread: number;

  /** Whether threshold was crossed */
  thresholdCrossed: boolean;

  /** Previous threshold (if crossed) */
  previousThreshold?: DreadThreshold;

  /** New threshold (if crossed) */
  newThreshold?: DreadThreshold;

  /** Modifiers that affected the change */
  modifiersApplied: DreadModifier[];

  /** Whether Watcher should spawn */
  triggerWatcherSpawn: boolean;
}

interface DreadModifier {
  source: 'torch' | 'equipment' | 'blessing' | 'class_passive';
  itemId?: string;
  reduction: number;
}

interface ThresholdDistance {
  /** Current threshold */
  current: DreadThreshold;

  /** Dread needed to reach next higher threshold (null if at max) */
  toNextUp: number | null;

  /** Dread lost to return to previous threshold (null if at min) */
  toNextDown: number | null;
}

// ==================== Corruption Types ====================

interface CorruptionContext {
  /** Type of value being corrupted */
  valueType: 'hp' | 'damage' | 'count' | 'stat' | 'name' | 'room_type';

  /** Whether player has Veteran Knowledge for this enemy */
  hasVeteranKnowledge?: boolean;

  /** Veteran Knowledge tier (1-3) if applicable */
  veteranTier?: 1 | 2 | 3;

  /** Current combat context */
  inCombat?: boolean;
}

interface CorruptedValue<T> {
  /** Original true value */
  actual: T;

  /** Display value (may be corrupted) */
  display: T | NumericRange | '???';

  /** Whether value was corrupted */
  wasCorrupted: boolean;

  /** Type of corruption applied */
  corruptionType: CorruptionType | null;

  /** Veteran Knowledge override (shown in brackets) */
  veteranOverride?: T;
}

type CorruptionType =
  | 'blur'           // Show as range instead of exact
  | 'variance'       // Add random variance to number
  | 'hallucination'  // Show completely wrong value
  | 'unknown'        // Show as "???"
  | 'false_name';    // Show wrong name for enemy/item

// ==================== Whisper Types ====================

interface WhisperContext {
  /** Current game phase */
  phase: 'exploration' | 'combat' | 'event';

  /** Recent events that might trigger whispers */
  recentEvents: readonly WhisperTrigger[];

  /** Turn number in combat (if applicable) */
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

interface WatcherState {
  /** Whether Watcher is currently active */
  active: boolean;

  /** Watcher HP (effectively infinite but tracked for display) */
  currentHP: number;

  /** Number of times Watcher has been stunned this run */
  stunCount: number;

  /** Whether Watcher is currently stunned */
  isStunned: boolean;

  /** Turns remaining in stun */
  stunTurnsRemaining: number;

  /** Whether Watcher is enraged (after 2 stuns) */
  isEnraged: boolean;

  /** Whether Watcher is immune to stuns (after 3 attempts) */
  isImmune: boolean;

  /** Whether extraction is currently blocked */
  extractionBlocked: boolean;

  /** Spawn was deferred (during boss fight) */
  spawnDeferred: boolean;
}

interface WatcherStunResult {
  /** Whether the stun attempt succeeded */
  success: boolean;

  /** Damage dealt to Watcher */
  damageDealt: number;

  /** Damage threshold needed */
  thresholdNeeded: number;

  /** Whether stun was blocked by immunity */
  blockedByImmunity: boolean;

  /** New stun count */
  newStunCount: number;

  /** Whether Watcher became enraged */
  becameEnraged: boolean;

  /** Whether Watcher became immune */
  becameImmune: boolean;

  /** Turns in escape window (if stunned) */
  escapeWindowTurns: number;

  /** Whether extraction is now unblocked */
  extractionUnblocked: boolean;
}

// ==================== Configuration Types ====================

/**
 * Dread configuration (loaded from configs/dread.json)
 * See 02-content-registry.md for full DreadConfig type
 */
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

### Factory Function

```typescript
/**
 * Create Dread manager instance
 */
function createDreadManager(
  config: DreadConfig,
  eventBus: EventBus,
  characterService: CharacterService,
  initialDread?: number
): DreadManager;
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

## Events Emitted

### DREAD_CHANGED

Emitted when Dread value changes.

```typescript
interface DreadChangedEvent {
  type: 'DREAD_CHANGED';
  timestamp: Timestamp;
  delta: number;
  newTotal: number;
  source: string;
  wasModified: boolean;
  modifierSource?: string;
}
```

### DREAD_THRESHOLD_CROSSED

Emitted when crossing a threshold boundary.

```typescript
interface DreadThresholdCrossedEvent {
  type: 'DREAD_THRESHOLD_CROSSED';
  timestamp: Timestamp;
  fromThreshold: DreadThreshold;
  toThreshold: DreadThreshold;
  direction: 'up' | 'down';
  currentDread: number;
}
```

### WATCHER_WARNING

Emitted at high Dread levels before spawn.

```typescript
interface WatcherWarningEvent {
  type: 'WATCHER_WARNING';
  timestamp: Timestamp;
  severity: 'noticed' | 'approaching' | 'imminent';
  currentDread: number;
  message: string;
}

// Warning thresholds:
// - 'noticed' at 85 Dread: "Something stirs in the darkness. You feel watched."
// - 'approaching' at 90 Dread: "The Watcher has noticed you. LEAVE NOW."
// - 'imminent' at 95 Dread: "It's coming."
```

### WATCHER_SPAWNED

Emitted when The Watcher spawns at 100 Dread.

```typescript
interface WatcherSpawnedEvent {
  type: 'WATCHER_SPAWNED';
  timestamp: Timestamp;
  floor: FloorNumber;
  roomId: string;
  dreadAtSpawn: number;
}
```

### WATCHER_STUNNED

Emitted when player successfully stuns The Watcher.

```typescript
interface WatcherStunnedEvent {
  type: 'WATCHER_STUNNED';
  timestamp: Timestamp;
  stunCount: number;
  stunsRemaining: number;
  damageDealt: number;
  escapeWindowTurns: number;
}
```

### WATCHER_ENRAGED

Emitted when The Watcher becomes enraged after second stun.

```typescript
interface WatcherEnragedEvent {
  type: 'WATCHER_ENRAGED';
  timestamp: Timestamp;
  damageMultiplier: number;
}
```

### EXTRACTION_BLOCKED

Emitted when Watcher blocks extraction.

```typescript
interface ExtractionBlockedEvent {
  type: 'EXTRACTION_BLOCKED';
  timestamp: Timestamp;
  blockedBy: 'watcher';
  canStun: boolean;
}
```

### EXTRACTION_UNBLOCKED

Emitted when extraction becomes available (Watcher stunned).

```typescript
interface ExtractionUnblockedEvent {
  type: 'EXTRACTION_UNBLOCKED';
  timestamp: Timestamp;
  turnsToEscape: number;
}
```

### WHISPER

Emitted when a whisper message should appear in combat log.

```typescript
interface WhisperEvent {
  type: 'WHISPER';
  timestamp: Timestamp;
  text: string;
  isHint: boolean;
  dreadLevel: number;
}
```

---

## Events Subscribed

| Event | Response |
|-------|----------|
| `ENEMY_KILLED` | Apply Dread gain based on enemy type |
| `ROOM_ENTERED` | Increment exploration turn counter, check for +1 Dread per 5 turns |
| `FLOOR_DESCENDED` | Apply floor descent Dread, deactivate torch |
| `FLEE_ATTEMPTED` | Apply flee Dread cost |
| `EVENT_OUTCOME` | Apply event-based Dread changes (horror encounters, forbidden texts) |
| `ITEM_USED` | Process Dread recovery items (Calm Draught, Clarity Potion, Torch) |
| `SHRINE_BLESSING_RECEIVED` | Process Dread recovery blessings |
| `COMBAT_ENDED` | Check for Watcher spawn if deferred during boss |
| `SESSION_ENDED` | Reset Watcher state |

---

## State Managed

This module operates on state managed by `03-state-management`:

```typescript
// In SessionPlayerState
interface SessionPlayerState {
  currentDread: number;
  // ... other fields
}

// In DungeonState
interface DungeonState {
  watcherActive: boolean;
  watcherCombat: WatcherCombatState | null;
  // ... other fields
}

// In SessionState
interface SessionState {
  explorationTurns: number;
  // ... other fields
}
```

### Internal State (Not Persisted)

```typescript
interface DreadInternalState {
  /** Whether torch effect is active */
  torchActive: boolean;

  /** Current floor where torch was activated */
  torchActivatedFloor: FloorNumber | null;

  /** Watcher spawn deferred (during boss fight) */
  watcherSpawnDeferred: boolean;

  /** Cached equipment Dread modifiers */
  equipmentDreadReduction: number;
}
```

---

## Edge Cases and Error Handling

### Dread Value Edge Cases

| Case | Handling |
|------|----------|
| Dread goes negative | Clamp to 0 |
| Dread exceeds 100 | Clamp to 100, trigger Watcher spawn |
| Multiple threshold crosses in one change | Emit events for each crossed threshold in order |
| Recovery brings Dread to exactly threshold boundary | Threshold is the lower one (49 = calm, not uneasy) |
| Dread change of 0 | No event emitted, no state change |
| Negative change when already at 0 | Return actual change of 0 |

### Watcher Edge Cases

| Case | Handling |
|------|----------|
| Reach 100 Dread during boss fight | Defer spawn until boss defeated |
| Player dies during Watcher fight | Standard death handling, Watcher despawns |
| Watcher stun at exactly threshold | Stun succeeds (>= not >) |
| Multiple hits in same turn exceed threshold | Only first hit counts for stun |
| Escape window expires mid-room-transition | Watcher resumes from last position |
| Watcher blocks extraction on Floor 1 | Same rules apply - must stun to escape |
| Heavy Attack deals <20 damage | Stun fails, Watcher attacks |
| Third stun attempt | Watcher becomes immune, enrages |

### Corruption Edge Cases

| Case | Handling |
|------|----------|
| Corruption roll succeeds but player has Tier 3 knowledge | Show corrupted value but add veteran override |
| Room type corruption shows wrong type | Never corrupt current room, only previews |
| Enemy HP corruption shows higher than max | Clamp displayed range to reasonable bounds |
| Corruption during Watcher fight | Watcher stats are NOT corrupted (too important) |
| Multiple corruption rolls for same value | Roll once per display update, cache result |

### Recovery Edge Cases

| Case | Handling |
|------|----------|
| Recovery at Dread 0 | No change (already at minimum) |
| Use multiple recovery items same turn | All apply, stack normally |
| Torch active + Dread recovery item | Apply reduction modifier to item's effect |
| Recovery exceeds negative Dread | Clamp at 0 |

---

## Test Strategy

### Unit Tests

1. **Dread Value Tests**
   - Apply positive change increases Dread
   - Apply negative change decreases Dread
   - Dread clamps at 0 and 100
   - Modifiers reduce Dread gain
   - Torch modifier stacks with equipment

2. **Threshold Tests**
   - Correct threshold for boundary values (49 = calm, 50 = uneasy)
   - Threshold crossing emits correct event
   - Multiple threshold crosses in one change
   - Direction correct for up/down crossing

3. **Corruption Tests**
   - Calm threshold: no corruption
   - Uneasy threshold: 5% corruption rate over many rolls
   - Corruption respects veteran knowledge override
   - Numeric corruption stays within reasonable bounds
   - String corruption picks from alternatives

4. **Watcher Tests**
   - Spawns at exactly 100 Dread
   - Blocks all extraction points
   - Stun succeeds at >= threshold damage
   - Stun fails below threshold
   - Enrage triggers after second stun
   - Immunity triggers after third stun attempt
   - Escape window counts down correctly
   - Deferred spawn during boss fight

5. **Whisper Tests**
   - Whisper chance scales with Dread
   - Combat bonus applies in combat
   - Near-death bonus applies at low HP
   - Hints appear occasionally (different pool)

### Integration Tests

1. **Combat Integration**
   - Kill enemy applies correct Dread
   - Watcher combat flows correctly
   - Stun -> escape -> extraction path

2. **Event Integration**
   - Horror encounter applies Dread
   - Forbidden text applies Dread
   - Shrine blessing removes Dread

3. **Exploration Integration**
   - Exploration turns increment correctly
   - Floor descent applies Dread + deactivates torch

### Property Tests

```typescript
property("Dread always in [0, 100]", (changes: DreadChangeRequest[]) => {
  const manager = createDreadManager(config, mockEventBus, mockCharService);
  for (const change of changes) {
    manager.applyDreadChange(change);
  }
  const dread = manager.getCurrentDread();
  return dread >= 0 && dread <= 100;
});

property("Threshold matches Dread value", (dread: number) => {
  const clampedDread = Math.max(0, Math.min(100, dread));
  const threshold = getThresholdForDread(clampedDread);
  const range = DREAD_THRESHOLDS.find(t => t.threshold === threshold)!;
  return clampedDread >= range.min && clampedDread <= range.max;
});

property("Corruption never affects input", (action: PlayerAction) => {
  // High dread shouldn't change what action is executed
  const manager = createDreadManager(config, mockEventBus, mockCharService, 100);
  const result = processAction(action);
  return result.actionType === action.type;
});

property("Watcher stun count never exceeds 3", (stunAttempts: number[]) => {
  const manager = createDreadManager(config, mockEventBus, mockCharService, 100);
  for (const damage of stunAttempts) {
    manager.processWatcherStun(damage);
  }
  const state = manager.getWatcherState()!;
  return state.stunCount <= 3;
});
```

---

## Implementation Notes

### Corruption Algorithm

The corruption system uses a layered approach:

```
1. Roll for corruption based on threshold chance
2. If corrupted:
   a. For numbers: blur to range OR add variance OR show "???"
   b. For strings: pick random alternative OR show generic
3. If player has Veteran Knowledge:
   a. Still show corrupted value
   b. Append veteran override in brackets
4. Cache result for this display frame
```

### Corruption Severity by Threshold

| Threshold | Number Display | String Display |
|-----------|---------------|----------------|
| Calm | Exact | Exact |
| Uneasy | Range (+-10%) | Exact |
| Shaken | Range (+-20%) | Occasionally wrong |
| Terrified | "???" or large range | Often wrong |
| Breaking | "???" | Frequently wrong |

### Watcher Damage Calculation

```typescript
function calculateWatcherDamage(watcherState: WatcherState, playerBlocking: boolean, playerArmor: number): number {
  const baseDamage = watcherState.isEnraged ? 75 : 50;

  let damage = baseDamage;

  // Block reduces by 50%
  if (playerBlocking) {
    damage = Math.floor(damage * 0.5);
  }

  // Armor reduces remaining
  damage = Math.floor(damage * (1 - playerArmor));

  return damage;
}
```

### Stun Success Calculation

```typescript
function checkWatcherStun(damageDealt: number, watcherState: WatcherState, config: DreadConfig): boolean {
  // Cannot stun if immune
  if (watcherState.isImmune) {
    return false;
  }

  // Damage must meet or exceed threshold
  return damageDealt >= config.watcher.stunThreshold;
}
```

### Whisper Generation

Whispers are semi-random text injections in combat logs at high Dread. The system:

1. Rolls against base chance + context bonuses
2. Selects from appropriate pool (generic, combat, near-death, hints)
3. Hints appear rarely (10% of whispers) and contain actual useful information
4. Same whisper won't repeat in consecutive appearances

### Performance Considerations

- Cache corruption rolls per display frame
- Pre-compute equipment Dread modifiers on equipment change
- Threshold lookup is O(1) via direct calculation
- Whisper pool selection is O(1) weighted random

---

## Public Exports

```typescript
// src/core/dread/index.ts

export type {
  DreadManager,

  // Change types
  DreadChangeRequest,
  DreadSource,
  DreadChangeResult,
  DreadModifier,
  ThresholdDistance,

  // Corruption types
  CorruptionContext,
  CorruptedValue,
  CorruptionType,

  // Whisper types
  WhisperContext,
  WhisperTrigger,

  // Watcher types
  WatcherState,
  WatcherStunResult,

  // Config types
  DreadThresholdRange,
};

export {
  createDreadManager,
  DREAD_THRESHOLDS,
};

// Re-export threshold type from foundation
export type { DreadThreshold } from '../foundation';
```

---

## Design Philosophy

### Information Corruption, Not Input Corruption

The cardinal rule of the Dread system: **never break input reliability**. When a player presses "attack", they attack. When they choose "flee", the flee attempt executes. The corruption only affects what they SEE:

- Enemy HP shown might be wrong
- Room type preview might lie
- Item stats might be uncertain
- Whispers might mislead

But their commands ALWAYS execute as intended. This preserves player agency while creating paranoia and tension.

### Progressive Escalation

Dread effects escalate gradually:

1. **Calm (0-49)**: Full accuracy. Player learns the game.
2. **Uneasy (50-69)**: Subtle hints something is wrong. 5% blur.
3. **Shaken (70-84)**: Clear unreliability. Whispers appear. 15% corruption.
4. **Terrified (85-99)**: Warnings about The Watcher. 25% corruption.
5. **Breaking (100)**: The Watcher spawns. Gameplay shifts to escape.

### The Watcher as Climactic Threat

The Watcher is not meant to be fought - it's meant to be escaped. Its purpose:

1. Create a hard ceiling on greed (can't farm indefinitely)
2. Provide climactic "oh no" moment
3. Test player skill (can you stun and escape?)
4. Reward careful Dread management

The stun mechanics ensure skilled players CAN escape, but it's not guaranteed. Repeated attempts get harder (enrage, immunity).

### Veteran Knowledge Interaction

When a player has earned Veteran Knowledge but is also experiencing Dread hallucinations, both show:

```
HP: 19?...29? [Veteran: 24]
```

Experience fights against madness. The player must reconcile conflicting information. At Terrified level, even the veteran text questions itself:

```
HP: ??? [Veteran: 24, but can you trust yourself?]
```

This rewards investment while preserving horror.
