# 16 - Agent Mode

## Purpose

Provides a structured JSON interface for AI agents (such as Claude Code) to play DARKDELVE programmatically. Agent Mode is an alternative presentation layer that outputs complete observable game state as JSON and accepts deterministic command strings, enabling automated playtesting, balance analysis, AI-vs-game experimentation, and reproducible sessions.

**Design Principle**: Same game core, different output format. Agent Mode is a presentation layer - it transforms game state into machine-parseable JSON while the underlying game mechanics remain identical to human play.

---

## Responsibilities

1. Transform all game state queries into structured JSON responses
2. Accept and validate deterministic command strings
3. Provide complete observable state after every action
4. Expose available actions as explicit string commands
5. Apply Dread corruption to JSON values (ranges, uncertainty)
6. Tag sessions for analytics separation from human players
7. Support seed-based RNG for reproducible sessions
8. Include RNG state in responses for debugging and replay
9. Provide session management (create, query, end)

---

## Dependencies

- **01-foundation**: Types, Result, SeededRNG, RNGState, EntityId, Timestamp
- **02-content-registry**: ContentRegistry for item/monster lookups
- **03-state-management**: GameState, GamePhase, all state types
- **04-event-system**: EventBus, GameEvent (for session events)
- **05-command-system**: CommandProcessor, GameCommand, CommandResult, AvailableCommand
- **06-character-system**: CharacterService for stat calculations
- **07-item-system**: ItemService for item info
- **08-combat-system**: CombatState, EnemyCombatState
- **09-dread-system**: DreadManager for corruption
- **10-dungeon-system**: DungeonState, RoomInstanceState
- **11-extraction-system**: ExtractionService for cost calculations
- **12-camp-system**: CampService, ExpeditionService views
- **13-save-system**: ProfileManager for agent profile handling

---

## Interface Contracts

### Agent Mode Adapter

```typescript
// ==================== Agent Mode Adapter ====================

/**
 * Main interface for AI agent interaction.
 * Wraps the game core and provides JSON-formatted responses.
 */
interface AgentModeAdapter {
  // === Session Management ===

  /**
   * Create a new agent session
   * @param options - Session configuration including seed and agent ID
   * @returns Initial game state response
   */
  createSession(options: AgentSessionOptions): AgentResponse;

  /**
   * Execute a command in the current session
   * @param command - Exact command string from available_actions
   * @returns Updated state response or error
   */
  executeCommand(command: string): AgentResponse;

  /**
   * Query current state without executing an action
   * @returns Current observable state
   */
  queryState(): AgentStateResponse;

  /**
   * Query specific subsystem state
   */
  querySubstate(subsystem: AgentSubsystem): AgentSubstateResponse;

  /**
   * End the current session
   * @param reason - Why session is ending
   */
  endSession(reason: SessionEndReason): AgentSessionEndResponse;

  /**
   * Get session metadata
   */
  getSessionInfo(): AgentSessionInfo;

  // === Utility ===

  /**
   * Validate a command without executing
   * @returns Whether command is valid and why if not
   */
  validateCommand(command: string): AgentValidationResponse;

  /**
   * Get help for available commands in current context
   */
  getCommandHelp(): AgentCommandHelpResponse;

  /**
   * Get config values relevant to agents
   */
  getConfig(): AgentConfigResponse;
}

interface AgentSessionOptions {
  /** Agent identifier (model name, version, experiment ID) */
  agentId: string;

  /** Profile name to use or create */
  profileName: string;

  /** RNG seed for reproducibility (optional, auto-generated if not provided) */
  seed?: number;

  /** Character class to start with (for new profiles) */
  characterClass?: CharacterClass;

  /** Verbosity level for state responses */
  verbosity?: AgentVerbosity;

  /** Whether to include event log in responses */
  includeEvents?: boolean;

  /** Maximum events to include per response */
  maxEventsPerResponse?: number;
}

type AgentVerbosity =
  | 'minimal'    // Core state only (HP, location, actions)
  | 'standard'   // Full observable state
  | 'verbose';   // Include derived values, breakdowns, help text

type SessionEndReason =
  | 'completed'   // Agent finished playing
  | 'error'       // Unrecoverable error
  | 'timeout'     // Session timed out
  | 'manual';     // Manual termination

type AgentSubsystem =
  | 'player'
  | 'location'
  | 'inventory'
  | 'combat'
  | 'dread'
  | 'merchant'
  | 'stash'
  | 'bestiary';

/**
 * Create agent mode adapter instance
 */
function createAgentModeAdapter(
  gameSession: GameSession,
  dreadManager: DreadManager,
  contentRegistry: ContentRegistry,
  profileManager: ProfileManager,
  eventBus: EventBus
): AgentModeAdapter;
```

### Agent Response Types

