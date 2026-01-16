# 07 - Item System

## Purpose

Manages all item-related operations: runtime item instances, inventory management, equipment handling, identification, stash interaction, loot generation, and effect processing. This module owns the lifecycle of items from creation to destruction.

---

## Responsibilities

1. Create runtime item instances from templates
2. Manage carried inventory (8 slots) and equipped items (4 slots)
3. Handle consumable slots (3 slots, stackable to 5)
4. Process item identification and curse mechanics
5. Manage stash storage and bring/retrieve operations
6. Generate loot based on floor, Dread, and source
7. Calculate equipment stat contributions
8. Process item effects (passive, on-hit, active)
9. Track item risk status for death economy

---

## Dependencies

- **01-foundation**: Types (EntityId, Rarity, EquipmentSlot, ItemSlot), Result, SeededRNG
- **02-content-registry**: ItemTemplate, ConsumableData, ItemEffect, EffectType, LootTable
- **06-character**: Equipment validation, class-specific rules (Hollowed One curse immunity)

---

## Interface Contracts

### Item Instance

```typescript
// ==================== Runtime Item ====================

/**
 * Runtime instance of an item.
 * Created from ItemTemplate with unique ID and mutable state.
 */
interface ItemInstance {
  /** Unique runtime identifier */
  readonly id: EntityId;

  /** Template ID for content lookup */
  readonly templateId: string;

  /** Current identification state */
  readonly identified: boolean;

  /** Source tracking for death economy */
  readonly source: ItemSource;

  /** When item was acquired (for sorting) */
  readonly acquiredAt: Timestamp;
}

/**
 * Where the item came from (affects death recovery)
 */
type ItemSource =
  | 'starting'   // Class starter gear - never lost
  | 'found'      // Dropped from enemy/chest - follows ID rules
  | 'purchased'  // Bought from merchant - follows ID rules
  | 'brought';   // Brought from stash - always lost on death

/**
 * Full item data combining instance and template
 * Used for display and calculations
 */
interface ResolvedItem {
  readonly instance: ItemInstance;
  readonly template: ItemTemplate;
}

/**
 * Item's risk status for death economy display.
 *
 * CANONICAL TYPE: This is the authoritative definition.
 * ExtractionSystem (11) imports this type rather than defining its own.
 *
 * Status determination priority (highest to lowest):
 * 1. source === 'starting' → 'safe' (starting gear always preserved)
 * 2. source === 'brought' → 'at_risk' (brought from stash, always lost)
 * 3. !isEquipped → 'doomed' (carried items always lost)
 * 4. !identified → 'vulnerable' (equipped but unidentified, lost)
 * 5. identified → 'protected' (equipped + identified, survives)
 */
type ItemRiskStatus =
  | 'safe'        // Starting gear - cannot be lost
  | 'protected'   // Equipped + identified - survives death
  | 'vulnerable'  // Equipped but unidentified - lost on death
  | 'at_risk'     // Brought from stash - always lost on death
  | 'doomed';     // Carried (not equipped) - lost on death
```

### Item Service

