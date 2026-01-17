# 12 - Camp System

## Purpose

Manages the camp hub - the safe zone between dungeon runs where players manage inventory, equipment, prepare expeditions, trade with the merchant, view progression, and access the bestiary. This module orchestrates all camp-phase interactions and transitions to dungeon runs.

---

## Responsibilities

1. Manage camp main menu navigation and state transitions
2. Handle stash operations (view, transfer, organize)
3. Process equipment changes at camp
4. Coordinate expedition preparation (item selection, consumable loadout)
5. Manage merchant interactions (buy, sell, buyback)
6. Provide access to The Chronicler (bestiary, veteran knowledge, lore)
7. Display character progression and stats
8. Handle level-up stat allocation
9. Grant free starter potion each run
10. Coordinate transition from camp to dungeon session

---

## Dependencies

- **01-foundation**: Types (EntityId, Result, GameError, Timestamp), utilities (clamp)
- **02-content-registry**: ConsumableData, ItemTemplate, MerchantConfig
- **03-state-management**: GameState, ProfileState, StashState, CharacterState, GamePhase
- **04-event-system**: EventBus, GameEvent
- **05-command-system**: Command validation and execution
- **06-character-system**: CharacterService, computeDerivedStats, processLevelUp
- **07-item-system**: StashService, InventoryService, MerchantService, ItemService

---

## Interface Contracts

### Camp Service

```typescript
// ==================== Camp Service ====================

interface CampService {
  // === Navigation ===

  /**
   * Get current camp menu state
   */
  getCampState(state: GameState): CampStateView;

  /**
   * Navigate to a camp submenu
   */
  navigateTo(
    state: GameState,
    destination: CampDestination
  ): Result<GameState, GameError>;

  /**
   * Navigate back one level
   */
  navigateBack(state: GameState): Result<GameState, GameError>;

  // === Stash Operations ===

  /**
   * Get stash view with items and metadata
   */
  getStashView(state: GameState): StashView;

  /**
   * Transfer item from stash to equipment
   */
  equipFromStash(
    state: GameState,
    itemId: EntityId,
    slot: EquipmentSlot
  ): Result<EquipFromStashResult, GameError>;

  /**
   * Unequip item to stash
   */
  unequipToStash(
    state: GameState,
    slot: EquipmentSlot
  ): Result<UnequipToStashResult, GameError>;

  /**
   * Drop (destroy) item from stash
   */
  dropFromStash(
    state: GameState,
    itemId: EntityId
  ): Result<DropResult, GameError>;

  /**
   * Sort stash by criteria
   */
  sortStash(
    state: GameState,
    sortBy: StashSortCriteria
  ): GameState;

  // === Equipment Operations ===

  /**
   * Get equipment view with current gear and available swaps
   */
  getEquipmentView(state: GameState): EquipmentView;

  /**
   * Swap equipment with stash item
   */
  swapEquipment(
    state: GameState,
    slot: EquipmentSlot,
    stashItemId: EntityId
  ): Result<SwapEquipmentResult, GameError>;

  // === Character Operations ===

  /**
   * Get character view with stats and progression
   */
  getCharacterView(state: GameState): CharacterView;

  /**
   * Check if character can level up
   */
  canLevelUp(state: GameState): boolean;

  /**
   * Process level up with stat choice
   */
  levelUp(
    state: GameState,
    statChoice: StatName
  ): Result<LevelUpResult, GameError>;

  // === Chronicler Operations ===

  /**
   * Get bestiary view
   */
  getBestiaryView(state: GameState): BestiaryView;

  /**
   * Get veteran knowledge for a monster
   */
  getVeteranKnowledge(
    state: GameState,
    monsterId: string
  ): VeteranKnowledgeView | null;

  /**
   * Get lore entries
   */
  getLoreEntries(state: GameState): LoreEntryView[];

  // === Expedition Log ===

  /**
   * Get recent expedition summaries
   */
  getExpeditionLog(state: GameState): ExpeditionLogEntry[];
}

/**
 * Camp navigation destinations
 */
type CampDestination =
  | 'main'
  | 'stash'
  | 'equipment'
  | 'expedition_prep'
  | 'merchant'
  | 'chronicler'
  | 'character'
  | 'chronicler_bestiary'
  | 'chronicler_lessons'
  | 'chronicler_lore'
  | 'chronicler_log';

/**
 * Create camp service instance
 */
function createCampService(
  characterService: CharacterService,
  itemService: ItemService,
  stashService: StashService,
  merchantService: MerchantService
): CampService;
```

