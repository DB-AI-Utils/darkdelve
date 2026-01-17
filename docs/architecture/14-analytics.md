# 14 - Analytics System

## Purpose

Captures and stores gameplay telemetry for AI-driven balance analysis. The analytics system passively records player decisions, combat outcomes, and progression patterns to enable data-driven game balance tuning.

**Design Philosophy**: Local-only, privacy-first, append-only logging. No network telemetry. All analysis happens offline on collected data. Human and AI agent data are separable for distinct analysis.

**Priority**: P1 (not MVP critical, but essential for balance iteration)

---

## Responsibilities

1. Subscribe to game events and transform them into analytics records
2. Write events to append-only JSONL files organized by profile
3. Compute and cache aggregate metrics for efficient querying
4. Provide query interfaces for balance analysis tools
5. Support data export for external analysis pipelines
6. Maintain strict privacy boundaries (no PII, hashed IDs)

---

## Dependencies

- **01-foundation**: Types, Result, FileSystem, Timestamp, Logger, generateEntityId
- **02-content-registry**: AnalyticsConfig (tracking settings, buffer sizes, flush intervals)
- **03-state-management**: GameState, ProfileState (for context enrichment)
- **04-event-system**: EventBus, GameEvent (source of analytics data)

---

## Interface Contracts

### Analytics Service

```typescript
// ==================== Analytics Service ====================

/**
 * Main analytics service that captures and stores gameplay telemetry.
 */
interface AnalyticsService {
  /**
   * Initialize analytics for a profile
   * Creates analytics directory if needed
   */
  initialize(profileId: string): Promise<Result<void, AnalyticsError>>;

  /**
   * Start capturing analytics events
   * Subscribes to event bus
   */
  startCapture(): void;

  /**
   * Stop capturing analytics events
   * Unsubscribes from event bus
   */
  stopCapture(): void;

  /**
   * Check if analytics capture is active
   */
  isCapturing(): boolean;

  /**
   * Force flush any buffered events to disk
   */
  flush(): Promise<Result<void, AnalyticsError>>;

  /**
   * Get analytics status for current profile
   */
  getStatus(): Promise<AnalyticsStatus>;

  /**
   * Check if analytics is enabled for profile
   */
  isEnabled(): boolean;

  /**
   * Enable/disable analytics for profile
   */
  setEnabled(enabled: boolean): Promise<Result<void, AnalyticsError>>;
}

interface AnalyticsStatus {
  /** Whether analytics capture is active */
  capturing: boolean;

  /** Profile ID being tracked */
  profileId: string;

  /** Total events recorded this session */
  eventsThisSession: number;

  /** Total events recorded all time */
  totalEvents: number;

  /** Last event timestamp */
  lastEventTime: Timestamp | null;

  /** Disk space used by analytics files */
  diskUsageBytes: number;

  /** Current log file path */
  currentLogFile: string;
}

/**
 * Create analytics service instance
 */
function createAnalyticsService(
  fileSystem: FileSystem,
  eventBus: EventBus,
  profilesPath: string,
  config: AnalyticsConfig,
  logger: Logger
): AnalyticsService;
```

### Analytics Events