```typescript
// ==================== Item Service ====================

interface ItemService {
  // === Item Creation ===

  /**
   * Create a new item instance from template
   */
  createItem(
    templateId: string,
    source: ItemSource
  ): Result<ItemInstance, GameError>;

  /**
   * Create starting equipment for a class
   */
  createStartingEquipment(
    classId: CharacterClass
  ): Result<StartingEquipment, GameError>;

  // === Item Resolution ===

  /**
   * Resolve item instance to full data
   */
  resolveItem(item: ItemInstance): Result<ResolvedItem, GameError>;

  /**
   * Get display name (respects identification state)
   */
  getDisplayName(item: ItemInstance): string;

  /**
   * Get item description (respects identification and Dread)
   */
  getDescription(
    item: ItemInstance,
    currentDread: number
  ): ItemDescription;

  /**
   * Calculate item's risk status
   */
  getRiskStatus(
    item: ItemInstance,
    isEquipped: boolean
  ): ItemRiskStatus;

  // === Identification ===

  /**
   * Identify an item (reveals stats/effects)
   * Does NOT change curse binding - that happens on equip
   */
  identifyItem(itemId: EntityId): Result<IdentificationResult, GameError>;

  /**
   * Check if item can be identified
   */
  canIdentify(item: ItemInstance): boolean;

  /**
   * Get identification cost
   */
  getIdentificationCost(item: ItemInstance): number;

  // === Effect Processing ===

  /**
   * Get all active effects from equipped items
   */
  getEquippedEffects(equipment: EquipmentState): EquippedEffects;

  /**
   * Process on-hit effects (player attacking)
   */
  processOnHitEffects(
    equipment: EquipmentState,
    rng: SeededRNG
  ): OnHitResult[];

  /**
   * Process on-hit-taken effects (player being attacked)
   */
  processOnHitTakenEffects(
    equipment: EquipmentState,
    damageTaken: number,
    rng: SeededRNG
  ): OnHitTakenResult[];

  /**
   * Process active effect (consumable use)
   */
  processActiveEffect(
    item: ItemInstance,
    context: ActiveEffectContext
  ): Result<ActiveEffectResult, GameError>;

  // === Stat Contribution ===

  /**
   * Calculate stat bonuses from all equipment
   */
  calculateEquipmentStats(equipment: EquipmentState): EquipmentStatBonus;

  /**
   * Calculate damage range from weapon + effects
   */
  calculateWeaponDamage(equipment: EquipmentState): NumericRange;

  /**
   * Calculate armor percentage from equipment
   */
  calculateArmor(equipment: EquipmentState): number;

  // === Curse Handling ===

  /**
   * Check if item is cursed
   */
  isCursed(item: ItemInstance): boolean;

  /**
   * Check if curse prevents unequip
   */
  canUnequip(
    item: ItemInstance,
    classId: CharacterClass
  ): Result<boolean, CurseBlockedError>;

  /**
   * Get all active curse effects from equipment
   */
  getCurseEffects(equipment: EquipmentState): CurseEffect[];
}

interface StartingEquipment {
  weapon: ItemInstance;
  armor: ItemInstance | null;
  helm: ItemInstance | null;
  accessory: ItemInstance | null;
}

interface ItemDescription {
  /** Display name */
  name: string;

  /** Slot type */
  slot: ItemSlot;

  /** Rarity (always visible) */
  rarity: Rarity;

  /** Stats (may be corrupted by Dread) */
  stats: DisplayedStats | null;

  /** Effects (hidden if unidentified) */
  effects: DisplayedEffect[];

  /** Flavor text (hidden if unidentified) */
  flavorText: string | null;

  /** Curse warning (hidden if unidentified) */
  isCursed: boolean | null;

  /** Whether display is corrupted by Dread */
  isCorrupted: boolean;
}

interface DisplayedStats {
  damageRange: string | null;   // "5-8" or "???"
  bonusHP: string | null;       // "+10" or "???"
  armor: string | null;         // "15%" or "???"
  vigor: string | null;
  might: string | null;
  cunning: string | null;
}

interface DisplayedEffect {
  description: string;          // May be "[UNKNOWN EFFECT]"
  isHidden: boolean;
}

interface IdentificationResult {
  itemId: EntityId;
  revealedName: string;
  wasCursed: boolean;
  effects: ItemEffect[];
}

interface EquippedEffects {
  /** Flat stat bonuses */
  statBonuses: Partial<StatBlock>;

  /** Percentage bonuses */
  critChance: number;
  critDamage: number;
  lifesteal: number;
  damageReduction: number;
  dreadGainReduction: number;

  /** Flat damage bonus */
  flatDamageBonus: number;

  /** Percentage damage bonus */
  percentDamageBonus: number;

  /** On-hit proc effects */
  onHitEffects: OnHitEffect[];

  /** On-hit-taken proc effects */
  onHitTakenEffects: OnHitTakenEffect[];

  /** Active curse effects */
  curseEffects: CurseEffect[];
}

interface OnHitEffect {
  type: 'poison' | 'bleed' | 'stun' | 'bonus_damage';
  chance: number;      // 0-1
  magnitude: number;   // Damage or duration
  source: string;      // Item template ID
}

interface OnHitTakenEffect {
  type: 'reflect' | 'heal' | 'thorns';
  chance: number;
  magnitude: number;
  source: string;
}

interface CurseEffect {
  type: 'dread_gain' | 'damage_taken' | 'no_heal' | 'gold_loss';
  magnitude: number;
  source: string;
}

interface OnHitResult {
  triggered: boolean;
  effectType: string;
  magnitude: number;
  statusToApply?: string;
}

interface OnHitTakenResult {
  triggered: boolean;
  effectType: string;
  value: number;        // Reflected damage, healing, etc.
}

interface ActiveEffectContext {
  currentHP: number;
  maxHP: number;
  currentDread: number;
  inCombat: boolean;
}

interface ActiveEffectResult {
  healing?: number;
  dreadReduction?: number;
  statusRemoved?: string[];
  buffApplied?: string;
  consumed: boolean;
}

interface EquipmentStatBonus {
  vigor: number;
  might: number;
  cunning: number;
  bonusHP: number;
}

interface CurseBlockedError {
  code: 'ITEM_CURSED';
  message: string;
  itemName: string;
}
```

