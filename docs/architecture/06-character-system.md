# 06 - Character System

## Purpose

Provides character creation, stat calculation, leveling, and derived value computation. This module owns all character-related business logic including HP calculation, damage computation, critical hit chance with diminishing returns, and DoT resistance.

---

## Responsibilities

1. Create new characters with class-based starting configuration
2. Calculate derived stats (max HP, damage, crit chance, armor, DoT resistance)
3. Process XP gain and level-up stat allocation
4. Apply equipment stat bonuses to base stats
5. Validate stat changes and enforce caps
6. Provide character state queries for combat and UI

---

## Dependencies

- **01-foundation**: Types (StatBlock, StatName, CharacterClass, NumericRange, Result), utility functions (clamp)
- **02-content-registry**: ClassDefinition, ItemTemplate, ProgressionConfig
- **03-state-management**: CharacterState, EquipmentState, EquippedItem

---

## Interface Contracts

### Character Service

```typescript
// ==================== Character Service ====================

interface CharacterService {
  // === Character Creation ===

  /**
   * Create a new character with class starting configuration.
   * Returns CharacterState ready for state management.
   */
  createCharacter(
    classId: CharacterClass,
    registry: ContentRegistry
  ): Result<CharacterState, CharacterCreationError>;

  // === Derived Stats ===

  /**
   * Compute all derived values from character state and equipment.
   * This is the primary method for getting "effective" character stats.
   */
  computeDerivedStats(
    character: CharacterState,
    registry: ContentRegistry
  ): CharacterDerivedStats;

  /**
   * Get effective stat block (base + equipment bonuses).
   */
  getEffectiveStats(
    character: CharacterState,
    registry: ContentRegistry
  ): StatBlock;

  // === HP Calculations ===

  /**
   * Calculate max HP from base stats and equipment.
   * Formula: 35 (base) + (VIGOR x 5) + equipment bonuses
   */
  calculateMaxHP(
    character: CharacterState,
    registry: ContentRegistry
  ): number;

  // === Damage Calculations ===

  /**
   * Calculate weapon damage range with MIGHT bonus.
   * Formula: Weapon base + MIGHT
   */
  calculateDamageRange(
    character: CharacterState,
    registry: ContentRegistry
  ): NumericRange;

  // === Critical Hit ===

  /**
   * Calculate total crit chance with diminishing returns.
   * Formula: 5% base + CUNNING contribution + gear bonuses
   * CUNNING 1-10: +3% per point
   * CUNNING 11+: +1.5% per point (diminishing)
   * Hard cap: 65%
   */
  calculateCritChance(
    character: CharacterState,
    registry: ContentRegistry
  ): number;

  // === DoT Resistance ===

  /**
   * Calculate DoT resistance from VIGOR.
   * Formula: min(VIGOR x 5%, 40%)
   */
  calculateDotResistance(character: CharacterState): number;

  // === Armor ===

  /**
   * Calculate total armor percentage from equipment.
   * Hard cap: 40%
   */
  calculateArmor(
    character: CharacterState,
    registry: ContentRegistry
  ): number;

  // === Leveling ===

  /**
   * Calculate XP required for next level.
   * Formula: 100 x level
   */
  getXPForNextLevel(currentLevel: number): number;

  /**
   * Check if character can level up.
   */
  canLevelUp(character: CharacterState): boolean;

  /**
   * Calculate how much XP would be gained after applying floor and level penalties.
   */
  calculateEffectiveXP(
    baseXP: number,
    floorNumber: FloorNumber,
    characterLevel: number,
    config: ProgressionConfig
  ): XPCalculationResult;

  /**
   * Process level up, returning new character state.
   * Grants +5 max HP and +1 to chosen stat.
   */
  processLevelUp(
    character: CharacterState,
    statChoice: StatName
  ): Result<LevelUpResult, LevelUpError>;

  // === Validation ===

  /**
   * Validate character state is consistent.
   */
  validateCharacter(
    character: CharacterState,
    registry: ContentRegistry
  ): ValidationResult;
}

/**
 * Create character service instance
 */
function createCharacterService(config: ProgressionConfig): CharacterService;
```

### Derived Stats

