# Character & Progression

> Part of the [DARKDELVE Game Design Document](../game-design.md)

---

## The Three-Stat System

Only three stats matter. This is intentional—we want decisions in the dungeon, not in menus.

| Stat | Primary Effect | Secondary Effect |
|------|----------------|------------------|
| **VIGOR** | Max HP (+5 per point) | Poison/Bleed resistance (see below) |
| **MIGHT** | Physical damage (+1 per point) | — |
| **CUNNING** | Crit chance (see below) | Special dialogue, loot detection |

**Design Note (MIGHT):** MIGHT intentionally has no secondary effect. Unlike VIGOR's subtle DoT resistance and CUNNING's probabilistic crit scaling, MIGHT's +1 damage per point is *directly felt every attack*. This makes MIGHT the "what you see is what you get" stat — straightforward power without hidden complexity. Adding carry capacity would introduce pre-dungeon optimization ("How much MIGHT do I need for inventory?") that conflicts with the design philosophy of "decisions in the dungeon, not in menus." Fixed 8-slot inventory preserves gear tension.

### VIGOR DoT Resistance

VIGOR provides percentage-based reduction to damage-over-time effects (Poison, Bleeding):

```
DoT Resistance = min(VIGOR × 5%, 40%)

Actual DoT Damage = Base DoT × (1 - DoT Resistance)

Soft Cap: 40% (reached at 8 VIGOR)
```

| VIGOR | Resistance | Poison (3/turn) | Bleed/stack (2/turn) |
|-------|------------|-----------------|----------------------|
| 1 | 5% | 2.85 → 3 | 1.9 → 2 |
| 3 (start) | 15% | 2.55 → 3 | 1.7 → 2 |
| 5 | 25% | 2.25 → 2 | 1.5 → 2 |
| 8+ | 40% (cap) | 1.8 → 2 | 1.2 → 1 |

**Design Intent:** VIGOR's secondary effect is noticeable against DoT-heavy enemies but not build-defining. The 40% cap prevents VIGOR stacking from trivializing poison/bleed strategies. This creates meaningful trade-offs:
- VIGOR build: Survives longer against DoT enemies, excels in multi-combat sequences
- MIGHT build: Kills faster, takes full DoT damage but ends fights before damage accumulates

**Note:** DoT resistance reduces damage per tick only, NOT duration.

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
- Cannot pick up items when inventory is full - must drop something or equip an identified item first
- Equipping an item frees an inventory slot
- Equipped items do not consume inventory space

### Consumable Stacking

*Added in v1.7 to resolve D-005.*

- Identical consumables stack in a single slot (e.g., "Healing Potion x3")
- Stack limit: 5 per slot
- Different consumable types require separate slots
- Consumable slots (3) are separate from inventory slots (8)

**Design Rationale:** Stacking prevents consumables from dominating limited inventory space while the stack cap (5) ensures players cannot hoard infinite healing. The separate consumable slots create dedicated "utility belt" storage that doesn't compete with equipment finds.

### Weapon Slot Rules

*Added in v1.7 to resolve B-019.*

**Weapon slot cannot be empty:**
- Players cannot unequip their weapon without a replacement
- "Unequip" action for weapons requires selecting a replacement from inventory or stash
- Death recovery: If weapon somehow lost (bug, corruption), grant starter "Rusty Sword"

**Design Rationale:** This eliminates the need to define unarmed combat stats while preserving simplicity. The player always has a weapon; the design question becomes "which weapon?" not "weapon or unarmed?"

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
- Creates tension: spend resources to understand loot, or sell it unidentified

**What Identification Does:**
- Reveals true stats and effects
- Enables selling at full value (unidentified = 50% value)
- Required to equip items; unidentified equipment cannot be equipped
- Reveals curses before equipping

**What Identification Does NOT Do:**
- Protect items from death loss (all items lost on death regardless of identification)
- Transfer items directly to stash

**Note:** Identification is about *information*, not *safety*. You identify items to know what you have, sell at full value, and avoid curse surprises. Death protection comes from extracting successfully, not from identification.

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

### Level-Gated Gold Reduction (Anti-Farming)

Mirrors XP penalty to prevent degenerate gold farming on early floors with free extraction:

| Player Level | Gold Penalty |
|--------------|--------------|
| Levels 1-5 | Full gold from all floors |
| Levels 6-10 | Floor 1 gives 70% gold |
| Levels 11-15 | Floors 1-2 give 70% gold |
| Levels 16-20 | Floors 1-3 give 70% gold |

**Implementation:** Multiply gold drops by 0.7 when penalty is active.

**Display:** *"The dungeon's lesser denizens carry little of value."*

**Design Rationale:** XP penalty alone was insufficient—gold farming remained viable for high-level players repeatedly clearing Floors 1-2 with zero extraction cost. The 70% penalty makes this inefficient without making it impossible. Quick raids remain VIABLE (for recovery, casual play) but not OPTIMAL (deep runs still reward more gold per hour).

**Balance Analysis (v1.7 - B-016):**

The 70% gold penalty (vs 50% XP penalty) is intentional:
- Recovery runs remain viable after bad deaths (70% of 20-50g = 14-35g, still meaningful)
- Deep runs are ~44% more gold-efficient (correct incentive direction)
- XP penalty gates progression regardless of gold
- Time cost of safe farming is self-limiting (boring gameplay discourages abuse)

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Quick raid frequency (Level 10+) | <30% of runs | If >40%, reduce gold penalty to 60% |

This prevents the XP grind wall at high levels by making deep runs the most efficient leveling method, aligning with the extraction dilemma (deeper = better rewards).

Levels provide modest power but mainly serve as gating for dungeon access.

---

## Meta-Progression

