# 08 - Combat System

## Purpose

Turn-based combat resolution engine. Processes combat actions, calculates damage, manages turn order and status effects, and determines combat outcomes. All combat encounters are 1v1 (player vs single enemy) for MVP.

---

## Responsibilities

1. Initialize combat state when entering combat
2. Process player combat actions (attack, dodge, block, pass, item, flee)
3. Execute enemy AI turn based on priority-based ability selection
4. Calculate damage using the core damage formula
5. Manage stamina costs and regeneration
6. Apply and tick status effects
7. Track turn order based on enemy speed
8. Determine combat victory, defeat, and flee outcomes
9. Emit combat events for presentation layer

---

## Dependencies

- **01-foundation**: Types (EntityId, EnemySpeed, EnemyType), Result, SeededRNG, NumericRange
- **02-content-registry**: MonsterTemplate, MonsterAbility, StatusEffectTemplate, CombatConfig
- **03-state-management**: CombatState, TurnPhase, TurnOrder, PlayerCombatState, EnemyCombatState, CombatActionType, CombatAction, CombatActionEffects
- **04-event-system**: EventBus, combat events (CombatStartedEvent, PlayerAttackedEvent, etc.)
- **06-character-system**: Character stats, equipped weapon damage, computed values
- **07-item-system**: Item effects, consumable usage in combat

---

## Interface Contracts

### Combat Engine

```typescript
// ==================== Combat Engine ====================

interface CombatEngine {
  /**
   * Initialize a new combat encounter.
   * Sets up combat state, determines turn order based on enemy speed.
   * @param enemy - The enemy template to fight
   * @param enemyInstanceId - Unique ID for this enemy instance
   * @param isAmbush - Whether this is an ambush encounter
   * @returns Initial combat state and any first-strike events
   */
  initializeCombat(
    enemy: MonsterTemplate,
    enemyInstanceId: EntityId,
    isAmbush: boolean
  ): CombatInitResult;

  /**
   * Execute a player combat action.
   * Validates action, processes it, then executes enemy turn if applicable.
   * @param action - The combat action to execute
   * @returns Result with damage dealt, status changes, and combat outcome
   */
  executePlayerAction(action: CombatAction): CombatActionResult;

  /**
   * Process start-of-turn effects.
   * Ticks status effects, regenerates stamina, decrements buff durations.
   * Called automatically at turn start.
   */
  processStartOfTurn(): TurnStartResult;

  /**
   * Get available actions for current combat state.
   * Filters based on stamina, turn restrictions, and combat context.
   */
  getAvailableActions(): AvailableCombatAction[];

  /**
   * Get current combat state.
   */
  getCombatState(): CombatState;

  /**
   * Check if combat has ended.
   */
  isCombatOver(): boolean;

  /**
   * Get combat outcome if ended.
   */
  getCombatOutcome(): CombatOutcome | null;
}

/**
 * Create combat engine instance
 */
function createCombatEngine(
  config: CombatConfig,
  contentRegistry: ContentRegistry,
  eventBus: EventBus,
  rng: SeededRNG,
  playerParams: CombatEngineParams,
  lessonLearned: LessonLearnedState | null
): CombatEngine;
```

### Combat State Types

```typescript
// ==================== Combat State ====================
//
// Canonical types imported from 03-state-management:
//   - CombatState, TurnPhase, TurnOrder
//   - PlayerCombatState, EnemyCombatState
//   - CombatActionType, CombatAction
//   - ActiveStatusEffect
//   - DamageBreakdown, CombatLogEntry, CombatLogDetails
//
// Combat system extends PlayerCombatState with computed fields:

interface CombatPlayerStateExtended extends PlayerCombatState {
  /** Computed damage range from weapon + stats */
  readonly damageRange: NumericRange;

  /** Computed crit chance from CUNNING + gear */
  readonly critChance: number;

  /** Player armor percentage from gear */
  readonly armor: number;
}

// ==================== Combat Engine Initialization ====================
//
// CombatEngineParams is the INPUT for creating a combat engine.
// This is NOT the same as PlayerCombatState (which is runtime state).
// CombatEngineParams provides character data needed to initialize combat.

interface CombatEngineParams {
  /** Current HP at combat start */
  currentHP: number;

  /** Max HP */
  maxHP: number;

  /** Base stats (VIGOR, MIGHT, CUNNING) */
  stats: StatBlock;

  /** Weapon damage range */
  weaponDamage: NumericRange;

  /** Armor percentage from gear */
  armor: number;

  /** Crit chance from CUNNING + gear */
  critChance: number;

  /** Active buffs that affect combat */
  activeBuffs: readonly ActiveBuff[];

  /** Status effects carried into combat */
  statusEffects: readonly ActiveStatusEffect[];
}

// EnemyCombatState and ActiveStatusEffect imported from 03-state-management
```

