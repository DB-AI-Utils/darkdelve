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

## Related Systems

- [Camp System](camp-system.md) - Where saves trigger
- [Death & Discovery](death-discovery.md) - What persists after death
- [Character & Progression](character-progression.md) - Veteran Knowledge persistence
