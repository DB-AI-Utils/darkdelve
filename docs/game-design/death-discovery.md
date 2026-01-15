# Death & Discovery

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Death is not punishment—it's reconnaissance. Every death unlocks information: enemy weaknesses, lore fragments, warnings for future runs.

---

## Death Economy

Death in DARKDELVE follows a clear priority system to resolve what happens to items:

### Death Item Resolution Priority (highest to lowest)

```
DEATH ITEM RESOLUTION
---------------------
1. BROUGHT from stash -> ALWAYS LOST (overrides everything)
   "You risked it, you lost it."

2. EQUIPPED + IDENTIFIED -> SAFE (returns to stash)
   "You understood it, you keep it."

3. EQUIPPED but UNIDENTIFIED -> LOST
   "You never truly knew what you held."

4. CARRIED (not equipped) -> LOST (regardless of ID status)
   "Only what you wore survives the journey back."

5. GOLD -> LOST (all carried gold)
   "The dungeon claims its toll."
```

---

## Item Risk State Indicators

**Design Principle:** Communicate item risk status BEFORE runs begin and consistently throughout gameplay. Loss must feel FAIR - rules must be clear and consistent.

### Risk State Tags

| Tag | Meaning | Visual | When Applied |
|-----|---------|--------|--------------|
| [SAFE] | In stash, will not be lost | Green | Items sitting in stash |
| [AT RISK] | Brought from stash, lost on death | Red | Stash items selected for run |
| [PROTECTED] | Equipped + identified, survives death | Blue | Found items that meet safety criteria |
| [VULNERABLE] | Equipped but unidentified, lost on death | Yellow | Found items not yet identified |
| [DOOMED] | Carried (not equipped), lost on death | Gray | Inventory items regardless of ID status |

### Pre-Run Equipment Check Display

```
═══════════════════════════════════════════════════════════════
                    EQUIPMENT CHECK
═══════════════════════════════════════════════════════════════

BRINGING FROM STASH:
  [!] Soulreaver's Edge        [AT RISK] - Lost if you die
  [!] Ring of Fortune          [AT RISK] - Lost if you die

CURRENTLY EQUIPPED:
  [~] Tattered Leathers        [PROTECTED] - Identified, survives death
  [?] Iron Helm                [VULNERABLE] - Unidentified, lost on death

WARNING: Items brought from stash are PERMANENTLY LOST on death.
         This cannot be reversed. Proceed with caution.

───────────────────────────────────────────────────────────────
[1] Begin expedition
[2] Return items to stash
[3] Review stash
```

### In-Dungeon Item Display

When viewing inventory during a run, each item shows its risk state:

```
INVENTORY (5/8 slots)
  [DOOMED] Cursed Dagger [UNIDENTIFIED]
  [DOOMED] Gold Ring [+1 CUNNING]
  [DOOMED] Torch x3

EQUIPPED:
  [AT RISK] Soulreaver's Edge [24-31 dmg] - Brought from stash
  [PROTECTED] Tattered Leathers [+5 HP] - Identified
  [VULNERABLE] Iron Helm [UNIDENTIFIED]
```

### Death Screen Item Summary

```
═══════════════════════════════════════════════════════════════
                    YOU HAVE FALLEN
═══════════════════════════════════════════════════════════════

ITEMS LOST:
  [X] Soulreaver's Edge        - Brought from stash (AT RISK)
  [X] Iron Helm                - Unidentified (VULNERABLE)
  [X] Cursed Dagger            - Not equipped (DOOMED)
  [X] Gold Ring                - Not equipped (DOOMED)
  [X] 147 gold

ITEMS PRESERVED:
  [+] Tattered Leathers        - Equipped + Identified (PROTECTED)

───────────────────────────────────────────────────────────────
LESSON LEARNED: +10% damage vs Bone Knight (next run only)
```

### Anti-Gear-Fear Monitoring

Track the percentage of runs where players bring stash items:
- **Healthy:** 40-60% of runs include at least 1 stash item
- **Gear Fear:** <30% of runs include stash items (loss too painful)
- **No Tension:** >80% of runs include stash items (loss not meaningful)

If gear fear is detected (<30%), consider adding:
- Partial recovery system (50% chance to recover 1 lost item)
- "Insurance" consumable that protects 1 brought item
- Reduced stash item power to lower stakes

### Example Scenarios

| Scenario | Outcome |
|----------|---------|
| Find Epic armor, equip, die | Lost (unidentified) |
| Find Epic armor, equip, identify, die | Safe (returns to stash) |
| Bring Epic armor from stash, equip, identify, die | Lost (brought overrides all) |
| Find Legendary, equip, identify, extract | Safe (now in stash) |
| Bring Legendary from stash, die | Lost forever |
| Carry identified item (not equipped), die | Lost (not equipped) |

### What You ALWAYS KEEP

- All meta-unlocks (bestiary, classes, etc.)
- XP gained this run
- Character level
- Veteran Knowledge progress

---

## Lesson Learned Mechanic

Next run starts with +10% damage against enemy type that killed you (persists 1 run). Creates narrative continuity and reduces frustration. Display prominently on death screen and at run start.

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