### Combat Actions

```typescript
// ==================== Combat Actions ====================
// CombatActionType and CombatAction imported from 03-state-management

interface AvailableCombatAction {
  /** Action type */
  type: CombatActionType;

  /** Display text */
  displayText: string;

  /** Keyboard shortcut */
  shortcut: string;

  /** Stamina cost */
  staminaCost: number;

  /** Whether action is currently available */
  available: boolean;

  /** Reason if not available */
  unavailableReason?: string;

  /** Damage preview (for attacks) */
  damagePreview?: NumericRange;

  /** Effect description */
  effectDescription: string;
}

// ==================== Action Configuration ====================

interface ActionConfig {
  /** Stamina costs */
  readonly lightAttackCost: number;     // 1
  readonly heavyAttackCost: number;     // 3
  readonly dodgeCost: number;           // 1
  readonly blockCost: number;           // 1

  /** Heavy attack modifiers */
  readonly heavyAttackMultiplier: number;     // 2.0
  readonly heavyAttackStaggerChance: number;  // 0.50
  readonly heavyAttackArmorPen: number;       // 0.25

  /** Slow enemy bonus */
  readonly slowEnemyHeavyBonus: number;       // 0.25 (25% extra damage)

  /** Block effect */
  readonly blockDamageReduction: number;      // 0.50

  /** Flee chances */
  readonly fleeChanceBasic: number;           // 0.70
  readonly fleeChanceElite: number;           // 0.50
  readonly fleeChanceBoss: number;            // 0.00
  readonly fleeDreadGain: number;             // 5

  /** Flee restrictions */
  readonly fleeBlockedOnTurn1: boolean;       // true
  readonly fleeBlockedOnAmbush: boolean;      // true
}
```

### Damage Calculation

```typescript
// ==================== Damage Calculation ====================

/**
 * Calculate final damage using the core formula.
 *
 * Formula:
 * Final = (Weapon Base + MIGHT Bonus) x Skill Multiplier x (1 + Bonus%) x Crit x (1 - Armor%)
 */
interface DamageCalculator {
  /**
   * Calculate damage for a player attack.
   */
  calculatePlayerDamage(
    params: PlayerDamageParams
  ): DamageResult;

  /**
   * Calculate damage for an enemy attack.
   */
  calculateEnemyDamage(
    params: EnemyDamageParams
  ): DamageResult;
}

interface PlayerDamageParams {
  /** Base weapon damage (rolled from range) */
  weaponDamage: number;

  /** MIGHT stat value */
  might: number;

  /** Attack type multiplier (1.0 light, 2.0 heavy) */
  skillMultiplier: number;

  /** Sum of bonus percent modifiers */
  bonusPercent: number;

  /** Whether attack is a critical hit */
  isCritical: boolean;

  /** Enemy armor percentage */
  enemyArmor: number;

  /** Armor penetration (heavy attack: 0.25) */
  armorPenetration: number;

  /** Lesson Learned bonus (0.10 = 10%) */
  lessonLearnedBonus: number;

  /** Bonus for hitting SLOW enemies with heavy attack */
  slowEnemyBonus: number;
}

interface EnemyDamageParams {
  /** Base enemy damage (rolled from range) */
  baseDamage: number;

  /** Player armor percentage */
  playerArmor: number;

  /** Block reduction (0.50 if blocking) */
  blockReduction: number;

  /** Multiplier from ability (if any) */
  abilityMultiplier: number;
}

interface DamageResult {
  /** Final damage after all calculations */
  finalDamage: number;

  /** Whether attack was a critical hit */
  wasCritical: boolean;

  /** Whether attack was blocked */
  wasBlocked: boolean;

  /** Whether attack was dodged */
  wasDodged: boolean;

  /** Detailed breakdown for UI */
  breakdown: DamageBreakdown;
}

// DamageBreakdown imported from 03-state-management (canonical definition)
// Includes: baseDamage, mightBonus, skillMultiplier, bonusPercent,
// critMultiplier, armorReduction, lessonLearnedBonus, slowEnemyBonus,
// blockReduction, finalDamage

/**
 * Create damage calculator instance
 */
function createDamageCalculator(config: CombatConfig): DamageCalculator;
```

