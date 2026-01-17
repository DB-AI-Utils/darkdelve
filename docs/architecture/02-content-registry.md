# 02 - Content Registry

## Purpose

Centralized loading, validation, and caching of all JSON content and configuration files. Game systems query the registry instead of reading files directly.

---

## Responsibilities

1. Load all `configs/*.json` files at startup
2. Load all `content/**/*.json` files at startup
3. Validate content against schemas (required fields, types, references)
4. Cache parsed content in memory for fast access
5. Provide typed accessors for all content types
6. Report clear, actionable errors for invalid content
7. Support hot-reload for development

---

## Dependencies

- **01-foundation**: Types, Result, FileSystem, Logger

---

## Interface Contracts

### Content Registry

```typescript
// ==================== Main Interface ====================

interface ContentRegistry {
  // === Lifecycle ===

  /**
   * Load all content from disk. Call once at startup.
   * Returns errors for any invalid content files.
   */
  initialize(): Promise<Result<void, ContentLoadError[]>>;

  /**
   * Reload specific content file (for hot-reload in dev)
   */
  reload(path: string): Promise<Result<void, ContentLoadError>>;

  /**
   * Validate all loaded content for cross-references
   * Call after initialize() to check referential integrity.
   */
  validate(): ValidationReport;

  // === Items ===

  /** Get item template by ID (file name without extension) */
  getItemTemplate(templateId: string): ItemTemplate | undefined;

  /** Get all item templates */
  getAllItemTemplates(): readonly ItemTemplate[];

  /** Get item templates by slot */
  getItemTemplatesBySlot(slot: ItemSlot): readonly ItemTemplate[];

  /** Get item templates by rarity */
  getItemTemplatesByRarity(rarity: Rarity): readonly ItemTemplate[];

  /** Get item templates for a loot table */
  getItemTemplatesForLootTable(tableId: string): readonly ItemTemplate[];

  /** Get items available at merchant */
  getMerchantItems(alwaysAvailable: boolean): readonly ItemTemplate[];

  // === Monsters ===

  /** Get monster template by ID */
  getMonsterTemplate(monsterId: string): MonsterTemplate | undefined;

  /** Get all monster templates */
  getAllMonsterTemplates(): readonly MonsterTemplate[];

  /** Get monsters that can spawn on a floor */
  getMonstersForFloor(floor: FloorNumber): readonly MonsterTemplate[];

  /** Get elite monsters for a floor */
  getElitesForFloor(floor: FloorNumber): readonly MonsterTemplate[];

  /** Get boss for a dungeon */
  getBoss(dungeonId: string): MonsterTemplate | undefined;

  // === Status Effects ===

  /** Get status effect by ID */
  getStatusEffect(effectId: string): StatusEffectTemplate | undefined;

  /** Get all status effects */
  getAllStatusEffects(): readonly StatusEffectTemplate[];

  // === Events ===

  /** Get event template by ID */
  getEventTemplate(eventId: string): EventTemplate | undefined;

  /** Get events that can occur on a floor */
  getEventsForFloor(floor: FloorNumber): readonly EventTemplate[];

  /** Get events by type */
  getEventsByType(type: EventType): readonly EventTemplate[];

  // === Dungeons ===

  /** Get dungeon template by ID */
  getDungeonTemplate(dungeonId: string): DungeonTemplate | undefined;

  /** Get all dungeon templates */
  getAllDungeonTemplates(): readonly DungeonTemplate[];

  // === Loot Tables ===

  /** Get loot table by ID */
  getLootTable(tableId: string): LootTable | undefined;

  // === Classes ===

  /** Get class definition */
  getClassDefinition(classId: CharacterClass): ClassDefinition | undefined;

  /** Get all class definitions */
  getAllClassDefinitions(): readonly ClassDefinition[];

  // === Configuration ===

  /** Get config value by path (e.g., "combat.heavyAttackMultiplier") */
  getConfig<T>(path: string): T;

  /** Get full combat configuration */
  getCombatConfig(): CombatConfig;

  /** Get full dread configuration */
  getDreadConfig(): DreadConfig;

  /** Get full extraction configuration */
  getExtractionConfig(): ExtractionConfig;

  /** Get full progression configuration */
  getProgressionConfig(): ProgressionConfig;

  /** Get full merchant configuration */
  getMerchantConfig(): MerchantConfig;

  /** Get full game configuration */
  getGameConfig(): GameConfig;

  /** Get analytics configuration */
  getAnalyticsConfig(): AnalyticsConfig;

  /** Get loot generation configuration */
  getLootConfig(): LootConfig;

  /** Get camp configuration */
  getCampConfig(): CampConfig;

  /** Get dungeon generation configuration */
  getDungeonConfig(): DungeonConfig;

  /** Get death economy configuration */
  getDeathEconomyConfig(): DeathEconomyConfig;

  /** Get lesson learned configuration */
  getLessonLearnedConfig(): LessonLearnedConfig;
}
```

