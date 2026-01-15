# DARKDELVE: Blocker & Exploit Research Analysis

> Research conducted: 2026-01-15
> Sources: Darkest Dungeon, Amnesia, Escape from Tarkov, Dark and Darker, Hades, Dead Cells, Path of Exile, FFXIV, Elden Ring, and academic game design literature

---

## Table of Contents

1. [Critical Blockers](#critical-blockers)
   - [#1 Dread Threshold Text Contradiction](#1-dread-threshold-text-contradiction)
   - [#2 Starting Dread Value Undefined](#2-starting-dread-value-undefined)
   - [#6 Inventory Capacity Undefined](#6-inventory-capacity-undefined)
   - [#7 Death Economy Contradictions](#7-death-economy-contradictions)
2. [Moderate Concerns](#moderate-concerns)
   - [#17 Flagellant Class Unlock Ambiguity](#17-flagellant-class-unlock-ambiguity)
   - [#18 Veteran Knowledge + Dread Hallucinations Interaction](#18-veteran-knowledge--dread-hallucinations-interaction)
3. [Exploit Analysis](#exploit-analysis)
   - [Exploit 1: Zero-Gold Floor 3 Extraction](#exploit-1-zero-gold-floor-3-extraction)
   - [Exploit 2: Watcher Farm on Floor 1](#exploit-2-watcher-farm-on-floor-1)
   - [Exploit 3: Watcher Stun-Lock](#exploit-3-watcher-stun-lock)
   - [Exploit 4: Shrine Buff Stacking](#exploit-4-shrine-buff-stacking)
   - [Exploit 5: Flee-Reset Exploit](#exploit-5-flee-reset-exploit)
   - [Exploit 6: Safe XP Grinding](#exploit-6-safe-xp-grinding)
   - [Exploit 7: Identification = Permanent Safety](#exploit-7-identification--permanent-safety)
4. [Summary of Recommendations](#summary-of-recommendations)

---

## Critical Blockers

### #1 Dread Threshold Text Contradiction

**Issue:** Line 245 says "Shaken (51+)" but the threshold table defines Shaken as 70-84.

#### Research Findings

**Darkest Dungeon Stress System:**
- Uses a 0-200 stress bar with a critical threshold at 100
- At 100 stress, heroes gain an Affliction (or rarely, become Virtuous)
- At 200 stress, heroes suffer a fatal heart attack
- Thresholds are clearly defined: 0-99 = functional, 100-199 = afflicted, 200 = death
- The system maintains consistency between documentation and gameplay

Source: [Darkest Dungeon Wiki - Stress](https://darkestdungeon.fandom.com/wiki/Stress)

**Amnesia: The Dark Descent:**
- Four sanity levels with progressive effects
- Level 4 causes visual distortion and hallucinations
- Interestingly, the sanity meter functions more as a "placebo" than a true mechanic
- The game deliberately lies to players about the consequences of low sanity

Source: [Game Design Deep Dive: Amnesia's Sanity Meter](https://www.gamedeveloper.com/design/game-design-deep-dive-i-amnesia-i-s-sanity-meter-)

**Best Practice:** Clear, consistent threshold documentation is essential. Darkest Dungeon's success comes partly from players understanding exactly when they're at risk.

#### Analysis

The contradiction is a simple documentation error, but its resolution has design implications:

| Option | Threshold | Effect |
|--------|-----------|--------|
| Early Warning (51+) | Hallucinations start at 51% Dread | Longer "danger zone," more gradual degradation |
| Late Warning (70+) | Hallucinations start at 70% Dread | Shorter but more intense danger zone |

**Pros of 70+ (current table):**
- Cleaner tier boundaries (0-49, 50-69, 70-84, 85-99, 100)
- More time in "reliable" gameplay before unreliable narrator kicks in
- Matches Darkest Dungeon's approach (100 stress = affliction, not gradual)

**Pros of 51+ (typo version):**
- Earlier warning gives players more reaction time
- "Uneasy" at 50+ with hallucinations makes thematic sense
- Gradual degradation aligns with Amnesia's approach

#### Recommended Solution

**Keep 70+ as the Shaken threshold. Fix the typo.**

Rationale:
1. The current threshold table is well-designed with clear tier boundaries
2. Starting hallucinations at 70% gives players a 69-point "safe zone" to learn the game
3. The 15% hallucination rate at Shaken (70+) is more impactful than 5% at Uneasy
4. This matches Darkest Dungeon's approach where stress becomes truly dangerous at higher levels

**Implementation:** Change line 245 from "Shaken (51+)" to "Shaken (70+)"

---

### #2 Starting Dread Value Undefined

**Issue:** Document never states what Dread value players start a run with. Camp reduces Dread to "min 10" but first run has no prior camp visit.

#### Research Findings

**Darkest Dungeon:**
- Heroes start at 0 stress
- Stress only accumulates during expeditions
- Camp/town activities reduce stress but don't eliminate it completely for most activities
- "0 stress" represents a fresh, mentally prepared adventurer

Source: [The Dynamics of Stress in Darkest Dungeon](https://nicolaluigidau.wordpress.com/2024/02/06/the-dynamics-of-stress-in-darkest-dungeon/)

**Roguelike Resource Pressure:**
- Traditional roguelikes use "food clocks" and similar mechanics to create early pressure
- The tension between "safe start" vs "immediate pressure" is a core design decision
- FTL starts with immediate threat (rebel fleet chasing you) while Hades starts in safety

Source: [Roguelike Radio: Episode 14 - Resource Management](http://www.roguelikeradio.com/2011/11/episode-14-resource-management.html)

**Early Game Design Principle:**
- "Don't treat the early game as a warm-up. The early game is absolutely important for building tension, but shouldn't be designed in a way where it eventually becomes a trivial chore."

Source: [Designing for Mastery in Roguelikes](https://www.gridsagegames.com/blog/2025/08/designing-for-mastery-in-roguelikes-w-roguelike-radio/)

#### Analysis

| Starting Value | Effect on Gameplay |
|---------------|-------------------|
| 0 Dread | Clean slate, ~70 Dread before hallucinations begin, forgiving for new players |
| 10 Dread | Slight tension, matches "min 10" from camp, implies baseline anxiety |
| Higher (20+) | Immediate pressure, faster ramp to danger, more punishing |

**Key consideration:** The camp's "min 10" suggests that even rested adventurers carry some baseline dread from knowing what lies below.

#### Recommended Solution

**Start at 0 Dread for the first run, 10 Dread for subsequent runs.**

Rationale:
1. First-time players need to learn the system without immediate pressure
2. After the first run, players understand the dungeon's horrors - baseline anxiety is thematically appropriate
3. This creates a subtle teaching moment: your first run is special (innocence), subsequent runs carry knowledge (and fear)
4. The 10-point difference is mechanically minor but narratively meaningful

**Alternative (simpler):** Always start at 0 Dread. Camp minimum of 10 represents "can't fully forget" after experiencing the dungeon, but first-timers are blissfully ignorant.

---

### #6 Inventory Capacity Undefined

**Issue:** How many items can players carry during a run? What happens when stash is full?

#### Research Findings

**Escape from Tarkov:**
- Complex inventory with grid-based storage (items have different sizes)
- Secure container (Alpha/Beta/Gamma) provides protected slots
- Backpacks and vests add capacity
- Creates significant inventory management gameplay

Source: [Escape from Tarkov Smart Inventory Management Guide](https://www.eyeonannapolis.net/2025/10/escape-from-tarkov-smart-inventory-management-guide/)

**Dark and Darker:**
- Similar extraction mechanics
- Inventory is limited but flexible
- All carried items lost on death except those in secure slots

Source: [Dark and Darker Beginners Guide](https://darkanddarker.wiki.spellsandguns.com/Beginners_Guide)

**Hades:**
- No traditional inventory - boons/abilities are the "items"
- Room-based rewards are immediate choices
- Simplifies inventory completely in favor of decision moments

**Dead Cells:**
- Two weapon slots, shield optional
- Consumables are separate
- Simple, focused inventory

Source: [Dead Cells vs Hades - Which is the Better Roguelite?](https://kinglink-reviews.com/2020/10/27/dead-cells-vs-hades-which-is-the-better-roguelite/)

#### Analysis

DARKDELVE needs to balance:
1. **CLI interface** - Complex grid inventories don't work in text
2. **Session length** - Inventory management adds time
3. **Extraction tension** - "Do I have room?" should be a meaningful question
4. **Loot excitement** - Finding items should feel rewarding, not burdensome

| Capacity | Effect |
|----------|--------|
| 6 slots | Very tight, frequent hard choices, fast sessions |
| 10 slots | Moderate, occasional choices, balanced |
| 15+ slots | Loose, rarely need to drop items, longer sessions |

**Stash overflow handling in similar games:**
- Tarkov: Can't extract if overweight (but can drop items)
- Most games: Force player to drop/sell before proceeding

#### Recommended Solution

**Carried inventory: 8 slots (separate from equipped items)**
**Stash capacity: 12 slots**
**Consumable slots: 3 (separate, as already specified)**

Rules:
1. **Equipped items don't count against carry capacity** (4 slots: weapon, armor, helm, accessory)
2. **Carry capacity = 8 unequipped items** during a run
3. **Cannot pick up items when full** - must drop something first
4. **Stash overflow on extraction:** Force player to choose what to keep/sell before next run
5. **Gold doesn't take slots** - it's a currency, not an item

Rationale:
- 8 carried + 4 equipped = 12 total items per run, matching extraction game standards
- Creates "inventory pressure" in later floors without feeling punishing
- Stash of 12 slots means players can't hoard everything - curation required
- Separate consumable slots prevent healing items from competing with loot

**CLI Implementation:**
```
INVENTORY (8/8 slots)
├─ Cursed Dagger [UNIDENTIFIED]
├─ Healing Potion x2
├─ Iron Helm [+5 HP]
├─ Tattered Cloak [UNIDENTIFIED]
├─ Gold Ring [+1 CUNNING]
├─ Torch x3
├─ Antidote
└─ ???
```

---

### #7 Death Economy Contradictions

**Issue:** Multiple conflicting rules about what happens to items on death:
- "Equipped items return to stash"
- "Cannot stash legendaries"
- "Brought stash items lost on death"
- "Identified items kept on death"

#### Research Findings

**Escape from Tarkov:**
- Clear priority system:
  1. Secure container items = always safe
  2. Insured items = returned if not looted by another player
  3. Everything else = lost on death
- Insurance creates cost-vs-security tradeoff

Source: [Escape from Tarkov: How Do I Keep My Items After Death?](https://www.gamepressure.com/escape-from-tarkov/how-do-i-keep-my-items-after-death/zdcfd0)

**Dark and Darker:**
- Simpler: Everything lost on death except secure container
- No insurance system
- Creates clear "bring good gear = high stakes" dynamic

Source: [Dark and Darker - Wikipedia](https://en.wikipedia.org/wiki/Dark_and_Darker)

**Traditional Roguelikes:**
- NetHack: Everything lost on death, including knowledge
- Some modern roguelikes retain knowledge/unlocks between runs

Source: [Permadeath - RogueBasin](https://www.roguebasin.com/index.php/Permadeath)

#### Analysis

The contradictions stem from trying to create multiple "safety tiers" without clear priority:

| Rule | Creates |
|------|---------|
| Equipped items safe | Incentive to wear items immediately |
| Brought items lost | Risk for bringing stash items |
| Identified = safe | Pay-to-secure mechanic |
| Legendaries can't stash | Forced to use or lose |

These rules conflict when combined. Example: I bring a legendary from stash, equip it, identify it, then die. Which rules apply?

#### Recommended Solution

**Clear Priority System (highest to lowest):**

```
DEATH ITEM RESOLUTION
─────────────────────
1. BROUGHT from stash → ALWAYS LOST (overrides everything)
   "You risked it, you lost it."

2. LEGENDARY items → LOST (special handling below)
   "Power comes with a price."

3. EQUIPPED + IDENTIFIED → SAFE (returns to stash)
   "You understood it, you keep it."

4. EQUIPPED but UNIDENTIFIED → LOST
   "You never truly knew what you held."

5. CARRIED (not equipped) → LOST (regardless of ID status)
   "Only what you wore survives the journey back."
```

**Legendary Handling (revised):**
- Legendaries CAN be stashed (changing current rule)
- If stashed, they're safe
- If brought from stash and lost, they're gone forever (same as other items)
- If found during run and you die before extracting, they're lost
- This removes the "use it or lose it" pressure which feels punishing for rare finds

**Why this works:**
1. Clear priority order eliminates ambiguity
2. "Brought = lost" is the highest priority, creating real stakes for bringing good gear
3. Identification has value (protects equipped items) without being a "permanent safety" exploit
4. Legendaries follow normal rules - the rarity itself provides enough specialness

**Example Scenarios:**

| Scenario | Outcome |
|----------|---------|
| Find Epic armor, equip, die | Lost (unidentified) |
| Find Epic armor, equip, identify, die | Safe (returns to stash) |
| Bring Epic armor from stash, equip, identify, die | Lost (brought overrides all) |
| Find Legendary, equip, die | Lost |
| Find Legendary, equip, identify, extract | Safe (now in stash) |
| Bring Legendary from stash, die | Lost forever |

---

## Moderate Concerns

### #17 Flagellant Class Unlock Ambiguity

**Issue:** "Reach 85+ Dread, extract alive" - at any point during the run, or at the moment of extraction?

#### Research Findings

**Achievement Tracking Patterns:**

Two main approaches exist:
1. **Peak tracking:** Achievement triggers if condition was EVER met during the run
2. **State tracking:** Achievement requires condition to be true AT the moment of completion

Source: [Designing and Building a Robust Achievement System](https://www.gamedeveloper.com/design/designing-and-building-a-robust-comprehensive-achievement-system)

**Darkest Dungeon Class Unlocks:**
- Most unlocks are cumulative (kill X enemies, complete Y dungeons)
- Some require specific conditions during gameplay

**Design Considerations:**
- Peak tracking is more forgiving but potentially exploit-prone
- State tracking creates more tension but may feel unfair if player "just missed it"

#### Analysis

| Approach | Difficulty | Exploit Risk | Player Experience |
|----------|------------|--------------|-------------------|
| Any point (peak) | Easier | Higher (cheese strats) | "Phew, I made it to 85, now I can reduce Dread" |
| At extraction (state) | Harder | Lower | "I need to maintain 85+ all the way out" |

**Cheese strategy with peak tracking:**
1. Deliberately spike to 85+ Dread early
2. Use Clarity Potions, rations to reduce Dread
3. Extract safely at lower Dread

**The intended fantasy:** The Flagellant is someone who walked the edge and returned. This suggests maintaining the edge, not just touching it.

#### Recommended Solution

**State tracking: Dread must be 85+ at the moment of extraction.**

Rationale:
1. Aligns with the class fantasy (mastery of suffering, not just exposure)
2. Creates genuine tension during the extraction sequence
3. Prevents trivial achievement via spike-and-reduce strategy
4. The harder unlock makes the class feel more earned

**Implementation details:**
- Track current Dread at extraction point
- If >= 85: Unlock Flagellant
- Display clear feedback: "You walked the edge... and returned. FLAGELLANT UNLOCKED."

**Clarified text:** "Extract from the dungeon while at 85+ Dread"

---

### #18 Veteran Knowledge + Dread Hallucinations Interaction

**Issue:** When a player KNOWS enemy stats (via Veteran Knowledge) but is hallucinating, what do they see?

#### Research Findings

**Amnesia's Approach:**
- The sanity meter is deliberately deceptive
- Players see visual distortions and hallucinations at low sanity
- However, much of this is "theater" - the game lies about consequences
- The FEELING of danger is more important than mechanical danger

Source: [Amnesia Dev on Lying to Players](https://www.gamedeveloper.com/design/-i-amnesia-i-dev-makes-the-case-for-why-lying-to-players-is-sometimes-good-game-design)

**Unreliable Narration in Games:**
- "Unreliable narration is a powerful tool for creating dissonance in horror games"
- Works best when conflicting information creates anxiety without removing player agency

Source: [Cognitive Dissonance in Horror Games](https://horrorchronicles.com/horror-games-and-cognitive-dissonance/)

**The Core Tension:**
- If knowledge overrides hallucinations: Dread becomes trivial for veterans
- If Dread corrupts knowledge: Veteran system feels useless
- Need a middle ground that preserves both systems' value

#### Analysis

The key insight from Amnesia: the game can show corrupted information while the player KNOWS it's corrupted. The tension comes from not being 100% sure which information to trust.

| Approach | Effect |
|----------|--------|
| Knowledge overrides | Veterans immune to Dread's core mechanic |
| Dread overrides | Veteran Knowledge feels worthless at high Dread |
| Both coexist | Creates interesting tension: "I know it's wrong, but how wrong?" |

#### Recommended Solution

**Layered display with "knowledge anchor":**

```
COMBAT: Ghoul
─────────────────────────────────
HP: 22...no, 18...maybe 24? [Veteran: 18-22]
Damage: 8-12 [Veteran: confirmed]

Status: Your hands shake. You can't trust your eyes.
        But you've fought these before. You KNOW them.
```

**Rules:**
1. Corrupted perception shows FIRST (the hallucination)
2. Veteran Knowledge shows SECOND (in brackets, styled differently)
3. Player must mentally reconcile the two

**Why this works:**
1. Preserves Dread's core mechanic (unreliable information)
2. Gives Veteran Knowledge meaningful value (anchor point)
3. Creates new tension: "I think I know, but my eyes say otherwise"
4. Thematically perfect: Experience fights against madness

**Detailed implementation:**

| Dread Level | Display Without Knowledge | Display With Tier 3 Knowledge |
|-------------|--------------------------|-------------------------------|
| Calm (0-49) | HP: 20 | HP: 20 [exact] |
| Uneasy (50-69) | HP: 18-22 | HP: 19...20? [Veteran: 20] |
| Shaken (70-84) | HP: 15?...25? | HP: 15?...25? [Veteran: 20] |
| Terrified (85-99) | HP: ??? | HP: ??? [Veteran: 20, but can you trust yourself?] |

**The key insight:** At Terrified level, even with knowledge, add flavor text that questions whether the veteran knowledge is reliable. This preserves the horror while rewarding investment.

---

## Exploit Analysis

### Exploit 1: Zero-Gold Floor 3 Extraction

**Issue:** 10% of 0 gold = 0. Players can dump all gold before extraction for free escape.

#### Research Findings

**Game Economy Design:**
- "Taps and sinks" must be balanced - if players can bypass sinks, currency loses value
- Minimum costs prevent "zero-gaming" exploits

Source: [Game Economy Design in Free-to-Play Games](https://machinations.io/articles/game-economy-design-free-to-play-games)

#### Analysis

This is a classic "boundary case" exploit. The percentage system assumes players will have gold.

**Exploit mechanism:**
1. Reach Floor 3 with gold
2. Spend all gold (identify items, buy from merchant, etc.)
3. Extract for free

**Impact:** Undermines the extraction cost mechanic entirely for prepared players.

#### Recommended Solution

**Minimum extraction costs:**

```
Floor 3: 10% of carried gold (minimum 15 gold)
Floor 4: 25% of carried gold (minimum 25 gold) OR sacrifice 1 item
```

**If player has insufficient gold:**
- Option A: Cannot extract, must go deeper or find more gold
- Option B: Can sacrifice an item instead of gold (1 item = extraction)
- Option C: Can extract but incur "debt" (next run starts with -X gold, capped)

**Recommended:** Option B - provides player agency and creates interesting "sacrifice best item vs go deeper" decisions.

**Why this works:**
1. Closes the zero-gold exploit
2. Creates new interesting decision: "Is this item worth the extraction cost?"
3. Thematically fits: "The Waystone demands payment"

---

### Exploit 2: Watcher Farm on Floor 1

**Issue:** Deliberately trigger 100 Dread on Floor 1-2 for risk-free unlock farming (Hollowed One class).

#### Research Findings

**Darkest Dungeon:**
- Retreat from dungeon costs significant resources (25 stress minimum)
- Cannot "camp" stress away completely after triggering affliction

Source: [Darkest Dungeon - The Dynamics of Stress](https://nicolaluigidau.wordpress.com/2024/02/06/the-dynamics-of-stress-in-darkest-dungeon/)

#### Analysis

**Current rules ambiguity:**
- Floor 1-2 have "free extraction at any stairwell"
- The Watcher "prioritizes blocking extraction"
- But does blocking apply to free extraction zones?

**The exploit:**
1. Enter Floor 1
2. Read forbidden texts, sit in darkness, accumulate 100 Dread
3. The Watcher spawns
4. Walk to stairwell and extract for free
5. Unlock Hollowed One class with minimal risk

**Impact:** Trivializes a class unlock intended to represent "broken by the abyss."

#### Recommended Solution

**The Watcher blocks ALL extraction, including free zones:**

```
THE WATCHER'S GAZE
──────────────────
When The Watcher is active:
- ALL extraction points are sealed
- The Watcher must be stunned (30+ damage) to create a window
- Stun window: 2 turns to reach extraction point
- After 2 stuns, Watcher becomes stun-immune for remainder of run
```

**Additional safeguard:**
- Hollowed One requires death at 100 Dread, not just reaching it
- Death must occur on Floor 3+ (prevents Floor 1 cheese)

**Revised Hollowed One unlock:** "Die at 100 Dread on Floor 3 or deeper."

**Why this works:**
1. The Watcher becomes a genuine threat, not just a speedbump
2. Stun immunity after 2 uses prevents infinite stun-lock (addresses Exploit 3 too)
3. Floor requirement ensures meaningful investment before unlock

---

### Exploit 3: Watcher Stun-Lock

**Issue:** High-level players can permanently stun The Watcher with heavy attacks (30+ damage threshold).

#### Research Findings

**Boss Stun Immunity Patterns:**

**Path of Exile:**
- Bosses cannot be stunned while already stunned
- 4-second immunity after stun ends
- Creates "hit window" gameplay

Source: [Stun - PoE Wiki](https://www.poewiki.net/wiki/Stun)

**FFXIV:**
- Diminishing returns: 100% > 50% > 25% > Resist
- 1-minute timer before full effectiveness returns

Source: [FFXIV Forums - Stun Mechanics](https://forum.square-enix.com/ffxiv/threads/115788)

**General Pattern:**
Most games use one of:
1. Full immunity (bosses can't be stunned)
2. Diminishing returns (progressively shorter stuns)
3. Limited uses (immune after X stuns)

Source: [Contractual Boss Immunity - TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/ContractualBossImmunity)

#### Analysis

**The math:**
- Stun threshold: 30 damage in one hit
- Level 20 player with heavy attack: Easily 80+ damage
- Result: Trivial to permanently stun The Watcher

**Design intent of The Watcher:**
- Supposed to be terrifying, near-invincible threat
- Should force extraction, not become a punching bag

#### Recommended Solution

**Limited stun with escalating immunity:**

```
THE WATCHER STUN MECHANICS
──────────────────────────
Stun 1: Full duration (1 turn), Watcher recoils
Stun 2: Reduced duration (1 turn), Watcher becomes enraged
Stun 3+: IMMUNE - "The Watcher learns your tricks. It will not be deterred again."
```

**Additional mechanic - Watcher Enrage:**
After 2nd stun, Watcher gains:
- +50% damage (now 75 per hit)
- +50% speed (acts first in turn order)
- Cannot be stunned

**Why this works:**
1. Players can still use stun tactically (creates window for extraction)
2. Cannot be abused infinitely
3. Enrage mechanic punishes overcommitment
4. Thematically appropriate: eldritch entity adapts to threats

---

### Exploit 4: Shrine Buff Stacking

**Issue:** Multiple shrine buffs could stack to broken levels (+3 MIGHT per shrine = absurd damage).

#### Research Findings

**Elden Ring Buff Categories:**
- Buffs categorized by type: aura, body, weapon
- Same-type buffs overwrite each other
- Different-type buffs stack

Source: [How Does Buff Stacking Work in Elden Ring](https://gamerant.com/elden-ring-how-stack-buffs/)

**Destiny 2:**
- "Empowering buffs do not stack with one another - only the strongest benefits your character"
- Weapon perks stack multiplicatively with buffs
- Clear categories prevent exploit stacking

Source: [Destiny 2 Buffs and Debuffs Explained](https://www.thegamer.com/destiny-2-buffs-debuffs-stacking-explained/)

**Skyrim Shrine Blessings:**
- Only one shrine blessing active at a time
- New blessing replaces the old one
- Simple, exploit-proof system

Source: [Skyrim Shrine Blessings - GameFAQs](https://gamefaqs.gamespot.com/boards/615804-the-elder-scrolls-v-skyrim/61011293)

#### Analysis

DARKDELVE shrines offer different buffs:
- +3 MIGHT (damage)
- Next 3 chests upgrade rarity
- Reveal floor map

**If these stack:**
- 3 shrines = +9 MIGHT = nearly doubled damage
- Combined with rarity upgrades = overpowered

#### Recommended Solution

**Single blessing active (Skyrim model):**

```
SHRINE BLESSING RULES
─────────────────────
- Only ONE shrine blessing active at a time
- Receiving a new blessing replaces the previous
- Choice prompt when already blessed:

  "The altar pulses with power.
   You already carry the Blessing of Might.

   [1] Accept Blessing of Fortune (replaces current)
   [2] Keep current blessing"
```

**Why this works:**
1. Simple rule, easy to understand
2. Creates interesting choices (which blessing fits my current run?)
3. No stacking exploits possible
4. Thematically appropriate: "The gods are jealous - you may serve only one"

---

### Exploit 5: Flee-Reset Exploit

**Issue:** Flee combat, re-enter room, get different RNG seed for potentially better outcomes.

#### Research Findings

**RNG Abuse Prevention:**
- "A brute-force approach where you make players unable to abuse RNG by making resets more time consuming or annoying is perhaps the clumsiest way you could try to patch the problem"
- Better solutions: Seed the RNG per room, use weighted RNG, or lock room state

Source: [Solving RNG Abuse in Roguelikes](https://www.gamedeveloper.com/game-platforms/solving-rng-abuse-in-roguelikes)

**Seed Management:**
- Separate RNG streams for different systems (level gen vs combat)
- Room state can persist even after fleeing
- Many roguelikes "lock" room contents on first entry

Source: [Working with Seeds - Cogmind](https://www.gridsagegames.com/blog/2017/05/working-seeds/)

#### Analysis

**The exploit mechanism:**
1. Enter room, see unfavorable enemy composition
2. Flee (taking Dread penalty)
3. Re-enter room hoping for better RNG
4. Repeat until favorable outcome

**Potential fixes:**
- Lock room state on entry (no RNG reset)
- Prevent re-entry to fled rooms
- Make flee penalty severe enough to discourage abuse

#### Recommended Solution

**Room state locks on entry + cannot re-enter fled rooms:**

```
ROOM STATE RULES
────────────────
1. Room contents generated on FIRST entry
2. Contents persist until cleared
3. Fled rooms are LOCKED until floor changes

"You fled this chamber.
 The darkness remembers your cowardice.
 You cannot return here this floor."
```

**Why this works:**
1. Technical: Seed room RNG on entry, persist state
2. Prevents infinite rerolling
3. Creates consequence for fleeing (lose access to room rewards)
4. Thematically fits: "The dungeon doesn't forget"

**Alternative (simpler):** Just persist room state. Player can re-enter, but enemies/contents are identical. No reroll possible.

---

### Exploit 6: Safe XP Grinding

**Issue:** Farm Floor 1-2 forever (free extraction) for risk-free XP accumulation.

#### Research Findings

**XP Scaling Solutions:**

**Formula-based diminishing returns:**
- XP gained = (target power - player level) modified
- Lower-level enemies give less XP to higher-level players

Source: [Hexworks - Experience and Leveling Up](https://hexworks.org/posts/tutorials/2019/06/28/how-to-make-a-roguelike-experience-and-leveling-up.html)

**Deep floor incentives:**
- Hades: Later areas have significantly better rewards
- Dead Cells: Higher difficulty = higher returns

**Time pressure:**
- FTL: Rebel fleet forces progression
- Dread system already provides this

#### Analysis

**The exploit mechanism:**
1. Enter dungeon, clear Floor 1-2
2. Extract for free with XP gained
3. Repeat indefinitely
4. Level up without ever facing real danger

**Current mitigation in design doc:**
- Floor XP multipliers exist (1.0x/1.5x/2.0x/3.0x/4.0x by floor)
- This helps but doesn't eliminate the exploit

**The math:**
- Floor 1-2 at 1.0x-1.5x is still positive XP
- Enough repetitions = level cap
- Boring but "safe"

#### Recommended Solution

**XP decay for repeated content + minimum floor requirements for leveling:**

```
XP SCALING RULES
────────────────
Floor Multipliers: 1.0x / 1.5x / 2.0x / 3.0x / 4.0x (current)

NEW: Level-gated XP
- Levels 1-5: Full XP from all floors
- Levels 6-10: Floor 1 gives 50% XP
- Levels 11-15: Floors 1-2 give 50% XP
- Levels 16-20: Floors 1-3 give 50% XP

Result: Higher levels REQUIRE deeper runs for efficient progression
```

**Why this works:**
1. Early game remains forgiving for new players
2. Progression naturally requires deeper engagement
3. "Safe grinding" becomes inefficient, not impossible
4. Aligns with extraction dilemma: "Go deeper for real rewards"

**Alternative:** Flat XP cap per floor per run. "You've learned all you can from this depth."

---

### Exploit 7: Identification = Permanent Safety

**Issue:** Pay 25g to identify item = item becomes death-proof. Trivializes death economy.

#### Research Findings

**Traditional Roguelike Identification:**
- In Rogue/NetHack: Identification reveals properties but doesn't protect from death
- All items lost on death regardless of identification status
- Identification is about KNOWLEDGE, not PROTECTION

Source: [@Play 81: On Rogue's Item Identification System](https://www.gamedeveloper.com/design/-play-81-on-rogue-s-item-identification-system)

**The original design intent:**
- Unidentified items are risky to use (could be cursed)
- Identification removes usage risk, not death risk
- Creates "use now vs identify later" tension

#### Analysis

**Current rule interpretation:**
- "Identified items kept on death" suggests identification = safety
- This makes 25g = permanent item security
- Undermines the death penalty system

**The problem:**
1. Find epic item
2. Pay 25g to identify
3. Die repeatedly while attempting to extract
4. Item is always safe
5. Death has no item consequences for identified gear

#### Recommended Solution

**Redefine identification's role:**

```
IDENTIFICATION RULES (REVISED)
──────────────────────────────
What identification does:
- Reveals true stats and effects
- Enables selling at full value (unidentified = 50% value)
- Required to equip items with active abilities

What identification does NOT do:
- Protect items from death loss
- Transfer items to stash

DEATH ECONOMY (per Priority System):
- EQUIPPED + IDENTIFIED = Safe (returns to stash)
- CARRIED + IDENTIFIED = LOST (not equipped, not protected)
```

**Key insight:** Identification protects EQUIPPED items because you understood what you were wearing. Carried items are still vulnerable.

**Why this works:**
1. Identification has meaningful value (equipping, selling, knowledge)
2. Not a "pay for safety" exploit
3. Creates interesting tension: identify before equipping, or risk using unknown gear
4. Death still has consequences for inventory hoarding

**Revised death economy tie-in:**
The Priority System from Blocker #7 already handles this correctly. Carried items are lost regardless of ID status. Only EQUIPPED + IDENTIFIED items survive death.

---

## Summary of Recommendations

### Critical Blockers

| Issue | Recommendation |
|-------|----------------|
| #1 Dread Threshold | Fix typo: "Shaken (70+)" not "Shaken (51+)" |
| #2 Starting Dread | 0 Dread first run, 10 Dread subsequent runs (or always 0 for simplicity) |
| #6 Inventory | 8 carried slots + 4 equipped + 3 consumables; Stash = 12 slots |
| #7 Death Economy | Priority system: Brought > Legendary > Equipped+ID > Equipped > Carried |

### Moderate Concerns

| Issue | Recommendation |
|-------|----------------|
| #17 Flagellant Unlock | State tracking: Must be at 85+ Dread AT extraction |
| #18 Veteran + Dread | Layered display: Corrupted value shown first, Veteran knowledge in brackets |

### Exploits

| Exploit | Fix |
|---------|-----|
| Zero-Gold Extraction | Minimum costs (15g Floor 3, 25g Floor 4) or item sacrifice |
| Watcher Farm | Watcher blocks ALL extraction; Hollowed One requires Floor 3+ death |
| Watcher Stun-Lock | 2-stun limit, then permanent immunity + Enrage |
| Shrine Stacking | Only one blessing active at a time |
| Flee-Reset | Room state locks on entry; fled rooms inaccessible |
| Safe XP Grinding | Level-gated XP reduction for lower floors |
| ID = Safety | Identification only protects EQUIPPED items, not carried |

---

## Sources

### Primary Research Sources

- [Darkest Dungeon Wiki - Stress](https://darkestdungeon.fandom.com/wiki/Stress)
- [Game Design Deep Dive: Darkest Dungeon's Affliction System](https://www.gamedeveloper.com/design/game-design-deep-dive-i-darkest-dungeon-s-i-affliction-system)
- [Game Design Deep Dive: Amnesia's Sanity Meter](https://www.gamedeveloper.com/design/game-design-deep-dive-i-amnesia-i-s-sanity-meter-)
- [Amnesia Dev on Lying to Players](https://www.gamedeveloper.com/design/-i-amnesia-i-dev-makes-the-case-for-why-lying-to-players-is-sometimes-good-game-design)
- [Escape from Tarkov - Wikipedia](https://en.wikipedia.org/wiki/Escape_from_Tarkov)
- [Dark and Darker - Wikipedia](https://en.wikipedia.org/wiki/Dark_and_Darker)
- [Solving RNG Abuse in Roguelikes](https://www.gamedeveloper.com/game-platforms/solving-rng-abuse-in-roguelikes)
- [Analysis: The Eight Rules of Roguelike Design](https://www.gamedeveloper.com/game-platforms/analysis-the-eight-rules-of-roguelike-design)

### Secondary Sources

- [Designing for Mastery in Roguelikes](https://www.gridsagegames.com/blog/2025/08/designing-for-mastery-in-roguelikes-w-roguelike-radio/)
- [Contractual Boss Immunity - TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/ContractualBossImmunity)
- [Stun - PoE Wiki](https://www.poewiki.net/wiki/Stun)
- [Elden Ring Buff Stacking](https://gamerant.com/elden-ring-how-stack-buffs/)
- [Destiny 2 Buffs and Debuffs](https://www.thegamer.com/destiny-2-buffs-debuffs-stacking-explained/)
- [Permadeath - RogueBasin](https://www.roguebasin.com/index.php/Permadeath)
- [@Play 81: On Rogue's Item Identification System](https://www.gamedeveloper.com/design/-play-81-on-rogue-s-item-identification-system)

---

*Document version: 1.0*
*Research completed: 2026-01-15*