```typescript
// ==================== Derived Stats ====================

/**
 * All computed values derived from base character state and equipment.
 * These are NOT stored in state - computed on demand.
 */
interface CharacterDerivedStats {
  // === Effective Stats ===

  /** Base stats + equipment bonuses */
  effectiveStats: StatBlock;

  // === Combat Stats ===

  /** Maximum HP: 35 + (VIGOR x 5) + equipment */
  maxHP: number;

  /** Weapon damage range including MIGHT bonus */
  damageRange: NumericRange;

  /** Total crit chance (capped at 65%) */
  critChance: number;

  /** Crit damage multiplier (default 1.5x) */
  critMultiplier: number;

  /** Total armor percentage (capped at 40%) */
  armor: number;

  /** DoT resistance percentage (capped at 40%) */
  dotResistance: number;

  // === Stat Breakdown ===

  /** Detailed breakdown of how each stat was calculated */
  breakdown: StatBreakdown;
}

interface StatBreakdown {
  hp: HPBreakdown;
  damage: DamageBreakdown;
  critChance: CritBreakdown;
  armor: ArmorBreakdown;
  dotResistance: DotResistanceBreakdown;
}

interface HPBreakdown {
  base: number;             // 35
  fromVigor: number;        // VIGOR x 5
  fromEquipment: number;    // Sum of equipment HP bonuses
  total: number;
}

interface DamageBreakdown {
  weaponMin: number;
  weaponMax: number;
  fromMight: number;        // MIGHT x 1
  totalMin: number;
  totalMax: number;
}

interface CritBreakdown {
  base: number;             // 5%
  fromCunning: number;      // Calculated with diminishing returns
  fromEquipment: number;    // Sum of equipment crit bonuses
  uncapped: number;         // Before applying 65% cap
  total: number;            // After cap
  cappedAmount: number;     // How much was lost to cap (0 if under cap)
}

interface ArmorBreakdown {
  fromEquipment: number;
  uncapped: number;
  total: number;            // After 40% cap
  cappedAmount: number;
}

interface DotResistanceBreakdown {
  vigor: number;
  uncapped: number;         // VIGOR x 5%
  total: number;            // After 40% cap
  cappedAmount: number;
}
```

### XP and Leveling

```typescript
// ==================== XP and Leveling ====================

interface XPCalculationResult {
  /** Base XP before modifiers */
  baseXP: number;

  /** Floor multiplier applied */
  floorMultiplier: number;

  /** Level penalty multiplier (1.0 or 0.5) */
  levelPenaltyMultiplier: number;

  /** Final XP after all modifiers */
  effectiveXP: number;

  /** Whether level penalty was applied */
  penaltyApplied: boolean;

  /** Explanation of penalty (if applied) */
  penaltyReason?: string;
}

interface LevelUpResult {
  /** Updated character state */
  character: CharacterState;

  /** New level reached */
  newLevel: number;

  /** Stat that was increased */
  statIncreased: StatName;

  /** HP gained from level up */
  hpGained: number;

  /** New stat value after increase */
  newStatValue: number;
}

interface LevelUpError {
  code: LevelUpErrorCode;
  message: string;
}

type LevelUpErrorCode =
  | 'INSUFFICIENT_XP'
  | 'MAX_LEVEL_REACHED'
  | 'INVALID_STAT_CHOICE';
```

### Character Creation

```typescript
// ==================== Character Creation ====================

interface CharacterCreationError {
  code: CharacterCreationErrorCode;
  message: string;
}

type CharacterCreationErrorCode =
  | 'CLASS_NOT_FOUND'
  | 'CLASS_LOCKED'
  | 'STARTING_WEAPON_NOT_FOUND'
  | 'STARTING_ARMOR_NOT_FOUND';
```

### Formula Implementations

