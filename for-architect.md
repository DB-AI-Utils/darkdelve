# Architect Reference

This document contains design considerations and requirements that should be addressed during the architect phase. These are cross-cutting concerns that affect multiple systems.

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
  "created_at": "2024-01-15T10:30:00Z",
  "last_played": "2024-01-20T18:45:00Z",
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