### Inventory Service

```typescript
// ==================== Inventory Service ====================

interface InventoryService {
  // === Carried Inventory ===

  /**
   * Add item to carried inventory
   */
  addToInventory(
    inventory: InventoryState,
    item: ItemInstance
  ): Result<InventoryState, GameError>;

  /**
   * Remove item from inventory
   */
  removeFromInventory(
    inventory: InventoryState,
    itemId: EntityId
  ): Result<{ inventory: InventoryState; item: ItemInstance }, GameError>;

  /**
   * Check if inventory has space
   */
  hasSpace(inventory: InventoryState): boolean;

  /**
   * Get available slots count
   */
  getAvailableSlots(inventory: InventoryState): number;

  /**
   * Find item in inventory by ID
   */
  findItem(
    inventory: InventoryState,
    itemId: EntityId
  ): ItemInstance | undefined;

  // === Equipment ===

  /**
   * Equip item to slot
   * Handles curse activation, slot validation
   */
  equipItem(
    equipment: EquipmentState,
    inventory: InventoryState,
    itemId: EntityId,
    classId: CharacterClass
  ): Result<EquipResult, GameError>;

  /**
   * Unequip item from slot
   * Blocked by curses (except Hollowed One)
   */
  unequipItem(
    equipment: EquipmentState,
    inventory: InventoryState,
    slot: EquipmentSlot,
    classId: CharacterClass
  ): Result<UnequipResult, GameError>;

  /**
   * Swap equipped item with inventory item
   */
  swapEquipment(
    equipment: EquipmentState,
    inventory: InventoryState,
    inventoryItemId: EntityId,
    classId: CharacterClass
  ): Result<SwapResult, GameError>;

  /**
   * Get equipped item in slot
   */
  getEquippedItem(
    equipment: EquipmentState,
    slot: EquipmentSlot
  ): ItemInstance | null;

  // === Consumables ===

  /**
   * Add consumable to slot (stacks if same type)
   */
  addConsumable(
    consumables: ConsumableSlotState,
    item: ItemInstance
  ): Result<ConsumableSlotState, GameError>;

  /**
   * Use consumable from slot
   */
  useConsumable(
    consumables: ConsumableSlotState,
    slotIndex: number,
    context: ActiveEffectContext
  ): Result<UseConsumableResult, GameError>;

  /**
   * Check if consumable can be used in current context
   */
  canUseConsumable(
    consumables: ConsumableSlotState,
    slotIndex: number,
    inCombat: boolean
  ): boolean;

  /**
   * Get consumable stack info
   */
  getConsumableStack(
    consumables: ConsumableSlotState,
    slotIndex: number
  ): ConsumableStackInfo | undefined;
}

interface EquipResult {
  equipment: EquipmentState;
  inventory: InventoryState;
  previousItem: ItemInstance | null;
  curseActivated: boolean;
}

interface UnequipResult {
  equipment: EquipmentState;
  inventory: InventoryState;
  unequippedItem: ItemInstance;
}

interface SwapResult {
  equipment: EquipmentState;
  inventory: InventoryState;
  newlyEquipped: ItemInstance;
  previouslyEquipped: ItemInstance;
}

interface UseConsumableResult {
  consumables: ConsumableSlotState;
  effectResult: ActiveEffectResult;
  stackDepleted: boolean;
}

interface ConsumableStackInfo {
  templateId: string;
  displayName: string;
  count: number;
  maxStack: number;
  canUseInCombat: boolean;
  canUseOutOfCombat: boolean;
}
```