```typescript
// ==================== Response Types ====================

/**
 * Standard response wrapper for all agent interactions
 */
interface AgentResponse {
  /** Whether the operation succeeded */
  success: boolean;

  /** Error details if not successful */
  error?: AgentError;

  /** Game state after the operation */
  state?: AgentStateResponse;

  /** Events generated by this operation */
  events?: AgentEventRecord[];

  /** Response metadata */
  meta: AgentResponseMeta;
}

interface AgentResponseMeta {
  /** Response timestamp */
  timestamp: Timestamp;

  /** Current RNG state (for reproducibility) */
  rngState: RNGState;

  /** Session ID */
  sessionId: string;

  /** Turn counter (increments on game-advancing actions) */
  turnNumber: number;

  /** Response generation time in ms */
  responseTimeMs: number;
}

interface AgentError {
  /** Machine-readable error code */
  code: AgentErrorCode;

  /** Human-readable error message */
  message: string;

  /** Valid commands that could work instead */
  suggestions?: string[];

  /** Additional context */
  context?: Record<string, unknown>;
}

type AgentErrorCode =
  // Command errors
  | 'INVALID_COMMAND'
  | 'UNKNOWN_COMMAND'
  | 'COMMAND_NOT_AVAILABLE'
  | 'INVALID_TARGET'
  | 'MALFORMED_COMMAND'

  // Resource errors
  | 'INSUFFICIENT_GOLD'
  | 'INSUFFICIENT_STAMINA'
  | 'INSUFFICIENT_SPACE'

  // State errors
  | 'WRONG_PHASE'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_ENDED'

  // System errors
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR';
```

### Agent State Response

