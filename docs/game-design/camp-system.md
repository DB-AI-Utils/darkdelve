# Camp System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Camp is the player's home base between dungeon runs. All menu interactions happen here, and the UI must support quick navigation while maintaining the dark fantasy atmosphere.

---

## Design Principles

1. **Respect player time** — Common actions (stash, equip, begin run) should be fast
2. **Surface critical info** — Always show gold, level, XP progress
3. **Communicate risk** — Items brought from stash are at risk; make this visible
4. **Consistent navigation** — Same input patterns across all menus
5. **60-character minimum width** — Ensure terminal compatibility

---

## Global Navigation Rules

| Input | Action |
|-------|--------|
| Number keys | Select numbered menu options |
| [B] | Back one level |
| [ESC] | Return to Camp main menu (confirms if unsaved state) |
| [?] | Help/controls reference |
| [Q] | Quit game (from main menu only) |

---

## Camp Main Menu

Menu ordering matches post-run player intent: stash loot → check upgrades → start next run.

```
══════════════════════════════════════════════════════════════
                    DARKDELVE - THE CAMP
══════════════════════════════════════════════════════════════

  Welcome back, [CHARACTER_NAME]. The darkness awaits.

  [1] STASH                - Manage stored items (8/12)
  [2] EQUIPMENT            - View/change equipped gear
  [3] BEGIN EXPEDITION     - Enter the dungeon
  [4] MERCHANT             - Buy/sell items
  [5] THE CHRONICLER       - Bestiary & lore
  [6] CHARACTER            - Stats, level, progress

  [Q] QUIT GAME

──────────────────────────────────────────────────────────────
  Gold: [GOLD] | Level [LEVEL] ([XP_TO_NEXT] to next) | Stash: [X]/12
  [If Dread > 0: Dread: [DREAD]/100]
══════════════════════════════════════════════════════════════
> _
```

### Status Bar Notes

- **Gold:** Affects merchant, extraction costs
- **Level + XP:** Progress visibility creates "one more run" motivation
- **Stash count:** Alerts player to manage overflow
- **Dread:** Only shown if above 0 (all runs start at 0 Dread)

---

## Begin Expedition Flow

Two-stage process: preparation screen → final confirmation.

### Stage 1: Expedition Preparation

```
BEGIN EXPEDITION
══════════════════════════════════════════════════════════════

CURRENT LOADOUT:
  Weapon:    Rusted Blade (8-12 damage)         [E] Quick-equip
  Armor:     Tattered Leathers (+5 HP)          [E] Quick-equip
  Helm:      (empty)                            [E] Quick-equip
  Accessory: Rat Bone Charm (+2% crit)          [E] Quick-equip

──────────────────────────────────────────────────────────────

BRINGING FROM STASH (0/2):               << WARNING >>
  (None selected)                        Items brought into the
                                         dungeon are LOST if you
CONSUMABLES (0/3):                       die. Choose carefully.
  (None selected)

──────────────────────────────────────────────────────────────
  [1] SELECT ITEMS TO BRING FROM STASH (max 2)
  [2] SELECT CONSUMABLES (max 3)
  [E] QUICK-EQUIP FROM STASH
  [3] CONFIRM & DESCEND

  [B] BACK TO CAMP
══════════════════════════════════════════════════════════════
> _
```

**Quick-Equip Feature:** Players can swap gear directly from this screen without navigating to Equipment menu separately. Reduces friction for the common "upgrade before run" workflow.

### Stage 2: Final Confirmation

```
══════════════════════════════════════════════════════════════
                      FINAL CONFIRMATION
══════════════════════════════════════════════════════════════

  You are about to descend into THE OSSUARY.

  EQUIPPED:
    Weapon: Rusted Blade | Armor: Tattered Leathers
    Helm: (none) | Accessory: Rat Bone Charm

  BRINGING (AT RISK):
    > Bloodstone Ring (rare)
    > Health Potion x2

  ┌─────────────────────────────────────────────────────────┐
  │  If you die, these items are LOST FOREVER.             │
  │  Extraction preserves everything.                       │
  └─────────────────────────────────────────────────────────┘

  [ENTER] DESCEND    [B] GO BACK

══════════════════════════════════════════════════════════════
```