### Stash Service

```typescript
// ==================== Stash Service ====================

interface StashService {
  /**
   * Add item to stash (at camp)
   */
  addToStash(
    stash: StashState,
    item: ItemInstance
  ): Result<StashState, GameError>;

  /**
   * Remove item from stash
   */
  removeFromStash(
    stash: StashState,
    itemId: EntityId
  ): Result<{ stash: StashState; item: ItemInstance }, GameError>;

  /**
   * Check if stash has space
   */
  hasSpace(stash: StashState): boolean;

  /**
   * Get available stash slots
   */
  getAvailableSlots(stash: StashState): number;

  /**
   * Find item in stash by ID
   */
  findItem(stash: StashState, itemId: EntityId): ItemInstance | undefined;

  /**
   * Prepare items to bring on expedition
   * Marks items as 'brought' source
   */
  prepareBringItems(
    stash: StashState,
    itemIds: EntityId[]
  ): Result<PreparedBringResult, GameError>;

  /**
   * Return surviving items to stash after death
   * Handles identification-based survival
   */
  returnSurvivingItems(
    stash: StashState,
    equipment: EquipmentState,
    inventory: InventoryState,
    broughtItemIds: EntityId[]
  ): DeathRecoveryResult;

  /**
   * Deposit items after successful extraction
   */
  depositAfterExtraction(
    stash: StashState,
    inventory: InventoryState,
    equipment: EquipmentState
  ): Result<StashState, GameError>;
}

interface PreparedBringResult {
  stash: StashState;
  broughtItems: ItemInstance[];
  broughtItemIds: EntityId[];
}

interface DeathRecoveryResult {
  stash: StashState;
  itemsLost: LostItemInfo[];
  itemsPreserved: PreservedItemInfo[];
}

interface LostItemInfo {
  itemId: EntityId;
  templateId: string;
  displayName: string;
  reason: 'brought' | 'unidentified' | 'carried_identified';
}

interface PreservedItemInfo {
  itemId: EntityId;
  templateId: string;
  displayName: string;
  reason: 'equipped_identified' | 'starting_gear';
}
```

### Loot Generation Service

```typescript
// ==================== Loot Generation ====================

interface LootGenerationService {
  /**
   * Generate loot from source
   */
  generateLoot(
    params: LootGenerationParams
  ): Result<GeneratedLoot, GameError>;

  /**
   * Generate loot from loot table
   */
  generateFromLootTable(
    tableId: string,
    params: LootTableParams
  ): Result<GeneratedLoot, GameError>;

  /**
   * Roll rarity based on floor and Dread
   */
  rollRarity(
    floor: FloorNumber,
    currentDread: number,
    rng: SeededRNG
  ): Rarity;

  /**
   * Roll item slot for equipment drop
   */
  rollSlot(rng: SeededRNG): EquipmentSlot;

  /**
   * Select random item matching criteria
   */
  selectItem(
    slot: ItemSlot,
    rarity: Rarity,
    rng: SeededRNG
  ): Result<string, GameError>;
}

interface LootGenerationParams {
  source: LootSource;
  floor: FloorNumber;
  currentDread: number;
  characterLevel: number;
  rng: SeededRNG;
}

type LootSource =
  | { type: 'basic_enemy'; enemyId: string }
  | { type: 'elite_enemy'; enemyId: string }
  | { type: 'boss'; bossId: string }
  | { type: 'chest'; chestType: 'standard' | 'locked' | 'ornate' }
  | { type: 'event'; eventId: string };

interface LootTableParams {
  floor: FloorNumber;
  currentDread: number;
  characterLevel: number;
  rng: SeededRNG;
}

interface GeneratedLoot {
  items: ItemInstance[];
  gold: number;
}

// ==================== Rarity Tables ====================

/**
 * Floor-based rarity distribution
 * From game-design/character-progression.md
 */
interface FloorRarityTable {
  floor: FloorNumber;
  common: number;     // Percentage (0-100)
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
}

/**
 * Default floor rarity tables
 */
const FLOOR_RARITY_TABLES: Record<FloorNumber, FloorRarityTable> = {
  1: { floor: 1, common: 70, uncommon: 22, rare: 7, epic: 1, legendary: 0 },
  2: { floor: 2, common: 65, uncommon: 25, rare: 8, epic: 1.5, legendary: 0.5 },
  3: { floor: 3, common: 55, uncommon: 28, rare: 13, epic: 3, legendary: 1 },
  4: { floor: 4, common: 45, uncommon: 30, rare: 18, epic: 5.5, legendary: 1.5 },
  5: { floor: 5, common: 35, uncommon: 30, rare: 22, epic: 10, legendary: 3 },
};

/**
 * Dread quality bonus formula
 * Upgrade chance = base + (dread * 0.5)%
 */
function calculateDreadQualityBonus(currentDread: number): number;
```

