# DARKDELVE MVP Architecture

> TypeScript/Node CLI roguelike with presentation-layer separation supporting both human (CLI) and AI (Agent/JSON) players.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript (Node.js) | Fast iteration, excellent JSON handling, type safety |
| Presentation | Dual mode: CLI + Agent (JSON) | Enables automated playtesting from day one |
| Persistence | JSON files | Simple, human-readable, matches data-driven config approach |
| Analytics | Minimal events | Log deaths, extractions, combat outcomes for balance analysis |
| State Management | Immutable state + event emission | Predictable, testable, supports replay |
| RNG | Injectable, seedable | Deterministic tests, reproducible runs |
| Data-driven content | JSON config + content files | Balance values and game entities are tunable without code changes |

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌─────────────────────┐       ┌─────────────────────────────┐  │
│  │   CLI Adapter       │       │   Agent Adapter (JSON)      │  │
│  │   - Input parsing   │       │   - JSON state output       │  │
│  │   - ASCII rendering │       │   - Command string input    │  │
│  │   - Color/format    │       │   - Structured responses    │  │
│  └──────────┬──────────┘       └──────────────┬──────────────┘  │
└─────────────┼──────────────────────────────────┼────────────────┘
              │                                  │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PresentationAdapter Interface                 │
│   render(state, dreadUncertainty) | getAction() | displayEvents │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Game Engine                              │
│   - State machine (CAMP → DUNGEON → COMBAT → DEAD/EXTRACTED)    │
│   - Coordinates subsystems                                       │
│   - Validates and executes actions                               │
│   - Emits events                                                 │
└─────────────────────────────┬───────────────────────────────────┘
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│  CombatSystem   │ │  DungeonSystem  │ │ DreadSystem │ │ Inventory   │
│  - Attack       │ │  - Generation   │ │ - Thresholds│ │ - Equipment │
│  - Defend       │ │  - Navigation   │ │ - Corruption│ │ - Items     │
│  - Flee         │ │  - Room state   │ │ - Watcher   │ │ - Gold      │
│  - Use item     │ │  - Extraction   │ │             │ │             │
└─────────────────┘ └─────────────────┘ └─────────────┘ └─────────────┘
              │               │               │               │
              └───────────────┼───────────────┴───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Content Registry                            │
│   - Loads balance configs and entity definitions from JSON       │
│   - Validates content at startup                                 │
│   - Provides typed accessors                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Organization

Game data is split into two categories of JSON files:

**Balance configs** — Tunable numeric values that control game feel:
- Player: base stats, starting gear, stat bonus formulas, crit settings
- Combat: flee chances, defend reduction, cooldowns
- Dread: thresholds, corruption chances, gain/recovery rates
- Extraction: floor costs, bonuses
- Stash: capacity limits
- Dungeon: rooms per floor, room type distributions, monster pools per floor

**Content definitions** — Game entities (one file per entity):
- Items: weapons, armor, consumables (8 total for MVP)
- Monsters: common enemies and bosses (5 common + 2 bosses for MVP)

The Content Registry loads and validates all JSON at startup, then provides typed read-only access to the rest of the system.

---

## Core State

### GameState

The central state object that flows through the entire system:

```
GameState
├── phase: CAMP | DUNGEON | COMBAT | DEAD | EXTRACTED
├── player: PlayerState
│   ├── hp / maxHp
│   ├── stats: { vigor, might, cunning }
│   ├── equipment: { weapon, armor }  (2 slots only for MVP)
│   ├── consumables: ItemInstance[]
│   ├── backpack: ItemInstance[]  (equipment found during run that isn't currently worn)
│   └── dread: 0-100
├── dungeon: DungeonState | null
│   ├── floor: 1-5
│   ├── currentRoomId
│   ├── rooms: Map<id, RoomState>
│   └── roomsCleared
├── combat: CombatState | null
│   ├── enemy: EnemyInstance
│   ├── turn number
│   ├── defendCooldown remaining
│   ├── canFlee (false on turn 1, false vs bosses)
│   ├── enemyTelegraph (null or warning string)
│   └── playerDefending
├── session: SessionState
│   ├── runNumber, seed
│   ├── goldEarnedThisRun (single source of run gold; increases on drops, decreases on extraction cost payment; transferred to persistent gold on extraction)
│   ├── torchUsesThisRun (max 3)
│   ├── consumablesBroughtFromStash (max 1)
│   └── clarityRoomsRemaining (0 = no active clarity effect)
└── persistent: PersistentState
    ├── stash: ItemInstance[] (max 10 slots)
    ├── gold (persisted across runs)
    ├── bestiary: Map<monsterId, BestiaryEntry>
    ├── totalRuns, totalDeaths, totalExtractions
    └── (no leveling — power comes from gear only)
```

