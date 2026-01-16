# Architecture Review - DARKDELVE (docs/architecture)

## Issues, References, and Potential Fixes

### 1) Combat state shape mismatch (high risk)
- **Issue**: `CombatState` differs between state management and combat system (phase enum, fields like `isAmbush`, `turnOrder`, derived combat stats). This makes reducers/serialization/presentation ambiguous and breaks integration.
- **References**:
  - `docs/architecture/03-state-management.md:544`
  - `docs/architecture/08-combat-system.md:114`
  - `docs/architecture/08-combat-system.md:146`
- **Potential fix**:
  - Choose a single canonical `CombatState` definition (preferably in state management), and have combat system import/extend it rather than redefining. If combat system needs extra transient fields, add them to `CombatState` or define a separate `CombatRuntimeState` that is explicitly not persisted.

### 2) Item runtime metadata missing from inventory/stash state (high risk)
- **Issue**: Inventory/stash state lacks `source` and `acquiredAt`, but item/extraction systems require full `ItemInstance` data (e.g., `source` for death economy). This blocks correct loss/preservation logic.
- **References**:
  - `docs/architecture/07-item-system.md:42`
  - `docs/architecture/03-state-management.md:189`
  - `docs/architecture/03-state-management.md:499`
- **Potential fix**:
  - Store full `ItemInstance` in `InventoryState` and `StashState`, or add a centralized `ItemInstance` registry in state management keyed by `EntityId` and store only IDs in inventory/stash.

### 3) Profile creation lacks class selection path (high risk)
- **Issue**: Command system requires `classId` for profile creation, and state utilities require a class to create character state, but save/profile creation APIs don’t accept class input. This makes initial character creation undefined.
- **References**:
  - `docs/architecture/05-command-system.md:495`
  - `docs/architecture/03-state-management.md:852`
  - `docs/architecture/13-save-system.md:56`
- **Potential fix**:
  - Extend `ProfileManager.createProfile` (and its file format) to accept `classId`, or move profile creation entirely into command/state layer where class selection is already specified.

### 4) ~~Dungeon room instance mismatch~~ ✅ RESOLVED
- **Resolution**: Added `floor` and `layoutIndex` to canonical `RoomInstanceState` in state management. Dungeon system now references the canonical definition instead of redefining it.
- **Changes made**:
  - `docs/architecture/03-state-management.md`: Added `floor: FloorNumber` and `layoutIndex: number` to `RoomInstanceState`
  - `docs/architecture/10-dungeon-system.md`: Removed duplicate definition, added reference to canonical type

### 5) ~~Dread equipment modifiers have no state input path~~ ✅ RESOLVED
- **Resolution**: Removed equipment-based Dread modifiers from MVP scope. The feature was over-engineered for minimal gameplay value. Core Dread management (torch, consumables, rest, shrines, extraction) is sufficient.
- **Changes made**:
  - `docs/architecture/09-dread-system.md`: Removed `CharacterService` dependency, simplified factory function, removed `equipmentDreadReduction` from internal state
  - Added "Future Enhancements" section documenting how to add equipment modifiers later if needed

### 6) ~~CLI integration inconsistencies~~ ✅ RESOLVED
- **Resolution**: Fixed naming inconsistency (`dungeon_exploration` → `dungeon_exploring`) and API mismatch (`subscribe('*')` → `subscribeAll()`).
- **Changes made**:
  - `docs/architecture/15-cli-presentation.md`: Changed `dungeon_exploration` to `dungeon_exploring` in ScreenType
  - `docs/architecture/15-cli-presentation.md`: Changed `subscribe('*', ...)` to `subscribeAll(...)` in main loop example

### 7) ~~Circular dependency between state-management and item-system~~ ✅ RESOLVED
- **Issue**: `03-state-management` declared dependency on `07-item-system` for `ItemInstance`, while `07-item-system` APIs use `InventoryState`, `EquipmentState`, `StashState` from `03-state-management`. This circular dependency broke module ordering and made the dependency graph ambiguous.
- **References**:
  - `docs/architecture/03-state-management.md:19` (original dependency declaration)
  - `docs/architecture/07-item-system.md:392` (InventoryService using InventoryState)
- **Resolution**: State Management owns all state shapes. `ItemInstance` and `ItemSource` are now canonical types defined in `03-state-management`. Item System imports these types from State Management, creating a clean one-way dependency: `01 → 03 → 07`.
- **Changes made**:
  - `docs/architecture/03-state-management.md`: Removed dependency on `07-item-system`, added canonical `ItemInstance` definition with full documentation, added `ItemInstance` to public exports
  - `docs/architecture/07-item-system.md`: Added `03-state-management` to dependencies, replaced `ItemInstance`/`ItemSource` definitions with import reference, updated public exports to re-export from state module

### 8) ~~"Brought" items tracking references wrong state and field name~~ ✅ RESOLVED
- **Issue**: Documentation comments referenced non-existent `CharacterState.broughtItemIds`, but the actual canonical field is `SessionState.broughtItems`. This naming/location mismatch would mislead death-economy implementation.
- **References**:
  - `docs/architecture/03-state-management.md:184` (incorrect reference in ItemSource comment)
  - `docs/architecture/07-item-system.md:66,71` (incorrect reference in ItemRiskStatus comment)
  - `docs/architecture/03-state-management.md:345` (actual canonical field)