### Template Types

```typescript
// ==================== Item Templates ====================

interface ItemTemplate {
  /** Unique identifier (derived from filename) */
  id: string;

  /** Equipment slot this item occupies */
  slot: ItemSlot;

  /** Rarity tier */
  rarity: Rarity;

  // --- Display (Narrative fills these) ---

  /** Display name when identified */
  name: string;

  /** Display name when unidentified */
  unidentifiedName: string;

  /** Short atmospheric text */
  flavorText: string;

  /** Detailed examination text */
  inspectText: string;

  // --- Stats ---

  /** Base stats (null for consumables) */
  baseStats: ItemStatBlock | null;

  /** Item effects (passives, on-hit, actives) */
  effects: ItemEffect[];

  // --- Consumable Data ---

  /** Consumable-specific data (null for equipment) */
  consumable: ConsumableData | null;

  // --- Flags ---

  /** Whether item is cursed (cannot unequip) */
  cursed: boolean;

  /** Whether item is a quest item (cannot sell/drop) */
  questItem: boolean;

  // --- Economy ---

  /** Price to buy from merchant (null if not sold) */
  buyPrice: number | null;

  /** Gold received when selling */
  sellPrice: number;

  // --- Spawn Rules ---

  /** Minimum character level to find/use */
  minLevel: number;

  /** Weight for loot generation (higher = more common) */
  dropWeight: number;

  /** Loot tables this item can appear in */
  lootTables: string[];

  /** Whether merchant can stock this */
  merchantStock: boolean;

  /** Whether always available at merchant */
  merchantAlwaysAvailable: boolean;
}

interface ItemStatBlock {
  /** Damage range (weapons only) */
  damageMin?: number;
  damageMax?: number;

  /** Flat HP bonus */
  bonusHP?: number;

  /** Armor value (0-1, where 0.40 = 40% reduction) */
  armor?: number;

  /** Stat bonuses */
  vigor?: number;
  might?: number;
  cunning?: number;
}

interface ItemEffect {
  /** Effect type identifier */
  type: EffectType;

  /** Magnitude of the effect */
  magnitude: number;

  /** Duration in turns (for temporary effects) */
  duration?: number;

  /** Proc chance (for on-hit effects, 0-1) */
  chance?: number;

  /** Human-readable description */
  description: string;

  /** Whether effect is hidden until identified */
  hiddenUntilIdentified: boolean;
}

type EffectType =
  // Passive bonuses
  | 'stat_bonus_vigor'
  | 'stat_bonus_might'
  | 'stat_bonus_cunning'
  | 'crit_chance'
  | 'crit_damage'
  | 'damage_bonus_flat'
  | 'damage_bonus_percent'
  | 'lifesteal'
  | 'damage_reduction'
  | 'dread_gain_reduction'

  // On-hit procs (player attacking)
  | 'on_hit_poison'
  | 'on_hit_bleed'
  | 'on_hit_stun'
  | 'on_hit_bonus_damage'

  // On-hit-taken procs (player being attacked)
  | 'on_hit_taken_reflect'
  | 'on_hit_taken_heal'
  | 'on_hit_taken_thorns'

  // Active effects (consumables)
  | 'active_heal'
  | 'active_heal_percent'
  | 'active_cure_poison'
  | 'active_cure_bleed'
  | 'active_cure_all'
  | 'active_reduce_dread'
  | 'active_buff_damage'
  | 'active_buff_armor'
  | 'active_buff_crit'

  // Curse effects
  | 'curse_dread_gain'
  | 'curse_damage_taken'
  | 'curse_no_heal'
  | 'curse_gold_loss';

interface ConsumableData {
  /** Max stack size in consumable slot */
  maxStack: number;

  /** Whether usable in combat */
  usableInCombat: boolean;

  /** Whether usable outside combat */
  usableOutOfCombat: boolean;

  /** Turns until can use again (0 = no cooldown) */
  cooldown: number;
}

// ==================== Monster Templates ====================

interface MonsterTemplate {
  /** Unique identifier (derived from filename) */
  id: string;

  /** Monster category */
  type: EnemyType;

  // --- Display ---

  /** Display name */
  name: string;

  /** Short atmospheric text */
  flavorText: string;

  /** Message on death */
  deathCry: string;

  /** Bestiary lore (longer description) */
  lore: string;

  // --- Stats ---

  /** HP range (rolled on spawn) */
  hpMin: number;
  hpMax: number;

  /** Damage range */
  damageMin: number;
  damageMax: number;

  /** Armor value (0-1, where 0.40 = 40% reduction) */
  armor: number;

  /** Speed category */
  speed: EnemySpeed;

  // --- Combat Behavior ---

  /** Abilities the monster can use */
  abilities: MonsterAbility[];

  /** Damage type resistances (type -> multiplier, 1.0 = normal) */
  resistances: Record<string, number>;

  /** Weaknesses (types that deal extra damage) */
  weaknesses: string[];

  // --- Rewards ---

  /** Base XP value */
  xpValue: number;

  /** Gold drop range */
  goldMin: number;
  goldMax: number;

  /** Loot table ID for drops */
  lootTableId: string;

  /** Dread change on kill (usually negative) */
  dreadOnKill: number;

  // --- Spawn Rules ---

  /** Floors where this monster can spawn */
  spawnFloors: FloorNumber[];

  /** Weight for spawn selection */
  spawnWeight: number;

  /** Dungeon IDs where this monster appears */
  dungeons: string[];

  // --- Veteran Knowledge ---

  /** What information unlocks at each tier */
  knowledgeTiers: KnowledgeTier[];
}

interface MonsterAbility {
  /** Ability identifier */
  id: string;

  /** Display name */
  name: string;

  /** Priority (higher = checked first) */
  priority: number;

  /** When to use this ability */
  condition: AbilityCondition;

  /** Damage range (if damaging) */
  damage?: NumericRange;

  /** Status effects applied */
  effects?: string[];

  /** Message shown when used */
  useText: string;

  /** Telegraph text shown before use */
  telegraphText?: string;

  /** Turns between uses (0 = no cooldown) */
  cooldown: number;
}

interface AbilityCondition {
  type: ConditionType;
  value?: number;
  action?: string;
}

type ConditionType =
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

interface KnowledgeTier {
  tier: 1 | 2 | 3;
  encountersRequired: number;
  deathsRequired: number;
  reveals: string[];
}

// ==================== Status Effect Templates ====================

interface StatusEffectTemplate {
  id: string;

  // Display
  name: string;
  description: string;
  icon: string;  // For future GUI

  // Mechanics
  type: 'buff' | 'debuff';
  stackable: boolean;
  maxStacks: number;
  defaultDuration: number;

  // Effects
  damagePerTurn?: number;
  damagePerStack?: number;
  statModifier?: Partial<StatBlock>;
  damageModifier?: number;  // Multiplier
  healingBlocked?: boolean;
  actionsBlocked?: boolean;

  // Cleansing
  cleansedBy: string[];  // Item effect types that remove this
  persistsBetweenCombats: boolean;
}

// ==================== Event Templates ====================

interface EventTemplate {
  id: string;
  type: EventType;

  // Display
  title: string;
  description: string;

  // Spawn rules
  spawnFloors: FloorNumber[];
  spawnWeight: number;
  unique: boolean;  // Can only occur once per run

  // Requirements
  requirements: EventRequirement[];

  // Choices
  choices: EventChoice[];
}

type EventType =
  | 'treasure'
  | 'npc'
  | 'rest'
  | 'shrine'
  | 'special'
  | 'merchant';

interface EventRequirement {
  type: 'stat_check' | 'item_owned' | 'gold_minimum' | 'dread_range' | 'event_memory';
  stat?: StatName;
  value?: number;
  itemId?: string;
  min?: number;
  max?: number;
  memoryKey?: string;
}

interface EventChoice {
  id: string;
  text: string;
  requirements: EventRequirement[];
  outcomes: EventOutcome[];
  hiddenUntilRequirementsMet: boolean;
}

interface EventOutcome {
  weight: number;  // For random outcome selection
  description: string;
  effects: OutcomeEffect[];
}

interface OutcomeEffect {
  type: OutcomeEffectType;
  value?: number;
  itemId?: string;
  statusId?: string;
  monsterId?: string;
  memoryKey?: string;
}

type OutcomeEffectType =
  | 'gold_gain'
  | 'gold_lose'
  | 'heal'
  | 'damage'
  | 'dread_gain'
  | 'dread_lose'
  | 'item_gain'
  | 'item_lose'
  | 'status_apply'
  | 'status_remove'
  | 'combat_start'
  | 'set_event_memory'
  | 'blessing_gain';

// ==================== Dungeon Templates ====================

interface DungeonTemplate {
  id: string;

  // Display
  name: string;
  description: string;

  // Structure
  floorCount: number;
  floors: FloorTemplate[];

  // Content pools
  monsterPool: string[];  // Monster IDs that can spawn here
  eventPool: string[];    // Event IDs that can occur here

  // Boss
  bossId: string;

  thresholdWarning: string;

  // Unlock
  unlocked: boolean;  // Available from start?
  unlockCondition?: UnlockCondition;
}

interface FloorTemplate {
  floor: FloorNumber;
  roomCount: number;

  // Room distribution
  combatRooms: number;
  treasureRooms: number;
  eventRooms: number;
  restRooms: number;

  // Layout
  layoutType: 'linear' | 'branching' | 'loop';

  // Content
  eliteChance: number;
  lootMultiplier: number;
}

interface UnlockCondition {
  type: 'boss_defeated' | 'runs_completed' | 'item_found' | 'always';
  dungeonId?: string;
  count?: number;
  itemId?: string;
}

// ==================== Loot Tables ====================

interface LootTable {
  id: string;

  // Drop mechanics
  guaranteedDrops: LootEntry[];
  randomDrops: LootEntry[];
  maxRandomDrops: number;

  // Gold
  goldMin: number;
  goldMax: number;
  goldChance: number;
}

interface LootEntry {
  type: 'item' | 'item_pool' | 'gold';

  // For type: 'item'
  itemId?: string;

  // For type: 'item_pool'
  slot?: ItemSlot;
  rarity?: Rarity;
  rarityMin?: Rarity;
  rarityMax?: Rarity;

  // Drop chance (0-1)
  chance: number;

  // Count
  countMin: number;
  countMax: number;
}

// ==================== Class Definitions ====================

interface ClassDefinition {
  id: CharacterClass;

  // Display
  name: string;
  description: string;
  lore: string;

  // Starting setup
  startingStats: StatBlock;
  startingWeapon: string;  // Item template ID
  startingArmor: string;   // Item template ID
  startingGold: number;

  // Passive abilities
  passives: ClassPassive[];

  // Unlock
  unlocked: boolean;
  unlockCondition?: ClassUnlockCondition;
}

interface ClassPassive {
  id: string;
  name: string;
  description: string;
  effect: ClassPassiveEffect;
}

type ClassPassiveEffect =
  | { type: 'damage_bonus_low_hp'; hpThreshold: number; bonus: number }
  | { type: 'curse_immunity' }
  | { type: 'dread_reduction'; amount: number }
  | { type: 'lifesteal_bonus'; amount: number }
  | { type: 'crit_on_kill'; duration: number };

interface ClassUnlockCondition {
  type: 'watcher_death' | 'high_dread_extract' | 'boss_kill' | 'death_count';
  floor?: FloorNumber;
  dread?: number;
  bossId?: string;
  count?: number;
}
```

