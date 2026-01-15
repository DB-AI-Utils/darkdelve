# Item System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Complete specification for item data structures, effects, and identification mechanics.

---

## Item Data Schema

### Core Item Structure

```typescript
interface Item {
  id: string;                    // Unique instance ID (UUID)
  templateId: string;            // Reference to item template
  slot: ItemSlot;                // WEAPON, ARMOR, HELM, ACCESSORY, CONSUMABLE
  rarity: Rarity;                // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
  identified: boolean;           // True if stats/effects revealed

  // Display names
  name: string;                  // Current display name
  unidentifiedName: string;      // "??? Sword"
  identifiedName: string;        // "Rusty Sword"
  flavorText: string;            // Lore description

  // Stats (equipment only)
  baseStats: StatBlock | null;

  // Effects (equipment and consumables)
  effects: ItemEffect[];

  // Consumable-specific
  consumable: ConsumableData | null;

  // Special flags
  cursed: boolean;
  questItem: boolean;            // Cannot be sold or discarded
}
```

### Stat Block

```typescript
interface StatBlock {
  // Weapon stats
  damageMin?: number;
  damageMax?: number;

  // Defensive stats
  bonusHP?: number;
  armor?: number;                // Percentage damage reduction

  // Attribute bonuses
  vigor?: number;
  might?: number;
  cunning?: number;
}
```

### Consumable Data

```typescript
interface ConsumableData {
  uses: number;                  // Number of uses (usually 1)
  useInCombat: boolean;
  useOutOfCombat: boolean;
}
```

---

## Effect System

### Effect Types

| Category | Effect Type | Description |
|----------|-------------|-------------|
| **Passive Bonuses** | | |
| | STAT_BONUS | +X to stat |
| | CRIT_CHANCE | +X% critical chance |
| | CRIT_DAMAGE | +X% critical damage |
| | DAMAGE_BONUS_FLAT | +X flat damage |
| | DAMAGE_BONUS_PERCENT | +X% damage |
| | LIFESTEAL | Heal for X% of damage dealt |
| | DAMAGE_REDUCTION | -X% damage taken |
| **On-Hit Procs** | | |
| | ON_HIT_POISON | X% chance to poison |
| | ON_HIT_BLEED | X% chance to bleed |
| | ON_HIT_STUN | X% chance to stun |
| | ON_HIT_BONUS_DAMAGE | X% chance for +Y damage |
| **Defensive Procs** | | |
| | ON_HIT_TAKEN_REFLECT | X% damage reflected |
| | ON_HIT_TAKEN_HEAL | X% chance to heal when hit |
| **Active Effects** | | |
| | ACTIVE_HEAL | Heal X HP (consumable) |
| | ACTIVE_CURE_POISON | Remove poison |
| | ACTIVE_CURE_BLEED | Remove bleed |
| | ACTIVE_REDUCE_DREAD | -X Dread |
| | ACTIVE_BUFF | Apply temporary buff |
| **Curse Effects** | | |
| | CURSE_DREAD_GAIN | +X% Dread gain |
| | CURSE_DAMAGE_TAKEN | +X% damage taken |
| | CURSE_NO_HEAL | Cannot heal |

### Effect Structure

```typescript
interface ItemEffect {
  type: EffectType;
  magnitude: number;             // Percentage, flat value, etc.
  duration?: number;             // For buffs: turns remaining
  chance?: number;               // For procs: 0-100
  description: string;           // Human-readable
  hiddenUntilIdentified: boolean;
}
```

### Effect Stacking Rules

- Same effect type: **Additive** (+10% crit + +10% crit = +20% crit)
- Hard caps apply (65% crit max, etc.)
- UI shows total from all sources

---

## Identification System

### Unidentified Display

When unidentified, player sees:
- Slot type (always visible)
- Rarity (border color visible)
- Name as "??? [Type]" (e.g., "??? Sword")
- Stats shown as "???"
- Effects shown as "[UNKNOWN EFFECT]"
- Cursed status NOT indicated

### Identification Process

**Cost:** 25 gold at camp (Chronicler)
**Alternative:** ID Scroll (30g consumable, usable in dungeon)

**What Identification Reveals:**
- True item name
- Exact stat values
- All effect descriptions
- Cursed status warning
- Flavor text

