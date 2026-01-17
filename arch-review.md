# Architecture Review

## Problem Statement
Review the architecture docs for module cohesion and cross-module references. Identify integration issues that would block or risk implementation, and propose targeted fixes to keep modules compatible without changing game design.

## Relevant Files
- docs/architecture/00-overview.md
- docs/architecture/01-foundation.md
- docs/architecture/02-content-registry.md
- docs/architecture/03-state-management.md
- docs/architecture/04-event-system.md
- docs/architecture/05-command-system.md
- docs/architecture/06-character-system.md
- docs/architecture/07-item-system.md
- docs/architecture/08-combat-system.md
- docs/architecture/09-dread-system.md
- docs/architecture/10-dungeon-system.md
- docs/architecture/11-extraction-system.md
- docs/architecture/12-camp-system.md
- docs/architecture/13-save-system.md
- docs/architecture/14-analytics.md
- docs/architecture/15-cli-presentation.md
- docs/architecture/16-agent-mode.md

## Findings and Potential Fixes

### 1) ~~Circular dependency between Character and Item systems~~ (RESOLVED)
- Issue: Character depends on Item (ItemInstance), and Item depends on Character (equip rules).
- Impact: Violates dependency order; requires both modules to exist before either is complete.
- Relevant files:
  - docs/architecture/06-character-system.md
  - docs/architecture/07-item-system.md
- **Resolution:** Simplified game design by removing curse immunity passive from Hollowed One. Replaced with "Abyssal Resilience" (-20% Dread gain). Cursed items now bind all classes equally. Character imports ItemInstance from State Management (03) where it's canonically defined. Item System no longer depends on Character System.

### 2) ~~Dungeon state vs dungeon system mismatch~~ (RESOLVED)
- Issue: Dungeon module defines fields not present in canonical state types (e.g., `isElite`, `leadsToNextFloor`, `warningText`) and uses `Direction` with `up/down` while state only has `north/south/east/west`.
- Impact: State cannot represent dungeon outputs; serialization/invariants break.
- Relevant files:
  - docs/architecture/02-content-registry.md
  - docs/architecture/03-state-management.md
  - docs/architecture/10-dungeon-system.md
- **Resolution:** Applied hybrid approach - runtime state fields added to canonical types, derivable/content fields removed from dungeon types:
  - Added `isElite` to `CombatRoomContents` in State Management (runtime state affecting combat)
  - Added `exitUnlocked` to `BossRoomContents` in State Management (runtime state for extraction)
  - Added `thresholdWarning` to `DungeonTemplate` in Content Registry (content data)
  - Removed `leadsToNextFloor` from Dungeon System (derived from `currentFloor < 5`)
  - Removed `warningText` from Dungeon System (load from `DungeonTemplate.thresholdWarning`)
  - Aligned `Direction` to 4 cardinal values (floor transitions use `descendFloor()` API, not room connections)

### 3) ~~Combat types diverge across modules~~ (RESOLVED)
- Issue: 08-combat redefines `CombatPlayerState` while claiming it imports it, and `DamageBreakdown` fields differ from state/event definitions.
- Impact: Type drift and incompatible payloads between combat, state, and event logs.
- Relevant files:
  - docs/architecture/03-state-management.md
  - docs/architecture/08-combat-system.md
