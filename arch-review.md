# Architecture Review: docs/architecture

## Problem statement
Review the architecture docs for module integration risks (dependency alignment, shared types, event contracts, and state ownership) to ensure the system can be implemented without hidden coupling or mismatched interfaces.

## Findings

### 1) ~~Dread state ownership is unclear and likely inconsistent~~ ✅ RESOLVED
- **Resolution:** Eliminated `DreadManager` entirely. The Dread system now provides only pure utility functions for calculations (thresholds, corruption, Watcher checks). All Dread-related state lives in `StateStore`:
  - `SessionPlayerState.currentDread` - the core Dread value
  - `SessionState.torchActive` / `torchActivatedFloor` - torch state (added)
  - `DungeonState.watcherActive` / `watcherCombat` - Watcher state
- State mutations happen via `StateAction` dispatches from command handlers
- Added `TORCH_ACTIVATED` and `TORCH_DEACTIVATED` actions to state management
- **Changes made:**
  - `docs/architecture/09-dread-system.md` - rewrote to remove stateful service, now pure functions only
  - `docs/architecture/03-state-management.md` - added `torchActive`, `torchActivatedFloor` to SessionState, added torch actions

### 2) ~~Lesson Learned state updates reference a non-existent field~~ ✅ RESOLVED
- **Resolution:** Aligned extraction system to state management's canonical state structure:
  - Removed fictional `PersistentPlayerState` type from extraction system
  - Changed `state.persistentPlayer` → `state.profile` in implementation example
  - Added comments referencing the correct `LESSON_LEARNED_DECREMENTED` and `LESSON_LEARNED_CLEARED` actions from state management
- **Changes made:**
  - `docs/architecture/11-extraction-system.md` - fixed state path and type references

### 3) ~~Combat item usage is mismatched with consumable model~~ ✅ RESOLVED
- **Resolution:** Aligned combat item usage to the slot-based consumable model:
  - Changed `CombatUseItemCommand.itemId: EntityId` → `slotIndex: number`
  - Changed `CombatAction.use_item.itemId: EntityId` → `slotIndex: number`
  - Now consistent with non-combat `USE_CONSUMABLE` command and `InventoryService.useConsumable`
- **Rationale:** Consumables are designed as fungible stacks (3 slots, max 5 per stack), not unique instances. Slot-based targeting matches the storage model.
- **Changes made:**
  - `docs/architecture/05-command-system.md` - updated `CombatUseItemCommand`
  - `docs/architecture/03-state-management.md` - updated `CombatAction` union

### 4) ~~Save triggers rely on events not in the event union~~ ✅ RESOLVED
- **Resolution:** Added missing events to `GameEvent` union in the event system:
  - `STASH_ITEM_ADDED` - emitted when item deposited to stash (triggers `stash_deposit` save)
  - `STASH_ITEM_REMOVED` - emitted when item withdrawn from stash (triggers `stash_withdrawal` save)
  - `PROFILE_CREATED` - emitted by save system when profile created
  - `PROFILE_DELETED` - emitted by save system when profile deleted
  - `SAVE_RECOVERY_ATTEMPTED` - emitted by save system during recovery
- **Rationale:** Maintains consistency with existing pub/sub pattern. All other save triggers use events. Events also enable analytics tracking and potential future subscribers.
- **Changes made:**
  - `docs/architecture/04-event-system.md` - added 5 event interfaces, updated GameEvent union, updated exports

### 5) ~~Combat action result is defined twice with different shapes~~ ✅ RESOLVED
- **Resolution:** Renamed state management's type to `CombatActionEffects` (the effects/consequences of an action) while combat system keeps `CombatActionResult` (the full engine response). These serve different purposes:
  - `CombatActionEffects` (state management): Canonical type for action effects data, used in `COMBAT_ACTION_EXECUTED` payload
  - `CombatActionResult` (combat system): Engine method response containing success/failure, state, events, and effects
- **Relationship:** `CombatActionResult.effects` field is of type `CombatActionEffects` (imported from state management)
- **Changes made:**
  - `docs/architecture/03-state-management.md` - renamed `CombatActionResult` → `CombatActionEffects`, updated action payload, updated exports
  - `docs/architecture/08-combat-system.md` - added `effects: CombatActionEffects` field to `CombatActionResult`, updated dependencies

### 6) ~~Stash capacity is defined in two configs~~ ✅ RESOLVED
- **Resolution:** Consolidated stash capacity to single source of truth in `game.json`. Removed all stash capacity definitions from save system:
  - Removed `stash.defaultCapacity` and `stash.maxCapacity` from `configs/save.json`
  - Removed `getCapacity()` method from `StashManager` interface
  - Removed `capacity` field from `StashFile` interface
- **Rationale:** Stash capacity is a game rule (like inventory capacity), not persistence configuration. The save system's job is to persist items, not define capacity limits. Capacity checks belong in `StashService` (item system) using `ContentRegistry.getGameConfig().stashCapacity`.
- **Decision:** No upgradable stash feature planned; capacity is fixed at 12 slots per `game.json`.
- **Changes made:**
  - `docs/architecture/13-save-system.md` - removed stash config, `getCapacity()`, and `StashFile.capacity`