### Configuration Types

```typescript
// ==================== Configuration ====================

interface GameConfig {
  version: string;

  // Inventory
  inventoryCapacity: number;
  stashCapacity: number;
  maxBringFromStash: number;
  consumableSlots: number;
  maxConsumableStack: number;

  // Equipment
  equipmentSlots: EquipmentSlot[];

  // Currency
  startingGold: number;
  identificationCost: number;

  // Profiles
  defaultProfileName: string;
}

interface CombatConfig {
  // Stamina
  maxStamina: number;
  staminaRegenBase: number;
  staminaRegenOnPass: number;
  dodgeStaminaBonus: number;

  // Actions
  lightAttackCost: number;
  heavyAttackCost: number;
  dodgeCost: number;
  blockCost: number;

  // Heavy attack
  heavyAttackMultiplier: number;
  heavyAttackStaggerChance: number;
  heavyAttackArmorPen: number;
  slowEnemyHeavyBonus: number;

  // Block
  blockDamageReduction: number;

  // Critical hits
  baseCritChance: number;
  critMultiplier: number;
  critChanceCap: number;
  cunningPerCritPoint: number;
  cunningDiminishingThreshold: number;
  cunningDiminishingRate: number;

  // Armor
  playerArmorCap: number;

  // Flee
  fleeChanceBasic: number;
  fleeChanceElite: number;
  fleeChanceBoss: number;
  fleeDreadGain: number;
  fleeBlockedOnTurn1: boolean;
  fleeBlockedOnAmbush: boolean;

  // Turn order
  fastEnemyFirstStrike: boolean;
  ambushFreeActions: number;

  // Boss stagger
  bossStaggerThreshold: number;
  bossStaggerWindow: number;
}

interface DreadConfig {
  maxDread: number;
  minDreadAfterRest: number;

  // Thresholds
  thresholds: {
    calm: DreadThresholdConfig;
    uneasy: DreadThresholdConfig;
    shaken: DreadThresholdConfig;
    terrified: DreadThresholdConfig;
    breaking: DreadThresholdConfig;
  };

  // Sources
  sources: {
    killBasic: number;
    killElite: number;
    killEldritch: number;
    explorationPerTurns: number;
    explorationTurnCount: number;
    floorDescent: number;
    forbiddenText: number;
    horrorEncounter: NumericRange;
    flee: number;
  };

  // Recovery
  recovery: {
    rest: number;
    torch: number;
    shrine: number;
    calmDraught: number;
    clarityPotion: number;
  };

  // Watcher
  watcher: {
    hp: number;
    damage: number;
    stunThreshold: number;
    maxStuns: number;
    enrageDamageMultiplier: number;
    escapeWindowTurns: number;
  };
}

interface DreadThresholdConfig {
  min: number;
  max: number;
  hallucinationChance: number;
  roomCorruptionChance: number;
  statCorruptionChance: number;
}

interface ExtractionConfig {
  /** Per-floor extraction rules indexed by floor number */
  floors: Record<FloorNumber, FloorExtractionRule>;

  thresholdRetreat: {
    goldPercentage: number;
    minimumGold: number;
    allowItemPayment: boolean;
    itemPaymentCount: number;
    returnFloor: FloorNumber;
  };

  desperation: {
    dreadCost: number;
    allowEquipmentSacrifice: boolean;
    protectedSlots: EquipmentSlot[];
    freeExtractionIfOnlyWeapon: boolean;
  };

  extractionLocations: RoomType[];

  taunt: {
    enabled: boolean;
    showChestType: boolean;
    highlightOrnateChest: boolean;
    showEnemyHint: boolean;
    showEventHint: boolean;
  };
}

interface FloorExtractionRule {
  method: 'free' | 'waystone' | 'boss';
  goldPercentage: number;
  minimumGold: number;
  allowItemPayment: boolean;
  itemPaymentCount: number;
}

interface ProgressionConfig {
  levelCap: number;

  // XP
  xpPerLevelBase: number;
  xpPerLevelMultiplier: number;  // XP needed = base * level * multiplier
  xpFloorMultipliers: Record<FloorNumber, number>;

  // Level penalties
  xpPenaltyLevelDifference: number;
  xpPenaltyMultiplier: number;
  goldPenaltyLevelDifference: number;
  goldPenaltyMultiplier: number;

  // Per-level gains
  hpPerLevel: number;
  statsPerLevel: number;

  // Base stats
  baseHP: number;
  vigorHPBonus: number;
  mightDamageBonus: number;

  // Resistances
  vigorDotResistancePerPoint: number;
  vigorDotResistanceCap: number;

  // Veteran Knowledge
  veteranKnowledge: {
    tier1Encounters: number;
    tier1Deaths: number;
    tier2Encounters: number;
    tier2Deaths: number;
    tier3Encounters: number;
    tier3Deaths: number;
  };

  // Lesson Learned
  lessonLearnedBonus: number;
  lessonLearnedDuration: number;
}

/**
 * Merchant configuration for stock and pricing rules.
 *
 * Merchant availability is determined by two sources:
 * 1. ItemTemplate flags (merchantStock, merchantAlwaysAvailable) - defines eligibility
 * 2. MerchantConfig.alwaysAvailable - explicit overrides with specific prices
 *
 * Items appear at merchant if EITHER:
 * - ItemTemplate.merchantAlwaysAvailable is true, OR
 * - Listed in MerchantConfig.alwaysAvailable
 *
 * Rotating stock uses items where ItemTemplate.merchantStock is true.
 */
interface MerchantConfig {
  // Always available consumables (explicit list with prices)
  alwaysAvailable: MerchantStockEntry[];

  // Rotating stock configuration
  rotatingStock: {
    consumableSlots: number;
    rotatingConsumables: string[];
  };

  // Accessory availability by level (slots and rarities scale with character level)
  accessorySlotsByLevel: { minLevel: number; slots: number; rarities: Rarity[] }[];

  // Pricing
  sellValueMultiplier: number;
  unidentifiedSellMultiplier: number;

  // Stock seed (for deterministic rotation)
  stockSeedComponents: ('runNumber' | 'characterLevel' | 'lastExtractionFloor')[];
}

interface MerchantStockEntry {
  templateId: string;
  price: number;
}

interface AnalyticsConfig {
  enabled: boolean;

  // Events to track
  trackCombatActions: boolean;
  trackDecisionPoints: boolean;
  trackEconomy: boolean;
  trackProgression: boolean;

  // Storage
  eventBufferSize: number;
  flushIntervalMs: number;
  retentionDays: number;

  // Aggregation
  computeDailyAggregates: boolean;
  computeWeeklyAggregates: boolean;
}

interface LootConfig {
  // Drop chances by source (0-1)
  dropChances: {
    basicEnemy: number;
    eliteEnemy: number;
    boss: number;
    treasureChest: number;
  };

  // Item counts per drop
  itemCounts: {
    basicEnemy: { min: number; max: number };
    eliteEnemy: { min: number; max: number; bonusChance: number };
    boss: { min: number; max: number; bonusChance: number };
    ornateChest: { min: number; max: number };
  };

  // Slot weights for random equipment drops
  slotWeights: {
    weapon: number;
    armor: number;
    helm: number;
    accessory: number;
  };

  // Consumable drop chances
  consumableChance: {
    default: number;
    chestFloor3Plus: number;
  };

  // Special rates
  bossLegendaryRate: number;
  dreadQualityBonusMultiplier: number;
}

interface CampConfig {
  stashCapacity: number;
  maxBringFromStash: number;
  consumableSlots: number;
  maxConsumableStack: number;

  freeStarterPotion: {
    enabled: boolean;
    templateId: string;
    count: number;
  };

  expeditionLogSize: number;
}

interface DungeonConfig {
  floors: FloorConfig[];

  generation: {
    roomIdPrefix: string;
    connectionStyle: 'corridor';
    guaranteeStartSafe: boolean;
    shuffleRoomOrder: boolean;
  };

  backtracking: {
    turnCost: number;
    requiresCleared: boolean;
  };

  dreadEliteScaling: {
    enabled: boolean;
    baseChance: number;
    maxChance: number;
    dreadThreshold: number;
    scalingStart: number;
  };
}

interface FloorConfig {
  floor: FloorNumber;
  roomCount: number;
  combatRooms: number;
  treasureRooms: number;
  eventRooms: number;
  restRooms: number;
  eliteChance: number;
  layoutType: 'linear' | 'branching' | 'loop';
  hasArmoredEnemies?: boolean;
  hasBoss?: boolean;
  hasThreshold?: boolean;
}

interface DeathEconomyConfig {
  rule: 'full_loss';
  description: string;

  riskStatusTags: {
    safe: { color: string; description: string };
    at_risk: { color: string; description: string };
  };
}

interface LessonLearnedConfig {
  damageBonus: number;

  duration: {
    runs: number;
    decrementsAt: 'expedition_start';
  };

  display: {
    deathScreen: boolean;
    runStart: boolean;
    combatLog: boolean;
  };

  stacking: 'overwrite';
}
```