```typescript
// ==================== Analytics Event Types ====================

/**
 * Base analytics event structure.
 * All analytics events share this shape.
 */
interface AnalyticsEvent {
  /** Unique event ID */
  id: string;

  /** Event type discriminator */
  type: AnalyticsEventType;

  /** ISO 8601 timestamp */
  timestamp: Timestamp;

  /** Hashed profile ID (not the actual profile name) */
  profileHash: string;

  /** Current run ID (null if at camp) */
  runId: string | null;

  /** Session ID (unique per game launch) */
  sessionId: string;

  /** Player type for segmentation */
  playerType: 'human' | 'ai_agent';

  /** AI agent identifier (if applicable) */
  agentId?: string;
}

type AnalyticsEventType =
  // Decision points
  | 'decision_extract_vs_continue'
  | 'decision_combat_action'
  | 'decision_item_pickup'
  | 'decision_event_choice'
  | 'decision_stash_bring'

  // Combat outcomes
  | 'combat_started'
  | 'combat_ended'
  | 'combat_damage_dealt'
  | 'combat_damage_taken'
  | 'combat_status_applied'
  | 'combat_flee_attempt'

  // Progression
  | 'progression_level_up'
  | 'progression_item_equipped'
  | 'progression_gold_change'

  // Run lifecycle
  | 'run_started'
  | 'run_ended'
  | 'run_floor_entered'

  // Resource management
  | 'resource_item_used'
  | 'resource_stash_operation'
  | 'resource_merchant_transaction'

  // Dread system
  | 'dread_changed'
  | 'dread_threshold_crossed'
  | 'dread_watcher_spawned'

  // Death analysis
  | 'death_occurred';

// ==================== Specific Event Payloads ====================

interface DecisionExtractEvent extends AnalyticsEvent {
  type: 'decision_extract_vs_continue';
  payload: {
    /** Did player choose to extract */
    extracted: boolean;
    /** Current floor when decision made */
    floor: FloorNumber;
    /** Dread level at decision */
    dreadLevel: number;
    /** Dread threshold at decision */
    dreadThreshold: DreadThreshold;
    /** Current HP percentage */
    hpPercent: number;
    /** Total inventory value (gold equivalent) */
    inventoryValue: number;
    /** Number of items in inventory */
    inventoryCount: number;
    /** Gold collected this run */
    goldCollected: number;
    /** Rooms explored on current floor */
    roomsExplored: number;
    /** Total rooms on current floor */
    totalRooms: number;
    /** Time spent on current floor (seconds) */
    floorTimeSeconds: number;
    /** Was extraction free or paid */
    extractionCostType: 'free' | 'gold' | 'item' | 'desperation';
    /** Next room type (if peeked/known) */
    nextRoomType?: RoomType;
  };
}

interface DecisionCombatActionEvent extends AnalyticsEvent {
  type: 'decision_combat_action';
  payload: {
    /** Action taken */
    action: 'light_attack' | 'heavy_attack' | 'block' | 'dodge' | 'use_item' | 'flee' | 'pass';
    /** Combat turn number */
    turn: number;
    /** Player HP percentage */
    playerHpPercent: number;
    /** Player stamina */
    playerStamina: number;
    /** Player max stamina */
    playerMaxStamina: number;
    /** Enemy HP percentage */
    enemyHpPercent: number;
    /** Enemy template ID */
    enemyId: string;
    /** Enemy type */
    enemyType: EnemyType;
    /** Current Dread */
    dreadLevel: number;
    /** Active player status effects */
    playerStatuses: string[];
    /** Active enemy status effects */
    enemyStatuses: string[];
    /** Is enemy staggered */
    enemyStaggered: boolean;
    /** Item used (if action is use_item) */
    itemUsed?: string;
  };
}

interface CombatEndedEvent extends AnalyticsEvent {
  type: 'combat_ended';
  payload: {
    /** Fight outcome */
    result: 'victory' | 'defeat' | 'fled';
    /** Enemy template ID */
    enemyId: string;
    /** Enemy type */
    enemyType: EnemyType;
    /** Total turns */
    turnsElapsed: number;
    /** Total damage dealt by player */
    totalDamageDealt: number;
    /** Total damage taken by player */
    totalDamageTaken: number;
    /** Player HP at start */
    playerHpStart: number;
    /** Player HP at end */
    playerHpEnd: number;
    /** Player max HP */
    playerMaxHp: number;
    /** Dread at start */
    dreadStart: number;
    /** Dread at end */
    dreadEnd: number;
    /** Items used count */
    itemsUsed: number;
    /** Critical hits landed */
    criticalHits: number;
    /** Times blocked */
    timesBlocked: number;
    /** Times dodged */
    timesDodged: number;
    /** XP awarded (if victory) */
    xpAwarded: number;
    /** Gold dropped (if victory) */
    goldDropped: number;
    /** Current floor */
    floor: FloorNumber;
    /** Fight duration seconds */
    durationSeconds: number;
  };
}

interface RunEndedEvent extends AnalyticsEvent {
  type: 'run_ended';
  payload: {
    /** How run ended */
    result: 'extraction' | 'death' | 'quit';
    /** Final floor reached */
    finalFloor: FloorNumber;
    /** Final Dread level */
    finalDread: number;
    /** Total gold collected */
    goldCollected: number;
    /** Total XP gained */
    xpGained: number;
    /** Enemies killed */
    enemiesKilled: number;
    /** Rooms explored */
    roomsExplored: number;
    /** Items found */
    itemsFound: number;
    /** Items kept (extracted) */
    itemsKept: number;
    /** Items lost (death) */
    itemsLost: number;
    /** Run duration seconds */
    durationSeconds: number;
    /** Character level at run start */
    levelAtStart: number;
    /** Character class */
    characterClass: CharacterClass;
    /** Items brought from stash */
    itemsBrought: number;
    /** Was boss defeated */
    bossDefeated: boolean;
    /** Death cause (if death) */
    deathCause?: {
      enemyId: string;
      enemyType: EnemyType;
      floor: FloorNumber;
      dreadAtDeath: number;
      wasOverkill: boolean;
    };
  };
}

interface DeathOccurredEvent extends AnalyticsEvent {
  type: 'death_occurred';
  payload: {
    /** Enemy that killed player */
    killerEnemyId: string;
    /** Enemy type */
    killerEnemyType: EnemyType;
    /** Floor where death occurred */
    floor: FloorNumber;
    /** Dread at time of death */
    dreadAtDeath: number;
    /** HP before killing blow */
    hpBeforeDeath: number;
    /** Damage of killing blow */
    killingBlowDamage: number;
    /** Was it overkill */
    wasOverkill: boolean;
    /** Player status effects at death */
    activeStatuses: string[];
    /** Combat turn when death occurred */
    combatTurn: number;
    /** Total damage taken this combat */
    totalDamageTaken: number;
    /** Items lost (all dungeon items) */
    itemsLost: string[];
    /** Gold lost */
    goldLost: number;
    /** Was this a spike damage death or attrition */
    deathType: 'spike' | 'attrition' | 'dot';
  };
}

interface DreadChangedEvent extends AnalyticsEvent {
  type: 'dread_changed';
  payload: {
    /** Previous Dread value */
    previousDread: number;
    /** New Dread value */
    newDread: number;
    /** Delta (can be negative) */
    delta: number;
    /** Source of change */
    source: string;
    /** Current floor */
    floor: FloorNumber;
    /** Room type where change occurred */
    roomType: RoomType;
    /** Previous threshold */
    previousThreshold: DreadThreshold;
    /** New threshold */
    newThreshold: DreadThreshold;
  };
}

interface ItemUsedEvent extends AnalyticsEvent {
  type: 'resource_item_used';
  payload: {
    /** Item template ID */
    itemId: string;
    /** Item category */
    itemCategory: 'consumable' | 'equipment_ability';
    /** Context of use */
    context: 'combat' | 'exploration' | 'rest';
    /** Current HP percent when used */
    hpPercent: number;
    /** Current Dread when used */
    dreadLevel: number;
    /** Current floor */
    floor: FloorNumber;
    /** If in combat, enemy type */
    enemyType?: EnemyType;
    /** If in combat, combat turn */
    combatTurn?: number;
  };
}

interface MerchantTransactionEvent extends AnalyticsEvent {
  type: 'resource_merchant_transaction';
  payload: {
    /** Transaction type */
    transactionType: 'buy' | 'sell';
    /** Item template ID */
    itemId: string;
    /** Gold amount */
    goldAmount: number;
    /** Player gold before */
    goldBefore: number;
    /** Player gold after */
    goldAfter: number;
    /** Item rarity */
    itemRarity: Rarity;
    /** Item slot */
    itemSlot: ItemSlot;
  };
}

// Union of all analytics events
type AnalyticsEventData =
  | DecisionExtractEvent
  | DecisionCombatActionEvent
  | CombatEndedEvent
  | RunEndedEvent
  | DeathOccurredEvent
  | DreadChangedEvent
  | ItemUsedEvent
  | MerchantTransactionEvent;
  // ... additional event types follow same pattern
```

