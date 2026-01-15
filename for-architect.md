# Architect Reference

This document contains design considerations and requirements that should be addressed during the architect phase. These are cross-cutting concerns that affect multiple systems.

---

## Presentation Layer Separation

**The game core must be completely independent from its presentation layer.** While the initial implementation uses a CLI interface, the architecture must support replacing or extending this with alternative interfaces (graphical UI, web client, mobile app) without modifying game logic.

### Architectural Principle

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  CLI/Text   │  │  Future UI  │  │  Agent Mode (JSON)  │  │
│  │  Interface  │  │  (Graphics) │  │  for AI Players     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Core API                           │
│  • State queries (get player, get room, get enemies)        │
│  • Action commands (attack, move, use item, extract)        │
│  • Event subscriptions (on damage, on death, on loot)       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Core                               │
│  Combat • Exploration • Dread • Loot • Progression          │
└─────────────────────────────────────────────────────────────┘
```

### Core vs. Presentation Responsibilities

| Belongs in Core | Belongs in Presentation |
|-----------------|-------------------------|
| Game state management | Rendering game state to screen |
| Combat resolution | Combat animations/effects |
| Loot generation | Item display formatting |
| Dread calculations | Dread visual effects (text corruption, UI distortion) |
| Valid action determination | Input parsing and command interpretation |
| Event emission | Event visualization (damage numbers, notifications) |
| Save/load logic | Save/load UI prompts |
| Profile data management | Profile selection screens |

### Design Requirements

| Requirement | Description |
|-------------|-------------|
| **No I/O in Core** | Core never reads keyboard, prints to screen, or renders. It only processes commands and returns state. |
| **Pure Game Logic** | Core functions are deterministic given the same inputs. Side effects (RNG) are injected. |
| **Event-Driven Updates** | Core emits events (damage dealt, item found, Dread increased). Presentation subscribes and visualizes. |
| **State Queries** | Presentation can query any observable game state at any time. Core doesn't push—presentation pulls. |
| **Command Interface** | All player actions go through a unified command interface. Presentation translates input into commands. |
| **Validation in Core** | Core validates all commands and returns errors. Presentation displays errors but doesn't validate. |

### Interface Contract

The Game Core exposes a clean API that any presentation layer implements against:

```
// Pseudocode - actual implementation language TBD

interface GameCore {
  // State queries
  getGameState(): GameState
  getAvailableActions(): Action[]
  getPlayer(): PlayerState
  getCurrentRoom(): RoomState

  // Commands
  executeAction(action: Action): ActionResult
  startNewRun(config: RunConfig): void
  extractFromDungeon(): ExtractionResult

  // Events
  onEvent(eventType: EventType, callback: (event) => void): void