### Merchant Service

```typescript
// ==================== Merchant Service ====================

interface MerchantService {
  /**
   * Get items available for purchase
   */
  getMerchantStock(params: MerchantStockParams): MerchantStock;

  /**
   * Calculate buy price for item
   */
  getBuyPrice(templateId: string): number | null;

  /**
   * Calculate sell price for item
   */
  getSellPrice(item: ItemInstance): number;

  /**
   * Purchase item from merchant
   */
  purchaseItem(
    templateId: string,
    currentGold: number
  ): Result<PurchaseResult, GameError>;

  /**
   * Sell item to merchant
   */
  sellItem(
    item: ItemInstance,
    currentGold: number
  ): Result<SellResult, GameError>;

  /**
   * Get buyback inventory
   */
  getBuybackInventory(): BuybackItem[];

  /**
   * Buyback recently sold item
   */
  buybackItem(
    itemId: EntityId,
    currentGold: number
  ): Result<BuybackResult, GameError>;
}

interface MerchantStockParams {
  characterLevel: number;
  runNumber: number;
  lastExtractionFloor: FloorNumber;
  rng: SeededRNG;
}

interface MerchantStock {
  alwaysAvailable: MerchantItem[];
  rotating: MerchantItem[];
}

interface MerchantItem {
  templateId: string;
  displayName: string;
  slot: ItemSlot;
  rarity: Rarity;
  price: number;
  inStock: boolean;
}

interface PurchaseResult {
  item: ItemInstance;
  goldSpent: number;
  remainingGold: number;
}

interface SellResult {
  goldReceived: number;
  newGoldTotal: number;
  addedToBuyback: boolean;
}

interface BuybackItem {
  itemId: EntityId;
  templateId: string;
  displayName: string;
  price: number;       // Original sell price + markup
  expiresAt: Timestamp;
}

interface BuybackResult {
  item: ItemInstance;
  goldSpent: number;
  remainingGold: number;
}
```

---

## Configuration Files

### configs/game.json (Item-related settings)

```json
{
  "inventoryCapacity": 8,
  "stashCapacity": 12,
  "maxBringFromStash": 2,
  "consumableSlots": 3,
  "maxConsumableStack": 5,
  "identificationCost": 25,
  "equipmentSlots": ["weapon", "armor", "helm", "accessory"]
}
```

### configs/merchant.json

```json
{
  "rotatingSlotCount": 4,
  "accessorySlotsByLevel": [
    { "minLevel": 1, "slots": 1, "rarities": ["common", "uncommon"] },
    { "minLevel": 5, "slots": 2, "rarities": ["common", "uncommon", "rare"] },
    { "minLevel": 10, "slots": 3, "rarities": ["uncommon", "rare", "epic"] }
  ],
  "buybackMarkup": 1.25,
  "sellRatio": 0.5,
  "unidentifiedSellRatio": 0.5,
  "buybackLimit": 5,
  "stockSeedComponents": ["runNumber", "characterLevel", "lastExtractionFloor"]
}
```