### Aggregates Service

```typescript
// ==================== Aggregates Service ====================

/**
 * Computes and caches aggregate metrics from raw event data.
 * Aggregates are incrementally updated as new events arrive.
 */
interface AggregatesService {
  /**
   * Get current aggregates for profile
   */
  getAggregates(profileId: string): Promise<Result<ProfileAggregates, AnalyticsError>>;

  /**
   * Update aggregates with new event
   * Called automatically by analytics service
   */
  updateWithEvent(event: AnalyticsEventData): void;

  /**
   * Rebuild aggregates from raw event log
   * Use if aggregates.json is corrupted
   */
  rebuild(profileId: string): Promise<Result<ProfileAggregates, AnalyticsError>>;

  /**
   * Persist current aggregates to disk
   */
  persist(): Promise<Result<void, AnalyticsError>>;
}

/**
 * Pre-computed aggregate metrics for a profile
 */
interface ProfileAggregates {
  /** Schema version */
  version: string;

  /** Profile hash */
  profileHash: string;

  /** Last update timestamp */
  lastUpdated: Timestamp;

  /** Total events processed */
  totalEventsProcessed: number;

  /** Run statistics */
  runs: RunAggregates;

  /** Combat statistics */
  combat: CombatAggregates;

  /** Extraction behavior */
  extraction: ExtractionAggregates;

  /** Item usage patterns */
  items: ItemAggregates;

  /** Dread system metrics */
  dread: DreadAggregates;

  /** Death analysis */
  deaths: DeathAggregates;

  /** Session patterns */
  sessions: SessionAggregates;
}

interface RunAggregates {
  /** Total runs started */
  totalRuns: number;

  /** Runs by outcome */
  outcomeBreakdown: {
    extractions: number;
    deaths: number;
    quits: number;
  };

  /** Win rate (extractions / total) */
  winRate: number;

  /** Average run duration seconds */
  avgDurationSeconds: number;

  /** Run duration distribution (buckets in minutes) */
  durationDistribution: Record<string, number>;

  /** Deepest floor reached */
  deepestFloor: FloorNumber;

  /** Floor reach rates */
  floorReachRates: Record<FloorNumber, number>;

  /** Average gold per successful extraction */
  avgGoldPerExtraction: number;

  /** Average items kept per extraction */
  avgItemsPerExtraction: number;

  /** Average enemies killed per run */
  avgEnemiesKilledPerRun: number;
}

interface CombatAggregates {
  /** Total combats fought */
  totalCombats: number;

  /** Combat win rate */
  combatWinRate: number;

  /** Average combat duration (turns) */
  avgCombatTurns: number;

  /** Combat outcomes by enemy type */
  outcomesByEnemyType: Record<string, {
    fights: number;
    wins: number;
    losses: number;
    flees: number;
    avgTurns: number;
    avgDamageDealt: number;
    avgDamageTaken: number;
  }>;

  /** Action distribution */
  actionDistribution: Record<string, number>;

  /** Average damage per turn */
  avgDamagePerTurn: number;

  /** Crit rate */
  critRate: number;

  /** Block rate */
  blockRate: number;

  /** Dodge rate */
  dodgeRate: number;

  /** Flee success rate */
  fleeSuccessRate: number;
}

interface ExtractionAggregates {
  /** Extraction timing by floor */
  extractionsByFloor: Record<FloorNumber, number>;

  /** Average Dread at extraction */
  avgDreadAtExtraction: number;

  /** Dread distribution at extraction */
  dreadDistributionAtExtraction: Record<DreadThreshold, number>;

  /** Average HP percent at extraction */
  avgHpPercentAtExtraction: number;

  /** Average inventory value at extraction */
  avgInventoryValueAtExtraction: number;

  /** Extraction timing indicators */
  extractionTiming: {
    /** Extracted with < 50% explored */
    early: number;
    /** Extracted with 50-80% explored */
    normal: number;
    /** Extracted with > 80% explored */
    late: number;
  };
}

interface ItemAggregates {
  /** Item pickup rates */
  pickupRatesByRarity: Record<Rarity, {
    found: number;
    pickedUp: number;
    rate: number;
  }>;

  /** Item usage rates */
  usageRatesByItem: Record<string, {
    acquired: number;
    used: number;
    rate: number;
  }>;

  /** Most used items */
  topUsedItems: Array<{ itemId: string; useCount: number }>;

  /** Items never used */
  unusedItems: string[];

  /** Merchant activity */
  merchantActivity: {
    totalBought: number;
    totalSold: number;
    goldSpent: number;
    goldEarned: number;
  };
}

interface DreadAggregates {
  /** Average Dread by floor */
  avgDreadByFloor: Record<FloorNumber, number>;

  /** Threshold crossing frequency */
  thresholdCrossings: Record<DreadThreshold, number>;

  /** Watcher spawn count */
  watcherSpawns: number;

  /** Average Dread at decision points */
  avgDreadAtExtractDecision: number;

  /** Dread management patterns */
  dreadReductionActions: Record<string, number>;
}

interface DeathAggregates {
  /** Total deaths */
  totalDeaths: number;

  /** Deaths by floor */
  deathsByFloor: Record<FloorNumber, number>;

  /** Deaths by enemy type */
  deathsByEnemyType: Record<string, number>;

  /** Death cause breakdown */
  deathCauseBreakdown: {
    spikeDamage: number;
    attrition: number;
    dot: number;
  };

  /** Average Dread at death */
  avgDreadAtDeath: number;

  /** Death floor distribution */
  mostDangerousFloor: FloorNumber;

  /** Most lethal enemies */
  mostLethalEnemies: Array<{ enemyId: string; kills: number }>;
}

interface SessionAggregates {
  /** Total play sessions */
  totalSessions: number;

  /** Average session duration minutes */
  avgSessionDurationMinutes: number;

  /** Session duration distribution */
  sessionDurationDistribution: {
    under5min: number;
    min5to15: number;
    min15to30: number;
    over30min: number;
  };

  /** Runs per session */
  avgRunsPerSession: number;

  /** Retry rate after death */
  retryRateAfterDeath: number;

  /** Drop-off analysis */
  dropOffPoints: Record<string, number>;
}

function createAggregatesService(
  fileSystem: FileSystem,
  profilesPath: string,
  logger: Logger
): AggregatesService;
```