**Risk Visibility:** The "AT RISK" section only appears if bringing stash items. This two-stage confirmation reduces accidental descents with wrong loadouts while maintaining dramatic "point of no return" feel.

---

## Stash Menu

```
STASH
══════════════════════════════════════════════════════════════

  STORED ITEMS (8/12 slots):                    [V] Toggle details

  [1] Bloodstone Ring        Rare Acc    +15% dmg <30% HP
  [2] Iron Pauldrons         Common Arm  +8 armor
  [3] Venom Flask            Unco Cons   Poison weapon 3t
  [4] Bone Dust              Common Mat  Crafting material
  [5] Cryptkeeper's Key      Quest       Opens something...
  [6] Health Potion          Common Cons Restore 30 HP
  [7] Health Potion          Common Cons Restore 30 HP
  [8] Cracked Gemstone       Junk        Sell: 12g

  ── Empty: 4 slots ──

──────────────────────────────────────────────────────────────
  [#] SELECT ITEM    [S] SORT (by: Rarity)    [V] DETAILS    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

**Pagination Rule:** For lists exceeding 9 items, use pagination:
- [N] Next page
- [P] Previous page
- Never use [B] for items (conflicts with Back)

### Item Selected State

```
STASH > Bloodstone Ring
══════════════════════════════════════════════════════════════

  BLOODSTONE RING (Rare Accessory)
  ─────────────────────────────────
  "Hewn from the crystallized blood of a dying god."

  Effect: +15% damage when below 30% HP
  Sell Value: 45 gold

──────────────────────────────────────────────────────────────
  [E] EQUIP    [D] DROP (destroy)    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

**Confirmation Required:** DROP/destroy actions require confirmation ("Are you sure? This cannot be undone.")

---

## Equipment Menu

```
EQUIPMENT
══════════════════════════════════════════════════════════════

  CURRENTLY EQUIPPED:

  [1] WEAPON:    Rusted Blade
                 8-12 physical damage
                 "Pitted and dull, but it still cuts."

  [2] ARMOR:     Tattered Leathers
                 +5 maximum HP
                 "More holes than leather at this point."

  [3] HELM:      (empty)

  [4] ACCESSORY: Rat Bone Charm
                 +2% critical chance
                 "The rat didn't need it anymore."

──────────────────────────────────────────────────────────────
  [1-4] SELECT SLOT TO CHANGE    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

### Slot Selected (showing compatible stash items)

```
EQUIPMENT > WEAPON SLOT
══════════════════════════════════════════════════════════════

  EQUIPPED: Rusted Blade (8-12 damage)

  AVAILABLE IN STASH:
  [1] Gravedigger's Shovel   10-14 damage, +5% vs undead

  (No other weapons in stash)