### Identification Rules

| Rule | Specification |
|------|---------------|
| Equip unidentified? | Allowed - player takes the risk |
| Curse activation | Applies immediately on equip, even if unidentified |
| Use unidentified consumable? | Allowed - using reveals effect |
| Sell unidentified? | Allowed at 50% value |

---

## Equipment vs Consumable Differences

| Aspect | Equipment | Consumable |
|--------|-----------|------------|
| baseStats | Has stat block | null |
| slot | WEAPON, ARMOR, HELM, ACCESSORY | CONSUMABLE |
| effects | Passive or proc-based | Active (triggered on use) |
| persistence | Persists across turns/rooms | Removed after use |
| equip/unequip | Yes | No (consumable slots) |
| identification | Reveals stats and effects | Reveals effect magnitude |

---

## Dread Corruption of Item Display

Dread affects how items are DISPLAYED, not their actual values.

| Dread Level | Item Display Corruption |
|-------------|------------------------|
| Calm (0-49) | Accurate display |
| Uneasy (50-69) | Stats shown as ranges (+/- 20%) |
| Shaken (70-84) | Stats may be wrong (+/- 30%), 15% chance |
| Terrified (85+) | Stats shown as "???" 25% of the time |

**Critical Rule:** Underlying item data is unchanged. Only display is corrupted.

---

## Item Examples

### Common Weapon

```json
{
  "id": "item_001",
  "templateId": "rusty_sword",
  "slot": "WEAPON",
  "rarity": "COMMON",
  "identified": true,
  "identifiedName": "Rusty Sword",
  "unidentifiedName": "??? Sword",
  "flavorText": "Its edge is dull, but desperation sharpens all blades.",
  "baseStats": {
    "damageMin": 5,
    "damageMax": 8
  },
  "effects": [],
  "consumable": null,
  "cursed": false,
  "questItem": false
}
```

### Rare Accessory with Effects

```json
{
  "id": "item_002",
  "templateId": "ring_of_shadows",
  "slot": "ACCESSORY",
  "rarity": "RARE",
  "identified": true,
  "identifiedName": "Ring of Shadows",
  "unidentifiedName": "??? Ring",
  "flavorText": "Darkness clings to it like a lover.",
  "baseStats": {
    "cunning": 2
  },
  "effects": [
    {
      "type": "CRIT_CHANCE",
      "magnitude": 10,
      "description": "+10% Critical Chance",
      "hiddenUntilIdentified": true
    },
    {
      "type": "ON_HIT_BONUS_DAMAGE",
      "magnitude": 5,
      "chance": 20,
      "description": "20% chance for +5 bonus damage",
      "hiddenUntilIdentified": true
    }
  ],
  "consumable": null,
  "cursed": false,
  "questItem": false
}
```

### Cursed Epic Weapon

```json
{
  "id": "item_003",
  "templateId": "cursed_bloodletter",
  "slot": "WEAPON",
  "rarity": "EPIC",
  "identified": true,
  "identifiedName": "Bloodletter",
  "unidentifiedName": "??? Blade",
  "flavorText": "It drinks deep, but so does the darkness.",
  "baseStats": {
    "damageMin": 14,
    "damageMax": 20
  },
  "effects": [
    {
      "type": "LIFESTEAL",
      "magnitude": 15,
      "description": "Lifesteal: Heal for 15% of damage dealt",
      "hiddenUntilIdentified": false
    },
    {
      "type": "CURSE_DREAD_GAIN",
      "magnitude": 25,
      "description": "CURSED: +25% Dread gain while equipped",
      "hiddenUntilIdentified": true
    }
  ],
  "consumable": null,
  "cursed": true,
  "questItem": false
}
```

### Consumable

```json
{
  "id": "item_004",
  "templateId": "healing_potion",
  "slot": "CONSUMABLE",
  "rarity": "COMMON",
  "identified": true,
  "identifiedName": "Healing Potion",
  "unidentifiedName": "??? Potion",
  "flavorText": "Bitter but effective.",
  "baseStats": null,
  "effects": [
    {
      "type": "ACTIVE_HEAL",
      "magnitude": 30,
      "description": "Restore 30 HP",
      "hiddenUntilIdentified": false
    }
  ],
  "consumable": {
    "uses": 1,
    "useInCombat": true,
    "useOutOfCombat": true
  },
  "cursed": false,
  "questItem": false
}
```