### Error Types

```typescript
// ==================== Error Types ====================

interface ContentLoadError {
  type: ContentErrorType;
  path: string;
  message: string;
  line?: number;
  column?: number;
}

type ContentErrorType =
  | 'file_not_found'
  | 'parse_error'
  | 'schema_violation'
  | 'missing_required_field'
  | 'invalid_type'
  | 'invalid_enum_value'
  | 'invalid_range'
  | 'reference_not_found';

interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'broken_reference' | 'circular_reference' | 'missing_content' | 'invalid_constraint';
  source: string;      // File/entity with the error
  target?: string;     // Referenced file/entity (for reference errors)
  field: string;       // Field name with the error
  message: string;
}

interface ValidationWarning {
  type: 'unused_content' | 'balance_concern' | 'missing_narrative';
  source: string;
  message: string;
}
```

### Factory Function

```typescript
/**
 * Create content registry instance
 */
function createContentRegistry(
  fileSystem: FileSystem,
  logger: Logger,
  basePath: string  // Root path for configs/ and content/
): ContentRegistry;
```

---

## Configuration/Content Files

### Directory Structure

```
darkdelve/
├── configs/
│   ├── game.json           # GameConfig
│   ├── combat.json         # CombatConfig
│   ├── dread.json          # DreadConfig
│   ├── extraction.json     # ExtractionConfig
│   ├── progression.json    # ProgressionConfig
│   ├── merchant.json       # MerchantConfig
│   ├── analytics.json      # AnalyticsConfig
│   ├── loot.json           # LootConfig
│   ├── camp.json           # CampConfig
│   ├── dungeon.json        # DungeonConfig
│   ├── death-economy.json  # DeathEconomyConfig
│   └── lesson-learned.json # LessonLearnedConfig
│
└── content/
    ├── items/
    │   ├── weapons/
    │   │   ├── rusty_sword.json
    │   │   ├── iron_blade.json
    │   │   └── ...
    │   ├── armor/
    │   ├── helms/
    │   ├── accessories/
    │   └── consumables/
    │
    ├── monsters/
    │   ├── common/
    │   │   ├── plague_rat.json
    │   │   ├── ghoul.json
    │   │   └── ...
    │   ├── elites/
    │   └── bosses/
    │
    ├── status_effects/
    │   ├── poison.json
    │   ├── bleed.json
    │   └── ...
    │
    ├── events/
    │   ├── treasure_standard_chest.json
    │   ├── npc_hooded_figure.json
    │   └── ...
    │
    ├── dungeons/
    │   └── ossuary.json
    │
    ├── loot_tables/
    │   ├── basic_enemy.json
    │   ├── elite_enemy.json
    │   └── ...
    │
    └── classes/
        ├── mercenary.json
        ├── flagellant.json
        └── hollowed_one.json
```

