# 01 - Foundation Layer

## Purpose

Provides core utilities used by all other modules: type definitions, seeded random number generator, Result type for error handling, and dependency injection container.

This module has **no dependencies** on other game modules and should be implemented first.

---

## Responsibilities

1. Define core TypeScript types used across the codebase
2. Provide seedable, reproducible RNG for deterministic gameplay
3. Define Result type for explicit error handling
4. Provide simple dependency injection for testability

---

## Interface Contracts

### Core Types

```typescript
// ==================== Entity Identification ====================

/** Unique identifier for runtime entities (items, enemies, rooms) */
type EntityId = string; // UUID v4 format

/** Generate a new unique entity ID */
function generateEntityId(): EntityId;

// ==================== Game Constants ====================

/** Floor number (1-5 for MVP dungeon) */
type FloorNumber = 1 | 2 | 3 | 4 | 5;

/** Item rarity tiers */
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Equipment slots */
type EquipmentSlot = 'weapon' | 'armor' | 'helm' | 'accessory';

/** All item slots including consumables */
type ItemSlot = EquipmentSlot | 'consumable';

/** Room types in dungeon */
type RoomType =
  | 'combat'
  | 'treasure'
  | 'event'
  | 'rest'
  | 'stairwell'
  | 'threshold'  // Pre-boss checkpoint
  | 'boss';

/** Room exploration state */
type RoomState = 'unexplored' | 'entered' | 'cleared';

/** Player character classes */
type CharacterClass = 'mercenary' | 'flagellant' | 'hollowed_one';

/** Combat turn phase */
type CombatPhase = 'player_turn' | 'enemy_turn' | 'resolution';

/** Enemy speed categories */
type EnemySpeed = 'slow' | 'normal' | 'fast' | 'ambush';

/** Enemy type categories */
type EnemyType = 'basic' | 'elite' | 'boss' | 'watcher';

/** Dread threshold names */
type DreadThreshold = 'calm' | 'uneasy' | 'shaken' | 'terrified' | 'breaking';

// ==================== Stat Block ====================

/** The three core player stats */
interface StatBlock {
  vigor: number;   // HP, DoT resistance
  might: number;   // Physical damage
  cunning: number; // Crit chance, detection
}

/** Keys of StatBlock for type-safe iteration */
type StatName = keyof StatBlock;

// ==================== Numeric Ranges ====================

/** Represents a numeric range [min, max] */
interface NumericRange {
  min: number;
  max: number;
}

/** Type guard for NumericRange */
function isNumericRange(value: unknown): value is NumericRange;

// ==================== Timestamps ====================

/** ISO 8601 timestamp string */
type Timestamp = string;

/** Get current timestamp */
function getCurrentTimestamp(): Timestamp;

/** Parse timestamp to Date */
function parseTimestamp(timestamp: Timestamp): Date;
```

### Result Type

```typescript
// ==================== Result Type ====================

/**
 * Represents the outcome of an operation that can fail.
 * Forces explicit error handling - no exceptions for expected failures.
 */
type Result<T, E = GameError> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Standard game error structure
 */
interface GameError {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional context for debugging */
  context?: Record<string, unknown>;
}

/**
 * All possible error codes
 */
type ErrorCode =
  // Validation errors
  | 'INVALID_COMMAND'
  | 'INVALID_TARGET'
  | 'INVALID_STATE'
  | 'INVALID_PARAMETER'

  // Resource errors
  | 'INSUFFICIENT_GOLD'
  | 'INSUFFICIENT_STAMINA'
  | 'INSUFFICIENT_INVENTORY_SPACE'
  | 'INSUFFICIENT_STASH_SPACE'

  // Not found errors
  | 'ITEM_NOT_FOUND'
  | 'MONSTER_NOT_FOUND'
  | 'ROOM_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'TEMPLATE_NOT_FOUND'

  // State errors
  | 'ALREADY_EQUIPPED'
  | 'CANNOT_UNEQUIP'
  | 'ITEM_CURSED'
  | 'BLOCKED_BY_WATCHER'
  | 'COMBAT_IN_PROGRESS'
  | 'NOT_IN_COMBAT'

  // System errors
  | 'PERSISTENCE_ERROR'
  | 'CONTENT_LOAD_ERROR'
  | 'VALIDATION_ERROR';

// ==================== Result Utilities ====================

/** Create a successful result */
function ok<T>(value: T): Result<T, never>;

/** Create a failed result */
function err<E>(error: E): Result<never, E>;

/** Check if result is success */
function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T };

/** Check if result is failure */
function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E };

/** Unwrap result value or throw (for tests only) */
function unwrap<T, E>(result: Result<T, E>): T;

/** Unwrap result value or return default */
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T;

/** Map over success value */
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E>;

/** Chain operations that return Results */
function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E>;
```

