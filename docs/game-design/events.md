# Event System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Complete outcome specifications for all event types. Events provide meaningful choices with risk/reward trade-offs.

---

## Event Resolution Framework

All events follow this structure:
1. Event description displayed
2. Player selects option (numbered choice)
3. Outcome resolved (may include RNG rolls)
4. Results displayed and applied

**RNG Transparency:** Hidden rolls are made BEFORE the player chooses. The result is determined but unrevealed until the choice locks in. This prevents feel-bad "I picked wrong" RNG.

---

## Treasure Room Events

### Standard Chest

```
An ornate chest sits in the corner, dust thick upon its lid.

[1] Pick lock carefully  (Safe, common loot)
[2] Force it open        (Noisy, may alert enemies, better loot)
[3] Smash it             (Guaranteed loot + enemies, rare chance)
[4] Examine first        (CUNNING 8+ required)
[5] Leave it
```

**Outcome Table:**

| Choice | Requirement | Outcome |
|--------|-------------|---------|
| 1 - Pick Lock | None | Receive 1 item (rarity per floor table, no modifier) |
| 2 - Force Open | None | 30% Alert + 1 item (rarity +1 tier, capped at Rare) |
| 3 - Smash It | None | 100% Alert + 1 item (rarity +1 tier) + 15% bonus item |
| 4 - Examine | CUNNING 8+ | Reveals chest contents and trap status, return to choice |
| 5 - Leave | None | No reward, no risk |

**Alert Mechanic:**
When enemies are "alerted," combat triggers immediately after loot is collected:
- Floor 1-2: Plague Rat
- Floor 3: Ghoul or Plague Ghoul (50/50)
- Floor 4: Skeleton Archer or Armored Ghoul (50/50)
- Floor 5: Shadow Stalker

Alerted enemies attack with Normal speed (no ambush bonus, no first-strike). Display: "Your noise echoes through the chamber. Something stirs..."

**"Better Loot" Specification:**
Rarity upgrade: Roll base rarity per floor table, then upgrade one tier.
- Common -> Uncommon
- Uncommon -> Rare
- Rare -> Rare (capped for MVP, Epic in post-MVP)

**Examine Results:**
```
You study the chest carefully...

Contents: Iron Longsword [UNCOMMON]
Trap: None detected

[1] Pick lock carefully  [SAFE]
[2] Force it open        [30% ALERT - Not trapped]
[3] Smash it             [ALERT - Not trapped]
[5] Leave it
```

---

### Locked Chest (Floor 3+)

```
A heavy iron chest, bound with chains. The lock is complex.

[1] Attempt lockpick     (60% success, fail = lock jams)
[2] Force the chains     (Noisy, 50% alert, guaranteed open)
[3] Leave it
```

| Choice | Outcome |
|--------|---------|
| 1 - Lockpick | 60% success: 1 Uncommon+ item. 40% fail: chest jams permanently |
| 2 - Force | 50% alert + 1 Uncommon+ item (guaranteed) |
| 3 - Leave | No reward, no risk |

**Lockpick Success Modifiers:**
- CUNNING 5+: +10% success (70% total)
- CUNNING 10+: +20% success (80% total)

---

## NPC Events

### Hooded Figure

```
A hooded figure blocks the passage.

"Spare some gold, traveler? Just 50 pieces.
 I know secrets of what lies below..."

[1] Give 50 gold         (Purchase hint)
[2] Refuse and pass      (No interaction)
[3] Threaten them        (Risk combat)
[4] Give 100 gold        (Purchase better hint)
```

| Choice | Requirement | Outcome |
|--------|-------------|---------|
| 1 - 50 Gold | 50+ gold | -50 gold, receive Floor Hint |
| 2 - Refuse | None | Figure vanishes, no effect |
| 3 - Threaten | None | 40% combat (Shadow Stalker), 60% flees |
| 4 - 100 Gold | 100+ gold | -100 gold, receive Floor Hint + Rare item |

**Floor Hint Types:**
Randomly selected from pool:
- "The boss strikes twice after raising both fists." (Boss pattern)
- "The armored ones fear your heaviest blows." (Heavy Attack hint)
- "There's a shrine two chambers east." (Map reveal: 1 room)
- "Beware the room with the cold air. Something waits." (Elite warning)

