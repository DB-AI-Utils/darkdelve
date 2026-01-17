# Architecture Review: docs/architecture

## Problem statement
Review the architecture docs (only `docs/architecture`) to verify module integration, references, and dependency alignment before implementation. Identify cross-module mismatches that could block or destabilize implementation, and propose fixes.

## Findings and potential fixes

### 1) Config schema mismatches and missing config coverage ✅ RESOLVED
- **Issue**: The content registry config list omits files used elsewhere (`camp.json`, `dungeon.json`, `death-economy.json`, `lesson-learned.json`). In addition, `ExtractionConfig` in the registry differs from the extraction system's config format, and `MerchantConfig` overlaps with camp merchant config and item template flags.
- **Relevant files**
  - `docs/architecture/02-content-registry.md`
  - `docs/architecture/10-dungeon-system.md`
  - `docs/architecture/11-extraction-system.md`
  - `docs/architecture/12-camp-system.md`
- **Resolution applied**:
  - Added `camp.json`, `dungeon.json`, `death-economy.json`, `lesson-learned.json` to ContentRegistry directory structure
  - Added typed accessors: `getCampConfig()`, `getDungeonConfig()`, `getDeathEconomyConfig()`, `getLessonLearnedConfig()`
  - Defined TypeScript interfaces: `CampConfig`, `DungeonConfig`, `FloorConfig`, `DeathEconomyConfig`, `LessonLearnedConfig`
  - Updated `ExtractionConfig` to match extraction-system's JSON format (per-floor rules via `floors` record, updated threshold/desperation/taunt configs)
  - Clarified `MerchantConfig` ownership: ItemTemplate flags define eligibility, MerchantConfig defines pricing rules and explicit overrides via `alwaysAvailable` list
  - Updated exports to include all new types

### 2) Session state shape mismatch with extraction system ✅ RESOLVED
- **Issue**: `ExtractionSystem` expects `SessionState.extractionState`, `runStats`, and `broughtItemIds`, but `SessionState` in state management defines `broughtItems` and lacks `extractionState`/`runStats`.
- **Relevant files**
  - `docs/architecture/03-state-management.md`
  - `docs/architecture/11-extraction-system.md`
- **Resolution applied**:
  - Added missing run stat fields to `SessionState` in 03-state-management.md: `floorsExplored`, `itemsFound`, `maxDreadReached`
  - Rewrote "State Managed" section in 11-extraction-system.md to clarify extraction system *reads* SessionState (single source of truth)
  - `ExtractionState` is now documented as **computed on demand**, not stored (avoids stale state bugs)
  - Aligned naming: extraction system now references `broughtItems` (matching state-management.md)

### 3) Missing events in Event System union ✅ RESOLVED
- **Issue**: The event union does not include events referenced by extraction/camp systems (`THRESHOLD_RETREAT_STARTED`, `THRESHOLD_RETREAT_COMPLETED`, `LESSON_LEARNED_GRANTED`, `LESSON_LEARNED_DECREMENTED`), causing typed emission/subscription mismatches.
- **Relevant files**
  - `docs/architecture/04-event-system.md`
  - `docs/architecture/11-extraction-system.md`
  - `docs/architecture/12-camp-system.md`
- **Resolution applied**:
  - Added `ThresholdRetreatStartedEvent`, `ThresholdRetreatCompletedEvent`, `LessonLearnedGrantedEvent` interfaces to 04-event-system.md
  - Added these events to the `GameEvent` union type and public exports
  - Simplified 11-extraction-system.md "Events Emitted" section to reference central event system (removed duplicate interface definitions)
  - Removed redundant `LESSON_LEARNED_DECREMENTED` from 12-camp-system.md (replaced with `LESSON_LEARNED_ACTIVATED` which already includes `runsRemaining` field)