- **Resolution:** Distinguished input types from state types:
  - Renamed `CombatPlayerState` in 08-combat to `CombatEngineParams` (it's engine initialization input, not stored state). Added clarifying comment.
  - Added `slowEnemyBonus` and `blockReduction` to canonical `DamageBreakdown` in 03-state (they belong in combat logs for UI display).
  - Removed duplicate `DamageBreakdown`, `CombatLogEntry`, `CombatLogDetails` definitions from 08-combat; these are now imported from 03-state.
  - Updated public exports to reflect correct type ownership.

### 4) ~~`MOVE_BACK` command lacks target~~ (RESOLVED)
- Issue: Command has no `roomId`, but navigation requires a target room to backtrack.
- Impact: Command cannot be executed deterministically without extra state.
- Relevant files:
  - docs/architecture/05-command-system.md
  - docs/architecture/10-dungeon-system.md
- **Resolution:** Added `roomId: string` to `MoveBackCommand` interface. This matches the existing `backtrackToRoom(targetRoomId)` API and preserves backtracking as a tactical choice (jump to any cleared room for 1-turn cost). CLI will present cleared rooms as numbered options.

### 5) ~~Extraction depends on undefined `DungeonService`~~ (RESOLVED)
- Issue: Extraction factory requires `DungeonService` but dungeon module only defines generator/navigation managers.
- Impact: Undefined API boundary; extraction can't query the "next room" reliably.
- Relevant files:
  - docs/architecture/10-dungeon-system.md
  - docs/architecture/11-extraction-system.md
- **Resolution:** Replaced `dungeonService: DungeonService` with `dungeonSystem: DungeonSystem` in the factory function. The existing `DungeonSystem` facade already provides `navigation.getNavigationOptions()` and `roomState.getRoomById()` which is everything Extraction needs for Taunt generation. No new interface required.

### 6) ~~Death economy duplicated across Item and Extraction~~ (RESOLVED)
- Issue: Both ItemSystem and Extraction define overlapping death outcomes with different reason enums.
- Impact: Risk of double-processing or inconsistent results.
- Relevant files:
  - docs/architecture/07-item-system.md
  - docs/architecture/11-extraction-system.md
- **Resolution:** Simplified death economy to "full loss on death" - all items in dungeon are lost, only stash is safe. This eliminates the complex survival rules (equipped+identified, brought from stash, etc.) that caused the duplication. Benefits:
  - Strengthens extraction dilemma (every item at risk creates visceral tension)
  - Eliminates overlapping type definitions (no reason enums needed)
  - Simple two-state risk system: `safe` (in stash) vs `at_risk` (in dungeon)
  - Death processing becomes trivial: collect all items → mark as lost
  - Game design precedent: Spelunky, FTL, Into the Breach all use full loss successfully

### 7) ~~Veteran Knowledge updates can double-apply~~ (RESOLVED)
- Issue: KnowledgeService subscribes to combat events, while Extraction's death result also includes VeteranKnowledge updates.
- Impact: On death, knowledge could be applied twice.
- Relevant files:
  - docs/architecture/06-character-system.md
  - docs/architecture/11-extraction-system.md
- **Resolution:** Established KnowledgeService as the SINGLE OWNER of all VeteranKnowledge state mutations:
  - Removed `veteranKnowledgeUpdates` field from `DeathResult` interface in 11-extraction-system
  - Removed `VeteranKnowledgeUpdate` type definition from 11-extraction-system (owned by KnowledgeService)
  - Updated `processPlayerDeath` implementation to not call knowledge updates
  - Added explicit "SINGLE OWNER" documentation to KnowledgeService interface
  - All knowledge updates now flow exclusively through KnowledgeService event subscriptions (COMBAT_STARTED, ENEMY_KILLED, PLAYER_KILLED)

### 8) ~~Item risk status API missing context + Agent mode mismatch~~ (RESOLVED)
- Issue: `getRiskStatus` cannot mark `at_risk` without brought-item context. Agent mode labels brought items as `doomed` instead of `at_risk`.
- Impact: UI/agent outputs can't reflect death economy correctly.
- Relevant files:
  - docs/architecture/07-item-system.md
  - docs/architecture/16-agent-mode.md
- **Resolution:** Simplified `ItemRiskStatus` to two states as part of "full loss on death" design change:
  - `safe`: Item is in stash (at camp)
  - `at_risk`: Item is in dungeon (equipped, carried, or brought - all treated equally)
  - No need for `broughtFromStash` context since all items in dungeon are lost on death
  - Agent mode can simply use: stash items = `safe`, dungeon items = `at_risk`

### 9) ~~CLI dependencies reference non-existent types~~ (RESOLVED)
- Issue: CLI lists `DerivedState` under Character and `ProfileInfo` under Save, but canonical types are elsewhere.
- Impact: Minor confusion; not blocking but causes implementation churn.
- Relevant files:
  - docs/architecture/15-cli-presentation.md
  - docs/architecture/03-state-management.md
  - docs/architecture/13-save-system.md
- **Resolution:** Updated CLI dependencies section:
  - Changed `DerivedState` import from `06-character-system` to `03-state-management` (where it's canonically defined)
  - Changed `ProfileInfo` to `ProfileMetadata` to match the actual type name in `13-save-system`

### 10) ~~Dependency matrix and naming drift~~ (RESOLVED)
- Issue: Overview dependency matrix lists State depends only on Foundation, but state doc includes Content Registry. Commands use `profileId` while Save system uses `profileName`.
- Impact: Minor spec inconsistency.
- Relevant files:
  - docs/architecture/00-overview.md
  - docs/architecture/03-state-management.md
  - docs/architecture/05-command-system.md
  - docs/architecture/13-save-system.md
- **Resolution:** Applied two fixes:
  - Updated dependency matrix in 00-overview.md: State Management (03) now correctly shows dependencies `01, 02` (was `01`)
  - Renamed `profileId` to `profileName` in 05-command-system.md for `LoadGameCommand` and `DeleteProfileCommand` to match Save System convention and the documented identifier model where `ProfileState.name` serves as both display name and filesystem directory name

### 11) ~~MOVE_BACK command lacks target in CLI/Agent docs~~ (RESOLVED)
- Issue: `MoveBackCommand` requires `roomId` (05-command-system:345), but CLI shortcut `"back": "MOVE_BACK"` (15-cli-presentation:1019) and Agent pattern `move back` (16-agent-mode:1175) provide no mechanism to specify the target room.
- Impact: Commands cannot be executed deterministically—no way to provide the required roomId.
- Relevant files:
  - docs/architecture/05-command-system.md
  - docs/architecture/15-cli-presentation.md
  - docs/architecture/16-agent-mode.md
- **Resolution:** Aligned CLI and Agent mode with the Command System's requirement:
  - **CLI (15):** Changed `"back": "MOVE_BACK"` to `"back": "SHOW_BACKTRACK_MENU"` for two-step selection. Added `"back <n>": "MOVE_BACK"` for direct selection. Added `BacktrackMenuRenderer` interface and `BacktrackOption` type to support menu-driven selection of cleared rooms.
  - **Agent Mode (16):** Changed `move back` pattern to `move back <room_id>` (e.g., `move back room_abc123`). Agents have full state access and can query cleared rooms directly.

### 12) ~~Death event schemas not aligned with full-loss design~~ (RESOLVED)
- Issue: `ItemsLostEvent` requires a `reason` field (`'brought' | 'unidentified' | 'carried'`) and `ItemsPreservedEvent` still exists, but `DeathResult` only returns `LostItemInfo[]` without reasons. Event contracts cannot be satisfied.
- Impact: Extraction system cannot emit valid death events; event consumers expect data that doesn't exist.
- Relevant files:
  - docs/architecture/04-event-system.md
  - docs/architecture/11-extraction-system.md
  - docs/architecture/07-item-system.md
- **Resolution:** Simplified death events to match "full loss on death" design (Finding #6):
  - **ItemsLostEvent:** Removed `reason` field. All items in dungeon are lost equally—no distinction needed. Event payload now matches `LostItemInfo` structure from Item System.
  - **ItemsPreservedEvent:** Removed entirely. With full loss on death, no items are preserved from dungeon. Stash items were never at risk during a run, so no preservation event needed.
  - This aligns event schemas with `DeathResult.itemsLost: LostItemInfo[]` and eliminates the contract mismatch.

### 13) ~~processDeathLoss returns goldLost without gold input~~ (RESOLVED)
- Issue: `processDeathLoss` returns `goldLost: number` in `DeathLossResult`, but the function signature only accepts `equipment` and `inventory`—no gold parameter. The function cannot compute `goldLost` without knowing how much gold was collected.
- Impact: Function contract cannot be satisfied; implementation would need to either hardcode 0 or access state illegally.
- Relevant files:
  - docs/architecture/07-item-system.md
  - docs/architecture/03-state-management.md
- **Resolution:** Added `goldCollected: number` parameter to `processDeathLoss`. This is the run gold from `SessionState.goldCollected` that gets lost on death. Persistent gold at camp (`ProfileState.gold`) is never at risk.

### 14) ~~Risk status literals still use 'doomed' in camp/agent views~~ (RESOLVED)
- Issue: `BringItemView.riskStatus` in Camp System and `AgentBroughtItem.risk_status` in Agent Mode used `'doomed'` literal, but canonical `ItemRiskStatus` was simplified to `'safe' | 'at_risk'` in Finding #8.
- Impact: Type inconsistency—views cannot satisfy `ItemRiskStatus` union.
- Relevant files:
  - docs/architecture/07-item-system.md
  - docs/architecture/12-camp-system.md
  - docs/architecture/16-agent-mode.md
- **Resolution:** Replaced `'doomed'` with `'at_risk'` in both `BringItemView` (12-camp-system) and `AgentBroughtItem` (16-agent-mode). Items brought into dungeon share the same risk status as all other dungeon items—the "full loss on death" design eliminates the need for a distinct `'doomed'` state.
