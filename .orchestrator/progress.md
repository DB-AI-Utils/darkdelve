# Architecture Alignment Progress

## Iteration 1 (2026-02-07)

### Step 1: Read both documents
- Read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v1.1) end to end.

### Step 2: Self-identified discrepancies
Found 27+ issues including:
- Missing combat turn order specification
- Missing failed-flee = enemy free attack behavior
- Missing telegraph mechanics (when/how they trigger, damage behavior)
- Missing bestiary unlock thresholds (3/1 and 6/2 numbers)
- Missing The Watcher stats/behavior/rewards
- Missing treasure chest gold amounts
- Missing death handling flow (gold loss, item loss, bestiary trigger)
- Missing extraction cost payment flow (which gold pool)
- Missing Floor 5 alternative extraction flow
- Missing explicit damage calculation formulas
- Missing Clarity Potion room tracking mechanics
- Missing camp system specification (menu options, Quit action)
- Missing fled-enemy room persistence behavior
- Missing CUNNING flee chance modifier in combat
- Extraction bonus contradiction (floors 1-2: "no extraction bonus" vs "Floor × 15")
- Enemy type mapping gap ("basic"/"elite" flee chances vs "common"/"boss" monster types)
- `sellValue` on ItemTemplate not in game design
- Implementation details present (directory structure, file names, library names, config JSON examples, content file examples, room ID format, CLI commands, test coverage targets)
- No leveling not explicitly stated
- No stamina/status effects not documented as constraints

### Step 3: Codex review (initial)
Codex found 35 issues, largely overlapping with self-review plus:
- Camp menu flow not defined
- "Lesson Learned" framing not in events
- No explicit extraction bonus event/state handling
- Stash carry limits not enforced in types
- Combat target length not specified
- Several scope creep concerns (Agent Adapter, Analytics, Content validation not in game design)

### Step 4: Fixes applied (major rewrite)
Rewrote architecture.md v2.0:
- **Removed implementation details**: Directory structure, file/folder names, TypeScript interface code blocks, config JSON examples, content file examples, room ID format, library names (chalk, Vitest, etc.), CLI commands, test coverage targets
- **Added Combat System section**: Full turn structure, action resolution table with damage formulas, telegraph mechanics, combat start/end flows, CUNNING flee modifier
- **Added The Watcher section**: Stats (HP 80-100, Damage 18-25), behavior, rewards (50-75 gold + rare item)
- **Added Death Handling section**: Complete death flow (bestiary unlock, item loss, gold loss, Lesson Learned display, phase transition)
- **Added Extraction System section**: Costs, Floor 5 alternative, bonus (floors 3+ only), successful extraction flow
- **Added Camp System section**: All 4 menu options, camp display info
- **Added Character section**: Starting character, stat effects, derived stat formulas
- **Added Gold System section**: All gold sources with amounts, gold rules
- **Added Stash System section**: All rules, stash actions
- **Added Design Constraints section**: All non-negotiable cuts from game design
- **Fixed extraction bonus**: Clarified floors 3+ only (resolving game design internal tension)
- **Fixed enemy type mapping**: Documented common→basic, boss→elite mapping for flee chances
- **Added bestiary unlock thresholds**: Tier 2 = 3 encounters OR 1 death, Tier 3 = 6 encounters OR 2 deaths
- **Added fled enemy persistence**: Documented in RoomState and Navigation
- **Removed sellValue**: Not in game design
- **Added LESSON_LEARNED event**: For death framing
- **Converted state schemas**: From TypeScript code blocks to language-agnostic tree notation

### Step 5: Codex verification
Codex found 7 remaining issues:
1. Equipment slots (4 vs 2) — **Not an issue**: CLAUDE.md is not source of truth, game-design.md only has 2 slots, architecture is correct
2. CUNNING flee modifier missing from combat — **Fixed**: Added to Flee action and note
3. Telegraph damage bonus not quantified — **Fixed**: Made configurable, added telegraphDamageMultiplier and telegraphChance to MonsterTemplate
4. Boss count (5+1 vs 5+2) — **Not an issue**: Architecture correctly counts Watcher as boss
5. Extraction bonus floors 3+ — **Not an issue**: Architecture resolves game design internal tension correctly
6. Dread gain on flee not in game design table — **Not an issue**: We don't modify game-design.md, architecture is more complete
7. Floor 5 mini-boss detail — **Not an issue**: Architecture makes reasonable specific decision