```typescript
// ==================== Formula Contracts ====================

/**
 * HP Formula
 * Base: 35 HP
 * Per VIGOR: +5 HP
 * Equipment: Sum of all bonusHP values
 *
 * maxHP = 35 + (vigor x 5) + equipmentBonusHP
 */
interface HPFormula {
  readonly BASE_HP: 35;
  readonly HP_PER_VIGOR: 5;

  calculate(vigor: number, equipmentBonusHP: number): number;
}

/**
 * Crit Chance Formula
 * Base: 5%
 * CUNNING 1-10: +3% per point
 * CUNNING 11+: +1.5% per point (diminishing returns)
 * Equipment: Sum of crit bonuses
 * Hard cap: 65%
 *
 * cunningContribution =
 *   cunning <= 10 ? cunning x 3%
 *                 : (10 x 3%) + ((cunning - 10) x 1.5%)
 *
 * totalCrit = min(5% + cunningContribution + equipmentBonus, 65%)
 */
interface CritFormula {
  readonly BASE_CRIT: 0.05;
  readonly CRIT_PER_CUNNING_NORMAL: 0.03;
  readonly CRIT_PER_CUNNING_DIMINISHING: 0.015;
  readonly DIMINISHING_THRESHOLD: 10;
  readonly HARD_CAP: 0.65;

  calculateCunningContribution(cunning: number): number;
  calculate(cunning: number, equipmentBonus: number): number;
}

/**
 * DoT Resistance Formula
 * Per VIGOR: +5% resistance
 * Soft cap: 40% (at 8 VIGOR)
 *
 * dotResistance = min(vigor x 5%, 40%)
 */
interface DotResistanceFormula {
  readonly RESISTANCE_PER_VIGOR: 0.05;
  readonly SOFT_CAP: 0.40;

  calculate(vigor: number): number;
}

/**
 * Damage Formula
 * Weapon provides base damage range
 * MIGHT adds flat bonus to both min and max
 *
 * damageMin = weaponDamageMin + might
 * damageMax = weaponDamageMax + might
 */
interface DamageFormula {
  readonly DAMAGE_PER_MIGHT: 1;

  calculate(weaponMin: number, weaponMax: number, might: number): NumericRange;
}

/**
 * Armor Formula
 * Sum of all equipment armor percentages
 * Hard cap: 40%
 *
 * totalArmor = min(sum(equipmentArmor), 40%)
 */
interface ArmorFormula {
  readonly HARD_CAP: 0.40;

  calculate(equipmentArmorSum: number): number;
}

/**
 * XP Required Formula
 * Linear scaling with level
 *
 * xpRequired = 100 x level
 */
interface XPFormula {
  readonly XP_PER_LEVEL_BASE: 100;

  calculateRequired(level: number): number;
}

/**
 * XP Gain Formula
 * Floor multipliers increase XP from deeper floors
 * Level penalties reduce XP from easy floors at high levels
 *
 * effectiveXP = baseXP x floorMultiplier x levelPenaltyMultiplier
 */
interface XPGainFormula {
  readonly FLOOR_MULTIPLIERS: Record<FloorNumber, number>;
  readonly PENALTY_MULTIPLIER: 0.5;

  calculateFloorMultiplier(floor: FloorNumber): number;
  calculateLevelPenalty(level: number, floor: FloorNumber): number;
  calculate(baseXP: number, floor: FloorNumber, level: number): number;
}
```

### Constants

```typescript
// ==================== Character Constants ====================

/**
 * All character-related constants from game design.
 * These should match values in progression.json config.
 */
const CHARACTER_CONSTANTS = {
  // HP
  BASE_HP: 35,
  HP_PER_VIGOR: 5,
  HP_PER_LEVEL: 5,

  // Damage
  DAMAGE_PER_MIGHT: 1,

  // Crit
  BASE_CRIT_CHANCE: 0.05,           // 5%
  CRIT_PER_CUNNING_NORMAL: 0.03,    // 3% per point (1-10)
  CRIT_PER_CUNNING_DIMINISHING: 0.015, // 1.5% per point (11+)
  CUNNING_DIMINISHING_THRESHOLD: 10,
  CRIT_CHANCE_CAP: 0.65,            // 65%
  CRIT_MULTIPLIER: 1.5,             // 150% damage on crit

  // DoT Resistance
  DOT_RESISTANCE_PER_VIGOR: 0.05,   // 5% per VIGOR
  DOT_RESISTANCE_CAP: 0.40,         // 40% max

  // Armor
  PLAYER_ARMOR_CAP: 0.40,           // 40% max

  // Leveling
  LEVEL_CAP: 20,
  XP_PER_LEVEL_MULTIPLIER: 100,     // XP needed = 100 x level
  STATS_PER_LEVEL: 1,

  // XP Floor Multipliers
  FLOOR_XP_MULTIPLIERS: {
    1: 1.0,
    2: 1.5,
    3: 2.0,
    4: 3.0,
    5: 4.0,
  } as Record<FloorNumber, number>,

  // XP Level Penalties (50% XP)
  XP_PENALTY_THRESHOLDS: {
    // Levels 1-5: no penalty
    // Levels 6-10: Floor 1 gives 50%
    // Levels 11-15: Floors 1-2 give 50%
    // Levels 16-20: Floors 1-3 give 50%
    6: [1],           // Floor 1 penalized
    11: [1, 2],       // Floors 1-2 penalized
    16: [1, 2, 3],    // Floors 1-3 penalized
  } as Record<number, FloorNumber[]>,
} as const;
```

