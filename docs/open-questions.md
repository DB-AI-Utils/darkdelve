# DARKDELVE: Open Design Questions

> Decisions needed before implementation. Each question should be resolved with a specific answer documented here.

---

## Resolved Decisions

Decisions made during design review (2026-01-13):

| Decision | Resolution |
|----------|------------|
| Corruption vs Dread | **Unified as Dread**. Time adds +1 Dread per 5 turns. Effects: unreliable narrator only. Curse chance/portal failure tied to floor depth. |
| Character Disobeys Commands | **Removed**. Never break input reliability. At 100 Dread, spawn elite pursuer instead. |
| Progression Philosophy | **Power progression accepted**. Remove "sidegrade only" claim. Keep +5 HP/+1 stat per level. |
| Gear Fear Mitigation | **No change**. Keep original stash system without Memento recovery. |
| Gold Death Penalty | **No change**. Gold retained on death. |
| Stamina Balance | **Defer**. Balance after playable build exists. |
| Block vs Dodge | **Defer**. Balance after playable build exists. |
| Flee Mechanics | **Reduce**. Cap success at 70%, add consequences for fleeing. |

---

## Open Questions - Core Systems

### Q1: Difficulty Scaling System

Do we implement "Deeper Darkness" difficulty levels for long-term challenge?

**Proposed:**
- 20 levels unlocked sequentially
- Each level: +10% enemy HP, +5% enemy damage, -3% drop rates
- Level 10+: New enemy variants
- Level 15+: Boss gains additional phase
- Level 20: "True ending" unlock

**Options:**
- [ ] Yes, implement as proposed
- [ ] Yes, with modifications: ___
- [ ] No, skip difficulty scaling
- [ ] Defer to post-MVP

**Decision:** _Pending_

---

### Q2: Waystone Extraction Costs

What are the specific costs for Waystone extraction by floor?

**Proposed:**

| Floor | Gold Cost | OR Item Cost |
|-------|-----------|--------------|
| 1-2 | Free | Free |
| 3 | 30 gold | 1 common item |
| 4 | 75 gold | 1 uncommon item |
| 5 | Boss fight | Boss fight |

**Additional questions:**
- Can Waystones be found as loot? (Proposed: Yes, rare drop from elites)
- Can you carry multiple Waystones? (Proposed: No, single use on pickup)
- What if you can't pay extraction cost? (Proposed: Must go deeper or die)

**Decision:** _Pending_

---

### Q3: Maximum Dread Consequence (100 Dread)

What happens when player reaches 100 Dread?

**Options:**
- [ ] **The Watcher**: Unique elite enemy spawns and pursues until extraction/death. Cannot be permanently killed (respawns after 3 rooms).
- [ ] **The Abyss Beckons**: Extraction becomes free (dungeon wants you gone). Staying past 100 is the danger.
- [ ] **Breaking Point**: Forced extraction triggered. Run ends but you keep loot.
- [ ] Other: ___

**Decision:** _Pending_

---

### Q4: Death Penalty Specifics

What exactly is lost on death?

| Category | Lost? | Notes |
|----------|-------|-------|
| Equipped items | ? | |
| Carried (unequipped) items | ? | |
| Brought stash items | ? | |
| Carried gold | No | Decided: gold retained |
| Unidentified items | ? | Original doc says lost |
| Identified items | ? | Original doc says kept |
| Quest items | ? | Proposed: kept for story |
| XP gained this run | ? | |
| Character level | ? | Reset or retained? |

**Decision:** _Pending_

---

### Q5: Run Structure and Win Condition

**Questions:**

1. How many floors in a standard dungeon?
   - [ ] 5 floors (as documented)
   - [ ] Other: ___

2. What is the win condition?
   - [ ] Kill boss on final floor
   - [ ] Extract with target loot value
   - [ ] Either/both
   - [ ] Other: ___

3. Is there a "true ending"?
   - [ ] Yes, at Deeper Darkness 20
   - [ ] Yes, other condition: ___
   - [ ] No true ending, infinite replayability

4. Target time per floor?
   - [ ] 4-6 minutes (20-30 min full run)
   - [ ] Other: ___

**Decision:** _Pending_

---

## Open Questions - Dread System

### Q6: Dread Accumulation Sources

What actions increase Dread and by how much?

**Proposed values:**

| Source | Dread Gain |
|--------|------------|
| Killing basic enemy | +2 |
| Killing elite enemy | +5 |
| Killing eldritch enemy | +8 |
| Turn in darkness (no torch) | +3 |
| Per 5 turns elapsed | +1 |
| Reading forbidden text | +10 |
| Horror encounter | +8-15 |
| Descending a floor | +5 |
| Certain events | Varies |

**Decision:** _Pending (confirm or adjust values)_

---

### Q7: Dread Recovery Methods

How can players reduce Dread during and after runs?

**Proposed:**

| Method | Dread Loss | Availability |
|--------|------------|--------------|
| Rest at camp | Full reset | After extraction |
| Consume ration | -5 | During run |
| Lit torch (passive) | -1 per 5 turns | During run |
| Shrine blessing | -20 (with tradeoff) | During run |
| Specific items | Varies | During run |

**Decision:** _Pending (confirm or adjust values)_

---

### Q8: Dread Threshold Effects

At what Dread levels do unreliable narrator effects trigger?

**Proposed:**

| Dread | Information Effects |
|-------|---------------------|
| 0-30 | Full accuracy |
| 31-50 | Occasional flavor text, enemy counts shown as ranges ("2-4 enemies") |
| 51-70 | Heavy uncertainty (item stats as ranges, 10% hallucinated enemies) |
| 71-90 | Stats hidden entirely, 25% hallucinated enemies, whispers in combat log |
| 91-100 | Complete unreliability, spawn The Watcher |