### Additional fixes after verification:
- Added `clarityRoomsRemaining` to SessionState
- Fixed lifesteal formula (was "enemy has lifesteal weapon" → "player's weapon has lifesteal")
- Clarified damage formula order (crit → damageReduction → apply → lifesteal heal)

### Step 6: Final assessment
Both my review and Codex's review are satisfied. All real discrepancies have been resolved. The remaining items Codex flagged were either:
- Already correct in architecture (matching game-design.md as source of truth)
- Issues in game-design.md itself that we correctly resolved in architecture
- Reasonable architectural decisions beyond game design scope (Agent adapter, Analytics)

**Status: ALIGNED**

## Iteration 2 (2026-02-07)

### Step 1: Read both documents
- Re-read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v2.0) end to end.

### Step 2: Self-identified discrepancies
Systematic comparison found **1 issue**:
- **Missing target fight length**: Game design specifies "3-5 turns for basic enemies, 6-10 for boss" (Combat Rules section). Architecture did not mention this anywhere.

All other systems, values, mechanics, and constraints were aligned between the two documents.

### Step 3: Codex review
Codex found 36 items in initial review. After careful analysis:
- Most were not real discrepancies (e.g., Agent adapter = architectural decision, boss count includes Watcher, elite→boss mapping already documented, etc.)
- The **only real discrepancy** was the same one found in self-review: missing target fight length.

### Step 4: Fix applied
Added target fight length to architecture.md:
1. New "Target Fight Length" subsection in Combat System section (after Combat Start):
   - Basic enemies: 3-5 turns
   - Bosses: 6-10 turns
   - Note: informs balance tuning, not hard engine enforcement
2. Added to Design Constraints section: "Target fight length: 3-5 turns for basic enemies, 6-10 turns for bosses"

### Step 5: Codex verification
Codex raised 5 "remaining issues," all of which are already addressed in the architecture:
1. Elite flee mapping → Already at line 280 with explicit basic→common, elite→boss mapping
2. ±20% HP distortion → Already at lines 467 and 478 in thresholds and corruption architecture
3. Whispers/hallucinations → Already at lines 468-469 in thresholds table, presentation layer responsibility
4. "Inputs always work" → Already at line 486: "Player inputs always work correctly"
5. Watcher spawn location → Reasonable necessary architectural decision (where else would it spawn?)

### Step 6: Final assessment
- Self-review: Zero remaining discrepancies after fix
- Codex: All 5 "remaining issues" are already present in the architecture document
- Architecture remains high-level with no implementation details
- All game design systems are covered with sufficient detail for engineers

**Status: ALIGNED**

## Iteration 3 (2026-02-07)

### Step 1: Read both documents
- Re-read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v2.0) end to end.

### Step 2: Self-identified discrepancies
Systematic section-by-section comparison found **zero discrepancies**. Every system, value, mechanic, and constraint in game-design.md is fully represented in architecture.md:
- All 4 combat actions with correct formulas and constraints
- All 8 items with correct stats
- All 6 enemies + 1 boss with correct stats and abilities
- All Dread thresholds, sources, and recovery methods
- All 5 floor structures with correct room counts and monster pools
- Extraction costs, bonuses, and Floor 5 alternative
- Death handling with bestiary unlocks and "Lesson Learned" framing
- Camp system with all 4 menu options
- Stash rules (10 slots, 2 items max, 1 consumable max)
- Character starting stats and derived stat formulas
- Gold sources and rules
- All design constraints (cuts from old docs)
- Session target (10-20 minutes)

### Step 3: Codex review
Codex initially raised 23 items, but ALL were false positives:
- Items 1, 3: Referenced CLAUDE.md instead of game-design.md (source of truth)
- Item 2: Miscount — 5 common + 2 bosses is correct (Bone Colossus + The Watcher)
- Items 4-5: Elite/boss flee mapping already documented with explanatory note
- Items 6-15: Artifacts of truncated architecture sent in prompt — all details exist in actual architecture.md
- Items 16-20: Legitimate architectural decisions (technology choices, persistence format, etc.)
- Items 21-23: Already in architecture's Design Constraints section