---

## CLI Display Examples

### Unidentified Item in Inventory

```
INVENTORY (3/8 slots)
───────────────────────────────────────────
  [1] ??? Sword           [RARE]    [WEAPON]
      Damage: ???
      Effects: [UNKNOWN EFFECT]

  [2] ??? Ring            [EPIC]    [ACCESSORY]
      Stats: ???
      Effects: [UNKNOWN EFFECT] [UNKNOWN EFFECT]

  [3] Healing Potion x2   [COMMON]  [CONSUMABLE]
      Restore 30 HP
───────────────────────────────────────────
[I]dentify (25g) | [E]quip | [D]rop
> _
```

### Identified Item Display

```
╔═══════════════════════════════════════════════╗
║                                               ║
║        RING OF SHADOWS                        ║
║        ═══════════════                        ║
║        Rare Accessory                         ║
║                                               ║
║        +2 CUNNING                             ║
║        +10% Critical Chance                   ║
║        20% chance for +5 bonus damage         ║
║                                               ║
║        "Darkness clings to it like a lover."  ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

### Cursed Item Warning

```
╔═══════════════════════════════════════════════╗
║                                               ║
║        BLOODLETTER                            ║
║        ═══════════                            ║
║        Epic Longsword                         ║
║                                               ║
║        Damage: 14-20                          ║
║        Lifesteal: 15%                         ║
║                                               ║
║        !! CURSED !!                           ║
║        +25% Dread gain while equipped         ║
║                                               ║
╚═══════════════════════════════════════════════╝

Equip this cursed weapon? [Y/N]
> _
```

---

## Save Schema

For persistence, items are saved minimally:

```typescript
interface SavedItem {
  id: string;
  templateId: string;
  identified: boolean;
}
```

All other data is derived from the item template combined with identification state at load time.

---

## Loot Generation Algorithm

### Loot Trigger Conditions

| Trigger Source | Drop Chance | Item Count |
|----------------|-------------|------------|
| Basic Enemy Death | 40% | 1 item |
| Elite Enemy Death | 75% | 1-2 items (75% for 1, 25% for 2) |
| Boss Death | 100% | 2-3 items (50% each) |
| Treasure Chest | 100% | 1 item |
| Ornate Chest (Floor 4-5) | 100% | 2 items |

### Generation Process

```
LOOT_GENERATION(source, floor, dread)
=====================================

Step 1: DETERMINE ITEM TYPE
  Roll d100:
    01-20 (20%): CONSUMABLE
    21-100 (80%): EQUIPMENT

  If source is CHEST and floor >= 3:
    Consumable chance reduced to 10%

Step 2: DETERMINE RARITY
  Use floor rarity table from character-progression.md
  Apply Dread Quality Bonus:
    Upgrade Chance = Floor_Rare+_Rate + (Current_Dread% * 0.5)

  If roll <= Upgrade_Chance: Shift rarity UP one tier

Step 3: DETERMINE SLOT (Equipment Only)
  Roll d100:
    01-30 (30%): WEAPON
    31-55 (25%): ARMOR
    56-75 (20%): HELM
    76-100 (25%): ACCESSORY

Step 4: SELECT ITEM TEMPLATE
  Filter by: slot, rarity, minLevel <= character.level
  Select uniformly at random from filtered pool

Step 5: SET IDENTIFICATION STATE
  identified: false (all items start unidentified)