```typescript
// ==================== State Response ====================

/**
 * Complete observable game state in JSON format.
 * Returned after every action.
 */
interface AgentStateResponse {
  /** Current game phase */
  phase: GamePhase;

  /** Location information */
  location: AgentLocationState;

  /** Player state */
  player: AgentPlayerState;

  /** Available actions as exact command strings */
  available_actions: string[];

  /** Detailed action info (if verbosity >= standard) */
  action_details?: AgentActionDetail[];

  /** Current combat state (null if not in combat) */
  combat?: AgentCombatState | null;

  /** Current event state (null if not in event) */
  event?: AgentEventState | null;

  /** Inventory state */
  inventory: AgentInventoryState;

  /** Active effects on player */
  effects: AgentEffectState[];

  /** Camp-specific state (when at camp) */
  camp?: AgentCampState;

  /** Dungeon-specific state (when in dungeon) */
  dungeon?: AgentDungeonState;

  /** Session statistics */
  session_stats: AgentSessionStats;
}

// ==================== Location State ====================

interface AgentLocationState {
  /** Current context */
  context: 'camp' | 'dungeon';

  /** Dungeon ID (if in dungeon) */
  dungeon_id?: string;

  /** Current floor (if in dungeon) */
  floor?: number;

  /** Current room ID (if in dungeon) */
  room_id?: string;

  /** Current room type (if in dungeon) - may be corrupted by Dread */
  room_type?: RoomType | 'unknown';

  /** Connected rooms (may be corrupted by Dread) */
  connections?: AgentRoomConnection[];

  /** Camp menu location (if at camp) */
  camp_menu?: CampDestination;
}

interface AgentRoomConnection {
  /** Direction */
  direction: Direction;

  /** Target room ID */
  room_id: string;

  /** Room type preview (corrupted at high Dread) */
  room_type: RoomType | 'unknown';

  /** Room state */
  state: RoomState;
}

// ==================== Player State ====================

interface AgentPlayerState {
  /** Current HP - may be exact or range based on Dread */
  hp: number | AgentNumericRange;

  /** Max HP */
  max_hp: number;

  /** Current stamina (in combat) */
  stamina?: number;

  /** Max stamina */
  max_stamina?: number;

  /** Current Dread (0-100) */
  dread: number;

  /** Dread threshold name */
  dread_threshold: DreadThreshold;

  /** Current gold */
  gold: number;

  /** Character level */
  level: number;

  /** Current XP */
  xp: number;

  /** XP to next level */
  xp_to_next_level: number;

  /** Base stats */
  stats: AgentStatBlock;

  /** Effective stats (base + equipment) */
  effective_stats?: AgentStatBlock;

  /** Equipped items */
  equipment: AgentEquipmentState;

  /** Class */
  class: CharacterClass;

  /** Active lesson learned bonus */
  lesson_learned?: AgentLessonLearned | null;
}

interface AgentNumericRange {
  /** Minimum possible value */
  min: number;

  /** Maximum possible value */
  max: number;

  /** Whether this is a Dread-corrupted estimate */
  uncertain: boolean;
}

interface AgentStatBlock {
  vigor: number;
  might: number;
  cunning: number;
}

interface AgentEquipmentState {
  weapon: AgentEquippedItem;
  armor: AgentEquippedItem | null;
  helm: AgentEquippedItem | null;
  accessory: AgentEquippedItem | null;
}

interface AgentEquippedItem {
  id: EntityId;
  template_id: string;
  name: string;
  rarity: Rarity;
  identified: boolean;

  /** Item stats as display string */
  stats: string;

  /** Full item effects */
  effects?: AgentItemEffect[];
}

interface AgentItemEffect {
  type: string;
  description: string;
  value?: number | string;
}

interface AgentLessonLearned {
  enemy_type: string;
  enemy_name: string;
  damage_bonus: number;
  runs_remaining: number;
}

// ==================== Combat State ====================

interface AgentCombatState {
  /** Current turn number */
  turn: number;

  /** Combat phase */
  phase: CombatPhase;

  /** Enemy information (may be corrupted by Dread) */
  enemy: AgentEnemyState;

  /** Player combat state */
  player: AgentPlayerCombatState;

  /** Recent combat log entries */
  log: AgentCombatLogEntry[];

  /** Whether player has acted this turn */
  player_acted: boolean;

  /** Whether this is a boss fight */
  is_boss: boolean;

  /** Whether this is The Watcher */
  is_watcher: boolean;
}

interface AgentEnemyState {
  /** Enemy instance ID (for targeting) */
  id: string;

  /** Enemy type (may be wrong at high Dread) */
  type: string;

  /** Display name (may be wrong at high Dread) */
  name: string;

  /** HP estimate - exact at low Dread, range at high Dread */
  hp: number | AgentNumericRange | '???';

  /** HP as percentage category */
  hp_estimate: 'full' | 'high' | 'medium' | 'low' | 'critical' | 'unknown';

  /** Max HP (if known via Veteran Knowledge) */
  max_hp?: number;

  /** Armor value (if known) */
  armor?: number | '???';

  /** Active status effects */
  effects: AgentEffectState[];

  /** Whether enemy is staggered */
  is_staggered: boolean;

  /** Enemy speed category */
  speed: EnemySpeed | 'unknown';

  /** Veteran knowledge tier for this enemy */
  veteran_tier?: 0 | 1 | 2 | 3;

  /** Veteran knowledge override (shown alongside corrupted values) */
  veteran_override?: {
    hp?: number;
    max_hp?: number;
    armor?: number;
  };
}

interface AgentPlayerCombatState {
  hp: number;
  max_hp: number;
  stamina: number;
  max_stamina: number;
  is_blocking: boolean;
  is_dodging: boolean;
  effects: AgentEffectState[];
}

interface AgentCombatLogEntry {
  turn: number;
  actor: 'player' | 'enemy' | 'system';
  action: string;
  result: string;
  damage?: number;
  critical?: boolean;
  blocked?: boolean;
  dodged?: boolean;
}

// ==================== Effect State ====================

interface AgentEffectState {
  id: string;
  name: string;
  description: string;
  stacks: number;
  duration: number | 'permanent';
  is_debuff: boolean;
  source: 'player' | 'enemy' | 'environment' | 'item';
}

// ==================== Event State ====================

interface AgentEventState {
  event_id: string;
  title: string;
  description: string;
  choices: AgentEventChoice[];
}

interface AgentEventChoice {
  /** Choice ID (used in command) */
  id: string;

  /** Choice display text */
  text: string;

  /** Whether choice has a stat check */
  has_check: boolean;

  /** Which stat is checked */
  check_stat?: StatName;

  /** Whether you meet the check threshold */
  check_meets_threshold?: boolean;

  /** Hint about outcome (if any) */
  hint?: string;
}

// ==================== Inventory State ====================

interface AgentInventoryState {
  /** Items in run inventory */
  items: AgentInventoryItem[];

  /** Current capacity */
  count: number;

  /** Max capacity */
  capacity: number;

  /** Consumable slots */
  consumables: AgentConsumableSlot[];

  /** Items brought from stash (at risk) */
  brought_items: AgentBroughtItem[];
}

interface AgentInventoryItem {
  id: EntityId;
  template_id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  identified: boolean;
  stats?: string;
}

interface AgentConsumableSlot {
  slot_index: number;
  template_id: string;
  name: string;
  count: number;
  max_stack: number;
  effect_description: string;
}

interface AgentBroughtItem {
  id: EntityId;
  name: string;
  /** Always 'doomed' - will be lost on death */
  risk_status: 'doomed';
}

// ==================== Camp State ====================

interface AgentCampState {
  /** Current camp submenu */
  current_menu: CampDestination;

  /** Stash info */
  stash: AgentStashState;

  /** Merchant info (when viewing merchant) */
  merchant?: AgentMerchantState;

  /** Expedition prep state (when preparing) */
  expedition_prep?: AgentExpeditionPrepState;

  /** Whether level up is available */
  can_level_up: boolean;

  /** Available stat choices for level up */
  level_up_choices?: StatName[];
}

interface AgentStashState {
  items: AgentStashItem[];
  count: number;
  capacity: number;
}

interface AgentStashItem {
  id: EntityId;
  template_id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  identified: boolean;
  sell_value: number;
}

interface AgentMerchantState {
  gold: number;
  always_available: AgentMerchantItem[];
  rotating_stock: AgentMerchantItem[];
  can_sell: boolean;
  has_buyback: boolean;
}

interface AgentMerchantItem {
  template_id: string;
  name: string;
  price: number;
  can_afford: boolean;
  in_stock: boolean;
  slot: ItemSlot;
  description: string;
}

interface AgentExpeditionPrepState {
  selected_bring_items: EntityId[];
  max_bring_items: number;
  selected_consumables: AgentSelectedConsumable[];
  max_consumable_slots: number;
  ready_to_begin: boolean;
  issues: string[];
}

interface AgentSelectedConsumable {
  slot_index: number;
  template_id: string;
  name: string;
  count: number;
  source: 'stash' | 'merchant';
}

// ==================== Dungeon State ====================

interface AgentDungeonState {
  dungeon_id: string;
  dungeon_name: string;
  current_floor: FloorNumber;
  current_room: AgentRoomState;

  /** Gold collected this run */
  gold_collected: number;

  /** XP collected this run */
  xp_collected: number;

  /** Enemies killed this run */
  enemies_killed: number;

  /** Exploration turns (affects Dread) */
  exploration_turns: number;

  /** Whether Watcher is active */
  watcher_active: boolean;

  /** Watcher state (if active) */
  watcher?: AgentWatcherState;

  /** Extraction cost for current stairwell (if in stairwell) */
  extraction_cost?: AgentExtractionCost;
}

interface AgentRoomState {
  id: string;
  type: RoomType;
  state: RoomState;

  /** Room-specific content based on type */
  content?: AgentRoomContent;
}

type AgentRoomContent =
  | AgentCombatRoomContent
  | AgentTreasureRoomContent
  | AgentEventRoomContent
  | AgentRestRoomContent
  | AgentStairwellRoomContent
  | AgentThresholdRoomContent;

interface AgentCombatRoomContent {
  type: 'combat';
  enemy_defeated: boolean;
  loot_available: boolean;
  loot?: AgentLootItem[];
}

interface AgentTreasureRoomContent {
  type: 'treasure';
  chest_type: 'standard' | 'locked' | 'ornate';
  opened: boolean;
  examined: boolean;
  loot?: AgentLootItem[];
}

interface AgentEventRoomContent {
  type: 'event';
  completed: boolean;
  choice_made: string | null;
}

interface AgentRestRoomContent {
  type: 'rest';
  rest_type: 'safe_alcove' | 'corrupted';
  used: boolean;
}

interface AgentStairwellRoomContent {
  type: 'stairwell';
  can_descend: boolean;
  can_extract: boolean;
  extraction_cost: AgentExtractionCost;
}

interface AgentThresholdRoomContent {
  type: 'threshold';
  boss_ready: boolean;
  retreat_cost: AgentRetreatCost;
}

interface AgentLootItem {
  id: EntityId;
  type: 'item' | 'gold';
  template_id?: string;
  name?: string;
  rarity?: Rarity;
  gold?: number;
  collected: boolean;
}

interface AgentExtractionCost {
  type: 'free' | 'gold' | 'item';
  gold_amount?: number;
  gold_percent?: number;
}

interface AgentRetreatCost {
  gold_amount: number;
  gold_percent: number;
  can_pay_with_item: boolean;
}

interface AgentWatcherState {
  hp: number;
  is_stunned: boolean;
  stun_count: number;
  is_enraged: boolean;
  is_immune: boolean;
  extraction_blocked: boolean;
  escape_window_turns: number;
}

// ==================== Session Stats ====================

interface AgentSessionStats {
  /** Total turns taken this session */
  total_turns: number;

  /** Total commands executed */
  commands_executed: number;

  /** Invalid commands attempted */
  invalid_commands: number;

  /** Session duration in seconds */
  session_duration_seconds: number;

  /** Run statistics */
  runs_completed: number;
  runs_failed: number;

  /** Current run stats */
  current_run?: {
    floor_reached: number;
    enemies_killed: number;
    gold_collected: number;
    items_found: number;
    dread_peak: number;
  };
}
```