**Decision:** _Pending (confirm or adjust thresholds)_

---

## Open Questions - Floor Depth Effects

### Q9: Floor-Based Effects (formerly Corruption)

Since curse chance and portal effects are now tied to floor depth, what are the thresholds?

**Proposed:**

| Floor | Effect |
|-------|--------|
| 1-2 | None |
| 3 | Found items have 20% curse chance |
| 4 | Found items have 40% curse chance, NPCs react with suspicion |
| 5 | Found items have 60% curse chance, elite spawn rate +10% |

**Decision:** _Pending_

---

## Open Questions - Combat & Balance

### Q10: Flee Mechanics (Updated)

With flee capped at 70%, what are the specific rules?

**Proposed:**

| Enemy Type | Flee Success | Consequence on Success | Consequence on Failure |
|------------|--------------|------------------------|------------------------|
| Basic | 70% | Drop 10% gold | Free enemy attack |
| Elite | 50% | Drop 15% gold | Free attack at +25% damage |
| Boss | 0% | Cannot flee | N/A |

**Decision:** _Pending_

---

### Q11: Potion System

The document references potions but lacks specifics.

**Questions:**
- How many potion types exist?
- What does each potion do?
- How are potions obtained?
- Capacity: 3 (as documented)?

**Proposed starter set:**

| Potion | Effect | Cost |
|--------|--------|------|
| Health Potion | +25 HP | 15 gold |
| Stamina Tonic | +30 Stamina instantly | 20 gold |
| Clarity Draught | -15 Dread | 25 gold |
| Antidote | Cure poison/bleed | 10 gold |

**Decision:** _Pending_

---

### Q12: Torch System

How do torches work mechanically?

**Questions:**
- How many turns does a torch last?
- How are torches obtained?
- What triggers "darkness"?
- Can you re-light torches?

**Proposed:**
- Torch duration: 50 turns
- Starting torches: 2
- Found in treasure rooms, purchased at camp
- Darkness: No active torch
- Cannot re-light, must use new torch

**Decision:** _Pending_

---

## Open Questions - Economy

### Q13: Starting Resources

What does the player begin each run with?

**Proposed:**

| Resource | Starting Amount |
|----------|-----------------|
| Gold | 0 |
| Health Potions | 1 |
| Torches | 2 |
| Rations | 1 |
| Stash items brought | Player choice (0-2) |

**Decision:** _Pending_

---

### Q14: Item Identification

How does the identification system work?

**Questions:**
- Cost to identify at camp?
- Are identification scrolls findable?
- What's the risk of using unidentified items?
- Are cursed items always unidentified?

**Proposed:**
- Camp identification: 25 gold
- Scrolls: Rare drop (5% from treasure rooms)
- Unidentified items work normally, just stats hidden
- Cursed items: 50% chance curse reveals on use, 50% on identification

**Decision:** _Pending_

---

## Open Questions - Meta Progression

### Q15: Class Unlock Conditions

How are additional classes unlocked?

**From document:**

| Class | Unlock Condition | Status |
|-------|------------------|--------|
| Graverobber | Default | Confirmed |
| Exorcist | Kill 10 undead | Needs confirmation |
| Hollowed One | Die at 100 Dread | Needs confirmation |

**Additional questions:**
- Are there more classes planned?
- What makes each class mechanically distinct?

**Decision:** _Pending_

---

### Q16: Veteran Knowledge Unlock Thresholds

What are the exact unlock conditions for Veteran Knowledge?

**From document (needs confirmation):**

| Knowledge Type | Unlock Condition |
|----------------|------------------|
| Boss Telegraph | 3 deaths to that boss |
| Boss Weakness | 5 deaths to that boss |
| Enemy Resistances | 10 encounters with enemy type |
| Enemy Attack Patterns | 25 encounters with enemy type |
| Dungeon Trap Locations | 5 visits to dungeon |
| Dungeon Elite Spawns | 10 visits to dungeon |

**Decision:** _Pending (confirm or adjust thresholds)_

---

## Open Questions - Content Scope

### Q17: MVP Enemy Roster

The document lists 3 enemy types + 1 boss for MVP. Specifics needed:

| Enemy | HP | Damage | Special | Status |
|-------|----|----|---------|--------|
| Ghoul | ? | ? | ? | Needs design |
| Plague Rat | ? | ? | Poison? | Needs design |
| Fleshweaver | ? | ? | Summons? | Needs design |
| Bone Colossus (Boss) | ? | ? | ? | Needs design |

**Decision:** _Pending (needs full enemy stat design)_

---

### Q18: MVP Item Pool

The document mentions 20-30 items across all rarities. Need item list.

**Categories needed:**
- Weapons (by type)
- Armor pieces
- Helms
- Accessories
- Consumables

**Decision:** _Pending (needs full item design)_

---

## Validation Questions (Playtesting Required)

These cannot be answered until playable build exists:

1. **Dread Accumulation Rate**: Is 40-60 Dread at extraction the right target?
2. **Stamina Feel**: Does combat feel tactical or trivial?
3. **Flee Balance**: Is 70% cap appropriate?
4. **Session Length**: Do runs actually fit 5-30 minute window?
5. **Unreliable Narrator**: Does information corruption feel tense or frustrating?
6. **Stash Usage**: Do players actually bring items, or always run "naked"?

---

*Document created: 2026-01-13*
*Last updated: 2026-01-13*