### 4) Camp transient state has no home in core state ✅ RESOLVED
- **Issue**: Camp selections (bring items, consumables, buyback list, etc.) are defined but not stored in `GameState`, which makes deterministic command handling and persistence ambiguous.
- **Relevant files**
  - `docs/architecture/02-content-registry.md`
  - `docs/architecture/03-state-management.md`
  - `docs/architecture/12-camp-system.md`
- **Resolution applied**:
  - Added `expeditionPrep: ExpeditionPrepState | null` to `GameState` for workflow state during expedition preparation
  - Defined `ExpeditionPrepState` and `ConsumableSelection` interfaces in 03-state-management.md
  - Removed buyback feature entirely (simplification) - sold items are gone permanently
  - Removed stash sorting options (simplification) - fixed sort by rarity
  - Documented UI selections (selected stash item, equipment slot, chronicler section, etc.) as presentation-only state
  - Updated 05-command-system.md to remove `MERCHANT_BUYBACK` command
  - Updated 12-camp-system.md to remove `CampTransientState`, buyback methods, and sorting
  - Updated 16-agent-mode.md to remove buyback command and `has_buyback` field
  - Updated 02-content-registry.md `CampConfig` interface to remove `sortOptions`, `defaultSort`, `buybackLimit`, `buybackMarkup`, and `StashSortCriteria` type

### 5) GameSession core API is referenced but not specified ✅ RESOLVED
- **Issue**: `GameSession` is referenced by presentation layers but has no dedicated spec or module, leaving the core API boundary underspecified.
- **Relevant files**
  - `docs/architecture/00-overview.md`
  - `docs/architecture/15-cli-presentation.md`
  - `docs/architecture/16-agent-mode.md`
- **Resolution applied**:
  - Added "Core API Contract" section to 00-overview.md with full TypeScript interface
  - Defined `GameSession` interface with 6 methods: `executeCommand`, `getAvailableCommands`, `getState`, `getDerivedState`, `subscribe`, `subscribeAll`
  - Added `createGameSession` factory function with `GameSessionOptions` (seed, profileName, profilesPath)
  - Documented ownership table: StateStore (03), EventBus (04), CommandProcessor (05)
  - Added command execution flow description

### 6) Dependency lists and dependency matrix drift ✅ RESOLVED
- **Issue**: Several module dependency lists do not match actual references (e.g., Command System uses `ContentRegistry` and `SeededRNG` but omits module 02; Analytics uses `AnalyticsConfig` but omits 02; Item System emits/subscribes events but omits 04; Extraction uses state shapes but omits 03).
- **Relevant files**
  - `docs/architecture/00-overview.md`
  - `docs/architecture/05-command-system.md`
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/11-extraction-system.md`
  - `docs/architecture/14-analytics.md`
- **Resolution applied**:
  - Updated dependency matrix in 00-overview.md (phase 1):
    - 07-Item: added 04 (event-system) - module emits/subscribes to events
    - 11-Extraction: added 03 (state-management) - reads SessionState extensively
    - 14-Analytics: added 02 (content-registry) - uses AnalyticsConfig
  - Updated each module's `## Dependencies` section to match matrix (phase 2):
    - 05-command-system: added 02-content-registry
    - 07-item-system: added 04-event-system, fixed stale 09-dread-system note (was corruption, now loot quality bonus)
    - 11-extraction-system: added 03-state-management, 10-dungeon-system
    - 14-analytics: added 02-content-registry
  - Matrix and module sections now aligned