### RoomState

```
RoomState
├── id
├── type: combat | treasure | empty | stairwell | boss
├── explored: boolean
├── adjacentRoomIds: string[]
├── enemy?: EnemyInstance           // Present if combat room; remains after flee; null after defeat
├── chest?: { opened, trapped }     // For treasure rooms
└── flavorText?: string             // For empty rooms
```

Key behavior: When a player flees combat, the enemy remains in the room with its current HP. Re-entering the room triggers combat again with that same enemy instance.

### EnemyInstance

```
EnemyInstance
├── templateId, name
├── hp / maxHp
├── damage: [min, max]
├── currentPhase (for bosses with phases)
├── attacksFirst (Plague Rat: true)
├── damageReduction (Armored Ghoul: 0.25)
├── ambush (Shadow Stalker: true)
├── ambushTriggered: boolean
├── telegraphs: string[]
└── canFlee: boolean
```

### BestiaryEntry

```
BestiaryEntry
├── monsterId
├── encounters (incremented each combat start)
├── kills
├── deathsTo (incremented when this enemy kills the player)
└── tier: 1 | 2 | 3
```

**Tier unlock rules** (from game design):
- Tier 1 (name only): First encounter
- Tier 2 (HP + damage range): 3 encounters OR 1 death to this enemy
- Tier 3 (special abilities): 6 encounters OR 2 deaths to this enemy

### ItemInstance

```
ItemInstance
├── id (unique per instance)
├── templateId (references content definition)
└── usesRemaining? (for consumables with limited uses, e.g. Torch has 3)
```

---

## Content Types

### ItemTemplate

```
ItemTemplate
├── id, name, flavorText
├── slot: weapon | armor | consumable
├── rarity: common | uncommon | rare
│
├── Weapon properties:
│   ├── damage: [min, max]
│   ├── critBonus? (percentage points, e.g. 5 for Iron Longsword)
│   └── lifesteal? (fraction, e.g. 0.1 for Soulreaver Axe)
│
├── Armor properties:
│   └── hpBonus? (flat HP increase)
│
├── Consumable properties:
│   ├── healAmount?
│   ├── dreadReduction?
│   ├── clearsDreadCorruption? (duration in rooms)
│   └── maxUsesPerRun?
│
└── dropFloorMin? (minimum floor for this item to drop)
```

### MonsterTemplate

```
MonsterTemplate
├── id, name, flavorText
├── type: common | boss
│
├── hp: [min, max]
├── damage: [min, max]
│
├── Special abilities:
│   ├── attacksFirst? (Plague Rat)
│   ├── damageReduction? (Armored Ghoul: 0.25)
│   ├── ambush? (Shadow Stalker)
│   └── phases?: MonsterPhase[]
│
├── spawnFloors: number[]
│
├── goldDrop: [min, max]
├── itemDropChance: float
│
├── telegraphs?: string[]
├── telegraphDamageMultiplier?: float   // Heavy attack multiplier (e.g., 1.5 = 150% damage)
├── telegraphChance?: float             // Chance per turn to telegraph (e.g., 0.3 = 30%)
└── canFlee: boolean
```

### MonsterPhase

```
MonsterPhase
├── hpThreshold (phase activates when HP <= this value)
├── damageBonus (added to base damage)
├── attacksPerTurn
└── telegraph? (warning message when phase activates)
```

---

## Combat System

### Turn Structure

Each combat turn follows this sequence:

1. **Pre-turn**: Check for enemy telegraph. If the enemy telegraphed last turn, it deals a heavy attack this turn (higher damage). Display the telegraph warning to the player.
2. **Player action**: Player chooses Attack, Defend, Use Item, or Flee.
3. **Player action resolution**: Resolve the player's chosen action.
4. **Enemy action**: Enemy attacks the player (unless the player fled or enemy died).