### Expedition Service

```typescript
// ==================== Expedition Service ====================

interface ExpeditionService {
  /**
   * Get expedition preparation state
   */
  getExpeditionPrepState(state: GameState): ExpeditionPrepView;

  /**
   * Select items to bring from stash (max 2)
   */
  selectBringItems(
    state: GameState,
    itemIds: EntityId[]
  ): Result<SelectBringResult, GameError>;

  /**
   * Deselect item from bring list
   */
  deselectBringItem(
    state: GameState,
    itemId: EntityId
  ): Result<GameState, GameError>;

  /**
   * Select consumables for expedition (max 3, from stash or purchase)
   */
  selectConsumables(
    state: GameState,
    selections: ConsumableSelection[]
  ): Result<SelectConsumablesResult, GameError>;

  /**
   * Deselect consumable from loadout
   */
  deselectConsumable(
    state: GameState,
    slotIndex: number
  ): Result<GameState, GameError>;

  /**
   * Quick-equip from stash during prep
   */
  quickEquip(
    state: GameState,
    slot: EquipmentSlot,
    stashItemId: EntityId
  ): Result<QuickEquipResult, GameError>;

  /**
   * Get final confirmation view
   */
  getConfirmationView(state: GameState): ExpeditionConfirmView;

  /**
   * Confirm and begin expedition
   * Creates session, grants free potion, transitions to dungeon
   */
  beginExpedition(
    state: GameState,
    dungeonId: string
  ): Result<BeginExpeditionResult, GameError>;

  /**
   * Validate expedition readiness
   */
  validateExpeditionReady(state: GameState): ExpeditionReadinessCheck;
}

interface ConsumableSelection {
  /** Source of the consumable */
  source: 'stash' | 'merchant';

  /** Item ID (if from stash) */
  itemId?: EntityId;

  /** Template ID (if purchasing from merchant) */
  templateId?: string;

  /** Quantity to add */
  quantity: number;
}

/**
 * Create expedition service instance
 */
function createExpeditionService(
  stashService: StashService,
  merchantService: MerchantService,
  itemService: ItemService
): ExpeditionService;
```

### Merchant Service (Camp-Specific)

```typescript
// ==================== Merchant Camp Service ====================

interface MerchantCampService {
  /**
   * Get merchant view with stock and prices
   */
  getMerchantView(state: GameState): MerchantView;

  /**
   * Purchase item from merchant
   */
  purchaseItem(
    state: GameState,
    templateId: string,
    quantity?: number
  ): Result<PurchaseResult, GameError>;

  /**
   * Sell item from stash
   */
  sellItem(
    state: GameState,
    itemId: EntityId
  ): Result<SellResult, GameError>;

  /**
   * Get buyback inventory
   */
  getBuybackView(state: GameState): BuybackView;

  /**
   * Buyback recently sold item
   */
  buybackItem(
    state: GameState,
    buybackId: EntityId
  ): Result<BuybackResult, GameError>;

  /**
   * Refresh rotating stock (called at session end)
   */
  refreshRotatingStock(
    state: GameState,
    rng: SeededRNG
  ): GameState;
}

/**
 * Create merchant camp service instance
 */
function createMerchantCampService(
  merchantService: MerchantService,
  itemService: ItemService
): MerchantCampService;
```

### View Types