### Step 4: No fixes needed
No discrepancies found by either self-review or Codex (after analysis of false positives).

### Step 5: Codex verification
Codex confirmed: **ALIGNED**

### Step 6: Final assessment
- Self-review: Zero discrepancies found
- Codex: Confirmed ALIGNED after clarification of false positives
- Architecture remains high-level with no implementation details
- All game design systems covered with sufficient engineer-ready detail

**Status: ALIGNED — TASK COMPLETE**

## Iteration 4 (2026-02-08)

### Step 1: Read both documents
- Re-read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v2.0) end to end.

### Step 2: Self-identified discrepancies
Thorough section-by-section comparison found **1 gap**:
- **Bone Colossus gold drop missing**: Game design specifies gold drops for all 5 common enemies and The Watcher, but omits Bone Colossus. Architecture's Gold Sources table also omitted it. An engineer implementing Bone Colossus defeat wouldn't know how much gold to award.

All other systems, values, mechanics, and constraints remain fully aligned.

### Step 3: Codex review
Codex initially raised 50 items. After careful analysis, 49 were false positives:
- Architectural decisions (Agent adapter, analytics, event system, Content Registry, etc.)
- Already present in architecture (threshold descriptions, ambush warnings, damage formulas, etc.)
- Already resolved in previous iterations (flee mapping, extraction bonus, Floor 5 mini-boss, etc.)
- The **only real gap** matched self-review: Bone Colossus gold drop missing.

### Step 4: Fix applied
Added Bone Colossus gold drop to architecture.md Gold Sources table:
- Bone Colossus: 20-35 gold (noted as architectural decision since game design omits it)
- Placed in the table between Shadow Stalker and Treasure Chest, maintaining scaling order

### Step 5: Codex verification
Codex raised 3 items:
1. Flee "elite" base chance not represented → **Already addressed**: Architecture explicitly documents the basic→common, elite→boss mapping with note that both MVP bosses have canFlee:false
2. Bone Colossus gold in game design → **Cannot fix**: We don't modify game-design.md; architecture fills this gap with noted decision
3. Trapped chest 10% chance in architecture but not game design → **Legitimate architectural decision**: Game design mentions trapped chests exist (in Dread sources) but doesn't specify probability; architecture fills this gap

All 3 items are either already addressed or legitimate architectural decisions filling game design gaps.

### Step 6: Final assessment
- Self-review: Zero remaining discrepancies after fix (Bone Colossus gold drop added)
- Codex: All 3 "remaining issues" are either already addressed or necessary architectural decisions
- Architecture remains high-level with no implementation details
- All game design systems covered with sufficient engineer-ready detail

**Status: ALIGNED**

## Iteration 5 (2026-02-08)

### Step 1: Read both documents
- Re-read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v2.0) end to end.