### Query Service

```typescript
// ==================== Query Service ====================

/**
 * Provides query interfaces for balance analysis.
 */
interface AnalyticsQueryService {
  /**
   * Query raw events with filters
   */
  queryEvents(
    profileId: string,
    query: EventQuery
  ): Promise<Result<AnalyticsEventData[], AnalyticsError>>;

  /**
   * Get win/loss breakdown by context
   */
  getWinLossBreakdown(
    profileId: string,
    context: WinLossContext
  ): Promise<Result<WinLossBreakdown, AnalyticsError>>;

  /**
   * Get item usage analysis
   */
  getItemUsageAnalysis(
    profileId: string
  ): Promise<Result<ItemUsageAnalysis, AnalyticsError>>;

  /**
   * Get build distribution
   */
  getBuildDistribution(
    profileId: string
  ): Promise<Result<BuildDistribution, AnalyticsError>>;

  /**
   * Get time-to-kill metrics
   */
  getTimeToKillMetrics(
    profileId: string,
    enemyType?: string
  ): Promise<Result<TimeToKillMetrics, AnalyticsError>>;

  /**
   * Get economy flow analysis
   */
  getEconomyFlow(
    profileId: string
  ): Promise<Result<EconomyFlow, AnalyticsError>>;

  /**
   * Export data for external analysis
   */
  exportData(
    profileId: string,
    options: ExportOptions
  ): Promise<Result<string, AnalyticsError>>;
}

interface EventQuery {
  /** Event types to include */
  eventTypes?: AnalyticsEventType[];

  /** Start timestamp */
  startTime?: Timestamp;

  /** End timestamp */
  endTime?: Timestamp;

  /** Specific run IDs */
  runIds?: string[];

  /** Maximum results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

interface WinLossContext {
  /** Group by dungeon */
  byDungeon?: boolean;

  /** Group by floor */
  byFloor?: boolean;

  /** Group by enemy type */
  byEnemyType?: boolean;

  /** Group by Dread threshold */
  byDreadThreshold?: boolean;
}

interface WinLossBreakdown {
  overall: { wins: number; losses: number; rate: number };
  byContext: Record<string, { wins: number; losses: number; rate: number }>;
}

interface ItemUsageAnalysis {
  /** Items by tier: meta, situational, vendor trash, unused */
  tiers: {
    meta: string[];
    situational: string[];
    vendorTrash: string[];
    unused: string[];
  };

  /** Usage rates per item */
  usageRates: Record<string, number>;

  /** Context of use */
  usageContexts: Record<string, Record<string, number>>;
}

interface BuildDistribution {
  /** Stat allocation patterns */
  statDistribution: {
    vigorFocused: number;
    mightFocused: number;
    cunningFocused: number;
    balanced: number;
  };

  /** Win rates by build type */
  winRatesByBuild: Record<string, number>;

  /** Equipment patterns */
  commonEquipmentCombinations: Array<{
    equipment: string[];
    frequency: number;
    winRate: number;
  }>;
}

interface TimeToKillMetrics {
  /** Average turns to kill by enemy */
  avgTurnsToKill: Record<string, number>;

  /** Damage per turn by player level */
  damagePerTurnByLevel: Record<number, number>;

  /** Kill time variance */
  killTimeVariance: Record<string, number>;
}

interface EconomyFlow {
  /** Gold sources */
  sources: Record<string, number>;

  /** Gold sinks */
  sinks: Record<string, number>;

  /** Net flow per run */
  netFlowPerRun: number;

  /** Balance over time */
  balanceHistory: Array<{ timestamp: Timestamp; balance: number }>;
}

interface ExportOptions {
  /** Format */
  format: 'json' | 'csv' | 'jsonl';

  /** Include raw events */
  includeEvents: boolean;

  /** Include aggregates */
  includeAggregates: boolean;

  /** Date range */
  startTime?: Timestamp;
  endTime?: Timestamp;
}

function createAnalyticsQueryService(
  fileSystem: FileSystem,
  aggregatesService: AggregatesService,
  profilesPath: string,
  logger: Logger
): AnalyticsQueryService;
```