### Stamina System

```typescript
// ==================== Stamina System ====================

interface StaminaManager {
  /**
   * Check if player can afford stamina cost.
   */
  canAfford(currentStamina: number, cost: number): boolean;

  /**
   * Spend stamina for an action.
   */
  spend(currentStamina: number, cost: number): number;

  /**
   * Regenerate stamina at start of turn.
   * Includes base regen (2) plus any bonus from previous turn's dodge (+1).
   */
  regenerate(currentStamina: number, maxStamina: number, bonusStamina: number): number;

  /**
   * Get stamina cost for an action.
   */
  getActionCost(actionType: CombatActionType): number;
}

interface StaminaConfig {
  readonly maxStamina: number;           // 4
  readonly staminaRegenBase: number;     // 2
  readonly staminaRegenOnPass: number;   // 2 (same as base, but explicit)
  readonly dodgeStaminaBonus: number;    // 1 (bonus stamina next turn after dodge)
}
```

### Enemy AI

```typescript
// ==================== Enemy AI ====================

interface EnemyAI {
  /**
   * Select the next ability for the enemy to use.
   * Evaluates conditions from highest to lowest priority.
   */
  selectAbility(
    enemy: EnemyCombatState,
    player: PlayerCombatState,
    turn: number,
    lastPlayerAction: CombatActionType | null
  ): SelectedAbility;

  /**
   * Check if ability condition is met.
   */
  evaluateCondition(
    condition: AbilityCondition,
    enemy: EnemyCombatState,
    player: PlayerCombatState,
    turn: number,
    lastPlayerAction: CombatActionType | null
  ): boolean;
}

interface SelectedAbility {
  /** The ability to use */
  ability: MonsterAbility;

  /** Rolled damage (if applicable) */
  damage: number | null;

  /** Status effects to apply */
  effectsToApply: string[];
}

/**
 * Ability condition types from content registry.
 */
type AbilityConditionType =
  | 'always'           // Always use if available
  | 'hp_below'         // Enemy HP below percentage
  | 'hp_above'         // Enemy HP above percentage
  | 'player_hp_below'  // Player HP below percentage
  | 'turn_number'      // Specific turn(s)
  | 'turn_multiple'    // Every N turns
  | 'random_chance'    // Probability check
  | 'player_action'    // Player did specific action last turn
  | 'has_status'       // Target has status effect
  | 'missing_status';  // Target missing status effect

interface AbilityCondition {
  type: AbilityConditionType;
  value?: number;       // For hp_below, turn_number, random_chance
  action?: string;      // For player_action
  statusId?: string;    // For has_status, missing_status
}

/**
 * Create enemy AI instance
 */
function createEnemyAI(rng: SeededRNG): EnemyAI;
```

### Status Effect Processing

```typescript
// ==================== Status Effect Processing ====================

interface StatusEffectProcessor {
  /**
   * Apply a status effect to a target.
   */
  applyEffect(
    currentEffects: readonly ActiveStatusEffect[],
    effectId: string,
    stacks: number,
    duration: number,
    source: 'player' | 'enemy' | 'environment'
  ): ApplyEffectResult;

  /**
   * Tick all status effects at start of turn.
   * Returns damage dealt and effects to remove.
   */
  tickEffects(
    effects: readonly ActiveStatusEffect[],
    vigorStat: number
  ): TickEffectResult;

  /**
   * Remove a status effect (cleansed or expired).
   */
  removeEffect(
    effects: readonly ActiveStatusEffect[],
    effectId: string
  ): readonly ActiveStatusEffect[];

  /**
   * Check if target has specific effect.
   */
  hasEffect(
    effects: readonly ActiveStatusEffect[],
    templateId: string
  ): boolean;

  /**
   * Get total DoT damage per turn from effects.
   */
  getTotalDoTDamage(effects: readonly ActiveStatusEffect[]): number;
}

interface ApplyEffectResult {
  /** Updated effect list */
  effects: readonly ActiveStatusEffect[];

  /** Whether effect was newly applied vs stacked/extended */
  wasNewApplication: boolean;

  /** New stack count */
  newStacks: number;

  /** New duration */
  newDuration: number;
}

interface TickEffectResult {
  /** Updated effect list (duration decremented, expired removed) */
  effects: readonly ActiveStatusEffect[];

  /** Total damage dealt by DoT effects */
  dotDamage: number;

  /** Effects that expired this tick */
  expiredEffects: readonly string[];

  /** Breakdown by effect */
  damageBreakdown: readonly { effectId: string; damage: number }[];
}

/**
 * Status effect stacking rules from design doc.
 */
interface StatusStackingRules {
  /**
   * Poisoned: Duration extends, damage flat (3 dmg/turn), 6 turn max
   */
  readonly poisonMaxDuration: number;      // 6
  readonly poisonDamagePerTurn: number;    // 3

  /**
   * Bleeding: Stacks increase damage, 5 stack max
   * 2/4/6/8/10 damage at 1/2/3/4/5 stacks
   */
  readonly bleedMaxStacks: number;         // 5
  readonly bleedDamagePerStack: number;    // 2

  /**
   * Stunned: Does not stack, refreshes to 1 turn
   */
  readonly stunnedDuration: number;        // 1

  /**
   * Weakened: Duration extends, -25% damage, 6 turn max
   */
  readonly weakenedMaxDuration: number;    // 6
  readonly weakenedDamageReduction: number; // 0.25

  /**
   * Cursed: Does not stack, persists between combats
   */
  readonly cursedPersists: boolean;        // true
}

/**
 * Create status effect processor
 */
function createStatusEffectProcessor(
  contentRegistry: ContentRegistry,
  rules: StatusStackingRules
): StatusEffectProcessor;
```