### Seeded RNG

```typescript
// ==================== Random Number Generator ====================

/**
 * Seedable, reproducible random number generator.
 * Uses xorshift128+ algorithm for speed and quality.
 *
 * Key properties:
 * - Deterministic: same seed produces same sequence
 * - Forkable: create independent child RNGs
 * - Serializable: state can be saved/restored
 */
interface SeededRNG {
  /** Current seed for debugging/logging */
  readonly seed: number;

  /** Internal state (can be saved/restored) */
  readonly state: RNGState;

  /**
   * Returns float in range [0, 1)
   * This is the core method - all others build on it.
   */
  random(): number;

  /**
   * Returns integer in range [min, max] inclusive
   */
  randomInt(min: number, max: number): number;

  /**
   * Returns true with given probability (0 to 1)
   * @param probability - Chance of returning true (0.0 to 1.0)
   */
  chance(probability: number): boolean;

  /**
   * Select random element from array
   * @throws Error if array is empty
   */
  pick<T>(array: readonly T[]): T;

  /**
   * Select element using weighted probabilities
   * @param items - Array of items with weights
   * @returns Selected item (weights don't need to sum to 1)
   */
  weightedPick<T>(items: readonly WeightedItem<T>[]): T;

  /**
   * Shuffle array in place using Fisher-Yates
   * @returns Same array (mutated)
   */
  shuffle<T>(array: T[]): T[];

  /**
   * Create a new shuffled copy of array
   * @returns New shuffled array
   */
  shuffled<T>(array: readonly T[]): T[];

  /**
   * Create child RNG with derived seed
   * Child is independent - doesn't affect parent's sequence.
   * @param namespace - String to derive child seed from
   */
  fork(namespace: string): SeededRNG;

  /**
   * Restore RNG to a previously saved state
   * Used for save/load functionality.
   */
  restore(state: RNGState): void;

  /**
   * Clone RNG with current state
   * Useful for "what if" scenarios without affecting original.
   */
  clone(): SeededRNG;
}

/**
 * Serializable RNG state for save/load
 */
interface RNGState {
  /** Original seed */
  seed: number;
  /** Internal state values (algorithm-specific) */
  s0: number;
  s1: number;
  /** Number of random() calls since creation (for debugging) */
  callCount: number;
}

/**
 * Item with associated weight for weighted selection
 */
interface WeightedItem<T> {
  item: T;
  weight: number;
}

/**
 * Create a new seeded RNG
 * @param seed - Optional seed (uses Date.now() if not provided)
 */
function createRNG(seed?: number): SeededRNG;

/**
 * Create RNG from saved state
 */
function createRNGFromState(state: RNGState): SeededRNG;

/**
 * Generate a random seed
 */
function generateSeed(): number;
```

### Dependency Injection