### Error Types

```typescript
// ==================== Error Types ====================

interface AnalyticsError {
  code: AnalyticsErrorCode;
  message: string;
  context?: Record<string, unknown>;
}

type AnalyticsErrorCode =
  | 'ANALYTICS_DISABLED'
  | 'PROFILE_NOT_FOUND'
  | 'FILE_WRITE_ERROR'
  | 'FILE_READ_ERROR'
  | 'PARSE_ERROR'
  | 'QUERY_ERROR'
  | 'EXPORT_ERROR'
  | 'AGGREGATION_ERROR'
  | 'BUFFER_OVERFLOW';
```

### Event Transformer

```typescript
// ==================== Event Transformer ====================

/**
 * Transforms game events into analytics events.
 * Enriches events with context from current game state.
 */
interface EventTransformer {
  /**
   * Transform a game event to analytics event(s)
   * Some game events may produce multiple analytics events
   * Some game events may not produce analytics events
   */
  transform(
    gameEvent: GameEvent,
    state: GameState,
    sessionId: string
  ): AnalyticsEventData[];

  /**
   * Check if game event should be captured
   */
  shouldCapture(eventType: GameEvent['type']): boolean;
}

function createEventTransformer(
  config: AnalyticsConfig
): EventTransformer;

/**
 * Event mapping configuration
 */
interface EventMappingConfig {
  /** Game events to capture */
  captureEvents: GameEvent['type'][];

  /** Events to ignore */
  ignoreEvents: GameEvent['type'][];

  /** Custom transformers by event type */
  customTransformers?: Record<string, (event: GameEvent, state: GameState) => AnalyticsEventData | null>;
}
```

