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

## Related Systems

- [Character & Progression](character-progression.md) - Inventory, gear slots, stash
- [Death & Discovery](death-discovery.md) - Item loss on death
- [Combat](combat.md) - How item stats affect combat
- [Reference Numbers](reference-numbers.md) - Item prices and drop rates