### configs/loot.json

```json
{
  "dropChances": {
    "basicEnemy": 0.40,
    "eliteEnemy": 0.75,
    "boss": 1.0,
    "treasureChest": 1.0
  },
  "itemCounts": {
    "basicEnemy": { "min": 1, "max": 1 },
    "eliteEnemy": { "min": 1, "max": 2, "bonusChance": 0.25 },
    "boss": { "min": 2, "max": 3, "bonusChance": 0.50 },
    "ornateChest": { "min": 2, "max": 2 }
  },
  "slotWeights": {
    "weapon": 30,
    "armor": 25,
    "helm": 20,
    "accessory": 25
  },
  "consumableChance": {
    "default": 0.20,
    "chestFloor3Plus": 0.10
  },
  "bossLegendaryRate": 0.03,
  "dreadQualityBonusMultiplier": 0.5
}
```

---

## Events Emitted

| Event | When Emitted |
|-------|--------------|
| `ITEM_FOUND` | Loot generated from any source |
| `ITEM_PICKED_UP` | Item added to inventory |
| `ITEM_DROPPED` | Item removed from inventory (player choice or full) |
| `ITEM_EQUIPPED` | Item equipped to slot |
| `ITEM_UNEQUIPPED` | Item removed from slot |
| `ITEM_IDENTIFIED` | Item identification completed |
| `ITEM_USED` | Consumable used |
| `ITEM_SOLD` | Item sold to merchant |
| `ITEM_PURCHASED` | Item bought from merchant |
| `ITEMS_LOST` | Items lost on death |
| `ITEMS_PRESERVED` | Items saved on death |

---

## Events Subscribed

| Event | Response |
|-------|----------|
| `COMBAT_ENDED` | Process loot drops from defeated enemy |
| `SESSION_ENDED` | Process death recovery or extraction deposit |
| `DREAD_THRESHOLD_CROSSED` | Update item display corruption |

---

## State Managed

This module does not own state directly. It operates on state provided by the State Management module (03):

- `InventoryState`: Items carried during run
- `EquipmentState`: Currently equipped items
- `ConsumableSlotState`: Consumable stacks
- `StashState`: Persistent item storage
- `LootDropState`: Uncollected loot in rooms

All state mutations are performed via state actions dispatched to the StateStore.

---

## Edge Cases and Error Handling

### Inventory Operations

| Case | Handling |
|------|----------|
| Add item to full inventory | Return `INSUFFICIENT_INVENTORY_SPACE` error |
| Remove non-existent item | Return `ITEM_NOT_FOUND` error |
| Equip item not in inventory | Return `ITEM_NOT_FOUND` error |
| Equip to wrong slot | Return `INVALID_STATE` error |
| Equip weapon slot empty | Weapon slot cannot be empty - swap only |
| Unequip cursed item | Return `ITEM_CURSED` error (except Hollowed One) |
| Unequip weapon with no replacement | Return `INVALID_STATE` error |

### Consumables

| Case | Handling |
|------|----------|
| Add consumable to full slots | Return `INSUFFICIENT_INVENTORY_SPACE` error |
| Add consumable to max stack | Overflow to new slot or error if no slots |
| Use empty consumable slot | Return `INVALID_STATE` error |
| Use combat-only item outside combat | Return `INVALID_STATE` error |
| Use non-combat item in combat | Return `INVALID_STATE` error |
| Stack different consumable types | Create new stack in available slot |

### Stash Operations

| Case | Handling |
|------|----------|
| Add to full stash | Return `INSUFFICIENT_STASH_SPACE` error |
| Bring more than 2 items | Return `INVALID_PARAMETER` error |
| Bring non-existent item | Return `ITEM_NOT_FOUND` error |
| Deposit after death | Use `returnSurvivingItems` instead |

### Identification

| Case | Handling |
|------|----------|
| Identify already identified | Return success (no-op) |
| Identify with insufficient gold | Return `INSUFFICIENT_GOLD` error |
| Identify cursed item | Reveal curse but don't prevent future equip |

### Loot Generation