**Exception — attacksFirst**: Enemies with the `attacksFirst` flag (Plague Rat) reverse the order on turn 1 only: enemy attacks first, then player acts. On subsequent turns, normal order resumes.

**Exception — ambush**: Enemies with the `ambush` flag (Shadow Stalker) get one free attack before combat begins. The player sees a pre-combat warning (e.g., "Something moves in the shadows..."), then takes damage before their first action. The `ambushTriggered` flag prevents this from happening again if the player flees and re-enters.

### Actions

| Action | Resolution | Constraints |
|--------|------------|-------------|
| **Attack** | Deal damage = weapon base damage (random in range) + MIGHT stat. Roll crit chance: 5% base + (CUNNING × 3%) + weapon critBonus. Crit deals 2× damage. If enemy has damageReduction, reduce incoming damage by that fraction. | None |
| **Defend** | Player takes 50% reduced damage from enemy attack this turn. | 2-turn cooldown after use |
| **Use Item** | Apply consumable effect (heal HP, reduce Dread, clear Dread corruption). Consumes the item. | Must have consumable in inventory |
| **Flee** | Roll flee chance: base 70% vs common enemies, base 50% vs bosses that allow flee, modified by +(CUNNING × 5%). On success: combat ends, +8 Dread, enemy stays in room with current HP. On failure: enemy gets a free attack (full damage, no Defend possible), combat continues. | Cannot flee on turn 1. Cannot flee bosses (Bone Colossus, The Watcher). |

**Note on flee chances**: The game design uses "basic" and "elite" terminology. For MVP, map this as: common enemies use the "basic" base flee chance (70%), boss enemies use the "elite" base flee chance (50%). CUNNING modifies the final chance: `final flee chance = base + (CUNNING × 5%)`. With starting CUNNING of 3, the effective flee chance vs common enemies is 85%. Both MVP bosses (Bone Colossus and The Watcher) have `canFlee: false`, so flee is not available against them regardless of chance.

### Enemy Telegraphs

On any turn, an enemy may telegraph its next heavy attack. When a telegraph is active:
- The presentation layer displays the telegraph message (e.g., "The Ghoul raises its claws...")
- This signals to the player that Defend is the optimal choice next turn
- The following turn, the enemy deals a heavy attack (higher damage than normal)

Telegraph frequency and heavy-attack damage multiplier are configurable per enemy in content/balance configs. The combat system selects a random telegraph from the enemy's telegraph list when triggered. The game design does not specify an exact multiplier — this should be tuned during balance testing.

### Damage Formulas

**Player damage to enemy:**
1. Base = random integer in weapon damage range + MIGHT stat
2. Roll crit: chance = 5% + (CUNNING × 3%) + weapon critBonus. If crit: multiply by 2
3. If enemy has damageReduction: reduce by that fraction → damage × (1 - damageReduction)
4. Apply final damage to enemy
5. If player's weapon has lifesteal: heal player by (final damage dealt × lifesteal fraction)

**Enemy damage to player:**
- Base = random integer in enemy damage range
- If player is defending: final damage = base × 0.5 (rounded down)
- If boss is in a later phase: add phase damageBonus to base before reduction
- If boss phase has attacksPerTurn > 1: repeat the full enemy attack sequence that many times (each attack is a separate damage roll). Defend applies to all attacks in the same turn. Each attack emits its own DAMAGE_DEALT event. (Bone Colossus phase 2: 2 attacks per turn at base damage + 2.)

### Combat Start

When player enters a combat room:
1. Create EnemyInstance from MonsterTemplate (roll HP within range)
2. Increment bestiary encounter count for this enemy
3. Check for ambush (Shadow Stalker: if `ambush: true` and not yet `ambushTriggered`, enemy gets one free attack)
4. Set `canFlee = false` for turn 1, and permanently false for bosses
5. Emit COMBAT_STARTED event

### Target Fight Length

- **Basic enemies:** 3-5 turns
- **Bosses:** 6-10 turns

These targets inform balance tuning of enemy HP, damage, and player stats. They are not hard-enforced by the engine but should be validated during playtesting.

### Combat End

