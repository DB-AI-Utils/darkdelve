# Architecture Review: docs/architecture

## Problem Statement
Review the architecture documents in `docs/architecture/` for module integration risks, missing references, or contract mismatches that could cause implementation issues when the project is built from these specs.

## Findings

### 1) Combat config schema mismatch (High)
**Problem:** The CombatConfig defined for content loading omits fields required by the combat system (e.g., `dodgeStaminaBonus`, `slowEnemyHeavyBonus`, `bossStaggerThreshold`, `bossStaggerWindow`). This will cause validation failures or runtime defaults that diverge from design.

**Relevant files:**
- `docs/architecture/02-content-registry.md`
- `docs/architecture/08-combat-system.md`

**Potential fix:**
- Expand `CombatConfig` in `02-content-registry` to include the missing fields and ensure `configs/combat.json` uses the full schema.
- Update any validation schemas accordingly.

---

### 2) Expedition prep consumables are under-specified (High)
**Problem:** `PREP_SELECT_CONSUMABLE` only specifies `templateId` and `fromStash`, but `ExpeditionPrepState` stores `itemId` and `quantity`. Stash stores distinct `ItemInstance`s, so selecting a specific consumable from stash is ambiguous when multiple copies exist.

**Relevant files:**
- `docs/architecture/05-command-system.md`
- `docs/architecture/03-state-management.md`

**Potential fix:**
- Change `PREP_SELECT_CONSUMABLE` to accept `itemId` when `fromStash` is true; keep `templateId` for merchant purchases.
- Alternatively, model stash consumables as stacks with `quantity` and store a stack reference in `ExpeditionPrepState`.

---

### 3) ~~Armor units inconsistent between content and combat~~ (RESOLVED)
**Resolution:** Standardized all armor values to 0–1 scale (decimal fractions) across content and combat. Updated `ItemStatBlock.armor` and `MonsterTemplate.armor` comments in `02-content-registry.md` to specify "0-1, where 0.40 = 40% reduction". This aligns with other probability/fractional fields (crit chance, proc chance) that already use 0–1.

---

### 4) Dungeon floor configuration defined twice with different shapes (High)
**Problem:** `DungeonConfig.FloorConfig` (content registry) differs from the dungeon module’s `FloorConfig` (has `hasStairwell`, `eliteSpawnChance`, etc.). This will lead to generator and config drift.

**Relevant files:**
- `docs/architecture/02-content-registry.md`
- `docs/architecture/10-dungeon-system.md`

**Potential fix:**
- Pick a single canonical `FloorConfig` shape and import it across modules.
- Update `DungeonConfig` and generator to match one schema and remove duplicate interface.

---

### 5) Starting equipment ownership gap (High)
**Problem:** Profile creation uses state utilities, but item instance creation lives in the Item System. The flow doesn’t specify who actually creates `ItemInstance`s for starting gear (source/identified fields), risking duplicated or inconsistent initialization logic.

**Relevant files:**
- `docs/architecture/03-state-management.md`
- `docs/architecture/05-command-system.md`
- `docs/architecture/07-item-system.md`

**Potential fix:**
- Make `createProfileState` call into `ItemService.createStartingEquipment` (by passing the service into the state factory), or move starting equipment creation into the command handler as an orchestration step before calling `createProfileState`.

---

### 6) Dread corruption responsibility leak (Medium)
**Problem:** Corruption is defined as presentation-only (with dedicated RNG), but `ItemService.getDescription` takes `currentDread` and implies it will corrupt output in the core. This violates the deterministic core rule and hides RNG usage.

**Relevant files:**
- `docs/architecture/07-item-system.md`
- `docs/architecture/09-dread-system.md`
- `docs/architecture/15-cli-presentation.md`

**Potential fix:**
- Remove Dread-based corruption from `ItemService` and move it entirely into presentation/agent layers using `PresentationRNG`.
- If core must provide corrupted data, define a `presentationRng` parameter explicitly and document its origin.

---

### 7) Crit multiplier inconsistency (Medium)
**Problem:** Character derived stats document a default `critMultiplier` of 1.5x, while combat config uses 2.5x. UI calculations and combat resolution will disagree.

**Relevant files:**
- `docs/architecture/06-character-system.md`
- `docs/architecture/08-combat-system.md`

**Potential fix:**
- Decide the authoritative crit multiplier (design doc vs config). Align character derived stats, combat config, and any UI display to the same value.

---

### 8) Extraction config duplication (Medium)
**Problem:** `ExtractionConfig` is defined in content registry, but extraction system hardcodes `FLOOR_EXTRACTION_CONFIG` and `THRESHOLD_RETREAT_CONFIG`. This risks divergence from JSON configs.

**Relevant files:**
- `docs/architecture/02-content-registry.md`
- `docs/architecture/11-extraction-system.md`

**Potential fix:**
- Remove hardcoded constants and read from `ExtractionConfig` at runtime, or explicitly mark the config file as deprecated and document the code constants as the source of truth.

---

### 9) Session end reason mismatch (Medium)
**Problem:** Events include `SESSION_ENDED` with result `'quit'`, but state actions only allow `'extraction' | 'death'`. Reducers won’t be able to represent a quit event cleanly.

**Relevant files:**
- `docs/architecture/04-event-system.md`
- `docs/architecture/03-state-management.md`

**Potential fix:**
- Add `'quit'` to the `SESSION_ENDED` state action payload, or remove it from event types and handle quit in another way.

---

### 10) Camp/inventory limits duplicated across configs (Low)
**Problem:** `GameConfig` and `CampConfig` both define stash/inventory/consumable limits. Different modules may read different configs and drift over time.

**Relevant files:**
- `docs/architecture/02-content-registry.md`

**Potential fix:**
- Consolidate these limits into one config (preferred) and have the other reference it or remove the duplicate fields.