  // Persistence
  saveGame(): SaveData
  loadGame(data: SaveData): void
}
```

### Dread and Presentation

The Dread system's "unreliable narrator" effects are a presentation concern, not a core concern:

- **Core responsibility**: Calculate Dread level, determine what information is "blurred" (enemy count uncertainty, hidden stats)
- **Presentation responsibility**: Render the blurred information appropriately (CLI: fuzzy text; GUI: visual distortion; Agent: JSON ranges)

The core returns something like `{ enemies: { count: "uncertain", range: [2, 4] } }` and each presentation layer decides how to display uncertainty.

### Benefits

| Benefit | Description |
|---------|-------------|
| **Testability** | Core can be unit tested without mocking I/O. Feed commands, assert state. |
| **AI Agent Support** | Agent mode is just another presentation layer—already designed for this. |
| **Future Flexibility** | Add graphical UI without rewriting game logic. |
| **Parallel Development** | UI team and logic team can work independently against the API contract. |
| **Modding Potential** | Third parties can create alternative interfaces. |

### Implementation Notes

- Use dependency injection to provide presentation-specific implementations to core if needed
- Core should have zero imports from presentation modules
- Consider a "headless" mode that runs core with no presentation for automated testing
- The CLI and Agent Mode interfaces described elsewhere in this document are both presentation layer implementations

---

## Data-Driven Configuration

**All game balance values must be in external JSON config files, NOT hardcoded in source.**

Store configs in a `configs/` folder. Files should be human-readable and easily modifiable without touching code.

**Key principle**: If a designer might want to tweak it, it belongs in config.

**Config files to create:**

| File | Contents |
|------|----------|
| `configs/player.json` | Base stats, level-up gains, stamina values |
| `configs/combat.json` | Damage formulas, status effect durations, flee chances |
| `configs/dread.json` | Thresholds, effects per level, gain/decay rates |
| `configs/extraction.json` | Corruption rates, Waystone costs, floor extraction rules |
| `configs/stash.json` | Capacity, bring limits, legendary restrictions |
| `configs/loot.json` | Drop rates, rarity weights, item pool definitions |
| `configs/veteran_knowledge.json` | Unlock thresholds for all knowledge types |
| `configs/dungeons/*.json` | Per-dungeon: enemy roster, floor layout, boss stats |
| `configs/agent_mode.json` | Agent output format, state verbosity, action syntax |
| `configs/profiles.json` | Default profile settings, naming rules |

**Why:** Enables rapid balance iteration without code changes. Designer can tweak values directly.

When designing any system, the architect must identify which values are tunable and specify their config location.

### Content Definitions (Items, Monsters, etc.)

**All game content entities must be defined in JSON files, not hardcoded in source.** This includes items, monsters, status effects, skills, room types, events, and any other game content that could be added, removed, or modified without changing game logic.

**Content directory structure:**

```
content/
├── items/
│   ├── weapons/
│   │   ├── rusty_sword.json
│   │   ├── vampiric_blade.json
│   │   └── ...
│   ├── armor/
│   ├── consumables/
│   └── accessories/
├── monsters/
│   ├── common/
│   │   ├── skeleton_warrior.json
│   │   ├── cave_rat.json
│   │   └── ...
│   ├── elites/
│   └── bosses/
├── status_effects/
│   ├── bleed.json
│   ├── poison.json
│   └── ...
├── skills/
├── events/
├── rooms/
├── shrines/
├── traps/
└── loot_tables/
```

**Content categories:**

| Directory | Contents |
|-----------|----------|
| `content/items/weapons/` | Individual weapon files (stats, effects, rarity, name, flavor text) |
| `content/items/armor/` | Armor pieces (defense values, set bonuses, slot types) |
| `content/items/consumables/` | Potions, scrolls, food (effects, durations, stacking rules) |
| `content/items/accessories/` | Rings, amulets, trinkets (passive effects, procs) |
| `content/monsters/common/` | Regular enemy definitions (stats, abilities, loot tables, flavor) |
| `content/monsters/elites/` | Elite variants (modifiers, enhanced drops) |
| `content/monsters/bosses/` | Boss definitions (phases, mechanics, guaranteed drops) |
| `content/status_effects/` | All status effects (bleed, poison, stun—duration, damage, stacking) |
| `content/skills/` | Player abilities (costs, effects, cooldowns, descriptions) |
| `content/events/` | Random encounter definitions (triggers, choices, outcomes, dialogue) |
| `content/rooms/` | Room type templates (layouts, spawn rules, interactables) |
| `content/shrines/` | Shrine types (blessings, curses, costs) |
| `content/traps/` | Trap definitions (damage, triggers, disarm difficulty) |
| `content/loot_tables/` | Drop table definitions (weights, conditions, pools) |

**One file per entity.** Each item, monster, or other content piece gets its own JSON file. Benefits:
- Easier version control (no merge conflicts on single large file)
- Simpler to find and edit specific content
- Can add/remove content by adding/removing files
- File name = entity ID (e.g., `rusty_sword.json` → ID is `rusty_sword`)

**Example item file:**

```json
// content/items/weapons/vampiric_blade.json
{
  // Mechanical properties (Engineer writes)
  "slot": "weapon",
  "rarity": "rare",
  "base_damage": [8, 14],
  "damage_type": "physical",
  "effects": [
    { "type": "on_hit", "effect": "lifesteal", "value": 0.1 }
  ],
  "requirements": { "might": 5 },
  "sell_value": 150,
  "drop_weight": 10,

  // Narrative properties (Narrative Agent writes—engineers use placeholders)
  "name": "Vampiric Blade",
  "flavor_text": "The blade drinks deep."
}
```

**Example monster file:**

```json
// content/monsters/common/skeleton_warrior.json
{
  // Mechanical properties (Engineer writes)
  "type": "undead",
  "base_stats": {
    "hp": [15, 25],
    "damage": [3, 6],
    "armor": 2,
    "speed": 3
  },
  "abilities": ["shield_block"],
  "resistances": { "pierce": 0.5, "blunt": -0.25 },
  "weaknesses": ["holy"],
  "loot_table": "skeleton_loot",
  "xp_value": 10,
  "dread_on_kill": -2,
  "spawn_floors": [1, 5],
  "spawn_weight": 80,

  // Narrative properties (Narrative Agent writes—engineers use placeholders)
  "name": "Skeleton Warrior",
  "flavor_text": "Bones held together by malice alone."
}
```

**Separation principle:**

| Config Type | Location | Purpose |
|-------------|----------|---------|
| **Balance values** | `configs/` | Numbers that tune existing mechanics (damage multipliers, thresholds, rates) |
| **Content definitions** | `content/` | Actual game entities (what exists in the game world) |

**Why separate content from balance:**
- Content files define WHAT exists (new sword, new monster)
- Config files define HOW systems behave (damage formula, drop rate curves)
- A designer adding a new item only touches `content/`
- A designer tuning difficulty only touches `configs/`

### Content Registry Module

**A dedicated module should handle all content and config loading.** Game systems should never read JSON files directly—they query the registry.

**Responsibilities:**

| Responsibility | Description |
|----------------|-------------|
| **Loading** | Read all JSON files from `content/` and `configs/` at startup |
| **Validation** | Check for missing fields, invalid references, type mismatches, duplicate IDs |
| **Caching** | Parse once, serve from memory |
| **Lookup API** | Provide typed accessors for all content types |
| **Error reporting** | Clear, actionable errors on invalid content |

**Interface concept:**

```
interface ContentRegistry {
  // Items
  getItem(id: string): Item
  getItemsByType(type: ItemType): Item[]
  getItemsByRarity(rarity: Rarity): Item[]

  // Monsters
  getMonster(id: string): Monster
  getMonstersByDungeon(dungeonId: string): Monster[]
  getMonstersForFloor(floor: number): Monster[]

  // Status Effects
  getStatusEffect(id: string): StatusEffect

  // Config values
  getConfig(path: string): any  // e.g., getConfig("dread.thresholds.blur_enemy_count")
  getDreadConfig(): DreadConfig
  getCombatConfig(): CombatConfig

  // Loot
  getLootTable(id: string): LootTable
  rollLoot(tableId: string, context: LootContext): Item[]
}
```

**Why centralized:**
- Single point of validation—catch errors at startup, not mid-game
- Systems depend on typed interfaces, not file paths
- Easy to mock for testing
- Enables hot-reloading without changing consumer code

**Hot-reloading (development mode):** Content changes should be reloadable without restarting the game. The registry watches for file changes and reloads affected content. Game systems automatically see updated values on next query.

---

## Narrative Content Workflow

**Neither architects nor engineers write lore, flavor text, or narrative content.** A dedicated `dark-fantasy-narrative` agent handles all player-facing text. This is a **workflow discipline**, not a file structure—all properties of an entity (mechanical and narrative) live in the same file.

### Role Boundaries

| Role | Responsibility | Does NOT Do |
|------|----------------|-------------|
| **Architect** | Defines what text fields exist (item has `name`, `flavor_text`, `lore`) | Write actual flavor text |
| **Engineer** | Implements systems, uses placeholder text in text fields | Invent names, descriptions, dialogue |
| **Narrative Agent** | Populates text fields after systems are functional | Touch mechanical values or code |

### Single File Per Entity

An entity is a unified concept. A weapon's damage, name, and flavor text are all properties of one thing—they belong together:

```json
// content/items/weapons/vampiric_blade.json — COMPLETE ENTITY
{
  // Mechanical properties (Engineer)
  "slot": "weapon",
  "rarity": "rare",
  "base_damage": [8, 14],
  "damage_type": "physical",
  "effects": [
    { "type": "on_hit", "effect": "lifesteal", "value": 0.1 }
  ],
  "requirements": { "might": 5 },
  "sell_value": 150,
  "drop_weight": 10,

  // Narrative properties (Narrative Agent)
  "name": "Vampiric Blade",
  "flavor_text": "The blade drinks deep.",
  "lore": "Forged in the blood pits of Khael'dur, this weapon hungers eternally.",
  "inspect_text": "Dark veins pulse along the steel. It feels warm to the touch."
}
```

**Why unified files:**
- Conceptual integrity—one entity, one file
- Narrative agent sees mechanical context when writing (lifesteal → "drinks deep")
- No file matching, merging, or orphan detection needed
- Simpler Content Registry implementation

### Text Field Conventions

Standard text field names across all content types:

| Field | Purpose | Used In |
|-------|---------|---------|
| `name` | Display name | All entities |
| `flavor_text` | Short atmospheric text | Items, monsters, locations |
| `lore` | Extended backstory (often unlockable) | Items, monsters, factions |
| `inspect_text` | Detailed examination description | Items, interactables |
| `description` | Functional description | Skills, status effects |
| `dialogue` | NPC speech | Events, encounters |
| `death_cry` | Message on death | Monsters |

### Placeholder Conventions

Engineers use obvious placeholders in text fields:

| Placeholder Format | Example | Purpose |
|-------------------|---------|---------|
| `[FIELD_TYPE]` | `"name": "[NAME]"` | Generic placeholder |
| `[ENTITY_FIELD]` | `"flavor_text": "[VAMPIRIC_BLADE_FLAVOR]"` | Specific placeholder |
| Generic text | `"flavor_text": "A weapon."` | Functional but bland |

**Finding incomplete text:** `grep -r '"\[.*\]"' content/` returns all placeholders awaiting narrative.

### Workflow

```
1. Architect designs system
   → Specifies which text fields each entity type needs
   → Documents field purposes in architecture spec

2. Engineer implements
   → Creates content files with mechanical values
   → Uses [PLACEHOLDER] or generic text in narrative fields
   → System is fully functional with placeholder text

3. Narrative Agent populates
   → Edits content files, touching ONLY text fields
   → Writes contextually appropriate text (can see mechanical properties)
   → Replaces placeholders with final prose

4. Validation
   → Content Registry flags unresolved [PLACEHOLDER] patterns
   → Game is complete when all placeholders resolved
```

---

## Analytics for AI Analysis

**All player actions and game events should be logged for AI-driven analysis.** The goal is to enable automated balance recommendations, detect design flaws, and understand player behavior at scale.

Store analytics in structured format (JSON lines or similar). Design the schema in the architect phase—this is a cross-cutting concern that affects many systems.

### Player Behavior Tracking

| Category | Events to Log |
|----------|---------------|
| **Decision Points** | Extract vs. continue choices, Dread level at decision, floor depth, inventory value at risk |
| **Combat Actions** | Action type, target selection, turn order, stamina spent, damage dealt/received |
| **Resource Management** | Item usage timing, gold spending patterns, stash deposits/withdrawals |
| **Risk Assessment** | Items brought into runs, Dread tolerance (extraction threshold), elite engagement vs. avoidance |
| **Exploration** | Rooms visited vs. skipped, time per room, backtracking frequency |

### Balance Health Metrics

| Metric | What It Reveals |
|--------|-----------------|
| **Win/Loss by Context** | Per dungeon, per floor, per enemy type, per Dread level |
| **Death Cause Analysis** | What kills players? Spike damage, attrition, resource exhaustion, bad RNG? |
| **Item Usage Rates** | Which items are meta? Which are vendor trash? Which are never used? |
| **Build Distribution** | Are all stat allocations viable or is one dominant? |
| **Time-to-Kill** | Per enemy type—identifies outliers (too easy/hard) |
| **Economy Flow** | Gold sources vs. sinks, inflation detection, Waystone cost impact |
| **Dread Curves** | How fast does Dread accumulate? Where do players hit thresholds? |

### Engagement & Retention Signals

| Signal | Purpose |
|--------|---------|
| **Session Length Distribution** | Are sessions hitting the 5-30 min target? |
| **Extraction Timing** | When do players choose to leave? Too early = fear. Too late = greed. |
| **Retry Rates** | After death: immediate retry, delayed, or quit? |
| **Drop-off Points** | Where do new players abandon runs? Tutorial? First boss? |
| **Veteran Knowledge Engagement** | Do players read/use unlocked information? |
| **Content Completion** | Which dungeons/quests are popular vs. ignored? |

### System-Specific Analytics

| System | Key Questions |
|--------|---------------|
| **Dread** | Does high Dread create tension or frustration? Do players push limits or play safe? |
| **Extraction Dilemma** | Is the risk/reward compelling? Are free floors (1-2) too safe? |
| **Death as Discovery** | Do unlocks feel valuable? Do players read Lessons Learned? |
| **Stash System** | Are players using bring slots? What items do they risk? |
| **Veteran Knowledge** | Which knowledge types are most valued? Unlock pacing appropriate? |

### AI Analysis Opportunities

The architect should design analytics with these AI use cases in mind:

| Use Case | Description |
|----------|-------------|
| **Automated Balance Recommendations** | AI suggests config value changes based on outlier detection |
| **Anomaly Detection** | Flag potential exploits, broken mechanics, or degenerate strategies |
| **Player Segmentation** | Identify playstyles (cautious, aggressive, completionist, speedrunner) |
| **Predictive Modeling** | Predict run outcomes, churn risk, or player frustration |
| **Difficulty Calibration** | Per-player or per-segment difficulty adjustment recommendations |
| **Content Gap Analysis** | Identify missing item tiers, enemy variety gaps, or underserved playstyles |
| **A/B Test Analysis** | Compare player metrics across experimental config variations |

### Implementation Notes

- **Privacy-first**: No PII. Player ID should be anonymized/hashed.
- **Timestamps**: All events need timestamps for session reconstruction.
- **Context**: Log game state context (floor, Dread, HP, inventory) with each event.
- **Versioning**: Tag events with game version and config version.
- **Aggregation**: Raw events + pre-computed daily/weekly aggregates for efficiency.

**Config file to add:** `configs/analytics.json` — defines which events to track, sampling rates, and retention policies.

---

## AI Agent Playability

**The game must support AI agents (e.g., Claude Code) as players.** This enables automated playtesting, balance analysis, and AI-vs-game experimentation. The CLI interface should be parseable by both humans and machines.

### Design Requirements

| Requirement | Description |
|-------------|-------------|
| **Structured Output Mode** | A flag or mode that outputs game state as JSON instead of (or alongside) human-readable text |
| **Deterministic Command Interface** | Commands must be unambiguous strings an AI can construct programmatically |
| **Complete State Visibility** | AI must query full observable game state (HP, inventory, map, enemies, Dread) on demand |
| **No Timing Dependencies** | Turn-based with explicit "end turn" or "confirm action"—no real-time inputs |
| **Reproducible Sessions** | Seed-based RNG for reproducible runs when testing AI strategies |

### Interface Modes

| Mode | Output | Input | Use Case |
|------|--------|-------|----------|
| **Human (default)** | Formatted text, ASCII art, colors | Natural CLI commands | Normal play |
| **Agent** | JSON state dumps, structured responses | Exact command strings | AI players, automated testing |

### Agent Mode Behavior

When running in agent mode:

- **State Response**: Every action returns a JSON object with complete observable game state
- **Available Actions**: Each state includes a list of valid actions the agent can take
- **Action Format**: Actions are simple string commands (e.g., `"attack goblin_1"`, `"use potion"`, `"move north"`)
- **No Ambiguity**: Invalid commands return an error with valid alternatives—never guess intent
- **Dread Effects**: Dread still affects information quality (blurred enemy counts become `"enemies": "2-4"` instead of exact numbers)

### Example Agent Interaction

```json
// State after entering a room
{
  "location": {"dungeon": "crypt", "floor": 2, "room": "antechamber"},
  "player": {"hp": 45, "max_hp": 60, "stamina": 3, "dread": 35},
  "enemies": [
    {"id": "skeleton_1", "type": "skeleton", "hp_estimate": "low"},
    {"id": "skeleton_2", "type": "skeleton", "hp_estimate": "full"}
  ],
  "available_actions": ["attack skeleton_1", "attack skeleton_2", "use potion", "flee", "inspect"],
  "inventory": [...],
  "effects": ["bleeding"]
}

// Agent sends: "attack skeleton_1"
// Game returns new state after attack resolution
```

### Integration with Analytics

AI agent sessions should be tagged in analytics:
- `"player_type": "ai_agent"` vs `"human"`
- Agent identifier (model/version)

This separation ensures AI data doesn't pollute human player metrics and enables AI-vs-human behavior comparison.

---

## Profile System

**The game must support multiple player profiles.** Each profile is an independent save state with its own progression, stash, unlocks, and analytics.

### Storage Structure

Profiles are stored in a `profiles/` directory within the project. Each profile is a folder named after the profile:

```
profiles/
├── default/
│   ├── save.json           # Character state, current run progress
│   ├── stash.json          # Persistent item storage
│   ├── unlocks.json        # Veteran Knowledge, bestiary, unlocked content
│   ├── settings.json       # Profile-specific settings
│   └── analytics/          # Profile-specific event logs
│       ├── events.jsonl
│       └── aggregates.json
├── speedrunner_test/
│   └── ...
├── ai_agent_01/
│   └── ...
└── ...
```

### Profile Requirements

| Requirement | Description |
|-------------|-------------|
| **Isolation** | Profiles are completely independent—no shared state |
| **Named Folders** | Profile name = folder name (sanitized for filesystem safety) |
| **Default Profile** | `default` profile created automatically on first launch |
| **Profile Selection** | CLI argument or interactive selection at startup |
| **Profile Creation** | Command to create new profile from scratch |
| **Profile Deletion** | Remove profile folder (with confirmation) |
| **Profile Listing** | Command to list all available profiles |

### CLI Interface

```bash
# Start with specific profile
darkdelve --profile speedrunner_test

# List profiles
darkdelve --list-profiles

# Create new profile
darkdelve --new-profile "my_new_run"

# Delete profile (requires confirmation)
darkdelve --delete-profile "old_profile"
```

### Profile Metadata

Each profile maintains metadata in `profile.json`:

```json
{
  "name": "speedrunner_test",
  "created_at": "2026-01-15T10:30:00Z",
  "last_played": "2026-01-20T18:45:00Z",
  "player_type": "human",
  "total_runs": 47,
  "game_version": "0.3.0"
}
```

### AI Agent Profiles

When an AI agent plays, it should use a dedicated profile:
- Tagged with `"player_type": "ai_agent"` in metadata
- Keeps AI progression separate from human play
- Enables comparison analysis between AI and human profiles

### Portability

- Profiles are self-contained folders—copy/move to backup or share
- No external dependencies (database, registry, etc.)
- Human-readable JSON for manual inspection/editing

---

## Future Architect Topics

Additional cross-cutting concerns to be designed:

- Event bus / message passing architecture
- Modding support considerations
- Accessibility features
- Localization architecture