### Action Details

```typescript
// ==================== Action Details ====================

interface AgentActionDetail {
  /** Exact command string */
  command: string;

  /** Human-readable description */
  description: string;

  /** Command category */
  category: CommandCategory;

  /** Whether this action can be executed */
  enabled: boolean;

  /** Why disabled (if not enabled) */
  disabled_reason?: string;

  /** Resource cost preview */
  cost?: AgentActionCost;

  /** Whether confirmation would be required in human mode */
  requires_confirmation: boolean;

  /** Keyboard shortcut (for reference) */
  shortcut?: string;
}

interface AgentActionCost {
  type: 'stamina' | 'gold' | 'item' | 'dread';
  amount: number;
  item_name?: string;
}
```

### Event Records

```typescript
// ==================== Event Records ====================

/**
 * Simplified event record for agent consumption
 */
interface AgentEventRecord {
  /** Event type */
  type: GameEvent['type'];

  /** Timestamp */
  timestamp: Timestamp;

  /** Key event data (varies by type) */
  data: Record<string, unknown>;

  /** Human-readable summary */
  summary: string;
}
```

### Session Info

```typescript
// ==================== Session Info ====================

interface AgentSessionInfo {
  /** Session ID */
  session_id: string;

  /** Agent ID */
  agent_id: string;

  /** Profile name */
  profile_name: string;

  /** Session start time */
  started_at: Timestamp;

  /** Current RNG seed */
  seed: number;

  /** Current RNG state */
  rng_state: RNGState;

  /** Verbosity level */
  verbosity: AgentVerbosity;

  /** Whether session is active */
  is_active: boolean;

  /** Total commands executed */
  commands_executed: number;

  /** Game version */
  game_version: string;
}

interface AgentSessionEndResponse {
  success: boolean;
  session_id: string;
  final_stats: AgentSessionStats;
  profile_saved: boolean;
}
```