| Case | Handling |
|------|----------|
| No items match criteria | Fall back to common item of any slot |
| Empty loot table | Return empty loot (valid, no error) |
| Invalid template reference | Skip item, log warning |
| Boss kill | Apply special legendary rate (3%) |

### Curse Mechanics

| Case | Handling |
|------|----------|
| Equip unidentified cursed item | Curse activates immediately, reveal curse |
| Unequip cursed item (normal class) | Block with `ITEM_CURSED` error |
| Unequip cursed item (Hollowed One) | Allow normally |
| Death with cursed equipped | Item lost like any other |
| Multiple curse effects | All effects stack and apply |

### Death Recovery

| Case | Handling |
|------|----------|
| Equipped + Identified | Preserve to stash |
| Equipped + Unidentified | Lost |
| Carried + Identified | Lost (not equipped) |
| Carried + Unidentified | Lost |
| Brought from stash | Always lost |
| Starting gear | Always preserved |
| Stash full on recovery | Grant starter weapon, warn player |

---

## Test Strategy

### Unit Tests

1. **Item Creation Tests**
   - Create item from valid template
   - Create item from invalid template
   - Starting equipment for each class
   - Source tracking correct

2. **Inventory Tests**
   - Add/remove items
   - Capacity enforcement
   - Find item by ID
   - Handle duplicates

3. **Equipment Tests**
   - Equip to correct slot
   - Slot validation
   - Curse activation on equip
   - Hollowed One curse immunity
   - Weapon slot never empty

4. **Consumable Tests**
   - Stack same type
   - Stack limit enforcement
   - Use in combat/out of combat
   - Stack depletion

5. **Identification Tests**
   - Cost calculation
   - State change
   - Curse reveal
   - Already identified items

6. **Effect Processing Tests**
   - Stat bonus calculation
   - On-hit proc chance
   - On-hit-taken proc chance
   - Active effect application
   - Curse effect stacking

7. **Loot Generation Tests**
   - Rarity distribution matches tables
   - Dread bonus applied correctly
   - Slot distribution correct
   - Floor-based scaling

8. **Death Recovery Tests**
   - Equipped + ID = preserve
   - Carried + ID = lose
   - Brought = always lose
   - Starting = always preserve
   - Stash capacity handling

### Property-Based Tests

```typescript
property("inventory never exceeds capacity", (actions) => {
  let inventory = createEmptyInventory();
  for (const action of actions) {
    const result = inventoryService.addToInventory(inventory, action.item);
    if (result.success) {
      inventory = result.value;
    }
  }
  return inventory.items.length <= inventory.capacity;
});

property("equipped items always have valid slot", (equipment) => {
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'helm', 'accessory'];
  return slots.every(slot => {
    const item = equipment[slot];
    if (!item) return true;
    const template = registry.getItemTemplate(item.templateId);
    return template?.slot === slot;
  });
});

property("cursed items block unequip (except Hollowed One)", (item, classId) => {
  if (!isCursed(item)) return true;
  const result = inventoryService.canUnequip(item, classId);
  if (classId === 'hollowed_one') {
    return result.success && result.value === true;
  }
  return !result.success && result.error.code === 'ITEM_CURSED';
});

property("loot rarity matches floor distribution", (floor, samples) => {
  const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  const rng = createRNG(12345);

  for (let i = 0; i < samples; i++) {
    const rarity = lootService.rollRarity(floor, 0, rng);
    counts[rarity]++;
  }

  const table = FLOOR_RARITY_TABLES[floor];
  // Chi-squared test or tolerance check
  return withinTolerance(counts, table, samples, 0.1);
});
```

### Integration Tests

1. **Full Equip Flow**
   - Create item -> Add to inventory -> Equip -> Verify stats
   - Unequip -> Verify back in inventory

2. **Loot to Stash Flow**
   - Generate loot -> Pick up -> Extract -> Verify in stash

3. **Death Recovery Flow**
   - Bring items -> Die -> Verify correct preservation/loss

4. **Merchant Flow**
   - Buy item -> Sell item -> Buyback item

5. **Consumable Flow**
   - Find consumable -> Stack -> Use in combat -> Verify effect

---

## Implementation Notes