```

**Full Inventory Handling:**
When loot drops and inventory is full, loot remains in room. Player may return after freeing inventory space. Room state persists until cleared or run ends.

---

## Cursed Item Mechanics

### Core Rules

| Rule | Specification |
|------|---------------|
| Equip Binding | Cursed items cannot be unequipped once equipped |
| Unidentified Equip | Curse activates immediately, even if unidentified |
| Curse Discovery | Cursed status revealed on first equip |
| Removal Methods | Death (item lost), Purging Stone (rare), Purification Shrine |

### Curse Effects

| Curse Type | Effect | Typical Power Budget |
|------------|--------|---------------------|
| CURSE_DREAD_GAIN | +X% Dread gain while equipped | +25-35% |
| CURSE_DAMAGE_TAKEN | +X% damage taken | +15-25% |
| CURSE_NO_HEAL | Cannot heal by any means | N/A |
| CURSE_BLEED_ON_HIT | Take 2 bleed damage when you attack | N/A |

### Cursed Item Design

Cursed items are **powerful but costly**:
- +30% primary stat bonus (damage, HP, crit)
- One significant curse effect
- Risk/reward trade-off

**Example:** Bloodletter (Cursed Epic Weapon)
- Damage: 14-20 (+40% vs Rare baseline)
- Lifesteal: 15%
- CURSED: +25% Dread gain

### Cursed Item Death Recovery

Cursed items follow standard death recovery rules. If Equipped + Identified, they return to stash (still cursed). The curse persists on the item.

### Hollowed One Class Interaction

The Hollowed One class (unlocked by dying to The Watcher) has special curse immunity:
- Can equip cursed items without binding
- Can unequip cursed items freely
- Still suffers curse effects while equipped

---

## MVP Item Templates

### Weapons (5 items)

**Rusty Sword** (Common, Starting)
- Damage: 5-8
- Effects: None
- *"Its edge is dull, but desperation sharpens all blades."*

**Bone Club** (Common)
- Damage: 6-9
- Effects: None
- *"Fashioned from a creature best left unnamed."*

**Iron Longsword** (Uncommon)
- Damage: 7-11
- Effects: +5% Crit Chance
- *"Proper steel. A welcome change from bone and rust."*

**Venomfang Dagger** (Uncommon)
- Damage: 5-8
- Effects: 25% chance to poison on hit
- *"The blade weeps a sickly green."*

**Soulreaver Axe** (Rare)
- Damage: 9-14
- Effects: 10% Lifesteal, +2 flat damage
- *"Each kill feeds its hunger. Each kill feeds yours."*

### Armor (4 items)

**Tattered Leathers** (Common, Starting)
- Bonus HP: +5
- *"Better than nothing. Barely."*

**Boiled Leather Vest** (Common)
- Bonus HP: +8
- *"Stiff and uncomfortable. Protective nonetheless."*

**Chainmail Shirt** (Uncommon)
- Bonus HP: +10, Armor: 10%
- *"The rings clink softly. A comforting sound."*

**Plate of the Undying** (Rare)
- Bonus HP: +15, Armor: 15%, -5% damage taken
- *"Forged for those who refused to stay dead."*

### Helms (3 items)

**Dented Helm** (Common)
- Bonus HP: +3
- *"The previous owner's fate is written in its dents."*

**Iron Visage** (Uncommon)
- Bonus HP: +5, +1 VIGOR
- *"See nothing. Fear nothing."*

**Crown of Clarity** (Rare)
- Bonus HP: +5, +2 CUNNING, -5 Dread gain per floor
- *"The whispers quiet when you wear it. Mostly."*

### Accessories (3 items)

**Copper Ring** (Common)
- +1 MIGHT
- *"Worn smooth by countless worried fingers."*

**Amulet of Fortune** (Uncommon)
- +1 CUNNING, +8% Crit Chance
- *"Luck is a fickle mistress."*

**Ring of Shadows** (Rare)
- +2 CUNNING, +10% Crit Chance, 20% chance +5 bonus damage
- *"Darkness clings to it like a lover."*

### Item Template Summary

| Slot | Common | Uncommon | Rare | Total |
|------|--------|----------|------|-------|
| Weapon | 2 | 2 | 1 | 5 |
| Armor | 2 | 1 | 1 | 4 |
| Helm | 1 | 1 | 1 | 3 |
| Accessory | 1 | 1 | 1 | 3 |
| **Equipment Total** | **6** | **5** | **4** | **15** |

Plus 5 consumables (Healing Potion, Antidote, Torch, Clarity Potion, Smoke Bomb) for **20 total MVP items**.

---

## Related Systems

- [Character & Progression](character-progression.md) - Inventory, gear slots, stash
- [Death & Discovery](death-discovery.md) - Item loss on death
- [Combat](combat.md) - How item stats affect combat
- [Reference Numbers](reference-numbers.md) - Item prices and drop rates
- [Events](events.md) - Event-based loot rewards