### 7) Dread corruption logic duplication in item system ✅ RESOLVED
- **Issue**: Item stat corruption in the item system uses hardcoded thresholds instead of the Dread system's config-driven corruption helpers, risking inconsistent behavior and balance tuning drift.
- **Relevant files**
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/09-dread-system.md`
- **Resolution applied**:
  - Added `09-dread-system` to Item System's dependencies (both in 07-item-system.md and 00-overview.md dependency matrix)
  - Replaced hardcoded `corruptStatDisplay` function with usage of Dread module's `corruptNumericValue`
  - ItemService.getDescription() now calls Dread module's corruption functions with proper CorruptionContext
  - All corruption thresholds and probabilities now config-driven via `configs/dread.json`

### 8) Merchant config schema split across incompatible shapes ✅ RESOLVED
- **Issue**: `MerchantConfig` was defined with three incompatible shapes: content-registry used `alwaysAvailable/rotatingStock/sellValueMultiplier`, item-system used `rotatingSlotCount/sellRatio`, and camp-system used a hybrid with redundant `accessoryRarityByLevel` inside rotatingStock. Additionally, buyback fields remained in docs 02 and 07 despite being removed per finding #4.
- **Relevant files**
  - `docs/architecture/02-content-registry.md`
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/12-camp-system.md`
- **Resolution applied**:
  - Established 02-content-registry.md `MerchantConfig` interface as single source of truth
  - Removed stale buyback fields (`buybackMarkup`, `buybackLimit`) from content-registry
  - Removed redundant `accessorySlots` and `accessoryRarityByLevel` from `rotatingStock` (use `accessorySlotsByLevel` array at root instead)
  - Updated 07-item-system.md merchant.json to use canonical field names (`sellValueMultiplier` not `sellRatio`, nested `rotatingStock` not flat `rotatingSlotCount`)
  - Updated 12-camp-system.md merchant.json to include missing `accessorySlotsByLevel` and `stockSeedComponents`, removed redundant nested accessory config
  - Added cross-reference notes in 07 and 12 pointing to canonical schema in 02

### 9) ItemsLostEvent missing goldLost field ✅ RESOLVED
- **Issue**: `ItemsLostEvent` in event system omitted `goldLost`, but extraction system's `DeathResult`/`DeathSummary` and analytics death events rely on it to populate death summaries and track gold loss metrics.
- **Relevant files**
  - `docs/architecture/04-event-system.md`
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/11-extraction-system.md`
  - `docs/architecture/14-analytics.md`
- **Resolution applied**:
  - Added `goldLost: number` field to `ItemsLostEvent` in 04-event-system.md
  - Event now carries complete loss context (items + gold) for death processing

### 10) Item System Dread corruption snippet has wrong APIs and layer violation ✅ RESOLVED
- **Issue**: Item System's "Dread Display Corruption" implementation note called `createPresentationRNG(gameState)` (wrong signature - actual API takes 4 args) and read `template.damage` (doesn't exist - actual field is `baseStats.damageMax`). More importantly, it introduced a presentation layer dependency (15) into core (07), violating layer boundaries.
- **Relevant files**
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/15-cli-presentation.md`
  - `docs/architecture/02-content-registry.md`
- **Resolution applied**:
  - Removed implementation code from 07-item-system.md; replaced with note clarifying corruption is NOT handled by Item System
  - Added documentation to 15-cli-presentation.md `ItemRenderer` interface explaining it owns stat corruption
  - Core Item System now provides raw values; presentation layer applies Dread corruption using correct APIs

### 11) Buyback feature remnants after removal decision ✅ RESOLVED
- **Issue**: Finding #4 removed buyback from camp/commands/agent, but references remained in event system (`fromBuyback` field), item system (`getBuybackInventory`, `buybackItem`, `BuybackItem`, `BuybackResult`, `addedToBuyback`), and analytics (`fromBuyback`).
- **Relevant files**
  - `docs/architecture/04-event-system.md`
  - `docs/architecture/07-item-system.md`
  - `docs/architecture/14-analytics.md`
- **Resolution applied**:
  - Removed `fromBuyback` from `ItemPurchasedEvent` in 04-event-system.md
  - Removed `getBuybackInventory()`, `buybackItem()` methods from `MerchantService` in 07-item-system.md
  - Removed `addedToBuyback` from `SellResult`, deleted `BuybackItem` and `BuybackResult` interfaces
  - Removed buyback from exports and test scenario
  - Removed `fromBuyback` from analytics event in 14-analytics.md
  - Verified: zero buyback references remain in architecture docs