### Dread Display Corruption

Item stats are corrupted for display based on Dread level:

```typescript
function corruptStatDisplay(
  actualValue: number,
  currentDread: number,
  rng: SeededRNG
): string {
  if (currentDread < 50) {
    return String(actualValue);
  }

  if (currentDread < 70) {
    // Uneasy: Show as range (+/- 20%)
    const variance = Math.floor(actualValue * 0.2);
    return `${actualValue - variance}-${actualValue + variance}`;
  }

  if (currentDread < 85) {
    // Shaken: 15% chance of wrong value (+/- 30%)
    if (rng.chance(0.15)) {
      const variance = Math.floor(actualValue * 0.3);
      const corrupted = actualValue + rng.randomInt(-variance, variance);
      return String(corrupted);
    }
    return String(actualValue);
  }

  // Terrified: 25% chance of "???"
  if (rng.chance(0.25)) {
    return '???';
  }
  return String(actualValue);
}
```

**Critical Rule:** Only DISPLAY is corrupted. Underlying values are unchanged.

### Effect Stacking

Same effect types from multiple sources stack additively:

```typescript
function calculateTotalCritChance(equipment: EquipmentState): number {
  let total = BASE_CRIT_CHANCE; // 5%

  for (const slot of EQUIPMENT_SLOTS) {
    const item = equipment[slot];
    if (!item) continue;

    const template = registry.getItemTemplate(item.templateId);
    for (const effect of template.effects) {
      if (effect.type === 'crit_chance') {
        total += effect.magnitude;
      }
    }
  }

  return Math.min(total, CRIT_CHANCE_CAP); // 65% cap
}
```

### Item Source Tracking

Source is set at creation and immutable:

```typescript
function createItem(templateId: string, source: ItemSource): ItemInstance {
  return Object.freeze({
    id: generateEntityId(),
    templateId,
    identified: false,
    source,
    acquiredAt: getCurrentTimestamp(),
  });
}
```

### Weapon Slot Protection

Weapon slot can never be empty:

```typescript
function unequipWeapon(
  equipment: EquipmentState,
  inventory: InventoryState,
  replacementId: EntityId
): Result<UnequipResult, GameError> {
  const replacement = findItem(inventory, replacementId);
  if (!replacement) {
    return err({ code: 'ITEM_NOT_FOUND', message: 'Replacement weapon not found' });
  }

  const template = registry.getItemTemplate(replacement.templateId);
  if (template.slot !== 'weapon') {
    return err({ code: 'INVALID_STATE', message: 'Replacement must be a weapon' });
  }

  // Swap atomically
  return swapEquipment(equipment, inventory, replacementId);
}
```

---

## Public Exports

```typescript
// src/core/items/index.ts

export type {
  // Item types
  ItemInstance,
  ItemSource,
  ResolvedItem,
  ItemRiskStatus,

  // Service interfaces
  ItemService,
  InventoryService,
  StashService,
  LootGenerationService,
  MerchantService,

  // Result types
  StartingEquipment,
  ItemDescription,
  DisplayedStats,
  DisplayedEffect,
  IdentificationResult,
  EquippedEffects,
  OnHitEffect,
  OnHitTakenEffect,
  CurseEffect,
  OnHitResult,
  OnHitTakenResult,
  ActiveEffectContext,
  ActiveEffectResult,
  EquipmentStatBonus,
  EquipResult,
  UnequipResult,
  SwapResult,
  UseConsumableResult,
  ConsumableStackInfo,
  PreparedBringResult,
  DeathRecoveryResult,
  LostItemInfo,
  PreservedItemInfo,
  LootGenerationParams,
  LootSource,
  LootTableParams,
  GeneratedLoot,
  FloorRarityTable,
  MerchantStockParams,
  MerchantStock,
  MerchantItem,
  PurchaseResult,
  SellResult,
  BuybackItem,
  BuybackResult,
};

export {
  // Factory functions
  createItemService,
  createInventoryService,
  createStashService,
  createLootGenerationService,
  createMerchantService,

  // Constants
  FLOOR_RARITY_TABLES,

  // Utilities
  calculateDreadQualityBonus,
};
```