- **Victory**: Enemy HP reaches 0. Drop gold (random in goldDrop range). Roll itemDropChance for item drop. Gain Dread based on floor. Increment bestiary kill count. Emit ENEMY_DIED, COMBAT_ENDED events.
- **Fled**: Player succeeds flee roll. +8 Dread. Enemy remains in room. Emit FLEE_ATTEMPTED (success), COMBAT_ENDED events.
- **Death**: Player HP reaches 0. Trigger death flow (see Death Handling). Emit PLAYER_DIED, COMBAT_ENDED events.

### The Watcher

The Watcher is a special boss that spawns when Dread reaches 100 (Breaking Point). It is defined as a monster template with these stats:

- **HP:** 80-100
- **Damage:** 18-25
- **canFlee:** false
- **Has "tell" turns** where it does not attack, creating safe windows for the player to act without taking damage. On the turn following a tell, the Watcher deals a heavy attack (telegraphed). This differs from normal enemy telegraphs: on a Watcher tell turn, the enemy action step is skipped entirely.
- **Reward on defeat:** 50-75 gold + guaranteed rare item drop

When Dread hits 100, the Watcher spawns immediately in the player's current room, forcing combat. The Watcher fight follows normal combat rules except for its unique tell behavior (no damage on tell turns, heavy attack on the following turn).

---

## Dungeon System

### Floor Structure

5 floors total, each a graph of interconnected rooms:

| Floor | Rooms (excluding stairwell) | Monster Pool |
|-------|----------------------------|--------------|
| 1 | 3 + stairwell | Plague Rat, Ghoul |
| 2 | 4 + stairwell | Plague Rat, Ghoul, Skeleton Archer |
| 3 | 4 + stairwell | Ghoul, Skeleton Archer, Armored Ghoul |
| 4 | 5 + stairwell | Skeleton Archer, Armored Ghoul, Shadow Stalker |
| 5 | 5 + boss room | Armored Ghoul, Shadow Stalker, Bone Colossus (boss) |

Total: ~25 rooms per run.

### Room Types

| Type | Content |
|------|---------|
| Combat | Single enemy encounter (1v1 only) |
| Treasure | Chest with item. 10% chance of trapped chest (+10 Dread on open) |
| Empty | Flavor text only |
| Stairwell | Floor transition point and extraction point. -5 Dread on arrival. |
| Boss | Floor 5 only. Contains Bone Colossus. |

### Generation Rules

Per floor:
1. Create rooms with types distributed according to config (combat-heavy, ~60-80%)
2. Add one stairwell room (floors 1-4) or boss room (floor 5)
3. Connect rooms as a graph: each room has 1-3 adjacencies, all rooms must be reachable
4. Place player at entrance (first combat or empty room)
5. Populate combat rooms with random monsters from floor's monster pool
6. Populate treasure rooms with chests. Gold per chest: 10-25 scaled by floor
7. Floor 2 guarantees at least one Uncommon item drop

### Navigation

- ASCII map shows the floor layout to the player
- Player chooses adjacent rooms to enter
- Backtracking is allowed
- Room state persists within a run: cleared rooms stay cleared, fled enemies remain with their current HP

### Treasure Chest Gold

Treasure chests contain gold in the range 10-25, scaled by floor. The exact scaling formula is configurable. Additionally, chests may contain an item drop based on floor-specific drop tables.

---

## Extraction System

### Extraction Points

Extraction can only happen at stairwell rooms (or after defeating the Floor 5 boss).

### Extraction Costs

| Floor | Cost |
|-------|------|
| 1-2 | Free |
| 3 | 30 gold (from run gold) |
| 4 | 60 gold (from run gold) |
| 5 | Must defeat Bone Colossus boss OR pay 100 gold + fight a Shadow Stalker mini-boss |

Extraction costs are paid from gold earned during the current run (`goldEarnedThisRun`), not from the persistent gold stash.

### Floor 5 Alternative Extraction

If the player reaches Floor 5 and does not want to (or cannot) fight the Bone Colossus:
- Pay 100 gold from run gold
- A Shadow Stalker spawns as a mini-boss encounter in the stairwell
- Defeating the Shadow Stalker completes extraction
- This is a last-resort escape, not the intended path

### Extraction Bonus

On successful extraction, the player receives a gold bonus of `floor × 15` **only for floors 3 and above**. Floors 1-2 provide no extraction bonus (free extraction, no bonus).