```typescript
// ==================== View Types ====================

interface CampStateView {
  /** Current camp phase */
  phase: CampPhase;

  /** Player name */
  characterName: string;

  /** Current gold */
  gold: number;

  /** Character level */
  level: number;

  /** XP to next level */
  xpToNextLevel: number;

  /** Current XP */
  currentXP: number;

  /** Stash usage */
  stashCount: number;
  stashCapacity: number;

  /** Current Dread (0 at camp unless carrying over) */
  currentDread: number;

  /** Whether level up is available */
  canLevelUp: boolean;

  /** Active lesson learned (if any) */
  lessonLearned: LessonLearnedView | null;

  /** First-time player flags */
  isFirstRun: boolean;
  hasSeenIntro: boolean;
}

type CampPhase =
  | 'main'
  | 'stash'
  | 'stash_item_selected'
  | 'equipment'
  | 'equipment_slot_selected'
  | 'expedition_prep'
  | 'expedition_bring_selection'
  | 'expedition_consumable_selection'
  | 'expedition_confirm'
  | 'merchant'
  | 'merchant_sell'
  | 'merchant_buyback'
  | 'chronicler'
  | 'chronicler_bestiary'
  | 'chronicler_bestiary_entry'
  | 'chronicler_lessons'
  | 'chronicler_lore'
  | 'chronicler_log'
  | 'character'
  | 'character_levelup';

interface StashView {
  /** Items in stash */
  items: StashItemView[];

  /** Current capacity */
  count: number;
  capacity: number;

  /** Current sort criteria */
  sortedBy: StashSortCriteria;

  /** Available sort options */
  sortOptions: StashSortCriteria[];
}

interface StashItemView {
  id: EntityId;
  templateId: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  identified: boolean;
  shortDescription: string;
  sellValue: number;
  isQuest: boolean;
  isJunk: boolean;
  source: ItemSource;
  acquiredAt: Timestamp;
}

type StashSortCriteria =
  | 'rarity'
  | 'slot'
  | 'name'
  | 'recent'
  | 'value';

interface EquipmentView {
  /** Currently equipped items by slot */
  equipped: EquippedItemView;

  /** Items in stash compatible with each slot */
  availableBySlot: Record<EquipmentSlot, StashItemView[]>;

  /** Derived stats from current equipment */
  derivedStats: DerivedStatsView;
}

interface EquippedItemView {
  weapon: EquipmentSlotView;
  armor: EquipmentSlotView | null;
  helm: EquipmentSlotView | null;
  accessory: EquipmentSlotView | null;
}

interface EquipmentSlotView {
  id: EntityId;
  templateId: string;
  name: string;
  rarity: Rarity;
  statLine: string;
  flavorText: string;
  isCursed: boolean;
  isStartingGear: boolean;
}

interface DerivedStatsView {
  maxHP: number;
  damageRange: string;
  critChance: string;
  armor: string;
  dotResistance: string;
}

interface CharacterView {
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  xpToNextLevel: number;

  /** Base stats */
  baseStats: StatBlock;

  /** Derived stats with breakdown */
  derivedStats: DerivedStatsView;

  /** Stat breakdown for display */
  statBreakdown: {
    hp: string;     // "35 base + 40 VIGOR + 15 gear"
    damage: string; // "5-8 weapon + 6 MIGHT"
    crit: string;   // "5% base + 15% CUNNING + 5% gear"
  };

  /** Run statistics */
  statistics: StatisticsView;

  /** Can level up */
  canLevelUp: boolean;
}

interface StatisticsView {
  runsCompleted: number;
  runsFailed: number;
  deepestFloor: number;
  bossesDefeated: number;
  totalGoldEarned: number;
  totalPlayTime: string;
}

interface MerchantView {
  /** Merchant dialogue */
  dialogue: string;

  /** Player's current gold */
  playerGold: number;

  /** Always available items */
  alwaysAvailable: MerchantItemView[];

  /** Rotating stock */
  rotatingStock: MerchantItemView[];

  /** Number of items player can sell */
  sellableItemCount: number;

  /** Buyback available */
  hasBuyback: boolean;
}

interface MerchantItemView {
  templateId: string;
  name: string;
  price: number;
  canAfford: boolean;
  slot: ItemSlot;
  rarity: Rarity;
  description: string;
  inStock: boolean;
}

interface BuybackView {
  items: BuybackItemView[];
}

interface BuybackItemView {
  id: EntityId;
  templateId: string;
  name: string;
  price: number;
  canAfford: boolean;
  originalSellPrice: number;
}

interface BestiaryView {
  /** Total discovered / total possible */
  discoveredCount: number;
  totalCount: number;

  /** Discovered monsters by category */
  categories: BestiaryCategoryView[];
}

interface BestiaryCategoryView {
  name: string;
  monsters: BestiaryEntryView[];
}

interface BestiaryEntryView {
  monsterId: string;
  name: string;
  type: EnemyType;
  discovered: boolean;
  knowledgeTier: 0 | 1 | 2 | 3;

  /** Visible info based on tier */
  visibleInfo: BestiaryMonsterInfo | null;
}

interface BestiaryMonsterInfo {
  /** Tier 1: Basic info */
  description?: string;
  floors?: string;

  /** Tier 2: Combat info */
  hp?: string;
  damage?: string;
  abilities?: string[];

  /** Tier 3: Full info */
  weaknesses?: string[];
  resistances?: string[];
  loot?: string[];
}

interface VeteranKnowledgeView {
  monsterId: string;
  monsterName: string;
  tier: 0 | 1 | 2 | 3;
  encounters: number;
  deaths: number;

  /** Progress to next tier */
  encountersToNextTier: number | null;
  deathsToNextTier: number | null;

  /** What each tier reveals */
  tierReveals: string[];
}

interface LoreEntryView {
  id: string;
  title: string;
  text: string;
  unlockedAt: Timestamp;
  source: string;
}

interface ExpeditionLogEntry {
  runId: string;
  date: Timestamp;
  result: 'extraction' | 'death';
  floor: FloorNumber;
  enemiesKilled: number;
  goldCollected: number;
  itemsFound: number;
  deathCause?: string;
}

interface LessonLearnedView {
  enemyType: string;
  enemyName: string;
  damageBonus: string;
  runsRemaining: number;
}
```