### Combat Results

```typescript
// ==================== Combat Results ====================

interface CombatInitResult {
  /** Initial combat state */
  state: CombatState;

  /** Events from initialization (first-strike, ambush actions) */
  events: readonly GameEvent[];

  /** Whether enemy gets first action */
  enemyActsFirst: boolean;

  /** Number of ambush actions enemy took */
  ambushActionsTaken: number;
}

/**
 * Result of executing a player combat action via CombatEngine.
 *
 * Note: The `effects` field uses `CombatActionEffects` from 03-state-management,
 * which is the canonical type for combat action effects. This ensures the
 * engine result can be directly used when dispatching COMBAT_ACTION_EXECUTED.
 */
interface CombatActionResult {
  /** Whether action executed successfully */
  success: boolean;

  /** Error if not successful */
  error?: CombatActionError;

  /** Updated combat state */
  state: CombatState;

  /** Events generated */
  events: readonly GameEvent[];

  /** Combat outcome if ended */
  outcome?: CombatOutcome;

  /** Action effects (imported from 03-state-management) */
  effects: CombatActionEffects;

  /** Additional action-specific data */
  data: CombatActionData;
}

interface CombatActionError {
  code: CombatErrorCode;
  message: string;
}

type CombatErrorCode =
  | 'INSUFFICIENT_STAMINA'
  | 'PLAYER_STUNNED'
  | 'FLEE_BLOCKED'
  | 'INVALID_ACTION'
  | 'ITEM_NOT_USABLE'
  | 'COMBAT_ENDED';

interface CombatActionData {
  /** Damage dealt by player (if attack) */
  playerDamageDealt?: number;

  /** Damage dealt by enemy */
  enemyDamageDealt?: number;

  /** Whether player attack was critical */
  wasCritical?: boolean;

  /** Whether enemy was staggered */
  enemyStaggered?: boolean;

  /** Whether player dodged */
  playerDodged?: boolean;

  /** Whether player blocked */
  playerBlocked?: boolean;

  /** Status effects applied */
  statusEffectsApplied?: readonly string[];

  /** Flee success (if flee action) */
  fleeSuccess?: boolean;

  /** Item effect description (if use_item) */
  itemEffect?: string;
}

interface CombatOutcome {
  /** Outcome type */
  result: 'victory' | 'defeat' | 'fled';

  /** XP awarded (victory only) */
  xpAwarded: number;

  /** Gold dropped (victory only) */
  goldDropped: number;

  /** Dread change */
  dreadChange: number;

  /** Total turns elapsed */
  turnsElapsed: number;

  /** Total damage dealt by player */
  totalDamageDealt: number;

  /** Total damage received by player */
  totalDamageReceived: number;

  /** Was enemy killed by DoT? */
  killedByDoT: boolean;

  /** Loot table ID for drops */
  lootTableId: string;
}

interface TurnStartResult {
  /** Updated combat state */
  state: CombatState;

  /** Events from start of turn */
  events: readonly GameEvent[];

  /** DoT damage dealt to player */
  playerDoTDamage: number;

  /** DoT damage dealt to enemy */
  enemyDoTDamage: number;

  /** Combat ended from DoT? */
  combatEnded: boolean;

  /** Outcome if ended */
  outcome?: CombatOutcome;
}

// ==================== Combat Log ====================
//
// CombatLogEntry and CombatLogDetails imported from 03-state-management.
// See canonical definitions there for full interface contracts.
```

