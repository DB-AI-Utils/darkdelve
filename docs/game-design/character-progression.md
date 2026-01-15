# Character & Progression

> Part of the [DARKDELVE Game Design Document](../game-design.md)

---

## The Three-Stat System

Only three stats matter. This is intentional—we want decisions in the dungeon, not in menus.

| Stat | Primary Effect | Secondary Effect |
|------|----------------|------------------|
| **VIGOR** | Max HP (+5 per point) | Poison/Bleed resistance |
| **MIGHT** | Physical damage (+1 per point) | Carry capacity |
| **CUNNING** | Crit chance (see below) | Special dialogue, loot detection |

### CUNNING Crit Scaling (Soft Cap)

CUNNING provides crit chance with diminishing returns at high investment:

```
Base Crit: 5%
CUNNING 1-10:  +3% per point
CUNNING 11+:   +1.5% per point (diminishing returns)

TOTAL CRIT CAP: 65% (from all sources combined)
```

| CUNNING | Crit Chance | Notes |
|---------|-------------|-------|
| 3 | 14% | Starting Mercenary |
| 5 | 20% | Early investment sweet spot |
| 8 | 29% | Noticeable crit build |
| 10 | 35% | Soft cap threshold |
| 12 | 38% | Diminishing returns active |
| 15 | 42.5% | High investment |
| 20 | 50% | Max practical from stats |

**Design Intent:** The soft cap at CUNNING 10 creates an "efficient investment" threshold. First 10 points provide 30% crit contribution; next 10 points provide only 15%. This makes moderate CUNNING investment attractive without forcing "max or nothing" builds.

**Hard Cap Rationale:** The 65% total cap (stats + gear) prevents gear stacking from creating degenerate crit builds. At 65%, crits feel powerful (~2 in 3 attacks) while 35% non-crit rate preserves meaningful variance.

### No Skill Trees

Your "build" is determined by what you FIND, not what you CHOOSE in a menu. This keeps decisions in the moment and prevents analysis paralysis.

---

## Inventory System

**Carried Inventory (during run):** 8 slots for unequipped items
**Equipped Slots:** 4 (weapon, armor, helm, accessory) - do not count against carry capacity
**Consumable Slots:** 3 (separate from inventory, dedicated for potions/items)
**Gold:** Does not take inventory slots - tracked as currency

```
INVENTORY (5/8 slots)
+-- Cursed Dagger [UNIDENTIFIED]
+-- Iron Helm [+5 HP]
+-- Tattered Cloak [UNIDENTIFIED]
+-- Gold Ring [+1 CUNNING]
+-- Torch x3

CONSUMABLES (2/3)
+-- Healing Potion x2
+-- Antidote
```

**Inventory Rules:**
- Cannot pick up items when inventory is full - must drop or equip something first
- Equipping an item frees an inventory slot
- Equipped items do not consume inventory space

---

## Gear System

**Slots:** Weapon, Armor, Helm, Accessory (4 total)

### Rarity Tiers

| Rarity | Visual | Stats | Effects | Drop Rate |
|--------|--------|-------|---------|-----------|
| Common | `+---+` | 1 basic | None | 60% |
| Uncommon | `│   │` | 1 stat | 1 minor bonus | 25% |
| Rare | `╒═══╕` | 2 stats | 1 notable effect | 12% |
| Epic | `╔═══╗` | 2-3 stats | 1 powerful effect | 2.5% |
| Legendary | `▓▓▓▓▓` | Named | Unique ability | 0.5% |

**Boss Legendary rate:** 3%

### Loot Rarity by Floor

Base drop rates shift based on floor depth. Dread provides an additional quality bonus.

