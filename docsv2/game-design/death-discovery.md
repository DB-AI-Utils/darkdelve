# Death & Discovery

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Death is not punishment—it's reconnaissance. Every death unlocks information: enemy weaknesses, lore fragments, warnings for future runs.

---

## Death Economy

Death in DARKDELVE follows one simple rule:

### Full Loss on Death

```
DEATH = FULL LOSS
-----------------
Everything you carried into the dungeon is LOST:
  - All equipped items
  - All carried items
  - All gold collected this run

"The dungeon claims everything. Only your knowledge survives."
```

**Only your stash (back at camp) is safe.** This is intentional—it creates maximum tension for the extraction dilemma.

---

## Why Full Loss Works

The complex survival rules (equipped + identified = safe, etc.) actually *weakened* the extraction dilemma:

| Old System | New System |
|------------|------------|
| "Is my sword identified? I'm safe to push deeper." | "I have a great sword... do I risk losing it?" |
| Mental accounting of item states | Pure risk assessment |
| Rules lawyering | Visceral tension |

Full loss means every room deeper is a genuine gamble. The player's question is always: **"Extract now, or risk everything?"**

### What Makes Full Loss Fair

1. **Clear and simple:** No hidden rules or edge cases
2. **Player controls risk:** You choose when to extract
3. **Stash is truly safe:** Items in camp cannot be lost
4. **Death has value:** Lesson Learned, Veteran Knowledge, bestiary unlocks
5. **Short sessions:** 5-30 minutes means less time "lost"

---

## Pre-Run Warning

When bringing items from stash, display a clear warning:

```
═══════════════════════════════════════════════════════════════
                    EQUIPMENT CHECK
═══════════════════════════════════════════════════════════════

BRINGING FROM STASH:
  [!] Soulreaver's Edge        - Will be LOST if you die
  [!] Ring of Fortune          - Will be LOST if you die

⚠️  WARNING: If you die, ALL items are lost.
    Only your stash remains safe.

───────────────────────────────────────────────────────────────
[1] Begin expedition (accept risk)
[2] Return items to stash
[3] Review stash
```

### Death Screen

```
═══════════════════════════════════════════════════════════════
                    YOU HAVE FALLEN
═══════════════════════════════════════════════════════════════

ITEMS LOST:
  [X] Soulreaver's Edge
  [X] Iron Helm
  [X] Cursed Dagger
  [X] Gold Ring
  [X] 147 gold

The dungeon claims its toll.

───────────────────────────────────────────────────────────────
LESSON LEARNED: +10% damage vs Bone Knight (next run only)
```

### Example Scenarios

| Scenario | Outcome |
|----------|---------|
| Find Epic armor, equip, die | Lost |
| Find Epic armor, equip, identify, die | Lost |
| Bring Legendary from stash, equip, die | Lost |
| Find items, extract successfully | Keep everything |
| Leave items in stash, die | Safe (stash is always safe) |

### What You ALWAYS KEEP

- All meta-unlocks (bestiary, classes, etc.)
- XP gained this run
- Character level
- Veteran Knowledge progress
- Everything in your stash

---

## Lesson Learned Mechanic

Next run starts with +10% damage against enemy type that killed you. Creates narrative continuity and reduces frustration. Display prominently on death screen and at run start.

### Duration Rules

**The charge decrements at expedition START, regardless of outcome.**

| Event | Effect on Lesson Learned |
|-------|-------------------------|
| Enter dungeon | Charge consumed (runsRemaining -= 1) |
| Die during run | Charge NOT restored |
| Extract successfully | Charge already consumed at start |
| Quit mid-run | Charge already consumed at start |

This prevents "die until you win" exploits where players could repeatedly attempt a boss while keeping the damage bonus.

### Display

**On Death Screen:**
```
LESSON LEARNED
  You've learned the Bone Knight's patterns.
  +10% damage vs Bone Knights (next expedition)
```

**At Run Start (if active):**
```
LESSON LEARNED ACTIVE
  +10% damage vs Bone Knights
  "Their weakness is seared into your memory."
```

---

## The Chronicler

An NPC at camp who records your deaths and turns them into knowledge:

```
The Chronicler looks up from her tome.

"Ah, the Fleshweaver claimed you. Let me tell you
what I know of their kind..."

╔═══════════════════════════════════════════════════╗
║  BESTIARY UNLOCKED: Fleshweaver                   ║
╠═══════════════════════════════════════════════════╣
║  Weakness: Fire, Severing                         ║
║  Resists: Poison, Necrotic                        ║
║  Behavior: Life Drain at 50% HP (heals 15 HP)     ║
║  Tip: Burst it down before 50% HP triggers heal   ║
╚═══════════════════════════════════════════════════╝

"Perhaps next time, you'll know their tricks."
```

---

## Death Echoes

Your ghost leaves warnings for future runs:

```
As you enter the chamber, a spectral warning appears:

    "The Shadow Stalker hides in the alcove. I never saw it.
     - Your Ghost, Run #23"

The echo fades.
```

Echoes are auto-generated from death circumstances. 1-2 appear per run from your own history.

---

## Death-Triggered Unlocks

Specific deaths unlock specific rewards:

| Death Condition | Unlock |
|-----------------|--------|
| First death to a boss | Item that counters that boss |
| First death to poison | Antidote recipe unlocked |
| Death with full inventory | "Last Stand" ability |
| Death at exactly 1 HP | "Desperate Gamble" item |
| Death to The Watcher on Floor 3+ | Hollowed One class |

---

## Framing

The death counter reads: **"Expeditions Failed: 47 | Lessons Learned: 47"**

---

## Related Systems

- [Character & Progression](character-progression.md) - Stash system, Veteran Knowledge
- [Save System](save-system.md) - What persists after death
- [Camp System](camp-system.md) - The Chronicler NPC