### Expedition View Types

```typescript
// ==================== Expedition View Types ====================

interface ExpeditionPrepView {
  /** Current equipment loadout */
  loadout: EquippedItemView;

  /** Items selected to bring (max 2) */
  bringItems: BringItemView[];
  maxBringItems: number;

  /** Consumables selected (max 3) */
  consumables: ConsumableSlotView[];
  maxConsumableSlots: number;

  /** Items available to bring from stash */
  availableTooBring: StashItemView[];

  /** Consumables available (stash + merchant) */
  availableConsumables: AvailableConsumableView[];

  /** Warning text */
  riskWarning: string;
}

interface BringItemView {
  id: EntityId;
  templateId: string;
  name: string;
  rarity: Rarity;
  riskStatus: 'at_risk';
}

interface ConsumableSlotView {
  templateId: string;
  name: string;
  count: number;
  maxStack: number;
  source: 'stash' | 'merchant';
}

interface AvailableConsumableView {
  templateId: string;
  name: string;
  source: 'stash' | 'merchant';
  price?: number;
  inStashCount?: number;
  canAfford?: boolean;
  description: string;
}

interface ExpeditionConfirmView {
  /** Dungeon info */
  dungeonName: string;
  dungeonDescription: string;

  /** Equipment summary */
  equipment: {
    weapon: string;
    armor: string;
    helm: string;
    accessory: string;
  };

  /** Items at risk */
  itemsAtRisk: BringItemView[];

  /** Consumables being brought */
  consumables: ConsumableSlotView[];

  /** Total gold */
  gold: number;

  /** Risk level assessment */
  riskLevel: 'safe' | 'moderate' | 'high';
  riskDescription: string;
}

interface ExpeditionReadinessCheck {
  ready: boolean;
  issues: ExpeditionIssue[];
}

interface ExpeditionIssue {
  severity: 'error' | 'warning';
  message: string;
}
```

### Result Types

