# The Extraction System

> Part of the [DARKDELVE Game Design Document](../game-design.md)

The extraction mechanic is the game's primary hook—a constant push-your-luck decision.

---

## Extraction Rules by Floor

| Floor | Extraction Method | Cost |
|-------|-------------------|------|
| 1-2 | Free extraction portal in Stairwell | None |
| 3 | Must find Waystone Chamber (separate room) | 10% of carried gold (minimum 15 gold) |
| 4 | Must find Waystone Chamber (separate room) | 25% gold (minimum 25 gold) OR 1 item |
| 5 | Boss guards the exit | Defeat boss |

> **Canonical source:** `configs/extraction.json` — This design document is authoritative for extraction rules. The architecture implements these values in `configs/extraction.json`.

### Stairwell vs Waystone Chamber

**Conceptual split** — These are two distinct locations with different purposes:

| Location | Purpose | Floors |
|----------|---------|--------|
| **Stairwell** | Descend to next floor | All floors |
| **Waystone Chamber** | Extract to camp (costs resources) | Floors 3-4 only |

**Floors 1-2:** Stairwells contain both stairs down AND a free extraction portal. Players can descend or extract from the same room.

**Floors 3-4:** Stairwells contain stairs down ONLY (the portal is dark/broken). To extract, players must find the Waystone Chamber — a separate room type that spawns once per floor. Extraction at the Waystone requires payment.

**Floor 5:** No extraction available. Boss guards the only exit.

This separation creates meaningful exploration pressure on deeper floors — you're not just hunting loot, you're hunting your escape route.

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
| 2 | 10% | Elites can spawn (base rate increases on deeper floors) |
| 3 | 15% | Waystone extraction cost begins |
| 4 | 20% | Epic loot chance increases |
| 5 | 25% | Boss guards exit |

**Elite base rates by floor (before Dread modifiers):**
- Floors 2-3: 10%
- Floors 4-5: 15%

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
