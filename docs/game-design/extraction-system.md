# The Extraction System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

The extraction mechanic is the game's primary hook—a constant push-your-luck decision.

---

## Extraction Rules by Floor

| Floor | Extraction Method | Cost |
|-------|-------------------|------|
| 1-2 | Free extraction at any stairwell | None |
| 3 | Must find Waystone | 10% of carried gold (minimum 15 gold) |
| 4 | Must find Waystone | 25% gold (minimum 25 gold) OR 1 item |
| 5 | Boss guards the exit | Defeat boss |

**Extraction Cost Rules:**
- Minimum costs prevent "zero-gold" exploit (spending all gold before extraction)
- If player has insufficient gold on Floor 3-4, they may sacrifice 1 item instead
- Item sacrifice creates meaningful choice: "Is this item worth the extraction cost?"
- Thematic justification: "The Waystone demands payment"

**Extraction Atomicity:**
Extraction is an atomic action. Once initiated, it completes regardless of damage. If HP would reach 0 during extraction, player extracts at 1 HP ("barely survived").

**Desperation Extraction (No Resources):**
If player has insufficient gold AND no carried items for extraction cost, they may sacrifice 1 equipped item (except weapon). If only weapon remains, extraction is free but inflicts +20 Dread.

---

## Floor Depth Effects

The deeper you go, the more the dungeon corrupts what you find:

| Floor | Curse Chance | Additional Effect |
|-------|--------------|-------------------|
| 1 | 5% | None |
| 2 | 10% | Elites can spawn (10% base chance) |
| 3 | 15% | Waystone extraction cost begins |
| 4 | 20% | Epic loot chance increases |
| 5 | 25% | Boss guards exit |

**Note:** In-dungeon NPCs (wandering merchants, mysterious strangers) are post-MVP features. The camp Merchant has static prices. See [Reference Numbers](reference-numbers.md#merchant-system) for Merchant specification.

**Cursed item design:** +30% primary stat, negative secondary effect (makes curses interesting choices, not just bad luck).

Note: Time pressure comes from Dread accumulation (+1 Dread per 5 turns), not a separate Corruption system.

---

## The Taunt

After successful extraction, reveal what was in the NEXT room:

```
You step onto the Waystone. The extraction ritual begins.

Through the shimmering portal, you glimpse the chamber beyond:

    An ornate chest sits unopened, glowing with purple light.
    [EPIC RARITY DETECTED]

The portal seals. You'll never know what was inside.
```

This creates regret and drives "one more run" behavior. Design note: Never show Legendary items here—that would feel punishing rather than intriguing.

---

## Related Systems

- [Dread System](dread-system.md) - Time pressure through mental strain
- [Death & Discovery](death-discovery.md) - What happens when extraction fails
- [Dungeon Structure](dungeon-structure.md) - Floor layouts and room types