### Example Content Files

**configs/combat.json:** *(canonical values in `docs/game-design/combat.md`)*
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
  "fleeChanceBoss": 0,
  "fleeDreadGain": 5,
  "fleeBlockedOnTurn1": true,
  "fleeBlockedOnAmbush": true,

  "fastEnemyFirstStrike": true,
  "ambushFreeActions": 2,

  "bossStaggerThreshold": 2,
  "bossStaggerWindow": 3
}
```

**content/items/weapons/rusty_sword.json:**
```json
{
  "slot": "weapon",
  "rarity": "common",

  "name": "Rusty Sword",
  "unidentifiedName": "Worn Blade",
  "flavorText": "Better than bare hands. Barely.",
  "inspectText": "The blade is pitted with rust, but the edge still holds.",

  "baseStats": {
    "damageMin": 4,
    "damageMax": 7
  },

  "effects": [],

  "consumable": null,
  "cursed": false,
  "questItem": false,

  "buyPrice": null,
  "sellPrice": 5,

  "minLevel": 1,
  "dropWeight": 100,
  "lootTables": ["basic_enemy", "floor1_chest"],
  "merchantStock": false,
  "merchantAlwaysAvailable": false
}
```

**content/monsters/common/plague_rat.json:**
```json
{
  "type": "basic",

  "name": "Plague Rat",
  "flavorText": "Disease given form and hunger.",
  "deathCry": "The rat collapses, still twitching.",
  "lore": "These vermin infest the upper reaches of the Ossuary...",

  "hpMin": 12,
  "hpMax": 15,
  "damageMin": 5,
  "damageMax": 8,
  "armor": 0,
  "speed": "fast",

  "abilities": [
    {
      "id": "bite",
      "name": "Venomous Bite",
      "priority": 1,
      "condition": { "type": "always" },
      "damage": { "min": 5, "max": 8 },
      "effects": ["poison"],
      "useText": "The rat sinks its fangs into your flesh!",
      "cooldown": 0
    }
  ],

  "resistances": {},
  "weaknesses": ["fire"],

  "xpValue": 8,
  "goldMin": 3,
  "goldMax": 8,
  "lootTableId": "plague_rat_loot",
  "dreadOnKill": -1,

  "spawnFloors": [1, 2, 3],
  "spawnWeight": 100,
  "dungeons": ["ossuary"],

  "knowledgeTiers": [
    { "tier": 1, "encountersRequired": 6, "deathsRequired": 1, "reveals": ["name", "hp_range", "damage_range"] },
    { "tier": 2, "encountersRequired": 15, "deathsRequired": 2, "reveals": ["abilities", "poison_chance"] },
    { "tier": 3, "encountersRequired": 25, "deathsRequired": 3, "reveals": ["exact_stats", "weaknesses", "strategies"] }
  ]
}
```

---

## Events Emitted/Subscribed

None. The content registry is a passive data store, not an event participant.

---

## State Managed

- **Loaded content cache**: All parsed JSON files in memory
- **Validation state**: Results of last validation run

---

## Edge Cases and Error Handling

| Case | Handling |
|------|----------|
| Missing config file | Return error, game cannot start |
| Missing content file | Log warning, continue (graceful degradation) |
| Invalid JSON syntax | Return parse error with line/column |
| Missing required field | Return schema violation error |
| Invalid enum value | Return invalid_enum_value error |
| Broken reference | Return in validation report, not load error |
| Circular reference | Detect and report in validation |
| Duplicate IDs | Later file overwrites (warn in validation) |
| Empty content directory | Valid, but warn about missing content |
| Hot-reload failure | Keep previous version, return error |

---

## Test Strategy

### Unit Tests

1. **Loading Tests**
   - Load valid config file
   - Load valid content file
   - Handle missing file
   - Handle invalid JSON
   - Handle schema violations

2. **Accessor Tests**
   - Get item by ID
   - Get items by slot
   - Get items by rarity
   - Get monsters for floor
   - Get config values by path

3. **Validation Tests**
   - Detect broken references
   - Detect missing required content
   - Detect duplicate IDs
   - Generate warnings for unused content

### Integration Tests

1. Load all actual content files
2. Validate cross-references
3. Ensure all referenced IDs exist
4. Test hot-reload mechanism

### Property Tests

```typescript
property("all items have valid rarity", () => {
  const items = registry.getAllItemTemplates();
  return items.every(item =>
    ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(item.rarity)
  );
});