---

## Configuration Files

### configs/analytics.json

```json
{
  "enabled": true,
  "captureHumanPlayers": true,
  "captureAIAgents": true,

  "storage": {
    "directory": "analytics",
    "eventsFile": "events.jsonl",
    "aggregatesFile": "aggregates.json",
    "rotateEventsAfterMB": 10,
    "maxEventFiles": 12,
    "compressionEnabled": false
  },

  "buffering": {
    "enabled": true,
    "maxBufferSize": 100,
    "flushIntervalMs": 5000,
    "flushOnSessionEnd": true
  },

  "privacy": {
    "hashProfileIds": true,
    "hashAlgorithm": "sha256",
    "excludePlayerNames": true,
    "excludeItemNames": false,
    "excludeTimestamps": false
  },

  "capture": {
    "decisions": {
      "extractVsContinue": true,
      "combatActions": true,
      "itemPickup": true,
      "eventChoices": true,
      "stashBring": true
    },
    "combat": {
      "started": true,
      "ended": true,
      "damageDealt": true,
      "damageTaken": true,
      "statusEffects": true,
      "fleeAttempts": true
    },
    "progression": {
      "levelUp": true,
      "itemEquipped": true,
      "goldChanges": true
    },
    "runs": {
      "started": true,
      "ended": true,
      "floorEntered": true
    },
    "resources": {
      "itemUsed": true,
      "stashOperations": true,
      "merchantTransactions": true
    },
    "dread": {
      "changes": true,
      "thresholdCrossings": true,
      "watcherSpawns": true
    },
    "deaths": {
      "occurred": true,
      "itemsLost": true
    }
  },

  "aggregation": {
    "enabled": true,
    "updateOnEvent": true,
    "rebuildOnCorruption": true,
    "persistIntervalMs": 30000
  },

  "export": {
    "allowedFormats": ["json", "csv", "jsonl"],
    "maxExportSizeMB": 50
  }
}
```

---

## Events Emitted/Subscribed

### Events Subscribed

The analytics system subscribes to these game events for transformation:

| Game Event | Analytics Event(s) |
|------------|-------------------|
| `SESSION_STARTED` | `run_started` |
| `SESSION_ENDED` | `run_ended` |
| `EXTRACTION_STARTED` | `decision_extract_vs_continue` (extracted=true) |
| `FLOOR_DESCENDED` | `run_floor_entered` |
| `COMBAT_STARTED` | `combat_started` |
| `COMBAT_ENDED` | `combat_ended` |
| `PLAYER_ATTACKED` | `decision_combat_action` |
| `DAMAGE_DEALT` | `combat_damage_dealt` |
| `HEALING_RECEIVED` | (not captured separately) |
| `STATUS_APPLIED` | `combat_status_applied` |
| `FLEE_ATTEMPTED` | `combat_flee_attempt` |
| `ENEMY_KILLED` | (captured in combat_ended) |
| `PLAYER_KILLED` | `death_occurred` |
| `DEATH_OCCURRED` | `death_occurred` |
| `ITEM_FOUND` | `decision_item_pickup` (with pickup decision) |
| `ITEM_PICKED_UP` | (captured in item_found) |
| `ITEM_USED` | `resource_item_used` |
| `ITEM_PURCHASED` | `resource_merchant_transaction` |
| `ITEM_SOLD` | `resource_merchant_transaction` |
| `XP_GAINED` | (not captured separately) |
| `LEVEL_UP` | `progression_level_up` |
| `GOLD_CHANGED` | `progression_gold_change` |
| `DREAD_CHANGED` | `dread_changed` |
| `DREAD_THRESHOLD_CROSSED` | `dread_threshold_crossed` |
| `WATCHER_SPAWNED` | `dread_watcher_spawned` |
| `EVENT_CHOICE_MADE` | `decision_event_choice` |

### Events Emitted

The analytics system does not emit game events. It is a passive observer.

---

## State Managed

- **Session ID**: Unique identifier for current game session (generated on launch)
- **Event buffer**: In-memory buffer of events pending write
- **Active profile hash**: Hashed ID of currently tracked profile
- **Capture state**: Whether capture is active
- **Aggregates cache**: In-memory copy of current aggregates

---

## File Format

```
profiles/{profileId}/analytics/
  events.jsonl           # Append-only event log (line-delimited JSON)
  events_2026-01.jsonl   # Rotated event files (by month or size)
  aggregates.json        # Pre-computed summaries
```

### events.jsonl Format

```jsonl
{"id":"evt_abc123","type":"run_started","timestamp":"2026-01-15T10:30:00Z","profileHash":"a1b2c3...","runId":"run_xyz","sessionId":"sess_123","playerType":"human","payload":{...}}
{"id":"evt_abc124","type":"combat_started","timestamp":"2026-01-15T10:30:15Z","profileHash":"a1b2c3...","runId":"run_xyz","sessionId":"sess_123","playerType":"human","payload":{...}}
{"id":"evt_abc125","type":"decision_combat_action","timestamp":"2026-01-15T10:30:20Z","profileHash":"a1b2c3...","runId":"run_xyz","sessionId":"sess_123","playerType":"human","payload":{...}}
```