| Floor | Extraction Bonus |
|-------|-----------------|
| 1 | 0 |
| 2 | 0 |
| 3 | 45 |
| 4 | 60 |
| 5 | 75 |

### On Successful Extraction

1. Player keeps all carried items (worn equipment + backpack items + consumables found this run)
2. Gold earned this run + extraction bonus transfers to persistent gold
3. At camp, the player can deposit items to stash (from extracted inventory). Items that don't fit in stash (10 slots max) are discarded — player must choose what to keep.
4. Dread resets to 0
5. Emit EXTRACTION_COMPLETED event

---

## Dread System

### Overview

Dread is a 0-100 mental strain meter. As Dread rises, the game's displayed information becomes unreliable. The core game state is always correct — only the presentation layer corrupts what the player sees.

### Dread Sources

| Source | Dread Gain |
|--------|------------|
| Room cleared (Floor 1-2) | +5 |
| Room cleared (Floor 3-4) | +8 |
| Room cleared (Floor 5) | +10 |
| Trapped chest opened | +10 |
| Successful flee | +8 |

**"Room cleared" trigger by room type:**
- **Combat rooms:** Dread gain triggers on enemy defeat (not on room entry or flee)
- **Treasure rooms:** Dread gain triggers on opening the chest
- **Empty rooms:** Dread gain triggers on entering the room
- **Stairwell/Boss rooms:** No separate Dread gain (stairwell grants -5 Dread recovery; boss room Dread comes from the combat within it)

### Dread Recovery

| Method | Effect |
|--------|--------|
| Reaching a stairwell | -5 Dread |
| Torch consumable | -5 Dread (max 3 uses per run) |
| Return to Camp | Reset to 0 |

### Dread Thresholds

| Range | Name | Corruption Chance | Effects |
|-------|------|-------------------|---------|
| 0-49 | Calm | 0% | Normal gameplay |
| 50-69 | Uneasy | 5% | Displayed info may be wrong (enemy HP shown ±20%) |
| 70-84 | Shaken | 15% | More wrong info, whisper messages appear in text |
| 85-99 | Terrified | 25% | Heavy corruption, hallucination messages |
| 100 | Breaking Point | N/A | The Watcher spawns immediately |

### Corruption Architecture

The Dread system's "unreliable narrator" is split between Core and Presentation:

| Layer | Responsibility |
|-------|----------------|
| **Core (DreadSystem)** | Tracks Dread value, determines corruption chance based on threshold, calculates what information should be uncertain (e.g., enemy HP display range = actual ±20%) |
| **Presentation** | Renders the uncertainty. CLI: shows wrong numbers, inserts whisper text. Agent: returns uncertainty ranges in JSON. |

The Core exposes a `DreadUncertainty` query that returns:
- Current Dread level name
- Corruption chance (0, 0.05, 0.15, or 0.25)
- For each corruptible value: the actual value and the display range

**Critical rule**: Dread corrupts DISPLAY only. Actual game state is always correct. Player inputs always work correctly.

### Clarity Potion Effect

When used, the Clarity Potion suppresses all Dread display corruption for 3 rooms. The session tracks remaining rooms of clarity. While active, corruption chance is treated as 0 regardless of Dread level. The Dread value itself is not reduced.

---

## Death Handling

### On Player Death

1. **Identify killer**: Record which enemy killed the player
2. **Bestiary unlock**: Increment `deathsTo` for the killing enemy. Check tier upgrade thresholds:
   - 1 death → unlock Tier 2 (HP + damage range) if not already unlocked
   - 2 deaths → unlock Tier 3 (special abilities) if not already unlocked
3. **Lose items**: All items carried during this run are permanently lost (including items brought from stash)
4. **Lose run gold**: `goldEarnedThisRun` is discarded, persistent gold is unchanged
5. **Display "Lesson Learned"**: Presentation shows the death screen with the enemy name, what was learned, and bestiary update notification
6. **Phase transition**: GameState phase moves to DEAD, then back to CAMP on acknowledgment
7. Dread resets to 0

### Death Does NOT Affect

- Persistent gold (only run gold is lost)
- Stash contents (items left in stash are always safe)
- Existing bestiary entries (only grows, never shrinks)

---

## Stash System

### Rules