### Validation and Help Responses

```typescript
// ==================== Validation Response ====================

interface AgentValidationResponse {
  /** Whether command is valid */
  valid: boolean;

  /** Error details if invalid */
  error?: AgentError;

  /** Parsed command (if valid) */
  parsed_command?: GameCommand;

  /** What would happen (preview) */
  preview?: string;
}

// ==================== Command Help Response ====================

interface AgentCommandHelpResponse {
  /** Current phase */
  phase: GamePhase;

  /** Commands available in this phase */
  commands: AgentCommandHelp[];

  /** Phase description */
  phase_description: string;
}

interface AgentCommandHelp {
  /** Command pattern */
  pattern: string;

  /** Examples */
  examples: string[];

  /** Description */
  description: string;

  /** Category */
  category: CommandCategory;

  /** Parameters */
  parameters?: AgentCommandParameter[];
}

interface AgentCommandParameter {
  name: string;
  type: 'target_id' | 'slot' | 'direction' | 'choice_id' | 'count';
  description: string;
  required: boolean;
  valid_values?: string[];
}

// ==================== Config Response ====================

interface AgentConfigResponse {
  /** Stash capacity */
  stash_capacity: number;

  /** Max bring items */
  max_bring_items: number;

  /** Consumable slots */
  consumable_slots: number;

  /** Max inventory */
  max_inventory: number;

  /** Dread thresholds */
  dread_thresholds: Record<DreadThreshold, { min: number; max: number }>;

  /** Floor count */
  floor_count: number;

  /** Session timeout */
  session_timeout_seconds: number;
}
```

### Command Parser

```typescript
// ==================== Command Parser ====================

/**
 * Parses agent command strings into GameCommand objects.
 */
interface AgentCommandParser {
  /**
   * Parse a command string into a GameCommand
   */
  parse(commandString: string): Result<GameCommand, AgentError>;

  /**
   * Get command pattern for a GameCommand type
   */
  getPattern(commandType: GameCommand['type']): string;

  /**
   * Generate command string from GameCommand
   */
  stringify(command: GameCommand): string;

  /**
   * Get all valid command patterns for current phase
   */
  getValidPatterns(phase: GamePhase): string[];
}

function createAgentCommandParser(): AgentCommandParser;
```

---

## Configuration Files

### configs/agent_mode.json

```json
{
  "enabled": true,

  "session": {
    "timeout_seconds": 3600,
    "max_commands_per_session": 10000,
    "auto_save_interval_commands": 100
  },

  "output": {
    "default_verbosity": "standard",
    "include_events_by_default": true,
    "max_events_per_response": 50,
    "include_combat_log_entries": 10,
    "include_timestamps": true,
    "include_rng_state": true
  },

  "commands": {
    "case_sensitive": false,
    "allow_shortcuts": true,
    "strict_parsing": true
  },

  "dread_corruption": {
    "apply_to_agent": true,
    "show_veteran_overrides": true,
    "format_uncertain_as_range": true
  },

  "analytics": {
    "tag_as_ai_agent": true,
    "log_command_timing": true,
    "log_invalid_commands": true
  },

  "reproducibility": {
    "require_seed": false,
    "allow_seed_override": true,
    "include_full_rng_state": true
  },

  "rate_limiting": {
    "enabled": false,
    "max_commands_per_second": 100,
    "burst_limit": 10
  }
}
```

---

## Command String Format

### Command Patterns

Agent commands are simple string commands. The format is:

```
<verb> [target] [parameters]
```

### Camp Commands

| Command | Pattern | Example |
|---------|---------|---------|
| View stash | `view stash` | `view stash` |
| View equipment | `view equipment` | `view equipment` |
| View character | `view character` | `view character` |
| View merchant | `view merchant` | `view merchant` |
| View chronicler | `view chronicler` | `view chronicler` |
| Begin expedition | `begin expedition` | `begin expedition` |
| Return to main | `back` | `back` |
| Quit | `quit` | `quit` |

### Stash Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Equip from stash | `equip <item_id>` | `equip item_abc123` |
| Drop item | `drop <item_id> confirmed` | `drop item_abc123 confirmed` |

### Equipment Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Equip item | `equip <item_id> to <slot>` | `equip item_abc to weapon` |
| Unequip slot | `unequip <slot>` | `unequip helm` |

### Expedition Prep Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Select bring item | `bring <item_id>` | `bring item_abc123` |
| Deselect bring item | `unbring <item_id>` | `unbring item_abc123` |
| Select consumable (stash) | `consumable <template_id> from stash` | `consumable healing_potion from stash` |
| Select consumable (buy) | `consumable <template_id> from merchant` | `consumable healing_potion from merchant` |
| Deselect consumable | `remove consumable <slot>` | `remove consumable 0` |
| Confirm expedition | `confirm expedition` | `confirm expedition` |
| Cancel | `cancel` | `cancel` |

### Merchant Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Buy item | `buy <template_id>` | `buy healing_potion` |
| Sell item | `sell <item_id>` | `sell item_abc123` |
| Buyback item | `buyback <item_id>` | `buyback item_xyz789` |