```typescript
// ==================== Dependency Injection ====================

/**
 * Simple service container for dependency injection.
 * Enables testability by allowing mock implementations.
 */
interface ServiceContainer {
  /**
   * Register a factory for a service
   * Factory called each time service is resolved (transient).
   */
  register<T>(token: ServiceToken<T>, factory: () => T): void;

  /**
   * Register a singleton service
   * Factory called once, same instance returned thereafter.
   */
  registerSingleton<T>(token: ServiceToken<T>, factory: () => T): void;

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: ServiceToken<T>, instance: T): void;

  /**
   * Resolve a service by token
   * @throws Error if service not registered
   */
  resolve<T>(token: ServiceToken<T>): T;

  /**
   * Check if a service is registered
   */
  has<T>(token: ServiceToken<T>): boolean;

  /**
   * Create a child container that inherits from this one
   * Child can override parent registrations.
   */
  createScope(): ServiceContainer;
}

/**
 * Typed token for service registration/resolution
 * The __type property is phantom - only for type inference.
 */
type ServiceToken<T> = symbol & { readonly __type: T };

/**
 * Create a typed service token
 * @param name - Debug name for the token
 */
function createToken<T>(name: string): ServiceToken<T>;

/**
 * Create a new service container
 */
function createContainer(): ServiceContainer;

// ==================== Common Service Tokens ====================

/** Token for SeededRNG service */
const RNG_TOKEN: ServiceToken<SeededRNG>;

/** Token for file system abstraction */
const FILE_SYSTEM_TOKEN: ServiceToken<FileSystem>;

/** Token for logger */
const LOGGER_TOKEN: ServiceToken<Logger>;

// ==================== File System Abstraction ====================

/**
 * Abstraction over file system for testability
 */
interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;
  unlink(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
}

/**
 * Create file system implementation for Node.js
 */
function createNodeFileSystem(): FileSystem;

/**
 * Create in-memory file system for testing
 */
function createMemoryFileSystem(): FileSystem;

// ==================== Logger ====================

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface Logger {
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

function createLogger(minLevel: LogLevel): Logger;
function createNullLogger(): Logger; // For tests
```

### Utility Functions

```typescript
// ==================== Utility Functions ====================

/**
 * Deep freeze an object (makes it immutable)
 * Use for content data that should never change.
 */
function deepFreeze<T extends object>(obj: T): Readonly<T>;

/**
 * Deep clone an object
 * Use when you need to mutate a copy.
 */
function deepClone<T>(obj: T): T;

/**
 * Type-safe object keys
 */
function keys<T extends object>(obj: T): (keyof T)[];

/**
 * Type-safe object entries
 */
function entries<T extends object>(obj: T): [keyof T, T[keyof T]][];

/**
 * Assert condition, throw if false
 * Use for programmer errors only, not user errors.
 */
function assert(condition: boolean, message: string): asserts condition;

/**
 * Assert value is not null/undefined
 */
function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T;

/**
 * Clamp number to range
 */
function clamp(value: number, min: number, max: number): number;

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number;

/**
 * Round to specified decimal places
 */
function roundTo(value: number, decimals: number): number;

/**
 * Percentage calculation with precision
 */
function percentage(value: number, total: number, decimals?: number): number;
```

---

## Dependencies

None. This is the foundation layer.

---

## Configuration Files

None. This module provides utilities, not configuration.

---

## Events Emitted/Subscribed

None. This is a pure utility layer with no event bus integration.

---

## State Managed

- **RNGState**: Internal state of random number generators (can be saved/restored)

---

## Edge Cases and Error Handling

### RNG Edge Cases

| Case | Handling |
|------|----------|
| `randomInt(5, 5)` | Returns 5 (valid: min equals max) |
| `randomInt(5, 3)` | Swap min/max, return value in [3, 5] |
| `chance(0)` | Always returns false |
| `chance(1)` | Always returns true |
| `chance(1.5)` | Clamp to 1, always returns true |
| `pick([])` | Throw Error (programmer error) |
| `weightedPick([])` | Throw Error (programmer error) |
| `weightedPick` all zero weights | Throw Error (programmer error) |
| `shuffle([])` | Return empty array |
| `fork("")` | Valid, uses empty string for hash |

### Result Type Edge Cases

| Case | Handling |
|------|----------|
| `unwrap(err(...))` | Throw Error (use only in tests) |
| Nested Results | Flatten with `flatMapResult` |
| Multiple errors | Return first error encountered |

### Container Edge Cases