- **Resolution**: "Brought" items are run-scoped, so `SessionState.broughtItems` is the correct canonical location. Updated all documentation comments to reference the correct state object and field name.
- **Changes made**:
  - `docs/architecture/03-state-management.md:184`: Changed `broughtItemIds in CharacterState` → `broughtItems in SessionState`
  - `docs/architecture/07-item-system.md:66`: Changed `broughtItemIds.includes(id)` → `SessionState.broughtItems.includes(id)`
  - `docs/architecture/07-item-system.md:71`: Changed `CharacterState.broughtItemIds` → `SessionState.broughtItems`

### 9) ~~createInitialState parameter mismatch in camp tests~~ ✅ RESOLVED
- **Issue**: `createInitialState` in state-management requires 4 parameters (profileName, playerType, classId, registry), but camp system property tests called it with no arguments.
- **References**:
  - `docs/architecture/03-state-management.md:935` (canonical signature with required params)
  - `docs/architecture/12-camp-system.md:1105` (tests calling with no params)
- **Resolution**: Added test fixture factory `createTestState()` in camp system property tests that wraps `createInitialState` with sensible defaults. This follows standard testing practice—production API remains strict while tests have convenient fixtures.
- **Changes made**:
  - `docs/architecture/12-camp-system.md`: Added `createTestState()` fixture factory before property tests, updated all 4 property test calls to use `createTestState()` instead of `createInitialState()`

### 10) ~~CombatPhase deprecated but Agent Mode still exposes it~~ ✅ RESOLVED
- **Issue**: `CombatPhase` is deprecated in foundation (use `TurnPhase` from state-management), but Agent Mode's `AgentCombatState.phase` still used the deprecated type. This creates API inconsistency between internal state (TurnPhase with 7 granular values) and agent-facing API (CombatPhase with 3 coarse values).
- **References**:
  - `docs/architecture/01-foundation.md:63` (@deprecated annotation)
  - `docs/architecture/16-agent-mode.md:440` (AgentCombatState.phase using CombatPhase)
- **Resolution**: Updated `AgentCombatState.phase` to use `TurnPhase` instead of deprecated `CombatPhase`. This aligns with Agent Mode's design principle ("Same game core, different output format") and the existing dependency on 03-state-management. The granular phases give AI agents precise combat state information, while the existing `player_acted: boolean` field provides simplified "can I act?" semantics.
- **Changes made**:
  - `docs/architecture/16-agent-mode.md`: Changed `phase: CombatPhase` to `phase: TurnPhase` with documentation reference

### 11) ~~ProfileManager API uses ambiguous profileName parameter~~ ✅ RESOLVED
- **Issue**: `ProfileManager.createProfile` takes `ProfileState`, but other methods use `profileName: string`. `ProfileState` had both `id` and `name` fields, with no documented mapping to filesystem directories. This made it unclear what `profileName` parameters referred to and how directory naming/validation worked.
- **References**:
  - `docs/architecture/13-save-system.md:48` (createProfile takes ProfileState)
  - `docs/architecture/13-save-system.md:63` (loadProfile uses profileName)
  - `docs/architecture/03-state-management.md:87` (ProfileState with id and name)
- **Resolution**: Adopted **Single Identifier Model**: profile `name` is both the display name AND the filesystem directory name. Removed separate `id` field from `ProfileState`. All `profileName` parameters refer to `ProfileState.name`. Validation against `profileNameRules` happens in `ProfileManager.createProfile()`.
- **Trade-off**: Display names limited to filesystem-safe characters (alphanumeric, dash, underscore), but this eliminates mapping complexity and an entire class of sync/lookup bugs.
- **Changes made**:
  - `docs/architecture/03-state-management.md`: Removed `id` field from `ProfileState`, added documentation explaining single identifier model, updated `createProfileState` to document validation responsibility
  - `docs/architecture/13-save-system.md`: Added identifier convention documentation to `ProfileManager` interface, clarified all method parameters refer to `ProfileState.name`, documented validation behavior in `createProfile`

### 12) ~~Missing ContentRegistry dependency in state-management~~ ✅ RESOLVED
- **Issue**: `03-state-management` uses `ContentRegistry` in state factory functions (`createProfileState`, `createInitialState`, `createCharacterState`) but doesn't list `02-content-registry` as a dependency. This breaks the dependency graph and makes the module contract unclear.
- **References**:
  - `docs/architecture/03-state-management.md:19` (dependencies section)
  - `docs/architecture/03-state-management.md:941` (ContentRegistry parameter in createProfileState)
  - `docs/architecture/02-content-registry.md:34` (ContentRegistry definition)
- **Resolution**: Added `02-content-registry` to the dependencies list, documenting its use for class definitions in state factory functions.
- **Changes made**:
  - `docs/architecture/03-state-management.md`: Added `02-content-registry: ContentRegistry` to Dependencies section