### Navigation Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Move to room | `move <direction>` | `move north` |
| Move back | `move back` | `move back` |

### Combat Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Light attack | `attack light` | `attack light` |
| Heavy attack | `attack heavy` | `attack heavy` |
| Dodge | `dodge` | `dodge` |
| Block | `block` | `block` |
| Pass turn | `pass` | `pass` |
| Use consumable | `use <slot>` | `use 0` |
| Flee | `flee` | `flee` |

### Treasure Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Pick lock | `pick lock` | `pick lock` |
| Force open | `force open` | `force open` |
| Smash chest | `smash` | `smash` |
| Examine chest | `examine` | `examine` |
| Take item | `take <item_id>` | `take item_abc123` |
| Take all | `take all` | `take all` |
| Leave | `leave` | `leave` |

### Event Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Choose option | `choose <choice_id>` | `choose help_stranger` |

### Rest Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Full rest | `rest full` | `rest full` |
| Brief rest | `rest brief` | `rest brief` |
| Meditate | `meditate` | `meditate` |
| Leave | `leave` | `leave` |

### Stairwell Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Descend | `descend` | `descend` |
| Extract (free/gold) | `extract` | `extract` |
| Extract (with item) | `extract with <item_id>` | `extract with item_abc` |
| Return to floor | `return` | `return` |

### Threshold Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Enter boss | `enter boss` | `enter boss` |
| Return | `return` | `return` |
| Retreat (gold) | `retreat gold` | `retreat gold` |
| Retreat (item) | `retreat item <item_id>` | `retreat item item_abc` |

### System Commands

| Command | Pattern | Example |
|---------|---------|---------|
| Inspect item | `inspect <item_id>` | `inspect item_abc123` |
| Query state | `query` | `query` |
| Query substate | `query <subsystem>` | `query combat` |
| Get help | `help` | `help` |
| Get config | `config` | `config` |

---

## Events Emitted

### AGENT_SESSION_STARTED

Emitted when an agent session begins.

```typescript
interface AgentSessionStartedEvent {
  type: 'AGENT_SESSION_STARTED';
  timestamp: Timestamp;
  sessionId: string;
  agentId: string;
  profileName: string;
  seed: number;
}
```

### AGENT_SESSION_ENDED

Emitted when an agent session ends.

```typescript
interface AgentSessionEndedEvent {
  type: 'AGENT_SESSION_ENDED';
  timestamp: Timestamp;
  sessionId: string;
  agentId: string;
  reason: SessionEndReason;
  commandsExecuted: number;
  durationSeconds: number;
}
```

### AGENT_COMMAND_EXECUTED

Emitted for every command (for analytics).

```typescript
interface AgentCommandExecutedEvent {
  type: 'AGENT_COMMAND_EXECUTED';
  timestamp: Timestamp;
  sessionId: string;
  agentId: string;
  command: string;
  success: boolean;
  errorCode?: AgentErrorCode;
  responseTimeMs: number;
}
```

---

## Events Subscribed

The agent mode adapter subscribes to all game events to include them in responses when `includeEvents` is enabled. It doesn't modify game behavior based on events.

---

## State Managed

Agent Mode is stateless beyond session tracking. All game state is managed by `03-state-management`. Agent Mode maintains:

- **Active sessions**: Map of session ID to session metadata
- **Command history**: Recent commands per session (for debugging)
- **Response cache**: Optional caching of computed values

---

## Dread Corruption in Agent Mode

Dread still affects information quality in Agent Mode. The corruption manifests differently in JSON:

### HP Values

| Dread Level | JSON Format | Example |
|-------------|-------------|---------|
| Calm (0-49) | Exact number | `"hp": 24` |
| Uneasy (50-69) | Small range | `"hp": {"min": 22, "max": 26, "uncertain": true}` |
| Shaken (70-84) | Larger range | `"hp": {"min": 18, "max": 30, "uncertain": true}` |
| Terrified (85-99) | Category only | `"hp": "???", "hp_estimate": "medium"` |
| Breaking (100) | Category only | `"hp": "???", "hp_estimate": "unknown"` |

### Room Types

| Dread Level | Behavior |
|-------------|----------|
| Calm (0-49) | Exact room type |
| Uneasy+ | May show `"room_type": "unknown"` for unexplored rooms |

### Enemy Names

| Dread Level | Behavior |
|-------------|----------|
| Calm (0-49) | Correct name |
| Shaken+ | May show wrong name from alternatives |

### Veteran Knowledge Override

When player has Veteran Knowledge and Dread is corrupting values:

```json
{
  "enemy": {
    "hp": {"min": 18, "max": 30, "uncertain": true},
    "hp_estimate": "medium",
    "veteran_tier": 3,
    "veteran_override": {
      "hp": 24,
      "max_hp": 35,
      "armor": 5
    }
  }
}
```

The agent can choose to trust either the corrupted visible value or the veteran override.

---

## Edge Cases and Error Handling

### Command Parsing