**Threaten Combat:**
If combat triggers, Shadow Stalker with full Ambush ability. If figure flees: "The figure laughs and melts into shadow. 'We'll meet again.'"

---

### Wounded Adventurer

```
A wounded adventurer slumps against the wall, clutching their side.

"Please... I can't go on. Take my gear, but leave me something..."

[1] Help them (give Healing Potion)
[2] Take their gear (gain item, +10 Dread)
[3] Mercy kill (+5 Dread, gain item + gold)
[4] Leave them
```

| Choice | Requirement | Outcome |
|--------|-------------|---------|
| 1 - Help | 1 Healing Potion | -1 Potion, +Uncommon item (gifted), "Bless you..." |
| 2 - Take Gear | None | +Common item, +10 Dread, "You... monster..." |
| 3 - Mercy Kill | None | +5 Dread, +Uncommon item, +15-25 gold, silence |
| 4 - Leave | None | Nothing happens |

**Subsequent Runs:**
If player chose "Help" in a previous run, 20% chance wounded adventurer appears as helpful NPC:
```
"You! You saved me before. Take this."
+Rare item, no Dread
```

---

## Rest Sites

### Safe Alcove

```
A small alcove, sheltered from the darkness.
You could rest here—but something might find you.

[1] Rest fully       (+50% HP, 20% ambush chance)
[2] Rest briefly     (+25% HP, 5% ambush chance)
[3] Meditate         (-15 Dread, +10% ambush chance)
[4] Don't rest
```

| Choice | Outcome |
|--------|---------|
| 1 - Full Rest | Heal 50% max HP, 20% chance: ambush by floor-appropriate enemy |
| 2 - Brief Rest | Heal 25% max HP, 5% ambush chance |
| 3 - Meditate | -15 Dread, 10% ambush chance |
| 4 - Leave | Nothing happens |

**Ambush Enemy by Floor:**
- Floor 1-2: Plague Rat
- Floor 3: Ghoul
- Floor 4: Shadow Stalker (full ambush!)
- Floor 5: Shadow Stalker

**Ambush Resolution:**
If ambush triggers, enemy gets Ambush bonus (2 free actions) regardless of type. Display: "Your rest is interrupted! Something found you!"

**Healing Calculation:**
- 50% HP means 50% of MAX HP, not current
- Example: 50 max HP, 20 current HP, Full Rest -> +25 HP = 45 HP

---

### Corrupted Rest Site (Floor 4+)

```
A rest site, but something feels wrong. The shadows are too deep.

[1] Rest anyway      (+50% HP, 40% ambush, +10 Dread)
[2] Rest briefly     (+25% HP, 20% ambush, +5 Dread)
[3] Investigate      (CUNNING 10+ reveals true nature)
[4] Leave
```

If CUNNING 10+ and Investigate chosen:
```
You sense it now—this is a trap. The "rest site" is bait.

[1] Spring the trap  (Fight elite, gain +1 Rare item if victory)
[2] Leave quietly
```

---

## Shrine Events

### Blood-Stained Altar

```
A blood-stained altar to a forgotten god.
Dark power hums in the air.

[1] Pray for strength  (+3 MIGHT until extraction, +15 Dread)
[2] Pray for fortune   (Next 3 chests upgrade rarity, +10 Dread)
[3] Pray for insight   (Reveal floor map, +5 Dread)
[4] Desecrate shrine   (50 gold, chance of curse)
[5] Leave
```

| Choice | Outcome |
|--------|---------|
| 1 - Strength | +3 MIGHT (temporary until extraction), +15 Dread |
| 2 - Fortune | Next 3 treasure room items upgrade 1 rarity tier, +10 Dread |
| 3 - Insight | Reveal all rooms on current floor (types + connections), +5 Dread |
| 4 - Desecrate | +50 gold, 35% chance: Cursed status (cannot heal until extraction or Purging Stone) |
| 5 - Leave | Nothing happens |

**Blessing Exclusivity:**
Only one shrine blessing active at a time. Choosing a new blessing replaces the old:
```
"You already carry the Blessing of Might.

[1] Accept Blessing of Fortune (replaces current)
[2] Keep current blessing"
```