### 7) ~~Default profile name conflicts with reserved names~~ ✅ RESOLVED
- **Resolution:** Changed `defaultProfileName` from `"default"` to `"adventurer"`:
  - Maintains strict reserved name validation (reserved names protect against system directory confusion)
  - Thematic name fits dark fantasy setting better than generic "default"
  - Updated file system layout example to reflect new default profile name
- **Changes made:**
  - `docs/architecture/13-save-system.md` - updated config, file system layout, and default profile creation example

### 8) ~~Save config is not accessible via ContentRegistry~~ ✅ RESOLVED
- **Resolution:** Eliminated `configs/save.json` entirely. Save system settings (file names, suffixes, algorithms, backup counts) are implementation constants, not game design parameters. They don't belong in externalized config.
  - Save system now uses internal constants for infrastructure details
  - `defaultProfileName` (the only player-facing value) moved to `GameConfig` in ContentRegistry
  - Added `ContentRegistry` to save system dependencies for accessing `GameConfig.defaultProfileName`
- **Changes made:**
  - `docs/architecture/02-content-registry.md` - added `defaultProfileName` to `GameConfig`
  - `docs/architecture/13-save-system.md` - replaced config file section with internal constants table, updated dependencies, updated default profile creation flow

### 9) ~~Extraction depends on a `DungeonSystem` facade that isn't defined~~ ✅ RESOLVED
- **Resolution:** The `DungeonSystem` facade already exists (10-dungeon-system.md lines 605-619). The actual issues were:
  1. **Data model mismatch:** `NextRoomContents.chestRarity` doesn't match dungeon's `TreasureRoomContents.chestType`
  2. **False dependency:** `dungeonSystem` in factory was unnecessary - `TauntParams` already expects caller to provide room data

- **Decision: Align the data model and clarify call flow**
  - Changed `NextRoomContents.chestRarity: Rarity | null` → `chestType: 'standard' | 'locked' | 'ornate' | null`
  - Removed `dungeonSystem` from `createExtractionService()` factory - it was never needed
  - Updated taunt message templates to use chest type language ("An ornate chest sits unopened..." instead of "Epic rarity detected")
  - Command handler (which orchestrates) queries dungeon + ContentRegistry to build `NextRoomContents`, then passes to extraction

- **Rationale:**
  - "Ornate chest" is more thematic for dark fantasy than mechanical "Epic rarity"
  - Rarity isn't actually known until chest opens (loot table roll) - chest TYPE is what dungeon knows
  - Extraction doesn't need direct dungeon access; the orchestrating layer provides the data

- **Alternative considered but rejected: Move taunt to presentation layer**
  - Would remove taunt from extraction entirely
  - Rejected because taunt is already well-designed as part of extraction flow
  - Data model fix is surgical and preserves existing design intent

- **Alternative considered but rejected: Add taunt query to DungeonSystem**
  - Would add `getNextRoomForTaunt(roomId): TauntRoomInfo | null` to facade
  - Rejected because it couples dungeon to extraction-specific concept

- **Changes made:**
  - `docs/architecture/11-extraction-system.md`:
    - Changed `NextRoomContents.chestRarity` → `chestType: 'standard' | 'locked' | 'ornate' | null`
    - Removed `dungeonSystem` from factory dependencies
    - Removed `10-dungeon-system` from Dependencies section
    - Updated taunt generation example to use chest type
    - Updated taunt edge case table

### 10) ~~Presentation layer uses RNG in Dread corruption~~ ✅ RESOLVED
- **Resolution:** Introduced `PresentationRNG` - a derived RNG for visual effects that never touches gameplay RNG:
  - Added `PresentationRNG` interface to CLI presentation layer
  - Added `createPresentationRNG(sessionSeed, currentDread, currentRoomId, frameCounter)` factory
  - Changed `RenderContext.rng` from `SeededRNG` to `presentationRng: PresentationRNG`
  - Updated all screen renderers and `DreadEffects` to use `PresentationRNG`
- **Rationale:** Derived RNG ensures:
  - Rendering never affects gameplay determinism (same seed + inputs = same outcomes)
  - Visual effects are reproducible for a given game state (useful for debugging)
  - Complete separation between gameplay RNG sequence and presentation randomness
- **Changes made:**
  - `docs/architecture/15-cli-presentation.md` - added `PresentationRNG` type and factory, updated all renderer interfaces
  - `docs/architecture/09-dread-system.md` - added documentation clarifying that corruption functions must receive `PresentationRNG` when called from rendering code

### 11) ~~Dependency matrix is inconsistent with module contracts~~ ✅ RESOLVED
- **Resolution:** Fixed the two documented discrepancies in the dependency matrix:
  - `05-Command System`: Changed `01, 03, 04` → `01, 02, 03, 04` (added 02 - ContentRegistry is required by `createCommandProcessor` factory)
  - `07-Item`: Changed `01, 02, 06` → `01, 02, 03` (replaced 06 with 03 - module spec explicitly lists 03-state-management for ItemInstance, InventoryState, etc.)