### aggregates.json Format

```json
{
  "version": "1.0.0",
  "profileHash": "a1b2c3...",
  "lastUpdated": "2026-01-15T10:35:00Z",
  "totalEventsProcessed": 1523,
  "runs": {
    "totalRuns": 47,
    "outcomeBreakdown": { "extractions": 31, "deaths": 14, "quits": 2 },
    "winRate": 0.66,
    "avgDurationSeconds": 1080,
    ...
  },
  "combat": { ... },
  "extraction": { ... },
  "items": { ... },
  "dread": { ... },
  "deaths": { ... },
  "sessions": { ... }
}
```

---

## Edge Cases and Error Handling

### Write Failures

| Scenario | Handling |
|----------|----------|
| Disk full | Buffer events in memory, warn user, retry on space |
| Permission denied | Log error, disable capture, continue game |
| File locked | Retry with backoff, buffer in memory |
| Corrupted JSONL line | Skip line on read, don't fail entire file |

### Aggregation Errors

| Scenario | Handling |
|----------|----------|
| Aggregates file corrupted | Rebuild from events.jsonl |
| Events file corrupted | Skip corrupted entries, note in aggregates |
| Missing events file | Start fresh, create new file |
| Schema version mismatch | Migrate or rebuild |

### Privacy Edge Cases

| Scenario | Handling |
|----------|----------|
| Profile renamed | Hash still based on internal ID, not name |
| AI agent ID changes | Track both old and new for continuity |
| Export requested | Ensure hashing applied before export |

### Performance Boundaries

| Scenario | Handling |
|----------|----------|
| Buffer overflow | Flush immediately, log warning |
| Query timeout | Return partial results with flag |
| Large export | Stream to file, don't load all in memory |
| Many rotated files | Index file names, lazy load |

### Data Integrity

| Scenario | Handling |
|----------|----------|
| Crash during write | JSONL is append-only, partial line ignored |
| Duplicate events | Dedupe by event ID in aggregation |
| Out-of-order events | Sort by timestamp during query |
| Missing context | Capture what's available, mark incomplete |

---

## Test Strategy

### Unit Tests

1. **Event Transformation Tests**
   - Each game event type transforms correctly
   - Context enrichment includes all required fields
   - Payload validation catches malformed data
   - Privacy hashing applied correctly

2. **Aggregation Tests**
   - Incremental update produces correct totals
   - Rebuild from events matches incremental result
   - Edge cases (empty data, single event) handled
   - Rate calculations are accurate

3. **Query Tests**
   - Filters work correctly
   - Pagination works
   - Time range filtering accurate
   - Export formats valid

4. **Buffer Tests**
   - Events buffered correctly
   - Flush triggers on threshold
   - Flush triggers on timer
   - Buffer survives rapid events

### Integration Tests

```typescript
test("analytics captures complete run lifecycle", async () => {
  const analytics = createAnalyticsService(...);
  await analytics.initialize(testProfile);
  analytics.startCapture();

  // Simulate a complete run
  eventBus.emit(createEvent('SESSION_STARTED', { ... }));
  eventBus.emit(createEvent('COMBAT_STARTED', { ... }));
  eventBus.emit(createEvent('COMBAT_ENDED', { ... }));
  eventBus.emit(createEvent('SESSION_ENDED', { ... }));

  await analytics.flush();

  const events = await queryService.queryEvents(testProfile, {
    eventTypes: ['run_started', 'combat_started', 'combat_ended', 'run_ended']
  });

  expect(events.value.length).toBe(4);
  expect(events.value[0].type).toBe('run_started');
  expect(events.value[3].type).toBe('run_ended');
});

test("aggregates update correctly", async () => {
  // Run multiple simulated sessions
  for (let i = 0; i < 10; i++) {
    await simulateRun(eventBus, { outcome: i < 7 ? 'extraction' : 'death' });
  }

  await analytics.flush();
  const aggregates = await aggregatesService.getAggregates(testProfile);

  expect(aggregates.value.runs.totalRuns).toBe(10);
  expect(aggregates.value.runs.winRate).toBeCloseTo(0.7, 1);
});

test("privacy hashing is consistent", async () => {
  const event1 = transformer.transform(gameEvent1, state, sessionId);
  const event2 = transformer.transform(gameEvent2, state, sessionId);

  // Same profile produces same hash
  expect(event1[0].profileHash).toBe(event2[0].profileHash);

  // Hash is not the original profile name
  expect(event1[0].profileHash).not.toBe(state.profile.name);
});
```

### Property Tests