**Strength Blessing Details:**
- +3 MIGHT adds +3 damage to all attacks
- Persists through all combat on current run
- Lost on extraction (successful or forced)
- Stacks with equipment MIGHT bonuses

**Fortune Blessing Tracking:**
- Counter decrements when player opens ANY chest (including forced)
- Counter visible in status: "Fortune: 2 chests remaining"
- Does not affect enemy drops, only chests

---

### Purification Shrine (Floor 3+)

```
A pristine white altar, untouched by the dungeon's corruption.
Holy light emanates from its surface.

[1] Pray for cleansing    (Remove all status effects, -20 Dread)
[2] Pray for protection   (Immune to status effects for 3 combats)
[3] Donate offering       (50 gold for +Uncommon consumable)
[4] Leave
```

| Choice | Requirement | Outcome |
|--------|-------------|---------|
| 1 - Cleansing | None | Remove Poison, Bleeding, Cursed; -20 Dread |
| 2 - Protection | None | 3-combat immunity to new status effects |
| 3 - Donate | 50+ gold | -50 gold, +1 random Uncommon consumable |
| 4 - Leave | None | Nothing happens |

**Protection Duration:**
- Counter decrements at END of each combat
- Status: "Protection: 2 combats remaining"
- Does NOT remove existing status effects

---

## Special Events

### The Merchant (Floor 2, 4)

Merchant appears in dungeon at fixed intervals. Stock is subset of camp merchant.

```
A merchant has set up shop in this unlikely place.

"Prices are higher down here. Supply and demand, friend."

[Available items listed with 25% markup from camp prices]

[B] Leave
```

**Dungeon Merchant Rules:**
- Prices are 125% of camp prices (rounded up)
- Limited stock: 3 consumables only
- Cannot sell to dungeon merchant
- Same merchant on Floor 2 and 4 (remembers purchases)

---

### Echo of the Past (Floor 5 only)

```
You find the remains of another adventurer.
Their journal lies open beside them.

"Day ???... The colossus... it follows a pattern...
 Strike after it raises... both fists...
 That's when it's... vulnerable..."

[1] Take the journal    (+Boss Telegraph knowledge, +5 Dread)
[2] Bury them properly  (+Rare item from corpse, +2 Dread)
[3] Search the body     (+Gold (30-50), +Uncommon item, +8 Dread)
[4] Leave
```

| Choice | Outcome |
|--------|---------|
| 1 - Journal | Unlock Boss Telegraph in Veteran Knowledge (permanent), +5 Dread |
| 2 - Bury | +Rare item, +2 Dread, narrative: "You hope for the same courtesy." |
| 3 - Search | +30-50 gold, +Uncommon item, +8 Dread |
| 4 - Leave | Nothing |

---

## Event Distribution by Floor

| Floor | Event Pool |
|-------|------------|
| 1 | Standard Chest, Hooded Figure, Safe Alcove |
| 2 | Standard Chest, Hooded Figure, Safe Alcove, Merchant |
| 3 | Standard Chest, Locked Chest, Hooded Figure, Wounded Adventurer, Blood Shrine, Purification Shrine |
| 4 | Locked Chest, Wounded Adventurer, Corrupted Rest, Blood Shrine, Merchant |
| 5 | Locked Chest, Corrupted Rest, Blood Shrine, Purification Shrine, Echo of the Past |

**Event Selection:**
When event room generated, randomly select from floor's pool with equal weight.

---

## Event Implementation Notes

**State Persistence:**
- Shrine blessings: Persist until extraction/death
- Fortune counter: Persists until depleted or extraction
- Protection counter: Persists until depleted or extraction
- Wounded Adventurer help: Persists across runs (save data)

**Gold Check:**
If player lacks gold for paid option, option is grayed with "(insufficient gold)":
```
[1] Give 50 gold         (insufficient gold)
```

**Requirement Display:**
Stat requirements shown only if player is close:
- CUNNING 8+ and player has CUNNING 6+: Shows "[Requires CUNNING 8]"
- CUNNING 8+ and player has CUNNING 3: Shows "(something about this chest...)" - hidden option

---

## Related Systems

- [Dungeon Structure](dungeon-structure.md) - Event room placement
- [Combat](combat.md) - Alert enemy encounters
- [Dread System](dread-system.md) - Dread costs and rewards
- [Items](items.md) - Loot tables and rarity