- Maximum 10 item slots
- Player can deposit and withdraw items only at Camp (not during a run)
- Before entering a dungeon, player can bring up to 2 items from stash
- Maximum 1 consumable from stash per run (the second item must be equipment)
- Items brought from stash into the dungeon are at risk: lost permanently on death
- Items left in stash are always safe

### Stash Actions

Available only during CAMP phase:
- View stash contents
- Deposit item to stash (from post-extraction inventory)
- Withdraw item from stash (to prepare for next run)
- Enter dungeon with selected items

---

## Camp System

### Camp Phase

Camp is the between-runs hub. It is purely functional menus with no NPCs for MVP.

### Available Actions at Camp

1. **Enter Dungeon** — Start a new run. Select up to 2 items from stash to bring (max 1 consumable). Begins dungeon generation for Floor 1.
2. **Manage Stash** — View, deposit, and withdraw items. Shows slot usage (e.g., "4/10 items").
3. **View Bestiary** — Browse discovered enemy entries at their current unlock tier. Shows progress (e.g., "3/6 enemies known").
4. **Quit** — Exit the game. Persistent state is saved automatically.

### Camp Display

The camp screen shows:
- Current persistent gold total
- Stash slot usage
- Bestiary progress
- Menu options

---

## Character

### Starting Character

Every run begins with the same character:
- **HP:** 55 (35 base + 15 from 3 VIGOR + 5 from Tattered Leathers)
- **Stats:** VIGOR 3, MIGHT 3, CUNNING 3
- **Equipment:** Rusty Sword (weapon), Tattered Leathers (armor)
- **No leveling** — power progression comes entirely from gear found/stashed

### Stat Effects

| Stat | Effect |
|------|--------|
| VIGOR | +5 HP per point |
| MIGHT | +1 weapon damage per point |
| CUNNING | +3% crit chance per point, +5% flee chance per point |

### Derived Stats

- **Max HP** = 35 (base) + (VIGOR × 5) + armor HP bonus
- **Damage** = weapon damage (random in range) + MIGHT
- **Crit Chance** = 5% (base) + (CUNNING × 3%) + weapon critBonus (e.g., Iron Longsword adds 5%)
- **Crit Multiplier** = 2×
- **Flee Chance** = base flee chance + (CUNNING × 5%)

---

## Run Inventory

### How Items Work During a Run

When the player finds an item (from a chest or enemy drop):
- **Equipment (weapon/armor):** If the item is a direct upgrade to the currently equipped item in that slot, the player is prompted to equip it. The replaced item goes into the backpack. If the player declines, the found item goes into the backpack. There is no backpack size limit for MVP — runs are short enough that hoarding isn't a concern.
- **Consumables:** Added directly to the player's consumable list.

### On Extraction

All items (worn equipment + backpack + consumables) are brought back to camp. At camp, the player can deposit items into the stash (max 10 slots). Any items that don't fit must be discarded — the player chooses which to keep.

### On Death

All items carried during the run are lost — worn equipment, backpack items, and consumables. This includes items brought from stash at the start of the run.

---

## Gold System

### Gold Sources

| Source | Amount |
|--------|--------|
| Plague Rat | 2-5 |
| Ghoul | 4-8 |
| Skeleton Archer | 5-10 |
| Armored Ghoul | 8-15 |
| Shadow Stalker | 12-20 |
| Bone Colossus | 20-35 (not specified in game design; architectural decision based on scaling) |
| Treasure Chest | 10-25 (floor-scaled) |
| Extraction Bonus | Floor × 15 (floors 3+ only) |
| The Watcher | 50-75 |

### Gold Rules

- Gold earned during a run is tracked separately (`goldEarnedThisRun`)
- Gold is only transferred to persistent storage on successful extraction
- Extraction costs are paid from run gold
- On death, all run gold is lost
- Persistent gold at camp persists forever

---

## Persistence

### What Persists Between Runs

- **Stash contents** — items stored safely at camp
- **Gold** — earned through successful extractions
- **Bestiary** — all encounter counts, kill counts, death counts, and tier levels

### What Does NOT Persist

- Character stats (same every run, no leveling)
- Items carried when you die
- Gold earned in a failed run (death)
- Dread (resets to 0 at camp)

### Save Format

Persistent state is saved to a JSON file. Only `PersistentState` needs to be saved — everything else is regenerated each run.

---

## Actions

### Action Types by Phase

