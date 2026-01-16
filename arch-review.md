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

### 4) Dungeon room instance mismatch (medium risk)
- **Issue**: `RoomInstanceState` in dungeon system includes `floor` and `layoutIndex`, but the canonical state tree omits them. This prevents consistent persistence and map rendering logic.
- **References**:
  - `docs/architecture/10-dungeon-system.md:379`
  - `docs/architecture/03-state-management.md:396`
- **Potential fix**:
  - Add `floor` and `layoutIndex` to the `RoomInstanceState` in state management, or define a separate `RoomRuntimeState` with explicit persistence rules.

### 5) Dread equipment modifiers have no state input path (medium risk)
- **Issue**: DreadManager applies equipment modifiers but has no way to receive current character/equipment state. `CharacterService` requires `CharacterState` input, but DreadManager only holds the service reference.
- **References**:
  - `docs/architecture/09-dread-system.md:13`
  - `docs/architecture/09-dread-system.md:55`
  - `docs/architecture/09-dread-system.md:423`
  - `docs/architecture/06-character-system.md:57`
- **Potential fix**:
  - Add `setCharacterState` or `updateEquipment` method on DreadManager, or pass `CharacterState` into Dread APIs that need modifiers (e.g., `applyDreadChange` accepting a `character` or `derivedStats` parameter).

### 6) CLI integration inconsistencies (medium risk)
- **Issue**: CLI uses `dungeon_exploration` while state uses `dungeon_exploring`, and CLI subscribes with `'*'` while EventBus exposes `subscribeAll`. This causes phase/screen mapping confusion and event subscription mismatch.
- **References**:
  - `docs/architecture/15-cli-presentation.md:152`
  - `docs/architecture/03-state-management.md:50`
  - `docs/architecture/15-cli-presentation.md:1374`
  - `docs/architecture/04-event-system.md:32`
- **Potential fix**:
  - Align `ScreenType` with `GamePhase` names or define an explicit mapping table in CLI. Replace `subscribe('*')` with `subscribeAll` in CLI examples and APIs.