### Class Definitions Reference

```typescript
// ==================== Class Definitions ====================

/**
 * MVP Classes and their configurations.
 * Actual data comes from content/classes/*.json via ContentRegistry.
 */

// Mercenary (Default) - Balanced starter
// Starting stats: VIGOR 3, MIGHT 3, CUNNING 3
// Starting equipment: Rusty Sword, Tattered Leathers
// Passives: None

// Flagellant (Unlockable) - Risk/reward
// Unlock: Extract while at 85+ Dread
// Starting stats: VIGOR 2, MIGHT 4, CUNNING 3
// Passive: Pain Threshold - +25% damage when below 30% HP

// Hollowed One (Unlockable) - Curse mastery
// Unlock: Die to The Watcher on Floor 3+
// Starting stats: VIGOR 3, MIGHT 2, CUNNING 4
// Passive: Void Touched - Immune to curse effects
```

---

## Configuration Files

### configs/progression.json

```json
{
  "levelCap": 20,

  "xpPerLevelBase": 100,
  "xpPerLevelMultiplier": 1,

  "xpFloorMultipliers": {
    "1": 1.0,
    "2": 1.5,
    "3": 2.0,
    "4": 3.0,
    "5": 4.0
  },

  "xpPenaltyLevelDifference": 5,
  "xpPenaltyMultiplier": 0.5,
  "goldPenaltyLevelDifference": 5,
  "goldPenaltyMultiplier": 0.7,

  "hpPerLevel": 5,
  "statsPerLevel": 1,

  "baseHP": 35,
  "vigorHPBonus": 5,
  "mightDamageBonus": 1,

  "vigorDotResistancePerPoint": 0.05,
  "vigorDotResistanceCap": 0.40,

  "veteranKnowledge": {
    "tier1Encounters": 6,
    "tier1Deaths": 1,
    "tier2Encounters": 15,
    "tier2Deaths": 2,
    "tier3Encounters": 25,
    "tier3Deaths": 3
  },

  "lessonLearnedBonus": 0.10,
  "lessonLearnedDuration": 1
}
```

### configs/combat.json (relevant portions)

```json
{
  "baseCritChance": 0.05,
  "critMultiplier": 1.5,
  "critChanceCap": 0.65,
  "cunningPerCritPoint": 0.03,
  "cunningDiminishingThreshold": 10,
  "cunningDiminishingRate": 0.015,

  "playerArmorCap": 0.40
}
```

### content/classes/mercenary.json

```json
{
  "id": "mercenary",
  "name": "Mercenary",
  "description": "A battle-hardened sellsword. Balanced stats make the Mercenary adaptable to any situation.",
  "lore": "You've fought for gold, for glory, for survival. The dungeon is just another contract.",

  "startingStats": {
    "vigor": 3,
    "might": 3,
    "cunning": 3
  },
  "startingWeapon": "rusty_sword",
  "startingArmor": "tattered_leathers",
  "startingGold": 50,

  "passives": [],

  "unlocked": true,
  "unlockCondition": null
}
```

### content/classes/flagellant.json

```json
{
  "id": "flagellant",
  "name": "Flagellant",
  "description": "Pain is a teacher. The Flagellant grows stronger as death approaches.",
  "lore": "You walked the edge and returned. You Awakened.",

  "startingStats": {
    "vigor": 2,
    "might": 4,
    "cunning": 3
  },
  "startingWeapon": "rusty_sword",
  "startingArmor": "tattered_leathers",
  "startingGold": 50,

  "passives": [
    {
      "id": "pain_threshold",
      "name": "Pain Threshold",
      "description": "+25% damage when below 30% HP",
      "effect": {
        "type": "damage_bonus_low_hp",
        "hpThreshold": 0.30,
        "bonus": 0.25
      }
    }
  ],

  "unlocked": false,
  "unlockCondition": {
    "type": "high_dread_extract",
    "dread": 85
  }
}
```