```typescript
// ==================== Result Types ====================

interface EquipFromStashResult {
  state: GameState;
  equippedItem: StashItemView;
  previousItem: StashItemView | null;
}

interface UnequipToStashResult {
  state: GameState;
  unequippedItem: StashItemView;
}

interface DropResult {
  state: GameState;
  droppedItem: StashItemView;
}

interface SwapEquipmentResult {
  state: GameState;
  newlyEquipped: StashItemView;
  previouslyEquipped: StashItemView;
}

interface SelectBringResult {
  state: GameState;
  selectedItems: BringItemView[];
  warnings: string[];
}

interface SelectConsumablesResult {
  state: GameState;
  consumables: ConsumableSlotView[];
  goldSpent: number;
}

interface QuickEquipResult {
  state: GameState;
  equippedItem: StashItemView;
  previousItem: StashItemView | null;
}

interface BeginExpeditionResult {
  state: GameState;
  runId: string;
  starterPotionGranted: boolean;
  lessonLearnedDecremented: boolean;
}

interface PurchaseResult {
  state: GameState;
  item: MerchantItemView;
  goldSpent: number;
  remainingGold: number;
}

interface SellResult {
  state: GameState;
  soldItem: StashItemView;
  goldReceived: number;
  addedToBuyback: boolean;
}

interface BuybackResult {
  state: GameState;
  item: StashItemView;
  goldSpent: number;
}

interface LevelUpResult {
  state: GameState;
  newLevel: number;
  statIncreased: StatName;
  newStatValue: number;
  hpGained: number;
}
```

---

## Configuration Files

### configs/camp.json

```json
{
  "stashCapacity": 12,
  "maxBringFromStash": 2,
  "consumableSlots": 3,
  "maxConsumableStack": 5,

  "freeStarterPotion": {
    "enabled": true,
    "templateId": "healing_potion",
    "count": 1
  },

  "sortOptions": ["rarity", "slot", "name", "recent", "value"],
  "defaultSort": "rarity",

  "expeditionLogSize": 20,
  "buybackLimit": 5,
  "buybackMarkup": 1.5
}
```

### configs/merchant.json (Camp-Specific Additions)

```json
{
  "alwaysAvailable": [
    { "templateId": "healing_potion", "price": 15 },
    { "templateId": "antidote", "price": 12 },
    { "templateId": "torch", "price": 8 },
    { "templateId": "bandage", "price": 10 },
    { "templateId": "calm_draught", "price": 18 }
  ],

  "rotatingStock": {
    "consumableSlots": 2,
    "accessorySlots": 1,

    "accessoryRarityByLevel": {
      "1": ["common"],
      "5": ["common", "uncommon"],
      "10": ["uncommon", "rare"]
    },

    "rotatingConsumables": [
      "id_scroll",
      "smoke_bomb",
      "fire_flask",
      "frost_flask",
      "fortify_elixir"
    ]
  },

  "sellValueMultiplier": 0.5,
  "unidentifiedSellMultiplier": 0.25,
  "buybackMarkup": 1.5
}
```

---

## Events Emitted

| Event | When Emitted |
|-------|--------------|
| `ITEM_EQUIPPED` | Item equipped from stash |
| `ITEM_UNEQUIPPED` | Item unequipped to stash |
| `ITEM_DROPPED` | Item destroyed from stash |
| `ITEM_SOLD` | Item sold to merchant |
| `ITEM_PURCHASED` | Item purchased from merchant |
| `LEVEL_UP` | Character leveled up |
| `STAT_INCREASED` | Stat increased from level up |
| `SESSION_STARTED` | Expedition begun |
| `GOLD_CHANGED` | Gold changed (purchase, sale) |
| `LESSON_LEARNED_DECREMENTED` | Lesson learned run count reduced at expedition start |

---

## Events Subscribed

| Event | Response |
|-------|----------|
| `SESSION_ENDED` | Update statistics, refresh merchant stock |
| `EXTRACTION_COMPLETED` | Process extracted items to stash |
| `DEATH_OCCURRED` | Process death recovery, update lesson learned |

---

## State Managed

The camp system operates on state from the State Management module. It does not own state directly but performs transitions between GamePhases:

**Camp Phases (from GamePhase):**
- `camp_main`
- `camp_stash`
- `camp_equipment`
- `camp_merchant`
- `camp_chronicler`
- `camp_character`
- `expedition_prep`
- `expedition_confirm`

**Camp-Specific Transient State:**

```typescript
interface CampTransientState {
  /** Items selected to bring from stash */
  selectedBringItems: EntityId[];

  /** Consumables selected for expedition */
  selectedConsumables: ConsumableSelection[];

  /** Current stash sort criteria */
  stashSortCriteria: StashSortCriteria;

  /** Selected item in stash view */
  selectedStashItem: EntityId | null;

  /** Selected equipment slot */
  selectedEquipmentSlot: EquipmentSlot | null;

  /** Buyback inventory */
  buybackItems: BuybackItem[];

  /** Selected chronicler submenu */
  chroniclerSection: ChroniclerSection | null;

  /** Selected bestiary entry */
  selectedBestiaryEntry: string | null;
}

type ChroniclerSection = 'bestiary' | 'lessons' | 'lore' | 'log';
```