### Flee Mechanics

```typescript
// ==================== Flee Mechanics ====================

interface FleeResolver {
  /**
   * Check if flee is currently allowed.
   */
  canFlee(
    turn: number,
    isAmbush: boolean,
    enemyType: EnemyType
  ): FleeCheckResult;

  /**
   * Attempt to flee combat.
   */
  attemptFlee(
    enemyType: EnemyType,
    rng: SeededRNG
  ): FleeAttemptResult;
}

interface FleeCheckResult {
  /** Whether flee is allowed */
  allowed: boolean;

  /** Reason if not allowed */
  blockedReason?: 'turn_1' | 'ambush' | 'boss' | 'watcher';

  /** Success chance if allowed */
  successChance: number;
}

interface FleeAttemptResult {
  /** Whether flee succeeded */
  success: boolean;

  /** Base chance used */
  baseChance: number;

  /** Roll result */
  roll: number;

  /**
   * Dread cost for this outcome.
   * Per design (combat.md): success = +5, failure = +2.
   * Failure also causes lost turn (handled by combat flow).
   */
  dreadCost: number;
}

/**
 * Create flee resolver
 */
function createFleeResolver(config: ActionConfig): FleeResolver;
```

### Turn Order Resolution

```typescript
// ==================== Turn Order ====================

interface TurnOrderResolver {
  /**
   * Determine turn order based on enemy speed.
   */
  determineTurnOrder(
    enemySpeed: EnemySpeed,
    isAmbush: boolean
  ): TurnOrder;

  /**
   * Get number of ambush actions for enemy.
   */
  getAmbushActions(enemySpeed: EnemySpeed): number;

  /**
   * Check if enemy gets first strike this turn.
   */
  enemyActsFirst(
    turnOrder: TurnOrder,
    turn: number
  ): boolean;

  /**
   * Get slow enemy bonus for heavy attacks.
   */
  getSlowEnemyBonus(enemySpeed: EnemySpeed): number;
}

/**
 * Turn order rules from design doc:
 * - SLOW: Player first, +25% Heavy damage against enemy
 * - NORMAL: Player first
 * - FAST: Enemy first-strike Turn 1 only
 * - AMBUSH: Enemy gets 2 free actions before Turn 1
 */
function createTurnOrderResolver(config: CombatConfig): TurnOrderResolver;
```

### Stagger System

```typescript
// ==================== Stagger System ====================

interface StaggerResolver {
  /**
   * Attempt to stagger enemy with heavy attack.
   */
  attemptStagger(
    staggerChance: number,
    enemyType: EnemyType,
    currentStaggerCount: number,
    turnsSinceStagger: number,
    rng: SeededRNG
  ): StaggerResult;

  /**
   * Check if boss stagger threshold met.
   * Bosses require 2 staggers within 3 turns.
   */
  checkBossStagger(
    staggerCount: number,
    turnsSinceStagger: number
  ): boolean;
}

interface StaggerResult {
  /** Whether stagger was successful */
  success: boolean;

  /** Roll result */
  roll: number;

  /** Required roll to stagger */
  threshold: number;

  /** For bosses: current progress toward stagger */
  bossStaggerProgress?: {
    staggersNeeded: number;
    currentStaggers: number;
    turnsRemaining: number;
  };
}

/**
 * Create stagger resolver
 */
function createStaggerResolver(config: CombatConfig): StaggerResolver;
```

---

## Configuration Files

### configs/combat.json

> **Source of truth:** `docs/game-design/combat.md` is authoritative for combat balance values. This example must stay in sync with design.