- **Note:** A full audit of all 16 modules against the matrix is deferred. These were surgical fixes for the documented issues only.
- **Changes made:**
  - `docs/architecture/00-overview.md` - updated Module Dependencies Matrix

### 12) ~~DreadManager still referenced after removal~~ ✅ RESOLVED
- **Resolution:** Removed all stale `DreadManager` references from CLI Presentation, Agent Mode, and Extraction System. These modules now use pure functions from the Dread system:
  - `15-cli-presentation.md`: Changed dependency to "Corruption pure functions", removed `dreadManager: DreadManager` from `RenderContext`, added `dreadConfig: DreadConfig` for corruption calls
  - `16-agent-mode.md`: Changed dependency to "Corruption pure functions for JSON value corruption", removed `dreadManager` parameter from `createAgentModeAdapter()` factory
  - `11-extraction-system.md`: Removed `dreadManager` parameter from `createExtractionService()` factory
- **Rationale:** Finding #1 eliminated `DreadManager` entirely. The Dread system now provides only pure utility functions. Presentation layers call these functions directly, passing `state.player.currentDread`, `DreadConfig`, and `PresentationRNG` as needed.
- **Changes made:**
  - `docs/architecture/15-cli-presentation.md` - updated dependencies and RenderContext interface
  - `docs/architecture/16-agent-mode.md` - updated dependencies and factory signature
  - `docs/architecture/11-extraction-system.md` - updated factory signature

### 13) ~~Dread corruption functions typed with SeededRNG incompatible with PresentationRNG~~ ✅ RESOLVED
- **Problem:** `PresentationRNG` was defined as a separate interface from `SeededRNG` with incompatible signatures (`randomInt(max)` vs `randomInt(min, max)`). This meant rendering code couldn't call Dread corruption functions.
- **Resolution:** Eliminated `PresentationRNG` as a separate type. The presentation layer now uses `SeededRNG` directly:
  - Removed `PresentationRNG` interface from CLI presentation
  - Changed `RenderContext.presentationRng` to type `SeededRNG`
  - `createPresentationRNG()` factory now returns `SeededRNG` (created with derived seed)
  - Updated Dread system notes to reference `createPresentationRNG` instead of `PresentationRNG` type
- **Rationale:** The goal was **instance isolation** (rendering shouldn't consume gameplay RNG), not **type differentiation**. A `SeededRNG` created with a derived seed achieves the same isolation without introducing a new type. Simpler is better.
- **Changes made:**
  - `docs/architecture/15-cli-presentation.md` - removed `PresentationRNG` interface, changed to `SeededRNG`, added to foundation dependencies
  - `docs/architecture/09-dread-system.md` - updated NOTE comments to reference `createPresentationRNG` factory

### 14) ~~ExtractionTauntEvent uses rarity instead of chestType~~ ✅ RESOLVED
- **Problem:** Finding #9 changed extraction system to use `chestType` instead of `rarity` (because rarity isn't known until chest opens), but the canonical `ExtractionTauntEvent` definition in the event system still used `rarity?: Rarity`.
- **Resolution:** Aligned event system's `ExtractionTauntEvent` to match extraction system:
  - Changed `rarity?: Rarity` → `chestType?: 'standard' | 'locked' | 'ornate'`
- **Changes made:**
  - `docs/architecture/04-event-system.md` - updated `ExtractionTauntEvent` interface

### 15) ~~profileNameRules config removed but still referenced~~ ✅ RESOLVED
- **Problem:** Finding #8 eliminated `configs/save.json`, but `profileNameRules` was referenced in multiple places as the validation source for profile names. No owner was defined for these rules.
- **Resolution:** Profile name validation rules are implementation/security constraints (not game design), so they belong as internal constants in the save system:
  - Added `PROFILE_NAME_MIN_LENGTH` (1), `PROFILE_NAME_MAX_LENGTH` (32), `PROFILE_NAME_PATTERN` (`/^[a-zA-Z0-9_-]+$/`), and `RESERVED_PROFILE_NAMES` (`["default", "system", "temp", "backup"]`) to internal constants table
  - Updated all references from "profileNameRules config" to "profile name validation constants" or "internal constants"
- **Changes made:**
  - `docs/architecture/13-save-system.md` - added validation constants to Configuration section, updated ProfileManager doc comments
  - `docs/architecture/03-state-management.md` - updated ProfileState and createProfileState doc comments

### 16) ~~Dependency matrix lists stale dependencies for Dread system~~ ✅ RESOLVED
- **Problem:** Finding #1 converted Dread to pure functions (depending only on 01-foundation and 02-content-registry), but the dependency matrix still showed `01, 02, 04, 06` (Event System and Character).
- **Resolution:** Updated dependency matrix to match actual module dependencies:
  - Changed `09-Dread | 01, 02, 04, 06` → `09-Dread | 01, 02`
- **Changes made:**
  - `docs/architecture/00-overview.md` - updated Module Dependencies Matrix