### Step 2: Self-identified discrepancies
Thorough section-by-section comparison found **4 issues**:
1. **Crit bonus missing from formula**: `critBonus` field existed on ItemTemplate (for Iron Longsword's +5% crit) but was never included in the crit chance formula in Derived Stats, Attack action, or Damage Formulas sections.
2. **Watcher tell behavior incorrect**: Game design says Watcher has "tell turns where it doesn't attack." Architecture's telegraph model had the enemy still attacking on telegraph turns — only the NEXT turn was heavy. The Watcher specifically doesn't attack on tell turns.
3. **Multi-attack resolution undefined**: Bone Colossus phase 2 "attacks twice" — MonsterPhase had `attacksPerTurn` but the combat turn structure only described one enemy action step. No clarity on how Defend, damage rolls, events interact with multi-attack.
4. **Run inventory model missing**: PlayerState only had `equipment: {weapon, armor}` and `consumables[]`. No way to carry extra equipment found during a run (e.g., finding a Chainmail Shirt while wearing Tattered Leathers). Game design says "keep all carried items on extraction" but architecture had no backpack/inventory container.

### Step 3: Codex review
Codex found 21 items. After careful analysis:
- 4 matched self-review findings (crit bonus, Watcher tells, multi-attack, run inventory)
- 17 were false positives or already-addressed items (elite mapping, Bone Colossus gold, trapped chest %, generation parameters, flee formula interpretation, etc.)

### Step 4: Fixes applied
1. **Added weapon critBonus to crit formula** in 3 locations:
   - Derived Stats: `Crit Chance = 5% + (CUNNING × 3%) + weapon critBonus`
   - Attack action table: `Roll crit chance: 5% base + (CUNNING × 3%) + weapon critBonus`
   - Damage Formulas: `Roll crit: chance = 5% + (CUNNING × 3%) + weapon critBonus`
2. **Fixed Watcher tell behavior**: Updated The Watcher section to specify "tell turns where it does not attack, creating safe windows" and "on a Watcher tell turn, the enemy action step is skipped entirely." Clarified this differs from normal telegraphs.
3. **Added multi-attack resolution**: Added to Enemy Damage formula: "If boss phase has attacksPerTurn > 1: repeat the full enemy attack sequence that many times (each attack is a separate damage roll). Defend applies to all attacks in the same turn. Each attack emits its own DAMAGE_DEALT event."
4. **Added Run Inventory section**: New section with:
   - `backpack: ItemInstance[]` added to PlayerState
   - Equipment found during run goes to backpack (or equip + old item to backpack)
   - Consumables go directly to consumable list
   - On extraction: all items brought back, deposit to stash, discard overflow
   - On death: all items lost (worn + backpack + consumables)
   - Updated extraction flow to reference worn equipment + backpack

### Step 5: Codex verification
Codex confirmed: **ALIGNED** (after reviewing full architecture v2.1)

### Step 6: Final assessment
- Self-review: 4 real issues found and fixed
- Codex: Confirmed ALIGNED with full document review
- Architecture remains high-level with no implementation details
- All game design systems covered with sufficient engineer-ready detail
- Version bumped to v2.1

**Status: ALIGNED**

## Iteration 6 (2026-02-08)

### Step 1: Read both documents
- Re-read `docs/game-design.md` (v2.2) and `docs/architecture.md` (v2.1) end to end.

### Step 2: Self-identified discrepancies
Thorough section-by-section comparison found **zero discrepancies**. Every system, value, mechanic, and constraint in game-design.md is fully represented in architecture.md:
- All 4 combat actions with correct formulas, constraints, and CUNNING modifiers
- All 8 items with correct stats (including critBonus for Iron Longsword, lifesteal for Soulreaver Axe)
- All 5 common enemies + 2 bosses with correct stats and abilities
- All Dread thresholds, sources (including per-room-type triggers), and recovery methods
- All 5 floor structures with correct room counts and monster pools
- Extraction costs, bonuses (floors 3+ only), and Floor 5 alternative
- Death handling with bestiary unlocks, "Lesson Learned" framing, and complete flow
- Camp system with all 4 menu options
- Stash rules (10 slots, 2 items max, 1 consumable max)
- Character starting stats (3/3/3), derived stat formulas, no leveling
- Gold sources and rules for all enemies including Bone Colossus (architectural decision)
- Run inventory with backpack, extraction overflow, and death loss
- The Watcher with unique tell behavior (distinct from normal telegraphs)
- Multi-attack resolution for Bone Colossus phase 2
- All design constraints (cuts from old docs)
- Session target (10-20 minutes) and fight length targets (3-5/6-10 turns)

### Step 3: Codex review
Codex initially raised 23 items. After careful analysis, ALL were false positives or already-addressed items:
- Boss count (Watcher explicitly labeled as boss in architecture)
- Bone Colossus gold drop (noted architectural decision)
- Flee mapping (explicit note with basic→common, elite→boss mapping)
- Room-clear triggers (necessary architectural decision filling game design gap)
- Trapped chest 10% (necessary architectural decision filling game design gap)
- Extraction bonus floors 3+ (resolves game design internal tension)
- Floor 5 mini-boss = Shadow Stalker (logical architectural decision)
- All other items were either already in architecture or appropriate architectural content

### Step 4: No fixes needed
No real discrepancies found by either self-review or Codex.

### Step 5: Codex verification
After providing exact quotes from the architecture showing all concerns were addressed, Codex confirmed: **ALIGNED**

### Step 6: Final assessment
- Self-review: Zero discrepancies found
- Codex: Confirmed ALIGNED after reviewing exact architecture text
- Architecture remains high-level with no implementation details
- All game design systems covered with sufficient engineer-ready detail
- Architecture v2.1 is stable — no changes needed for 2 consecutive iterations

**Status: ALIGNED — TASK COMPLETE**