| Floor | Common | Uncommon | Rare | Epic | Legendary |
|-------|--------|----------|------|------|-----------|
| 1 | 70% | 22% | 7% | 1% | 0% |
| 2 | 65% | 25% | 8% | 1.5% | 0.5% |
| 3 | 55% | 28% | 13% | 3% | 1% |
| 4 | 45% | 30% | 18% | 5.5% | 1.5% |
| 5 | 35% | 30% | 22% | 10% | 3% |

### Dread Quality Bonus Formula

```
Upgrade Chance = Floor Bonus + (Current Dread% x 0.5)

Example: Floor 3 at 60 Dread
- Floor Bonus: 13% (from table, Rare+ chance)
- Dread Bonus: 60 x 0.5 = 30%
- Total upgrade chance: 43%

When upgrade triggers: Roll shifts one tier up (Common -> Uncommon, etc.)
```

This means "+50% loot quality at max Dread" translates to a 50% chance for any drop to upgrade one rarity tier.

---

## Item Identification

- Items drop UNIDENTIFIED
- Identification costs 25 gold at camp OR rare scrolls in dungeon
- Creates tension: spend resources to understand loot, or gamble on unknown gear?

**What Identification Does:**
- Reveals true stats and effects
- Enables selling at full value (unidentified = 50% value)
- Required to equip items with active abilities
- Protects EQUIPPED items from death loss (see [Death Economy](death-discovery.md))

**What Identification Does NOT Do:**
- Protect CARRIED (unequipped) items from death loss
- Transfer items directly to stash
- Make items "safe" if they were BROUGHT from stash

**Key Rule:** Identification only protects items you are WEARING. If you identify an item but keep it in your carried inventory (not equipped), it is still lost on death. This prevents "pay 25g for permanent item safety" exploits.

---

## Level System

- **Level cap:** 20
- **XP per level:** Scales linearly (100 x level)
- **Per level gain:** +5 Max HP, +1 to chosen stat

### Floor-Based XP Multipliers

To reward deep runs over grinding early floors, enemy XP scales with floor depth:

| Floor | XP Multiplier | Rationale |
|-------|---------------|-----------|
| 1 | 1.0x | Base XP rate |
| 2 | 1.5x | Slight reward for progression |
| 3 | 2.0x | Waystone cost offset |
| 4 | 3.0x | Deep runs become efficient |
| 5 | 4.0x | Maximum risk = maximum reward |

**Example:** A Ghoul worth 10 base XP gives 10 XP on Floor 1, but 40 XP on Floor 5.

### Level-Gated XP Reduction (Anti-Grinding)

To prevent safe XP grinding on early floors with free extraction:

| Player Level | XP Penalty |
|--------------|------------|
| Levels 1-5 | Full XP from all floors |
| Levels 6-10 | Floor 1 gives 50% XP |
| Levels 11-15 | Floors 1-2 give 50% XP |
| Levels 16-20 | Floors 1-3 give 50% XP |

This ensures higher-level characters must engage with deeper, riskier content to progress efficiently. Safe grinding on early floors becomes time-inefficient rather than impossible, preserving player agency while discouraging degenerate play patterns.

This prevents the XP grind wall at high levels by making deep runs the most efficient leveling method, aligning with the extraction dilemma (deeper = better rewards).

Levels provide modest power but mainly serve as gating for dungeon access.

---

## Meta-Progression

Meta-progression provides both **power growth** (leveling) and **variety expansion** (unlocks):

### Gradual Item Pool Expansion

- First 5 runs: 30-item pool (simple, learnable)
- After 5 runs: +10 items unlock
- Each boss killed: +2-3 specific items
- Full pool: ~100 items

### Class Unlocks

*Mixed unlock methods - survival AND death. Both fit the "death as discovery" philosophy.*

| Class | Unlock Condition | Playstyle |
|-------|------------------|-----------|
| Mercenary | Default | Balanced, standard stats |
| Flagellant | Extract while at 85+ Dread | High risk/reward, damage bonuses at low HP |
| Hollowed One | Die at 100 Dread on Floor 3+ | Can use cursed items safely, Dread manipulation |