| Case | Handling |
|------|----------|
| Unknown command | Return `UNKNOWN_COMMAND` with suggestions |
| Malformed command | Return `MALFORMED_COMMAND` with pattern hint |
| Missing parameter | Return `MALFORMED_COMMAND` listing required params |
| Invalid target ID | Return `INVALID_TARGET` with valid targets |
| Command not available in phase | Return `COMMAND_NOT_AVAILABLE` with available commands |

### Session Management

| Case | Handling |
|------|----------|
| Create session with existing profile | Load profile, continue |
| Create session with new profile | Create profile, initialize |
| Command on ended session | Return `SESSION_ENDED` error |
| Session timeout | Auto-save, end session |
| Concurrent session on same profile | Reject second session |

### Reproducibility

| Case | Handling |
|------|----------|
| Same seed, same commands | Identical state sequence guaranteed |
| Seed not provided | Generate random seed, include in response |
| Restore from RNG state | Full determinism from that point |
| Mid-session seed change | Not allowed |

### Error Recovery

| Case | Handling |
|------|----------|
| Invalid command | No state change, return error with suggestions |
| Internal error | Log error, return `INTERNAL_ERROR`, state unchanged |
| Corruption in response | Should never happen (state is source of truth) |

---

## Test Strategy

### Unit Tests

1. **Command Parser Tests**
   - Parse all valid command patterns
   - Reject malformed commands
   - Case insensitivity handling
   - Parameter extraction

2. **State Transformation Tests**
   - All state fields correctly transformed to JSON
   - Dread corruption applied correctly
   - Veteran knowledge override formatting
   - Action list generation

3. **Session Management Tests**
   - Create session with various options
   - Session timeout handling
   - Command counting
   - Session end processing

4. **Reproducibility Tests**
   - Same seed produces same sequence
   - RNG state correctly captured
   - Full replay from initial seed

### Integration Tests

1. **Full Game Flow**
   ```typescript
   test("agent can complete full extraction run", async () => {
     const adapter = createAgentModeAdapter(/*...*/);
     const session = adapter.createSession({ agentId: "test", profileName: "test_profile", seed: 12345 });

     // Navigate camp
     adapter.executeCommand("view stash");
     adapter.executeCommand("back");
     adapter.executeCommand("begin expedition");
     adapter.executeCommand("confirm expedition");

     // Play through dungeon
     while (state.phase !== 'camp_main') {
       const actions = adapter.queryState().available_actions;
       // Execute appropriate action based on state
       adapter.executeCommand(selectAction(actions, state));
     }

     expect(adapter.getSessionInfo().commands_executed).toBeGreaterThan(0);
   });
   ```

2. **Dread Corruption Verification**
   ```typescript
   test("Dread corrupts enemy HP at high levels", async () => {
     // Set up combat with high Dread
     const state = adapter.queryState();
     expect(state.combat?.enemy.hp).toHaveProperty('uncertain', true);
   });
   ```

3. **Command Error Handling**
   ```typescript
   test("invalid command returns helpful error", async () => {
     const response = adapter.executeCommand("attack goblin");
     expect(response.success).toBe(false);
     expect(response.error?.code).toBe('MALFORMED_COMMAND');
     expect(response.error?.suggestions).toContain('attack light');
   });
   ```

### Property Tests

```typescript
property("available_actions always valid", (commands) => {
  const adapter = createAgentModeAdapter(/*...*/);
  adapter.createSession({ agentId: "test", profileName: "test", seed: 12345 });

  for (const cmd of commands) {
    const state = adapter.queryState();
    const action = state.available_actions[0];
    if (action) {
      const result = adapter.executeCommand(action);
      // Every action in available_actions should succeed
      if (!result.success) return false;
    }
  }
  return true;
});

property("RNG state enables perfect replay", (seed, commandCount) => {
  const adapter1 = createAgentModeAdapter(/*...*/);
  const adapter2 = createAgentModeAdapter(/*...*/);

  adapter1.createSession({ agentId: "test", profileName: "test1", seed });
  adapter2.createSession({ agentId: "test", profileName: "test2", seed });

  for (let i = 0; i < commandCount; i++) {
    const state1 = adapter1.queryState();
    const state2 = adapter2.queryState();

    if (state1.available_actions[0] !== state2.available_actions[0]) return false;

    const action = state1.available_actions[0];
    if (action) {
      adapter1.executeCommand(action);
      adapter2.executeCommand(action);
    }
  }

  const final1 = adapter1.queryState();
  const final2 = adapter2.queryState();
  return JSON.stringify(final1) === JSON.stringify(final2);
});

property("state always includes required fields", (commands) => {
  const adapter = createAgentModeAdapter(/*...*/);
  adapter.createSession({ agentId: "test", profileName: "test" });

  for (const cmd of commands) {
    const state = adapter.queryState();

    // Always present
    if (!state.phase) return false;
    if (!state.player) return false;
    if (!state.available_actions) return false;
    if (!state.location) return false;

    adapter.executeCommand(cmd);
  }
  return true;
});
```

---

## Implementation Notes

### Response Generation

Every response is generated fresh from current GameState:

```typescript
function generateStateResponse(
  state: GameState,
  dreadManager: DreadManager,
  contentRegistry: ContentRegistry,
  verbosity: AgentVerbosity,
  rng: SeededRNG
): AgentStateResponse {
  return {
    phase: state.phase,
    location: generateLocationState(state),
    player: generatePlayerState(state, dreadManager, rng),
    available_actions: generateAvailableActions(state),
    action_details: verbosity !== 'minimal'
      ? generateActionDetails(state)
      : undefined,
    combat: state.session?.combat
      ? generateCombatState(state.session.combat, dreadManager, rng)
      : null,
    // ... etc
  };
}
```

### Dread Corruption Application

```typescript
function corruptHPValue(
  hp: number,
  maxHp: number,
  dreadManager: DreadManager,
  veteranTier: number | null,
  rng: SeededRNG
): number | AgentNumericRange | '???' {
  const threshold = dreadManager.getCurrentThreshold();

  if (threshold === 'calm') {
    return hp;
  }

  const corrupted = dreadManager.corruptNumericValue(
    hp,
    { valueType: 'hp', veteranTier, inCombat: true },
    rng
  );

  if (corrupted.corruptionType === 'unknown') {
    return '???';
  }

  if (corrupted.corruptionType === 'blur' && typeof corrupted.display === 'object') {
    return {
      min: corrupted.display.min,
      max: corrupted.display.max,
      uncertain: true
    };
  }

  return corrupted.display as number;
}
```

### Action String Generation

```typescript
function generateAvailableActions(state: GameState): string[] {
  const processor = getCommandProcessor(state);
  const available = processor.getAvailableCommands();

  return available
    .filter(cmd => cmd.enabled)
    .map(cmd => commandToString(cmd.command));
}

function commandToString(command: GameCommand): string {
  switch (command.type) {
    case 'COMBAT_LIGHT_ATTACK':
      return 'attack light';
    case 'COMBAT_HEAVY_ATTACK':
      return 'attack heavy';
    case 'MOVE_TO_ROOM':
      return `move ${command.direction}`;
    case 'USE_CONSUMABLE':
      return `use ${command.slotIndex}`;
    // ... all command types
  }
}
```

### Analytics Tagging

All analytics events from agent sessions include:

```typescript
interface AgentAnalyticsContext {
  player_type: 'ai_agent';
  agent_id: string;
  session_id: string;
  seed: number;
  verbosity: AgentVerbosity;
}
```

This ensures agent data can be separated from human player data in analysis.

---

## Public Exports

```typescript
// src/presentation/agent/index.ts

export type {
  // Main interface
  AgentModeAdapter,

  // Options and config
  AgentSessionOptions,
  AgentVerbosity,
  SessionEndReason,
  AgentSubsystem,

  // Response types
  AgentResponse,
  AgentResponseMeta,
  AgentError,
  AgentErrorCode,
  AgentStateResponse,
  AgentValidationResponse,
  AgentCommandHelpResponse,
  AgentConfigResponse,
  AgentSessionInfo,
  AgentSessionEndResponse,

  // State types
  AgentLocationState,
  AgentRoomConnection,
  AgentPlayerState,
  AgentNumericRange,
  AgentStatBlock,
  AgentEquipmentState,
  AgentEquippedItem,
  AgentItemEffect,
  AgentLessonLearned,
  AgentCombatState,
  AgentEnemyState,
  AgentPlayerCombatState,
  AgentCombatLogEntry,
  AgentEffectState,
  AgentEventState,
  AgentEventChoice,
  AgentInventoryState,
  AgentInventoryItem,
  AgentConsumableSlot,
  AgentBroughtItem,
  AgentCampState,
  AgentStashState,
  AgentStashItem,
  AgentMerchantState,
  AgentMerchantItem,
  AgentExpeditionPrepState,
  AgentSelectedConsumable,
  AgentDungeonState,
  AgentRoomState,
  AgentRoomContent,
  AgentLootItem,
  AgentExtractionCost,
  AgentRetreatCost,
  AgentWatcherState,
  AgentSessionStats,

  // Action types
  AgentActionDetail,
  AgentActionCost,
  AgentCommandHelp,
  AgentCommandParameter,

  // Event types
  AgentEventRecord,

  // Parser
  AgentCommandParser,
};

export {
  createAgentModeAdapter,
  createAgentCommandParser,
};
```

---

## Design Philosophy

### Same Game, Different Interface

Agent Mode does not create a separate game - it provides a different view into the same game core. An agent playing through Agent Mode and a human playing through CLI are playing the exact same game with the exact same rules.

### Complete Information Access

Agents receive complete observable state after every action. There's no need to "look around" or query multiple endpoints - one response contains everything an agent needs to make decisions.

### Dread Still Matters

Dread corruption applies to agents just as it does to humans. This is intentional:
- Tests agent robustness to uncertainty
- Ensures agent strategies work under realistic conditions
- Prevents agents from having unfair information advantages

### Determinism Enables Science

With seed-based RNG and full state capture, agent runs are perfectly reproducible. This enables:
- Debugging specific behaviors
- A/B testing strategies
- Regression testing game changes
- Fair comparisons between agent versions

### No Special Treatment

Agents don't get special commands or bypass mechanics. They play by the same rules as humans, just through a different interface. This ensures findings from agent play transfer to human play.