**Camp:**
- ENTER_DUNGEON (with list of item IDs to bring from stash)
- VIEW_STASH
- VIEW_BESTIARY
- DEPOSIT_TO_STASH (itemId)
- WITHDRAW_FROM_STASH (itemId)
- QUIT

**Dungeon (exploring):**
- MOVE_TO_ROOM (roomId)
- DESCEND_FLOOR (at stairwell)
- EXTRACT (at stairwell)
- OPEN_CHEST (in treasure room)

**Combat:**
- ATTACK
- DEFEND
- USE_ITEM (itemId)
- FLEE

### Action Validation

The engine validates every action against current state:
- ENTER_DUNGEON: max 2 items, max 1 consumable, all items must be in stash
- MOVE_TO_ROOM: roomId must be adjacent to current room
- DESCEND_FLOOR: must be in stairwell room
- EXTRACT: must be in stairwell room, player must be able to pay floor cost
- DEFEND: must not be on cooldown
- FLEE: must not be turn 1, must not be a boss fight (where canFlee is false)
- USE_ITEM: item must be in player's consumable inventory

### ActionResult

Every action returns:
- success: boolean
- error message (if failed)
- list of GameEvents describing what happened
- the new GameState

---

## Event System

Events are:
- **Facts** — describe what happened, not what should happen
- **Synchronous** — emitted during action execution, included in ActionResult
- **For presentation** — Core doesn't care if anyone listens
- **For analytics** — same events drive both display and logging

### Event Types

**Combat events:**
- DAMAGE_DEALT (source: player/enemy, amount, isCrit)
- DAMAGE_BLOCKED (original amount, reduced amount)
- ENEMY_DIED (enemyId, gold dropped, item dropped)
- PLAYER_DIED (cause, floor, dread)
- FLEE_ATTEMPTED (success, dread gained)
- COMBAT_STARTED (enemyId, enemyName)
- COMBAT_ENDED (outcome: VICTORY/FLED/DEATH)

**Dread events:**
- DREAD_CHANGED (old value, new value, source description)
- DREAD_THRESHOLD_CROSSED (which threshold)
- WATCHER_SPAWNED

**Exploration events:**
- ROOM_ENTERED (roomId, room type)
- FLOOR_DESCENDED (new floor number)
- EXTRACTION_COMPLETED (gold earned, items kept)

**Item events:**
- ITEM_FOUND (itemId, itemName)
- ITEM_USED (itemId, effect description)

**Bestiary events:**
- BESTIARY_UNLOCKED (monsterId, new tier)

**Death events:**
- LESSON_LEARNED (killing enemy name, bestiary update info)

---

## Analytics

Analytics captures high-level game events for balance analysis. Events are logged to a JSONL file with context (floor, dread, HP, gold) for each event.

### Analytics Event Types

- **RUN_STARTED** — seed, items brought
- **COMBAT_RESOLVED** — enemy, outcome, turns, damage dealt/taken
- **EXTRACTION_DECISION** — floor, gold at risk, items at risk, dread, choice (continue/extract)
- **RUN_ENDED** — outcome (death/extraction), floor, gold earned, items kept, duration
- **DREAD_THRESHOLD** — which threshold crossed, on which floor

Analytics is an optional observer — the game engine does not depend on it.

---