| Case | Handling |
|------|----------|
| Resolve unregistered | Throw Error |
| Double registration | Override previous (warn in dev) |
| Circular dependency | Not detected (design to avoid) |
| Scope disposal | Clear child registrations |

---

## Test Strategy

### Unit Tests

1. **RNG Distribution Tests**
   - `random()` produces uniform distribution (chi-squared test)
   - `randomInt()` hits all values in range
   - `chance()` matches expected probability over many trials
   - `weightedPick()` respects weight ratios

2. **RNG Reproducibility Tests**
   - Same seed produces identical sequence
   - `fork()` produces different sequence from parent
   - State save/restore produces identical continuation
   - Different seeds produce different sequences

3. **Result Type Tests**
   - `ok()` and `err()` create correct variants
   - `isOk()` and `isErr()` correctly identify variants
   - `mapResult()` only transforms success
   - `flatMapResult()` chains correctly

4. **Container Tests**
   - Registration and resolution work
   - Singleton returns same instance
   - Transient returns new instance each time
   - Scope isolation works correctly
   - Unregistered token throws

5. **Utility Tests**
   - `clamp()` handles all boundary cases
   - `deepFreeze()` makes object immutable
   - `deepClone()` creates independent copy
   - `assert()` throws on false

### Property-Based Tests

```typescript
// RNG properties
property("randomInt always in range", (min, max) => {
  const rng = createRNG(12345);
  const value = rng.randomInt(min, max);
  return value >= Math.min(min, max) && value <= Math.max(min, max);
});

property("same seed same sequence", (seed) => {
  const rng1 = createRNG(seed);
  const rng2 = createRNG(seed);
  const seq1 = Array(100).fill(0).map(() => rng1.random());
  const seq2 = Array(100).fill(0).map(() => rng2.random());
  return seq1.every((v, i) => v === seq2[i]);
});
```

---

## Implementation Notes

### RNG Algorithm

Use xorshift128+ for the RNG implementation:
- Fast (few operations per call)
- Good statistical properties
- Easy to seed and serialize
- Well-tested algorithm

```
// Pseudocode for xorshift128+
function random():
  s1 = state.s0
  s0 = state.s1
  state.s0 = s0
  s1 ^= s1 << 23
  s1 ^= s1 >> 17
  s1 ^= s0
  s1 ^= s0 >> 26
  state.s1 = s1
  return (s0 + s1) / MAX_UINT64
```

### Service Container

Keep it simple:
- No auto-wiring (explicit registration)
- No lifecycle management beyond singleton
- No decorators or annotations
- Just a typed Map under the hood

### Immutability

Use TypeScript's `Readonly<T>` extensively:
- All returned objects should be readonly
- Use `readonly` arrays where possible
- Document when mutation is intentional (shuffle in place)

---

## Public Exports

```typescript
// src/core/foundation/index.ts

// Types
export type {
  EntityId,
  FloorNumber,
  Rarity,
  EquipmentSlot,
  ItemSlot,
  RoomType,
  RoomState,
  CharacterClass,
  CombatPhase,
  EnemySpeed,
  EnemyType,
  DreadThreshold,
  StatBlock,
  StatName,
  NumericRange,
  Timestamp,
  Result,
  GameError,
  ErrorCode,
  SeededRNG,
  RNGState,
  WeightedItem,
  ServiceContainer,
  ServiceToken,
  FileSystem,
  Logger,
  LogLevel,
};

// Functions
export {
  generateEntityId,
  isNumericRange,
  getCurrentTimestamp,
  parseTimestamp,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  mapResult,
  flatMapResult,
  createRNG,
  createRNGFromState,
  generateSeed,
  createToken,
  createContainer,
  createNodeFileSystem,
  createMemoryFileSystem,
  createLogger,
  createNullLogger,
  deepFreeze,
  deepClone,
  keys,
  entries,
  assert,
  assertDefined,
  clamp,
  lerp,
  roundTo,
  percentage,
};

// Tokens
export {
  RNG_TOKEN,
  FILE_SYSTEM_TOKEN,
  LOGGER_TOKEN,
};
```