──────────────────────────────────────────────────────────────
  [#] EQUIP FROM LIST    [U] UNEQUIP (to stash)    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

---

## Merchant Menu

```
THE MERCHANT
══════════════════════════════════════════════════════════════

  "Everything has a price. Even your life... especially your life."

  YOUR GOLD: 847

  ── ALWAYS AVAILABLE ────────────────────────────────────────

  [1] Healing Potion         15g    Restore 30 HP
  [2] Antidote               12g    Cure poison
  [3] Torch                   8g    -5 Dread gain, 1 floor
  [4] Bandage                10g    Stop bleeding, restore 15 HP/3t
  [5] Calm Draught           18g    -15 Dread instantly

  ── TODAY'S STOCK ───────────────────────────────────────────

  [6] ID Scroll              30g    Identify 1 item in dungeon
  [7] Smoke Bomb             45g    Guaranteed flee
  [8] Bone Ring (Common)     95g    +2% crit chance
      "Its previous owner is... nearby."

  ── SELL YOUR ITEMS ─────────────────────────────────────────

  [S] OPEN SELL MENU (8 items in stash)

──────────────────────────────────────────────────────────────
  [#] BUY ITEM    [S] SELL    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

**Stock Categories:**
- **Always Available:** Core consumables (Healing Potion, Antidote, Torch, Bandage, Calm Draught)
- **Today's Stock:** 2-3 rotating consumables + 1-2 accessories (refreshes each run)

**Buy/Sell Rules:**
- Buy: No confirmation (can sell back at 50% value)
- Sell: Session-based buyback available (3-item limit, 50% markup)

**Equipment Policy:** The Merchant sells **accessories only**—weapons, armor, and helms must be found in the dungeon. This preserves loot discovery value.

→ *Full pricing and level scaling: [Reference Numbers](reference-numbers.md#merchant-system)*

---

## The Chronicler Menu

```
THE CHRONICLER
══════════════════════════════════════════════════════════════

  "I record. I remember. So that others might survive."

  [1] BESTIARY         - Creatures encountered (23/48 discovered)
  [2] LESSONS LEARNED  - Death insights (+damage vs known foes)
  [3] LORE FRAGMENTS   - World knowledge (12 entries)
  [4] EXPEDITION LOG   - Recent run summaries
  [5] IDENTIFY ITEM    - Reveal item properties (25g)

  [B] BACK TO CAMP
══════════════════════════════════════════════════════════════
> _
```

---

## Character Menu

```
CHARACTER
══════════════════════════════════════════════════════════════

  [CHARACTER_NAME]
  Level 12 Mercenary                        XP: 2,340 / 3,000

  ── ATTRIBUTES ──────────────────────────────────────────────

  VIGOR:    8     (+40 HP, poison/bleed resistance)
  MIGHT:    6     (+6 damage per attack)
  CUNNING:  5     (+15% crit, loot detection)

  ── DERIVED STATS ───────────────────────────────────────────

  Health:      90/90 (35 base + 40 VIGOR + 15 gear)
  Damage:      11-17 (5-8 weapon + 6 MIGHT)
  Crit Chance: 25% (5% base + 15% CUNNING + 5% gear)

  ── RUN STATISTICS ──────────────────────────────────────────

  Runs Completed: 34    |    Deaths: 12
  Deepest Floor: 5      |    Bosses Slain: 1
  Total Gold Earned: 12,847

──────────────────────────────────────────────────────────────
  [L] LESSONS LEARNED    [V] VETERAN KNOWLEDGE    [B] BACK
══════════════════════════════════════════════════════════════
> _
```

---

## First-Time Player Experience

**Approach:** Diegetic tutorial via The Chronicler, not intrusive overlays.

### First Launch Sequence

```
══════════════════════════════════════════════════════════════

  You awaken in the camp. Firelight flickers. A figure approaches.

  THE CHRONICLER:
  "Another soul drawn to the depths. I am the Chronicler.
   I will record your deeds... and your deaths.

   The dungeon below holds treasures beyond measure,
   but also horrors beyond counting.

   A word of advice: your STASH keeps items safe between
   runs. Anything you BRING into the dungeon... well.
   If you die down there, it's gone forever.

   When you're ready, BEGIN EXPEDITION.
   And try not to die on your first descent."

  [ENTER] CONTINUE

══════════════════════════════════════════════════════════════
```

### First-Time Menu Markers

After the Chronicler introduction, the main menu shows contextual hints that disappear after first use:

```
  [1] STASH                - Manage stored items (3/12)
  [2] EQUIPMENT            - View/change equipped gear
  [3] BEGIN EXPEDITION     - Enter the dungeon         << START HERE
  [5] THE CHRONICLER       - Bestiary & lore           << NEW
```

**Design Philosophy:** Show the full game scope immediately. Progressive unlock feels patronizing and hides depth during critical first impression.

---

## Confirmation Requirements

Only confirm irreversible or high-stakes actions:

| Action | Confirm? | Rationale |
|--------|----------|-----------|
| Begin Expedition | Yes | Items at risk |
| Quit Game | Yes | Session end |
| Drop/Destroy Item | Yes | Permanent loss |
| Sell Item | Yes | Gold loss (or allow buyback) |
| Buy Item | No | Can sell back |
| Equip Item | No | Can re-equip |
| Unequip Item | No | Can re-equip |

---

## Related Systems

- [Save System](save-system.md) - When camp actions trigger saves
- [Character & Progression](character-progression.md) - Stash system details
- [Death & Discovery](death-discovery.md) - The Chronicler, item risk states