**Class Unlock Clarifications:**
- **Flagellant:** Uses state tracking - Dread must be 85+ at the moment of extraction, not just at any point during the run. This prevents "spike to 85, reduce with potions, extract safely" cheese strategies.
- **Hollowed One:** Must die on Floor 3 or deeper to prevent trivial Floor 1 farming. The Floor requirement ensures meaningful investment before unlock.

**Narrative frames:**
- Flagellant: "You walked the edge and returned. You Awakened."
- Hollowed One: "The abyss claimed you, but you came back... changed."

### Mutators (Difficulty Modifiers)

- Unlocked by specific achievements
- Add challenge for veterans seeking variety
- Examples: "The Whispering Dark" (darker but better loot), "Iron Will" (no saves)

---

## The Stash System

A permanent storage for items between runs, with risk/reward mechanics for bringing gear into dungeons.

```
+-------------------------------------------------------------+
|  STASH (12 slots) - Items here are SAFE                     |
|                                                             |
|  Before Run: Select up to 2 items to BRING                  |
|  -> Items brought are AT RISK                               |
|                                                             |
|  If you DIE:    Brought items LOST FOREVER                  |
|  If you EXTRACT: Keep brought items + deposit found items   |
+-------------------------------------------------------------+
```

### Stash Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Capacity | 12 slots | Forces curation, prevents hoarding |
| Bring limit | 2 items per run | Caps power spike, forces choices |
| Stash overflow | Must sell or discard before next run | Cannot exceed capacity |

### The Core Tension

This creates "gear fear" — a meaningful pre-run decision:
- Bring best gear → powerful run, but risk permanent loss
- Bring nothing → weaker run, but no risk
- Bring medium gear → balanced risk/reward

**Red Flag to Watch:** If players NEVER bring items, loss is too painful — needs tuning.

---

## Veteran Knowledge System

Permanent **information** unlocks from experience. You get smarter, not stronger.

This extends the "death as discovery" philosophy — deaths literally teach you things that persist forever.

### Three-Tiered Enemy Knowledge

| Tier | Unlock Condition | Information Unlocked |
|------|------------------|---------------------|
| 1 | 8 encounters OR 1 death | Name, HP range, damage range |
| 2 | 20 encounters OR 2 deaths | Attack patterns, resistances, weaknesses |
| 3 | 35 encounters OR 3 deaths | Exact stats, optimal strategies, lore entry |

**Death-Linked Acceleration:** Deaths to an enemy type accelerate knowledge unlocks, making death feel productive. A player who dies once to Ghouls immediately learns their basic stats, while a cautious player needs 8 encounters.

### Boss Knowledge

| Knowledge | Unlock Condition | What You Learn |
|-----------|------------------|----------------|
| Telegraph | 1 death OR 3 encounters | Attack pattern hints shown in combat |
| Weakness | 2 deaths OR use correct element once | Bonus damage type revealed |

### Dungeon Knowledge

| Knowledge | Unlock Condition | What You Learn |
|-----------|------------------|----------------|
| Secret Passages | 3 visits | Hidden rooms shown on minimap |
| Elite Spawns | 7 visits | Elite spawn areas revealed |

### Why This Works

- Maintains sidegrade principle (no power increase)
- Makes death feel productive (you learned something)
- Helps struggling players through knowledge, not crutches
- Skilled players face same mechanical challenge
- Thematically fits ("veteran delver" fantasy)

**Design Note:** Veteran Knowledge is information advantage, NOT stat advantage. A player with full knowledge still faces the same enemy HP, damage, and mechanics.

---

## Related Systems

- [Combat](combat.md) - How stats affect combat performance
- [Death & Discovery](death-discovery.md) - Death economy and item loss rules
- [Camp System](camp-system.md) - Stash and equipment management UI
- [Dread System](dread-system.md) - Dread + Veteran Knowledge interaction