### content/classes/hollowed_one.json

```json
{
  "id": "hollowed_one",
  "name": "Hollowed One",
  "description": "The Watcher's gaze revealed something within you. Curses hold no power here.",
  "lore": "The Watcher's gaze pierced your soul. You fell into the abyss... and found something there.",

  "startingStats": {
    "vigor": 3,
    "might": 2,
    "cunning": 4
  },
  "startingWeapon": "rusty_sword",
  "startingArmor": "tattered_leathers",
  "startingGold": 50,

  "passives": [
    {
      "id": "void_touched",
      "name": "Void Touched",
      "description": "Immune to curse effects. Cursed items can be unequipped freely.",
      "effect": {
        "type": "curse_immunity"
      }
    }
  ],

  "unlocked": false,
  "unlockCondition": {
    "type": "watcher_death",
    "floor": 3
  }
}
```

---

## Events Emitted

The character system emits events through handlers that call it. The service itself is stateless.

Events typically emitted by callers after character operations:

| Event | When Emitted |
|-------|--------------|
| `LEVEL_UP` | After processLevelUp succeeds |
| `STAT_INCREASED` | After stat allocation during level up |
| `XP_GAINED` | After XP is added to character |

---

## Events Subscribed

None. The character service is a pure computation module with no event subscriptions.

---

## State Managed

The character service does not manage state directly. It operates on CharacterState from state-management and returns new state objects or computed values.

**Input state:**
- `CharacterState` from state store
- Equipment templates from content registry

**Output:**
- New `CharacterState` (for level up)
- `CharacterDerivedStats` (computed values)
- Validation results

---

## Edge Cases and Error Handling

### XP and Leveling

| Case | Handling |
|------|----------|
| XP gain at max level | XP still tracked but no level up |
| Level up with insufficient XP | Return error: INSUFFICIENT_XP |
| Invalid stat choice | Return error: INVALID_STAT_CHOICE |
| Multiple level ups from single XP gain | Process one level at a time; caller must loop |

### Stat Calculations

| Case | Handling |
|------|----------|
| Crit chance exceeds 65% | Clamp to 65%, record capped amount |
| Armor exceeds 40% | Clamp to 40%, record capped amount |
| DoT resistance exceeds 40% | Clamp to 40%, record capped amount |
| No weapon equipped | Should never happen (see state-management); if occurs, use 0 damage |
| Negative stat value | Clamp to 0 |
| Equipment with missing template | Log warning, treat as 0 bonuses |

### Character Creation

| Case | Handling |
|------|----------|
| Class not found in registry | Return error: CLASS_NOT_FOUND |
| Class is locked | Return error: CLASS_LOCKED |
| Starting weapon not found | Return error: STARTING_WEAPON_NOT_FOUND |
| Starting armor not found | Return error: STARTING_ARMOR_NOT_FOUND |

### XP Penalty Edge Cases

| Case | Handling |
|------|----------|
| Level 5 on Floor 1 | No penalty (threshold is level 6) |
| Level 6 on Floor 1 | 50% penalty applied |
| Level 6 on Floor 2 | No penalty (only Floor 1 penalized) |
| Level 11 on Floor 3 | No penalty (Floors 1-2 penalized, not 3) |

---

## Test Strategy

### Unit Tests

1. **HP Calculation Tests**
   - Base HP with 0 VIGOR = 35
   - HP with starting VIGOR (3) = 50
   - HP with max VIGOR (20) = 135
   - HP with equipment bonus
   - HP with combined VIGOR and equipment

2. **Crit Chance Tests**
   - Base crit with 0 CUNNING = 5%
   - Crit with CUNNING 3 (starting) = 14%
   - Crit with CUNNING 10 (threshold) = 35%
   - Crit with CUNNING 15 (diminishing) = 42.5%
   - Crit with CUNNING 20 = 50%
   - Crit capped at 65% with high equipment bonus
   - Breakdown correctly shows capped amount