## State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Presentation calls engine.getState()                        │
│     └─> Returns current GameState                               │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Presentation calls engine.getDreadUncertainty()             │
│     └─> Returns corruption info for display                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Presentation renders state + uncertainty                    │
│     └─> CLI: ASCII with colors | Agent: JSON                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Presentation calls engine.getAvailableActions()             │
│     └─> Returns valid actions for current phase                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Presentation gets action from user/agent                    │
│     └─> getAction() prompts and parses input                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Presentation calls engine.executeAction(action)             │
│     └─> Returns ActionResult { success, events, newState }      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Presentation displays events                                │
│     └─> displayEvents() renders damage, loot, etc.              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                          Loop back to 1
```

---

## Key Interfaces

### GameEngine

The central orchestrator:
- `getState()` — returns current immutable GameState
- `getAvailableActions()` — returns valid actions for current phase
- `getDreadUncertainty()` — returns Dread corruption info for presentation
- `executeAction(action)` — validates and executes an action, returns ActionResult
- `startNewRun(config)` — begins a new dungeon run with selected stash items and optional RNG seed
- `subscribe(callback)` — register for event notifications (for analytics)
- `serialize()` / `deserialize()` — save/load persistent state

### PresentationAdapter

The interface that both CLI and Agent adapters implement:
- `initialize()` — set up the display
- `render(state, dreadUncertainty)` — draw the current game state
- `getAction(availableActions)` — prompt for and return a valid action
- `displayEvents(events)` — show what happened (damage, loot, etc.)
- `displayError(message)` — show error messages
- `shutdown()` — clean up

### ContentRegistry

Loads and provides read-only access to all game content:
- Item queries: by ID, by slot, by rarity, droppable items for a given floor
- Monster queries: by ID, for a given floor
- Config queries: player, combat, dread, extraction, stash, dungeon configs
- `validate()` — verify all content is internally consistent at startup

---

## Module Responsibilities

| Module | Responsibility | Depends On |
|--------|----------------|------------|
| GameEngine | State machine, action dispatch, event emission | All subsystems, ContentRegistry |
| CombatSystem | Turn resolution, damage calculation, flee/defend mechanics | ContentRegistry, RNG |
| DungeonSystem | Floor/room generation, navigation, room state | ContentRegistry, RNG |
| DreadSystem | Dread tracking, threshold detection, corruption calculation, Watcher spawn trigger | ContentRegistry |
| InventorySystem | Player equipment, consumable management, gold tracking | ContentRegistry |
| StashSystem | Persistent item storage between runs | InventorySystem |
| BestiarySystem | Encounter/kill/death tracking, tier unlock logic | ContentRegistry |
| ContentRegistry | Load and validate all JSON content and configs | File system (startup only) |
| CLI Adapter | Human-readable terminal I/O, ASCII maps, color formatting | GameEngine |
| Agent Adapter | Structured JSON I/O for AI players | GameEngine |
| Persistence | Save/load PersistentState to JSON file | File system |
| Analytics | Log game events to JSONL for balance analysis | File system |
| RNG | Injectable, seedable pseudo-random number generator | None |

---

## Implementation Order

### Phase 1: Foundation
1. Project setup (TypeScript, test framework, linting)
2. Type definitions (state, actions, events, content types, config types)
3. Balance config files (all tunable values from game design)
4. Content Registry skeleton (loading and typed accessors)

### Phase 2: Core Systems
5. RNG module (seedable, injectable)
6. GameEngine skeleton (state machine, action dispatch)
7. Combat system (4 actions, turn flow, damage formulas, telegraphs)
8. Dungeon system (floor generation, room graph, navigation)
9. Dread system (thresholds, corruption calculation, Watcher trigger)

### Phase 3: Content and Persistence
10. Content definition files (8 items, 7 monsters)
11. Content Registry full implementation (validation, queries)
12. Inventory system (equipment, consumables, gold)
13. Stash system (persistent storage, bring-item rules)
14. Bestiary system (encounter tracking, tier unlocks)
15. JSON persistence (save/load PersistentState)

### Phase 4: Presentation
16. CLI Adapter (ASCII rendering, input parsing, color)
17. Agent Adapter (JSON I/O for AI players)
18. Dread display corruption (unreliable narrator rendering)

### Phase 5: Polish
19. Analytics logging
20. Death flow ("Lesson Learned" screen)
21. Extraction flow (cost payment, bonus calculation)
22. Integration testing

---

## Design Constraints (from Game Design)

These are non-negotiable constraints that the architecture must enforce:

- **No stamina system** — combat has no stamina resource
- **No status effects** — no poison, bleed, stun, etc. (deferred to post-MVP)
- **No leveling** — character stats are the same every run; power comes from gear
- **No classes/unlocks** — single starting character
- **No multi-enemy combat** — all fights are 1v1
- **No camp NPCs** — camp is purely functional menus
- **No item identification** — all items are immediately usable
- **8 items total** for MVP (3 weapons, 2 armor, 3 consumables)
- **5 common enemies + 2 bosses** (Bone Colossus + The Watcher) for MVP
- **Target fight length:** 3-5 turns for basic enemies, 6-10 turns for bosses
- **Session target:** 10-20 minutes per run

---

*Document version: 2.1*
*Updated: 2026-02-08*
