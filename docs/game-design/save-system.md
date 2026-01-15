# Save System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

DARKDELVE saves automatically at key moments to protect player progress without enabling save-scumming.

---

## Save Trigger Events

| Event | Saves | Rationale |
|-------|-------|-----------|
| Dungeon extraction | Yes | Run completed successfully, rewards secured |
| Player death | Yes | Run completed (failed), unlocks applied |
| Merchant transaction | Yes | Economic decision is final |
| Stash deposit/withdrawal | Yes | Item management decision is final |
| Item identification | Yes | Resource spent, outcome locked |
| Stash reorganization | No | Cosmetic, no gameplay impact |
| Mid-dungeon | **Never** | Roguelike integrity preserved |

---

## Design Philosophy

Save on **commit actions** — moments when the player makes an irreversible decision. This approach:

- **Protects progress:** Crashes, interruptions, and life events don't erase meaningful work
- **Prevents save-scumming:** Camp actions are already permanent (selling, buying, identifying) — there's no RNG to reroll
- **Aligns with precedent:** Hades, Darkest Dungeon, Slay the Spire, and Dead Cells all save aggressively to protect progress while preserving integrity through irreversible actions

**Player Mental Model:** *"When I do something important, it's saved."*

---

## What Gets Saved

```
SAVE DATA SCHEMA
----------------
character:
  name: string
  class: string (Mercenary, Flagellant, Hollowed One)
  level: number (1-20)
  xp: number
  stats: { vigor, might, cunning }
  equipment: { weapon, armor, helm, accessory }

stash: Item[] (max 12 slots)
gold: number (persistent camp gold)

veteranKnowledge:
  [enemyId]: { encounters: number, deaths: number, tier: 1|2|3 }

bestiary:
  [enemyId]: boolean (discovered/undiscovered)

unlocks:
  classes: string[]
  items: string[] (expanded item pool)
  mutators: string[]

statistics:
  runsCompleted: number
  runsFailed: number
  totalGoldEarned: number
  enemiesKilled: { [enemyId]: number }
  deepestFloor: number
  bossesDefeated: number

lessonLearned: { enemyType: string, runsRemaining: number } | null
  // Decrements at expedition START, not end. Dying does not restore the charge.
  // Set to null when runsRemaining reaches 0.
```

---

## What Is NOT Saved

| Data | Why Not Saved |
|------|---------------|
| Mid-dungeon state | Roguelike integrity — no retry on combat/events |
| Run inventory (on death) | Per Death Economy rules |
| Combat state | Fights must resolve in one session |
| Room contents after flee | Prevents flee-reset exploit |

---

## Session Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CAMP (saved state)                                         │
│    │                                                        │
│    ├─► Merchant transaction ──► AUTO-SAVE                   │
│    ├─► Stash deposit/withdraw ──► AUTO-SAVE                 │
│    ├─► Item identification ──► AUTO-SAVE                    │
│    │                                                        │
│    └─► BEGIN EXPEDITION                                     │
│          │                                                  │
│          │  ┌─────────────────────────────┐                │
│          └─►│     DUNGEON RUN             │                │
│             │     (no saves)              │                │
│             │                             │                │
│             │  Floor 1 ──► Floor 2 ──► ...│                │
│             └──────────────┬──────────────┘                │
│                            │                                │
│              ┌─────────────┴─────────────┐                 │
│              ▼                           ▼                  │
│         EXTRACTION                    DEATH                 │
│         AUTO-SAVE                    AUTO-SAVE              │
│              │                           │                  │
│              └───────────┬───────────────┘                 │
│                          ▼                                  │
│                    RETURN TO CAMP                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Cases

### Player closes game mid-camp-session
- All commit actions (merchant, stash, identification) already saved
- Cosmetic changes (stash slot rearrangement) may be lost — acceptable

### Player closes game mid-dungeon
- Run state is lost
- Player returns to camp with pre-run state
- Thematic: *"You wake in camp. Was it a dream? The dungeon remembers nothing."*

### Game crashes during extraction
- Extraction is atomic — either completes fully or not at all
- If crash before completion: run state lost, return to pre-run camp state
- If crash after completion: extraction rewards saved

---

## Save File Technical Specification

*Added in v1.6 to resolve B-024.*

### Format: JSON

JSON chosen for:
- Human-readable (debugging)
- Cross-platform compatibility
- Easy version migration
- Native support in all target languages

### File Structure

**Single File:** `darkdelve_save.json`

```json
{
  "version": "1.0.0",
  "saveTimestamp": "2026-01-15T14:30:00Z",
  "checksum": "sha256:abc123...",

  "character": {
    "name": "Valdris",
    "class": "Mercenary",
    "level": 5,
    "xp": 340,
    "stats": { "vigor": 4, "might": 5, "cunning": 3 },
    "equipment": {
      "weapon": { "id": "item_001", "templateId": "iron_longsword", "identified": true },
      "armor": { "id": "item_002", "templateId": "chainmail_shirt", "identified": true },
      "helm": null,
      "accessory": { "id": "item_003", "templateId": "copper_ring", "identified": false }
    }
  },

  "stash": [
    { "id": "item_004", "templateId": "soulreaver_axe", "identified": true }
  ],

  "gold": 245,
  "veteranKnowledge": { "ghoul": { "encounters": 15, "deaths": 0, "tier": 2 } },
  "bestiary": { "ghoul": true, "plague_rat": true },
  "unlocks": { "classes": ["Mercenary"], "items": [], "mutators": [] },
  "statistics": { "runsCompleted": 8, "runsFailed": 12, "totalGoldEarned": 1840, "deepestFloor": 5, "bossesDefeated": 1 },
  "lessonLearned": { "enemyType": "shadow_stalker", "runsRemaining": 1 },
  "eventMemory": { "woundedAdventurerHelped": true },
  "settings": { "currentDread": 15 }
}
```

### Version Scheme

**Semantic Versioning:** `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes (requires migration)
- MINOR: New fields (backwards compatible)
- PATCH: Bug fixes

### Checksum

SHA-256 hash of save content (excluding checksum field itself). Used to detect corruption.

### Corruption Recovery

| Scenario | Recovery Action |
|----------|----------------|
| Checksum mismatch | Attempt field-level recovery |
| Malformed JSON | Load backup if exists |
| Missing required field | Use default value + warning |
| No recovery possible | Reset to new game + warning |

### Save Location

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%/DARKDELVE/` |
| macOS | `~/Library/Application Support/DARKDELVE/` |
| Linux | `~/.local/share/DARKDELVE/` |

### Atomic Save Process

```
1. Write to temp file (darkdelve_save.tmp)
2. Verify temp file integrity (read back, check checksum)
3. Rename existing save to backup (darkdelve_save.bak)
4. Rename temp to save (darkdelve_save.json)
5. Delete backup on successful verify
```

This prevents data loss from crashes during write operations.

---

## Related Systems

- [Camp System](camp-system.md) - Where saves trigger
- [Death & Discovery](death-discovery.md) - What persists after death
- [Character & Progression](character-progression.md) - Veteran Knowledge persistence