3. **DoT Resistance Tests**
   - Resistance with VIGOR 1 = 5%
   - Resistance with VIGOR 3 (starting) = 15%
   - Resistance with VIGOR 8 (cap) = 40%
   - Resistance with VIGOR 10 = 40% (capped)

4. **Damage Calculation Tests**
   - Damage with starter weapon (5-8) + MIGHT 3 = 8-11
   - Damage scales correctly with MIGHT
   - Damage with no weapon (edge case) = 0-0

5. **Armor Calculation Tests**
   - Armor from single piece of equipment
   - Armor from multiple pieces stacks
   - Armor capped at 40%
   - Breakdown shows capped amount

6. **Level Up Tests**
   - XP required for level 2 = 200
   - XP required for level 10 = 1000
   - Level up grants +5 HP
   - Level up grants +1 to chosen stat
   - Cannot level up without sufficient XP
   - Cannot level up past level 20
   - Level up returns correct new state

7. **XP Penalty Tests**
   - Level 5 Floor 1: full XP
   - Level 6 Floor 1: 50% XP
   - Level 6 Floor 2: full XP
   - Level 11 Floor 2: 50% XP
   - Level 16 Floor 3: 50% XP
   - Level 16 Floor 4: full XP
   - Floor multipliers applied correctly

8. **Character Creation Tests**
   - Mercenary created with correct starting stats
   - Flagellant created with correct passives
   - Hollowed One created with curse immunity
   - Error returned for unknown class
   - Error returned for locked class

### Property Tests

```typescript
property("HP is always positive", (vigor, equipmentHP) => {
  const hp = calculateMaxHP({ vigor, equipmentHP });
  return hp > 0;
});

property("crit chance never exceeds 65%", (cunning, equipmentCrit) => {
  const crit = calculateCritChance({ cunning, equipmentCrit });
  return crit <= 0.65;
});

property("DoT resistance never exceeds 40%", (vigor) => {
  const resistance = calculateDotResistance(vigor);
  return resistance <= 0.40;
});

property("level up always increases total stats", (character, statChoice) => {
  const before = character.baseStats[statChoice];
  const result = processLevelUp(character, statChoice);
  if (!result.success) return true; // Skip invalid cases
  const after = result.value.character.baseStats[statChoice];
  return after === before + 1;
});

property("XP required increases with level", (level1, level2) => {
  if (level1 >= level2) return true;
  return getXPForNextLevel(level1) <= getXPForNextLevel(level2);
});
```

### Integration Tests

1. Create character, equip items, verify derived stats
2. Gain XP through multiple floors, verify penalties apply correctly
3. Level up multiple times, verify cumulative stat growth
4. Test all three classes with their starting equipment
5. Verify equipment changes immediately affect derived stats

---

## Implementation Notes

### Stat Calculation Order

Always calculate in this order to avoid inconsistencies:

1. Get base stats from CharacterState
2. Sum equipment stat bonuses
3. Calculate effective stats (base + equipment)
4. Calculate derived values from effective stats

### Memoization

Consider memoizing `computeDerivedStats` if it's called frequently:
- Key on character state version or hash
- Invalidate when equipment changes
- Cache per character, not globally

### Precision

- Store percentages as decimals (0.05 not 5)
- Round final display values, not intermediate
- Use at least 4 decimal places internally
- Round to nearest integer for damage

### Immutability

- Never mutate input CharacterState
- Return new objects from processLevelUp
- DerivedStats are computed, never stored

---

## Public Exports

```typescript
// src/core/character/index.ts

export type {
  CharacterService,
  CharacterDerivedStats,
  StatBreakdown,
  HPBreakdown,
  DamageBreakdown,
  CritBreakdown,
  ArmorBreakdown,
  DotResistanceBreakdown,
  XPCalculationResult,
  LevelUpResult,
  LevelUpError,
  LevelUpErrorCode,
  CharacterCreationError,
  CharacterCreationErrorCode,
};

export {
  createCharacterService,
  CHARACTER_CONSTANTS,
};

// Re-export commonly used types from dependencies
export type {
  CharacterState,
  EquipmentState,
  StatBlock,
  StatName,
  CharacterClass,
} from '../state';
```
