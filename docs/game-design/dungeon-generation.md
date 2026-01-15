# Dungeon Generation

> Part of the [DARKDELVE Game Design Document](../game-design.md)

Dungeons use a **hybrid approach**: fixed skeleton, random flesh. Structure provides mastery, variation provides tension.

---

## The Core Principle

Players should be able to **plan generally** but face **specific uncertainty**:

| Approach | Player Experience | Problem |
|----------|------------------|---------|
| Fully handcrafted | "I know exactly what's behind that door" | Extraction becomes solved, grinding is autopilot |
| Fully procedural | "No idea what's next, might as well gamble" | Session length unpredictable, narrative impossible |
| **Hybrid** | "I know there's a shrine somewhere, but is the next room 3 archers or 1 brute?" | Real dilemma |

---

## What's Fixed (Dungeon Identity)

| Element | Why Fixed |
|---------|-----------|
| Dungeon theme/name | "The Ossuary" must always feel like The Ossuary |
| Number of floors | 5 — players know the journey length |
| Boss identity + mechanics | The dungeon's signature challenge |
| Key story beats | Floor 1 intro, Floor 3 midpoint, Floor 5 climax |
| Monster roster | Which enemy TYPES can appear (thematic coherence) |
| Room type distribution | Floor 1 easier than Floor 4 (guaranteed progression) |

---

## What's Randomized (Per-Run Variance)

| Element | How It Varies |
|---------|---------------|
| Room order within floors | Rooms shuffle, connections change |
| Enemy composition | Different combinations from the dungeon's roster |
| Loot contents | Pulls from dungeon loot pool, rarity weighted by floor |
| Events/encounters | Selected from thematic pool per dungeon |
| Shrine types | Random selection from available shrines |
| Minor flavor text | Cosmetic variety in descriptions |

---

## Dread as Randomization Accelerator

Higher Dread increases unpredictability — the longer you stay, the wilder things get:

| Dread Level | Effect on Dungeon |
|-------------|-------------------|
| 0-25% | Standard variance, predictable runs |
| 26-50% | Elite spawn chance increases (+10%), dangerous events more likely |
| 51-75% | New enemy variants appear, treasure quality increases |
| 76-100% | "Twisted" room variants possible, maximum chaos + maximum reward |

### Concrete Numbers

- Elite spawn chance: `5% base + (Dread% × 0.2)` = 5% at 0 Dread, 25% at 100 Dread
- Dangerous event weight: `1.0 base + (Dread% × 0.02)` = 1x at 0 Dread, 3x at 100 Dread
- Loot quality bonus: `+0% base + (Dread% × 0.5)` = +50% at max Dread

This creates the extraction dilemma organically: *"Stay longer for better loot, but the dungeon becomes less predictable."*

---

## Variety Math

To avoid "seed exhaustion" (players seeing all variants quickly):

```
4 room templates × 3 floor layouts × 5 enemy compositions
= 60 combinations minimum per floor
= hundreds of thousands of possible dungeon runs
```

---

## Implementation Phases

### Phase 1: Minimal Viable Hybrid (MVP)

- Fixed 5-floor structure with boss on floor 5
- Randomized room ORDER within floors (4-6 rooms per floor)
- Enemy composition from fixed roster, scaled by floor
- Single event pool
- Basic loot tables per dungeon

### Phase 2: Rich Variance

- Multiple room templates per type
- Enemy modifiers and elite variants
- Dread-influenced spawning
- Curated event pools with theming

### Phase 3: Narrative Integration

- Fixed first-run story events
- Story-aware event restrictions
- Boss variant mechanics

---

## Generation Red Flags

| Risk | Mitigation |
|------|------------|
| Randomization theater | If changes don't affect decisions, they're not adding value |
| Seed exhaustion | Need enough combinations that players don't see repeats by run 15 |
| Narrative whiplash | Random events must respect fixed story state |
| First-run quality gap | Random events need equal design care as fixed story beats |

---

## Related Systems

- [Dungeon Structure](dungeon-structure.md) - Floor layouts and room types
- [Dread System](dread-system.md) - Dread as randomization accelerator
- [Extraction System](extraction-system.md) - Floor-based extraction rules