Meta-progression provides both **power growth** (leveling) and **variety expansion** (unlocks):

### Item Pool (MVP)

MVP uses a fixed item pool of 20 items. All items are available from Level 1.

**MVP Item Distribution:**

| Slot | Common | Uncommon | Rare | Total |
|------|--------|----------|------|-------|
| Weapons | 2 | 2 | 1 | 5 |
| Armor | 2 | 1 | 1 | 4 |
| Helms | 1 | 1 | 1 | 3 |
| Accessories | 1 | 1 | 1 | 3 |
| Consumables | 5 | 0 | 0 | 5 |

**Totals:** Common 11 (55%), Uncommon 5 (25%), Rare 4 (20%)

**Rarity Availability:**

| Rarity | Availability | Notes |
|--------|--------------|-------|
| Common | Level 1+ | Always available |
| Uncommon | Level 1+ | Always available |
| Rare | Level 1+ | Low drop rate creates aspiration |
| Epic | Post-MVP | Not in MVP item pool |
| Legendary | Post-MVP | Not in MVP item pool |

**Implementation:** On loot generation, select from full item pool. Rarity is determined by floor-based drop tables (see [Reference Numbers](reference-numbers.md)).

**Post-MVP Expansion:** Item pool can grow to 50-100 items with level-gated unlocks. Epic items unlock at Level 5+, Legendary at Level 8+.

**Post-MVP:** Achievement-based unlocks (boss kills, bestiary completion) can add SPECIFIC items as bonuses without replacing this system.

### Class Unlocks

*Mixed unlock methods - survival AND death. Both fit the "death as discovery" philosophy.*

| Class | Unlock Condition | Playstyle |
|-------|------------------|-----------|
| Mercenary | Default | Balanced, standard stats |
| Flagellant | Extract while at 85+ Dread | High risk/reward, damage bonuses at low HP |
| Hollowed One | Die to The Watcher on Floor 3+ | Dread mastery, 20% reduced Dread gain |

**Class Unlock Clarifications:**
- **Flagellant:** Uses state tracking—Dread must be 85+ at the moment of extraction, not just at any point during the run. This prevents "spike to 85, reduce with potions, extract safely" cheese strategies.
- **Hollowed One:** Must be killed by The Watcher specifically (not just at 100 Dread) on Floor 3 or deeper. This ensures intentional sacrifice and prevents trivial Floor 1 farming. The player must push to 100 Dread, trigger The Watcher, and be defeated by it.

**Expected Unlock Journey:**

| Class | Typical Unlock Run | Player Experience |
|-------|-------------------|-------------------|
| Flagellant | Runs 5-10 | Master Dread management, survive at high tension |
| Hollowed One | Runs 6-10 | Deliberately push to 100 Dread, embrace death |

**Narrative frames:**
- Flagellant: "You walked the edge and returned. You Awakened."
- Hollowed One: "The Watcher's gaze pierced your soul. You fell into the abyss... and found something there."

### Mutators (Difficulty Modifiers)

- Unlocked by specific achievements
- Add challenge for veterans seeking variety
- Examples: "The Whispering Dark" (darker but better loot), "Iron Will" (no saves)

---

## The Stash System

A permanent storage for items between runs. The stash is the ONLY safe place for items.

```
+-------------------------------------------------------------+
|  STASH (12 slots) - Items here are SAFE                     |
|                                                             |
|  Before Run: Select up to 2 items to BRING                  |
|  -> Items brought are AT RISK (like all items in dungeon)   |
|                                                             |
|  If you DIE:    ALL items lost (equipped, carried, brought) |
|  If you EXTRACT: Keep everything, deposit to stash          |
+-------------------------------------------------------------+
```

### Stash Rules

| Rule | Value | Rationale |
|------|-------|-----------|
| Capacity | 12 slots | Forces curation, prevents hoarding |
| Bring limit | 2 items per run | Caps power spike, forces choices |
| Stash overflow | Must sell or discard before next run | Cannot exceed capacity |

### The Core Tension

Full loss on death creates maximum "gear fear" — a meaningful pre-run decision:
- Bring best gear → powerful run, but risk permanent loss
- Bring nothing → weaker run, but no risk
- Bring medium gear → balanced risk/reward

The extraction dilemma intensifies: "I have my best sword equipped... do I push deeper or extract NOW?"

**Red Flag to Watch:** If players NEVER bring items, loss is too painful — needs tuning.

---

## Veteran Knowledge System

Permanent **information** unlocks from experience. You get smarter, not stronger.

This extends the "death as discovery" philosophy — deaths literally teach you things that persist forever.

### Three-Tiered Enemy Knowledge

| Tier | Unlock Condition | Information Unlocked |
|------|------------------|---------------------|
| 1 | 6 encounters OR 1 death | Name, HP range, damage range |
| 2 | 15 encounters OR 2 deaths | Attack patterns, resistances, weaknesses |
| 3 | 25 encounters OR 3 deaths | Exact stats, optimal strategies, lore entry |

**Timeline by Playstyle (per enemy type):**

| Playstyle | Tier 1 | Tier 2 | Tier 3 |
|-----------|--------|--------|--------|
| Careful (rarely dies) | Run 1-2 | Runs 3-5 | Runs 6-10 |
| Average (dies sometimes) | Run 1 | Runs 2-3 | Runs 4-6 |
| Aggressive (dies often) | Run 1 (death) | Runs 2-3 (deaths) | Runs 3-4 (deaths) |

**Death-Linked Acceleration:** Deaths to an enemy type accelerate knowledge unlocks, making death feel productive. A player who dies once to Ghouls immediately learns their basic stats, while a cautious player needs 6 encounters.

**Display in Chronicler:** Unlock source is tracked—"Learned through experience" vs "Learned through sacrifice."

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