---

## Edge Cases and Error Handling

### Stash Operations

| Case | Handling |
|------|----------|
| Equip from full stash to non-empty slot | Swap items (unequip goes to stash) |
| Unequip to full stash | Return `INSUFFICIENT_STASH_SPACE` error |
| Unequip cursed item | Return `ITEM_CURSED` error |
| Drop quest item | Block with warning "Quest items cannot be destroyed" |
| Drop last weapon | Block - weapon slot cannot be empty |
| Sort empty stash | No-op, return unchanged state |

### Equipment Operations

| Case | Handling |
|------|----------|
| Equip wrong slot type | Return `INVALID_STATE` error |
| Equip unidentified cursed item | Allow - curse activates on equip |
| Swap weapon with non-weapon | Return `INVALID_STATE` error |
| Empty weapon slot | Never allowed - always swap, never remove |

### Merchant Operations

| Case | Handling |
|------|----------|
| Purchase with insufficient gold | Return `INSUFFICIENT_GOLD` error |
| Purchase out-of-stock item | Return `INVALID_STATE` error |
| Sell starting gear | Allow (not blocked) |
| Sell quest item | Block with warning |
| Buyback expired item | Item removed from buyback, return `ITEM_NOT_FOUND` |
| Buyback with full stash | Return `INSUFFICIENT_STASH_SPACE` error |

### Expedition Preparation

| Case | Handling |
|------|----------|
| Select more than 2 bring items | Return `INVALID_PARAMETER` error |
| Select more than 3 consumables | Return `INVALID_PARAMETER` error |
| Select non-existent item | Return `ITEM_NOT_FOUND` error |
| Purchase consumable with insufficient gold | Return `INSUFFICIENT_GOLD` error |
| Begin expedition with no weapon | Block - should never happen |
| Begin expedition with pending level up | Allow - level up is optional |

### Level Up

| Case | Handling |
|------|----------|
| Level up without sufficient XP | Return `INSUFFICIENT_XP` error |
| Level up at max level | Return `MAX_LEVEL_REACHED` error |
| Invalid stat choice | Return `INVALID_STAT_CHOICE` error |
| Multiple level ups available | Process one at a time |

### Navigation

| Case | Handling |
|------|----------|
| Navigate back from main | No-op (already at root) |
| Navigate to invalid destination | Return `INVALID_STATE` error |
| Navigate during expedition | Block - must be at camp |
| ESC during unsaved state | Prompt confirmation |

### Free Starter Potion

| Case | Handling |
|------|----------|
| Consumable slots full | Add to first available stack or skip |
| Healing potion already at max stack | Do not add duplicate |
| Player declined potion | Always grant - no decline option |

---

## Test Strategy

### Unit Tests

1. **Navigation Tests**
   - Navigate to all camp destinations
   - Navigate back from each destination
   - Phase transitions are correct
   - Invalid navigation blocked

2. **Stash Tests**
   - Get stash view with items
   - Equip item from stash
   - Unequip item to stash
   - Drop item from stash
   - Sort stash by all criteria
   - Handle full stash
   - Handle empty stash

3. **Equipment Tests**
   - Get equipment view
   - Swap equipment with stash item
   - Show available items per slot
   - Block invalid slot swaps
   - Handle cursed items

4. **Merchant Tests**
   - Get merchant view with stock
   - Purchase consumable
   - Purchase accessory
   - Sell item
   - Buyback item
   - Handle insufficient gold
   - Handle out of stock
   - Rotating stock refresh

5. **Expedition Prep Tests**
   - Select bring items (0, 1, 2)
   - Deselect bring items
   - Select consumables from stash
   - Select consumables via purchase
   - Mixed consumable sources
   - Quick-equip during prep
   - Validation checks
   - Begin expedition creates session

6. **Level Up Tests**
   - Can level up detection
   - Process level up
   - Stat increase correct
   - HP gain correct
   - Handle max level
   - Handle insufficient XP