```json
{
  "maxStamina": 4,
  "staminaRegenBase": 2,
  "staminaRegenOnPass": 2,
  "dodgeStaminaBonus": 1,

  "lightAttackCost": 1,
  "heavyAttackCost": 3,
  "dodgeCost": 1,
  "blockCost": 1,

  "heavyAttackMultiplier": 2.0,
  "heavyAttackStaggerChance": 0.50,
  "heavyAttackArmorPen": 0.25,
  "slowEnemyHeavyBonus": 0.25,

  "blockDamageReduction": 0.50,

  "baseCritChance": 0.05,
  "critMultiplier": 2.5,
  "critChanceCap": 0.65,
  "cunningPerCritPoint": 0.03,
  "cunningDiminishingThreshold": 10,
  "cunningDiminishingRate": 0.015,

  "playerArmorCap": 0.40,

  "fleeChanceBasic": 0.70,
  "fleeChanceElite": 0.50,
  "fleeChanceBoss": 0.00,
  "fleeDreadGain": 5,
  "fleeBlockedOnTurn1": true,
  "fleeBlockedOnAmbush": true,

  "fastEnemyFirstStrike": true,
  "ambushFreeActions": 2,

  "bossStaggerThreshold": 2,
  "bossStaggerWindow": 3
}
```

### Status Effect Config (in content/status_effects/)

```json
// content/status_effects/poison.json
{
  "id": "poison",
  "name": "Poisoned",
  "type": "debuff",
  "stackable": false,
  "maxStacks": 1,
  "defaultDuration": 3,
  "maxDuration": 6,
  "damagePerTurn": 3,
  "persistsBetweenCombats": false,
  "cleansedBy": ["active_cure_poison", "active_cure_all"]
}

// content/status_effects/bleed.json
{
  "id": "bleed",
  "name": "Bleeding",
  "type": "debuff",
  "stackable": true,
  "maxStacks": 5,
  "defaultDuration": -1,
  "damagePerStack": 2,
  "persistsBetweenCombats": false,
  "cleansedBy": ["active_cure_bleed", "active_cure_all"]
}

// content/status_effects/stunned.json
{
  "id": "stunned",
  "name": "Stunned",
  "type": "debuff",
  "stackable": false,
  "maxStacks": 1,
  "defaultDuration": 1,
  "actionsBlocked": true,
  "persistsBetweenCombats": false,
  "cleansedBy": []
}

// content/status_effects/weakened.json
{
  "id": "weakened",
  "name": "Weakened",
  "type": "debuff",
  "stackable": false,
  "maxStacks": 1,
  "defaultDuration": 3,
  "maxDuration": 6,
  "damageModifier": 0.75,
  "persistsBetweenCombats": false,
  "cleansedBy": ["active_cure_all"]
}

// content/status_effects/cursed.json
{
  "id": "cursed",
  "name": "Cursed",
  "type": "debuff",
  "stackable": false,
  "maxStacks": 1,
  "defaultDuration": -1,
  "healingBlocked": true,
  "persistsBetweenCombats": true,
  "cleansedBy": ["shrine_purification", "active_purge_curse"]
}
```

---

## Events Emitted

The combat system emits the following events through the EventBus:

| Event Type | When Emitted |
|------------|--------------|
| `COMBAT_STARTED` | Combat initialized |
| `PLAYER_ATTACKED` | Player executes attack |
| `ENEMY_ATTACKED` | Enemy executes attack |
| `DAMAGE_DEALT` | Any damage dealt |
| `HEALING_RECEIVED` | Any healing occurs |
| `STATUS_APPLIED` | Status effect applied |
| `STATUS_REMOVED` | Status effect removed/expired |
| `CRITICAL_HIT` | Critical hit occurs |
| `ENEMY_STAGGERED` | Enemy becomes staggered |
| `FLEE_ATTEMPTED` | Player attempts flee |
| `ENEMY_KILLED` | Enemy HP reaches 0 |
| `PLAYER_KILLED` | Player HP reaches 0 |
| `COMBAT_ENDED` | Combat resolves |
| `ITEM_USED` | Consumable used in combat |

---

## State Managed

The combat system manages `CombatState` as a sub-state of `SessionState`. Key state transitions:

| Trigger | State Change |
|---------|--------------|
| Enter combat room | `session.combat = CombatState` |
| Player action | Update HP, stamina, effects |
| Enemy action | Update HP, effects |
| Start of turn | Tick effects, regen stamina |
| Combat victory | `session.combat = null`, emit rewards |
| Combat defeat | `session.combat = null`, trigger death |
| Combat fled | `session.combat = null`, room state persists |

---

## Edge Cases and Error Handling