```typescript
property("all events have required fields", (event: AnalyticsEventData) => {
  return (
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.profileHash === 'string' &&
    typeof event.sessionId === 'string' &&
    ['human', 'ai_agent'].includes(event.playerType)
  );
});

property("aggregates totals are non-negative", (aggregates: ProfileAggregates) => {
  return (
    aggregates.runs.totalRuns >= 0 &&
    aggregates.combat.totalCombats >= 0 &&
    aggregates.deaths.totalDeaths >= 0 &&
    aggregates.runs.winRate >= 0 &&
    aggregates.runs.winRate <= 1
  );
});

property("event buffer never exceeds max size", (events: GameEvent[]) => {
  const buffer = createEventBuffer(100);
  events.forEach(e => buffer.add(transform(e)));
  return buffer.size() <= 100;
});
```

---

## Implementation Notes

### JSONL Append Strategy

```typescript
async function appendEvent(
  fs: FileSystem,
  filePath: string,
  event: AnalyticsEventData
): Promise<Result<void, AnalyticsError>> {
  const line = JSON.stringify(event) + '\n';

  try {
    // Use append mode - creates file if not exists
    await fs.appendFile(filePath, line);
    return ok(undefined);
  } catch (e) {
    return err({
      code: 'FILE_WRITE_ERROR',
      message: `Failed to append event: ${e.message}`,
      context: { eventId: event.id, filePath }
    });
  }
}
```

### Event Buffer Implementation

```typescript
class EventBuffer {
  private buffer: AnalyticsEventData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private maxSize: number,
    private flushIntervalMs: number,
    private onFlush: (events: AnalyticsEventData[]) => Promise<void>
  ) {
    this.startTimer();
  }

  add(event: AnalyticsEventData): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = this.buffer;
    this.buffer = [];
    await this.onFlush(events);
  }

  private startTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}
```

### Profile ID Hashing

```typescript
import { createHash } from 'crypto';

function hashProfileId(
  profileId: string,
  algorithm: string = 'sha256'
): string {
  return createHash(algorithm)
    .update(profileId)
    .digest('hex')
    .substring(0, 16); // Truncate for readability
}
```

### File Rotation

```typescript
async function rotateIfNeeded(
  fs: FileSystem,
  filePath: string,
  maxSizeMB: number
): Promise<string> {
  const exists = await fs.exists(filePath);
  if (!exists) return filePath;

  const stats = await fs.stat(filePath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB >= maxSizeMB) {
    const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM
    const rotatedPath = filePath.replace('.jsonl', `_${timestamp}.jsonl`);
    await fs.rename(filePath, rotatedPath);
  }

  return filePath;
}
```

### Incremental Aggregate Updates

```typescript
function updateRunAggregates(
  current: RunAggregates,
  event: RunEndedEvent
): RunAggregates {
  const newTotal = current.totalRuns + 1;

  return {
    totalRuns: newTotal,
    outcomeBreakdown: {
      ...current.outcomeBreakdown,
      [event.payload.result === 'extraction' ? 'extractions' :
       event.payload.result === 'death' ? 'deaths' : 'quits']:
        current.outcomeBreakdown[
          event.payload.result === 'extraction' ? 'extractions' :
          event.payload.result === 'death' ? 'deaths' : 'quits'
        ] + 1
    },
    winRate: (current.outcomeBreakdown.extractions +
              (event.payload.result === 'extraction' ? 1 : 0)) / newTotal,
    avgDurationSeconds: (
      (current.avgDurationSeconds * current.totalRuns) +
      event.payload.durationSeconds
    ) / newTotal,
    // ... update other fields
  };
}
```

---

## Public Exports

```typescript
// src/core/analytics/index.ts

export type {
  // Service interfaces
  AnalyticsService,
  AggregatesService,
  AnalyticsQueryService,
  EventTransformer,

  // Status and config
  AnalyticsStatus,
  AnalyticsConfig,
  EventMappingConfig,

  // Event types
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsEventData,
  DecisionExtractEvent,
  DecisionCombatActionEvent,
  CombatEndedEvent,
  RunEndedEvent,
  DeathOccurredEvent,
  DreadChangedEvent,
  ItemUsedEvent,
  MerchantTransactionEvent,

  // Aggregates
  ProfileAggregates,
  RunAggregates,
  CombatAggregates,
  ExtractionAggregates,
  ItemAggregates,
  DreadAggregates,
  DeathAggregates,
  SessionAggregates,

  // Query types
  EventQuery,
  WinLossContext,
  WinLossBreakdown,
  ItemUsageAnalysis,
  BuildDistribution,
  TimeToKillMetrics,
  EconomyFlow,
  ExportOptions,

  // Errors
  AnalyticsError,
  AnalyticsErrorCode,
};

export {
  // Factory functions
  createAnalyticsService,
  createAggregatesService,
  createAnalyticsQueryService,
  createEventTransformer,

  // Utilities
  hashProfileId,
};
```