property("all monster loot tables exist", () => {
  const monsters = registry.getAllMonsterTemplates();
  return monsters.every(monster =>
    registry.getLootTable(monster.lootTableId) !== undefined
  );
});
```

---

## Implementation Notes

### Loading Strategy

1. Load all config files first (synchronously block on errors)
2. Load content files by directory (can be parallel)
3. Index content by ID after loading
4. Run validation after all content loaded
5. Freeze all content objects (immutable)

### Caching

- Parse JSON once, cache in typed Maps
- Index by multiple keys (ID, slot, rarity, floor)
- Pre-compute common queries (monsters by floor, items by slot)

### Hot-Reload (Dev Only)

- Watch content directories for changes
- Reload only changed files
- Re-run validation after reload
- Emit event on successful reload (presentation can refresh)

---

## Public Exports

```typescript
// src/core/content/index.ts

export type {
  ContentRegistry,

  // Templates
  ItemTemplate,
  ItemStatBlock,
  ItemEffect,
  EffectType,
  ConsumableData,
  MonsterTemplate,
  MonsterAbility,
  AbilityCondition,
  ConditionType,
  KnowledgeTier,
  StatusEffectTemplate,
  EventTemplate,
  EventType,
  EventChoice,
  EventOutcome,
  DungeonTemplate,
  FloorTemplate,
  LootTable,
  LootEntry,
  ClassDefinition,
  ClassPassive,
  ClassPassiveEffect,

  // Configs
  GameConfig,
  CombatConfig,
  DreadConfig,
  DreadThresholdConfig,
  ExtractionConfig,
  FloorExtractionRule,
  ProgressionConfig,
  MerchantConfig,
  MerchantStockEntry,
  AnalyticsConfig,
  LootConfig,
  CampConfig,
  StashSortCriteria,
  DungeonConfig,
  FloorConfig,
  DeathEconomyConfig,
  LessonLearnedConfig,

  // Errors
  ContentLoadError,
  ContentErrorType,
  ValidationReport,
  ValidationError,
  ValidationWarning,
};

export { createContentRegistry };
```