| Case | Handling |
|------|----------|
| Attack at 0 stamina | Return INSUFFICIENT_STAMINA error |
| Flee on turn 1 | Return FLEE_BLOCKED error with reason |
| Flee from boss | Return FLEE_BLOCKED error with reason |
| Use item with no items | Return ITEM_NOT_USABLE error |
| Use item on cooldown | Return ITEM_NOT_USABLE error |
| Action while stunned | Return PLAYER_STUNNED error |
| Negative damage result | Clamp to 0 (minimum 1 for attacks that hit) |
| DoT kills player | Combat ends as defeat, emit events |
| DoT kills enemy | Combat ends as victory, killedByDoT flag |
| Stagger on staggered enemy | Refresh stagger, don't stack |
| Dodge multiple attacks | Only blocks first attack |
| Block 0 damage | No effect, but block consumed |
| Heal while cursed | Healing blocked, return 0 |
| Status on immune target | Apply fails silently |
| Boss stagger resistance | Track 2-in-3-turns threshold |

---

## Test Strategy

### Unit Tests

1. **Damage Calculation Tests**
   - Light attack damage formula
   - Heavy attack damage formula with multiplier
   - Armor reduction calculation
   - Armor penetration on heavy attack
   - Critical hit multiplier
   - Lesson Learned bonus
   - Slow enemy bonus
   - Block reduction

2. **Stamina System Tests**
   - Action costs correct
   - Cannot act without stamina
   - Regeneration at turn start
   - Pass action stamina behavior

3. **Turn Order Tests**
   - Normal enemy: player first
   - Fast enemy: enemy first-strike turn 1
   - Fast enemy: player first turn 2+
   - Slow enemy: player first, bonus damage
   - Ambush: enemy 2 free actions

4. **Status Effect Tests**
   - Poison: flat damage, duration extension
   - Bleed: stacking damage
   - Stun: skip turn, no stack
   - Weakened: damage reduction
   - Cursed: heal block, persist

5. **Enemy AI Tests**
   - Priority-based ability selection
   - Condition evaluation (hp_below, etc.)
   - Cooldown tracking
   - Fallback to default attack

6. **Flee Tests**
   - Blocked turn 1
   - Blocked during ambush
   - Blocked vs boss
   - Success rate by enemy type
   - Dread gain on success

7. **Stagger Tests**
   - Normal enemy stagger
   - Boss stagger resistance
   - Boss 2-in-3-turns requirement
   - Stagger effect (skip action)

### Integration Tests

1. Full combat sequence: init -> actions -> victory
2. Full combat sequence: init -> actions -> defeat
3. Full combat sequence: init -> flee
4. DoT-kill scenarios
5. Multi-turn combat with status effects
6. Ambush combat handling

### Property Tests

```typescript
property("damage is always positive for hits", (weaponDmg, might, armor) => {
  const result = calculator.calculatePlayerDamage({
    weaponDamage: Math.abs(weaponDmg) + 1,
    might: Math.abs(might),
    skillMultiplier: 1.0,
    bonusPercent: 0,
    isCritical: false,
    enemyArmor: Math.min(Math.abs(armor), 0.99),
    armorPenetration: 0,
    lessonLearnedBonus: 0,
    slowEnemyBonus: 0
  });
  return result.finalDamage >= 1;
});

property("stamina never exceeds max", (actions, maxStamina) => {
  let stamina = maxStamina;
  for (const action of actions) {
    if (action === 'regen') {
      stamina = Math.min(stamina + 2, maxStamina);
    }
  }
  return stamina <= maxStamina;
});

property("DoT damage scales with stacks for bleed", (stacks) => {
  const clampedStacks = Math.min(Math.max(1, Math.floor(stacks)), 5);
  const expectedDamage = clampedStacks * 2;
  const result = processor.tickEffects([{
    id: 'test',
    templateId: 'bleed',
    stacks: clampedStacks,
    remainingDuration: 99,
    source: 'enemy'
  }], 0);
  return result.dotDamage === expectedDamage;
});
```

---

## Implementation Notes

### Combat Loop Flow

```
1. initializeCombat()
   - Create CombatState
   - Determine turn order
   - If FAST: execute enemy first-strike
   - If AMBUSH: execute 2 enemy actions
   - Emit COMBAT_STARTED

2. processStartOfTurn()
   - Tick status effects (damage, duration)
   - Check for DoT kills
   - Regenerate stamina (base + bonus from dodge if applicable)
   - Apply bonus stamina from previous turn's dodge (+1)
   - Clear bonus stamina counter
   - Decrement buff durations
   - Clear blocking/dodging flags

3. executePlayerAction(action)
   - Validate action (stamina, restrictions)
   - Execute action
   - If attack: calculate damage, apply, check stagger
   - If dodge: set isDodging flag
   - If block: set isBlocking flag
   - If flee: roll flee, resolve
   - If item: apply item effect
   - Check for enemy defeat
   - If combat continues: execute enemy turn

4. executeEnemyTurn()
   - Skip if staggered
   - Select ability via AI
   - Roll and apply damage
   - Apply status effects
   - Check for player defeat

5. Check combat end
   - Victory: emit ENEMY_KILLED, calculate rewards
   - Defeat: emit PLAYER_KILLED
   - Continue: increment turn, goto step 2
```