7. **Chronicler Tests**
   - Get bestiary view
   - Get veteran knowledge by tier
   - Get lore entries
   - Get expedition log

8. **Free Starter Potion Tests**
   - Potion granted on expedition start
   - Potion stacks with existing
   - Handles full consumable slots

### Property-Based Tests

```typescript
// Test fixture factory - provides sensible defaults for property tests.
// Uses createInitialState from state-management with test-appropriate values.
function createTestState(overrides?: {
  profileName?: string;
  classId?: CharacterClass;
}): GameState {
  const testRegistry = createTestContentRegistry(); // Test helper from test utilities
  return createInitialState(
    overrides?.profileName ?? 'TestProfile',
    'human',
    overrides?.classId ?? 'warrior',
    testRegistry
  );
}

property("stash never exceeds capacity", (operations) => {
  let state = createTestState();
  for (const op of operations) {
    const result = campService.executeOperation(state, op);
    if (result.success) {
      state = result.value;
    }
  }
  return state.profile.stash.items.length <= state.profile.stash.capacity;
});

property("bring items always <= 2", (selections) => {
  let state = createTestState();
  const result = expeditionService.selectBringItems(state, selections);
  if (!result.success) return true;
  return result.value.selectedItems.length <= 2;
});

property("gold never negative after purchase", (purchases) => {
  let state = createTestState();
  for (const templateId of purchases) {
    const result = merchantService.purchaseItem(state, templateId);
    if (result.success) {
      state = result.value.state;
    }
  }
  return state.profile.gold >= 0;
});

property("consumable slots never exceed 3", (selections) => {
  let state = createTestState();
  const result = expeditionService.selectConsumables(state, selections);
  if (!result.success) return true;
  return result.value.consumables.length <= 3;
});

property("level up always increases chosen stat by 1", (state, statChoice) => {
  if (!campService.canLevelUp(state)) return true;
  const result = campService.levelUp(state, statChoice);
  if (!result.success) return true;
  const before = state.profile.character.baseStats[statChoice];
  const after = result.value.state.profile.character.baseStats[statChoice];
  return after === before + 1;
});
```

### Integration Tests

1. **Full Expedition Flow**
   - Start at camp main
   - Visit stash, equip item
   - Visit merchant, buy consumable
   - Begin expedition prep
   - Select bring items
   - Select consumables
   - Confirm expedition
   - Verify session created with correct state

2. **Post-Run Flow**
   - Complete extraction
   - Verify items added to stash
   - Verify gold updated
   - Verify merchant stock refreshed
   - Verify expedition log updated

3. **Death Recovery Flow**
   - Die in dungeon
   - Verify death recovery rules applied
   - Verify items lost/preserved correctly
   - Verify lesson learned activated
   - Return to camp

4. **Level Up Flow**
   - Gain sufficient XP
   - Return to camp
   - Navigate to character
   - Level up with stat choice
   - Verify stats updated
   - Verify HP increased

5. **Merchant Full Cycle**
   - Sell item
   - Verify gold received
   - Verify buyback available
   - Buy different item
   - Buyback original item
   - Verify correct gold transactions

---

## Implementation Notes

### Phase Transitions

Camp phases map to GamePhase and control what operations are valid:

```typescript
const VALID_OPERATIONS: Record<CampPhase, CampOperation[]> = {
  'main': ['navigate', 'quit'],
  'stash': ['navigate', 'select_item', 'sort'],
  'stash_item_selected': ['equip', 'drop', 'navigate'],
  'equipment': ['navigate', 'select_slot'],
  'equipment_slot_selected': ['swap', 'unequip', 'navigate'],
  'expedition_prep': ['navigate', 'select_bring', 'select_consumables', 'quick_equip', 'confirm'],
  'expedition_confirm': ['begin', 'navigate'],
  'merchant': ['buy', 'navigate'],
  'merchant_sell': ['sell', 'navigate'],
  'character': ['level_up', 'navigate'],
  // ... etc
};
```

### Merchant Stock Refresh

Rotating stock is seeded by run number for consistency:

```typescript
function refreshRotatingStock(
  state: GameState,
  rng: SeededRNG
): MerchantStock {
  const merchantRng = rng.fork('merchant');

  // Select rotating consumables
  const consumables = merchantRng.shuffle(ROTATING_CONSUMABLES)
    .slice(0, config.rotatingStock.consumableSlots);

  // Select accessories based on level
  const level = state.profile.character.level;
  const rarities = getAccessoryRaritiesForLevel(level);
  const accessories = selectAccessories(merchantRng, rarities);

  return { alwaysAvailable: ALWAYS_AVAILABLE, rotating: [...consumables, ...accessories] };
}
```

### Free Starter Potion

Granted at expedition start, before session creation:

```typescript
function grantStarterPotion(state: GameState): GameState {
  const config = getConfig().camp.freeStarterPotion;
  if (!config.enabled) return state;

  // Check if can add to existing stack
  const existingSlot = state.session?.consumables.slots.findIndex(
    slot => slot.templateId === config.templateId && slot.count < slot.maxStack
  );

  if (existingSlot !== undefined && existingSlot >= 0) {
    // Add to existing stack
    return addToConsumableStack(state, existingSlot, config.count);
  }

  // Check for empty slot
  const emptySlot = state.session?.consumables.slots.findIndex(
    slot => slot.count === 0
  );

  if (emptySlot !== undefined && emptySlot >= 0) {
    // Create new stack
    return createConsumableStack(state, emptySlot, config.templateId, config.count);
  }

  // No room - skip silently (player chose to fill all slots)
  return state;
}
```

### Lesson Learned at Expedition Start

Lesson learned runs remaining is decremented at expedition start:

```typescript
function processLessonLearnedAtStart(state: GameState): GameState {
  const lesson = state.profile.lessonLearned;
  if (!lesson) return state;

  const newRunsRemaining = lesson.runsRemaining - 1;

  if (newRunsRemaining <= 0) {
    // Clear lesson learned
    return {
      ...state,
      profile: {
        ...state.profile,
        lessonLearned: null
      }
    };
  }

  // Decrement runs remaining
  return {
    ...state,
    profile: {
      ...state.profile,
      lessonLearned: {
        ...lesson,
        runsRemaining: newRunsRemaining
      }
    }
  };
}
```

### Stash Sorting

```typescript
const SORT_COMPARATORS: Record<StashSortCriteria, (a: StashItemView, b: StashItemView) => number> = {
  rarity: (a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity],
  slot: (a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot],
  name: (a, b) => a.name.localeCompare(b.name),
  recent: (a, b) => b.acquiredAt - a.acquiredAt,
  value: (a, b) => getSellValue(b) - getSellValue(a)
};

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4
};

const SLOT_ORDER: Record<ItemSlot, number> = {
  weapon: 0,
  armor: 1,
  helm: 2,
  accessory: 3,
  consumable: 4
};
```

---

## Public Exports

```typescript
// src/core/camp/index.ts

export type {
  // Services
  CampService,
  ExpeditionService,
  MerchantCampService,

  // View types
  CampStateView,
  CampPhase,
  CampDestination,
  StashView,
  StashItemView,
  StashSortCriteria,
  EquipmentView,
  EquippedItemView,
  EquipmentSlotView,
  DerivedStatsView,
  CharacterView,
  StatisticsView,
  MerchantView,
  MerchantItemView,
  BuybackView,
  BuybackItemView,
  BestiaryView,
  BestiaryCategoryView,
  BestiaryEntryView,
  BestiaryMonsterInfo,
  VeteranKnowledgeView,
  LoreEntryView,
  ExpeditionLogEntry,
  LessonLearnedView,

  // Expedition view types
  ExpeditionPrepView,
  BringItemView,
  ConsumableSlotView,
  AvailableConsumableView,
  ConsumableSelection,
  ExpeditionConfirmView,
  ExpeditionReadinessCheck,
  ExpeditionIssue,

  // Result types
  EquipFromStashResult,
  UnequipToStashResult,
  DropResult,
  SwapEquipmentResult,
  SelectBringResult,
  SelectConsumablesResult,
  QuickEquipResult,
  BeginExpeditionResult,
  PurchaseResult,
  SellResult,
  BuybackResult,
  LevelUpResult,
};

export {
  createCampService,
  createExpeditionService,
  createMerchantCampService,
};
```