### Critical Hit Calculation

```typescript
function calculateCritChance(cunning: number, gearBonus: number, cap: number): number {
  const base = 0.05;
  let cunningBonus = 0;

  // Linear scaling up to threshold
  const threshold = 10;
  const linearRate = 0.03;
  const diminishedRate = 0.015;

  if (cunning <= threshold) {
    cunningBonus = cunning * linearRate;
  } else {
    cunningBonus = (threshold * linearRate) +
                   ((cunning - threshold) * diminishedRate);
  }

  return Math.min(base + cunningBonus + gearBonus, cap);
}
```

### Enemy AI Decision Tree

```typescript
function selectAbility(enemy, player, turn, lastAction): MonsterAbility {
  // Sort abilities by priority (highest first)
  const sortedAbilities = [...enemy.abilities]
    .sort((a, b) => b.priority - a.priority);

  for (const ability of sortedAbilities) {
    // Skip if on cooldown
    if (enemy.abilityCooldowns[ability.id] > 0) continue;

    // Evaluate condition
    if (evaluateCondition(ability.condition, enemy, player, turn, lastAction)) {
      return ability;
    }
  }

  // Fallback: should never reach if abilities are well-defined
  return sortedAbilities[sortedAbilities.length - 1];
}
```

### Status Effect Stacking

```typescript
function applyStatusEffect(currentEffects, effectTemplate, source): ActiveStatusEffect[] {
  const existing = currentEffects.find(e => e.templateId === effectTemplate.id);

  if (!existing) {
    // New application
    return [...currentEffects, {
      id: generateEntityId(),
      templateId: effectTemplate.id,
      stacks: 1,
      remainingDuration: effectTemplate.defaultDuration,
      source
    }];
  }

  if (effectTemplate.stackable) {
    // Increase stacks up to max
    return currentEffects.map(e =>
      e.id === existing.id
        ? { ...e, stacks: Math.min(e.stacks + 1, effectTemplate.maxStacks) }
        : e
    );
  }

  // Extend duration
  return currentEffects.map(e =>
    e.id === existing.id
      ? { ...e, remainingDuration: Math.min(
          e.remainingDuration + effectTemplate.defaultDuration,
          effectTemplate.maxDuration || Infinity
        )}
      : e
  );
}
```

---

## Public Exports

```typescript
// src/core/combat/index.ts

export type {
  // Engine
  CombatEngine,

  // State (re-exported from 03-state-management for convenience)
  CombatState,
  TurnPhase,
  TurnOrder,
  PlayerCombatState,
  EnemyCombatState,
  ActiveStatusEffect,
  DamageBreakdown,
  CombatLogEntry,
  CombatLogDetails,

  // Combat-specific types
  CombatEngineParams,
  CombatPlayerStateExtended,

  // Actions
  CombatAction,
  CombatActionType,
  AvailableCombatAction,
  ActionConfig,

  // Damage
  DamageCalculator,
  PlayerDamageParams,
  EnemyDamageParams,
  DamageResult,

  // Stamina
  StaminaManager,
  StaminaConfig,

  // Enemy AI
  EnemyAI,
  SelectedAbility,
  AbilityConditionType,
  AbilityCondition,

  // Status Effects
  StatusEffectProcessor,
  ApplyEffectResult,
  TickEffectResult,
  StatusStackingRules,

  // Results
  CombatInitResult,
  CombatActionResult,
  CombatActionError,
  CombatErrorCode,
  CombatActionData,
  CombatOutcome,
  TurnStartResult,

  // Flee
  FleeResolver,
  FleeCheckResult,
  FleeAttemptResult,

  // Turn Order
  TurnOrderResolver,

  // Stagger
  StaggerResolver,
  StaggerResult,
};

export {
  createCombatEngine,
  createDamageCalculator,
  createEnemyAI,
  createStatusEffectProcessor,
  createFleeResolver,
  createTurnOrderResolver,
  createStaggerResolver,
};
```
