# 15 - CLI Presentation Layer

## Purpose

Human-readable command-line interface for DARKDELVE. The CLI presentation layer is responsible for all I/O operations: rendering game state to the terminal, parsing player input into commands, and displaying Dread-induced visual corruptions. This layer translates between the pure game core and the human player.

**Critical Principle:** The core never does I/O. All screen output, keyboard input, and visual effects are presentation layer responsibilities.

---

## Responsibilities

1. Render game state to terminal (ASCII art, status bars, combat logs, menus)
2. Parse player input into game commands
3. Subscribe to game events for reactive updates
4. Apply Dread visual effects (text corruption, stat uncertainty, whispers)
5. Manage terminal colors and formatting
6. Provide contextual help and command shortcuts
7. Display dopamine moments (kill celebrations, legendary reveals, extraction climax)
8. Handle input validation and error display
9. Manage screen layout and scrolling

---

## Dependencies

- **01-foundation**: Types (EntityId, Rarity, RoomType, DreadThreshold, etc.), Timestamp, SeededRNG
- **02-content-registry**: ItemTemplate, MonsterTemplate (for display names/descriptions)
- **03-state-management**: GameState, GamePhase, CombatState, DungeonState, ProfileState
- **04-event-system**: EventBus, all GameEvent types (subscription for reactive updates)
- **05-command-system**: CommandProcessor, GameCommand, AvailableCommand, CommandResult
- **03-state-management**: DerivedState (for stat display)
- **07-item-system**: ItemRiskStatus, ItemDescription, ResolvedItem
- **08-combat-system**: CombatState, DamageBreakdown, CombatLogEntry
- **09-dread-system**: Corruption pure functions (corruptNumericValue, corruptStringValue, etc.), CorruptedValue, DreadThreshold
- **10-dungeon-system**: RoomInstanceState, FloorState (for map rendering)
- **11-extraction-system**: ExtractionCost (for display)
- **12-camp-system**: CampStateView, all camp view types
- **13-save-system**: ProfileMetadata (for load/save UI)

---

## Interface Contracts

### CLI Application

```typescript
// ==================== Main CLI Application ====================

interface CLIApplication {
  /**
   * Start the CLI application
   * Sets up terminal, event subscriptions, and main loop
   */
  start(): Promise<void>;

  /**
   * Stop the CLI application gracefully
   * Restores terminal state, saves game
   */
  stop(): Promise<void>;

  /**
   * Force quit (e.g., from signal handler)
   */
  forceQuit(): void;
}

/**
 * Create CLI application instance
 */
function createCLIApplication(
  gameSession: GameSession,
  config: CLIConfig
): CLIApplication;

interface CLIConfig {
  /** Enable color output (default: true) */
  enableColors: boolean;

  /** Enable ASCII art (default: true) */
  enableAsciiArt: boolean;

  /** Terminal width (auto-detect if not provided) */
  terminalWidth?: number;

  /** Terminal height (auto-detect if not provided) */
  terminalHeight?: number;

  /** Combat log max lines (default: 20) */
  combatLogMaxLines: number;

  /** Enable screen clear between renders (default: true) */
  clearScreen: boolean;

  /** Input timeout in ms (default: none) */
  inputTimeout?: number;

  /** Enable sound-through-text effects (default: true) */
  enableSoundText: boolean;
}
```

### Renderer

```typescript
// ==================== Renderer Interface ====================

interface Renderer {
  /**
   * Render current game state to terminal
   * Called after each state change or event
   */
  render(state: GameState, events: readonly GameEvent[]): void;

  /**
   * Render specific screen type
   */
  renderScreen(screen: ScreenType, context: RenderContext): void;

  /**
   * Clear the terminal
   */
  clear(): void;

  /**
   * Print a single line with optional formatting
   */
  print(text: string, options?: PrintOptions): void;

  /**
   * Print with newline
   */
  println(text: string, options?: PrintOptions): void;

  /**
   * Print empty line
   */
  newline(): void;

  /**
   * Set cursor position
   */
  setCursor(row: number, col: number): void;

  /**
   * Get terminal dimensions
   */
  getDimensions(): TerminalDimensions;
}

type ScreenType =
  // Camp screens
  | 'camp_main'
  | 'camp_stash'
  | 'camp_equipment'
  | 'camp_merchant'
  | 'camp_chronicler'
  | 'camp_character'
  | 'expedition_prep'
  | 'expedition_confirm'

  // Dungeon screens
  | 'dungeon_exploring'
  | 'dungeon_combat'
  | 'dungeon_treasure'
  | 'dungeon_event'
  | 'dungeon_rest'
  | 'dungeon_stairwell'
  | 'dungeon_threshold'
  | 'dungeon_boss'

  // Special screens
  | 'extraction_sequence'
  | 'death_screen'
  | 'level_up'
  | 'legendary_reveal'
  | 'kill_celebration'
  | 'watcher_spawn'
  | 'help';

interface RenderContext {
  state: GameState;
  derivedState: DerivedState;
  availableCommands: AvailableCommand[];
  recentEvents: readonly GameEvent[];
  /**
   * Isolated SeededRNG for visual effects. Created via createPresentationRNG().
   * CRITICAL: This is NOT the gameplay RNG - never pass the session's gameplay RNG here.
   */
  presentationRng: SeededRNG;
  /** DreadConfig from ContentRegistry, cached for corruption calls */
  dreadConfig: DreadConfig;
}

/**
 * Create an isolated SeededRNG instance for presentation/rendering.
 *
 * CRITICAL: Rendering must NEVER consume the gameplay RNG sequence. This factory
 * creates a separate SeededRNG instance with a derived seed, ensuring:
 * - Visual effects don't affect gameplay determinism
 * - Same game state produces consistent visual corruption
 * - Gameplay replays remain reproducible regardless of rendering
 *
 * Seed derivation: sessionSeed XOR hash(currentDread, currentRoomId, frameCounter)
 */
function createPresentationRNG(
  sessionSeed: number,
  currentDread: number,
  currentRoomId: string | null,
  frameCounter: number
): SeededRNG;

interface PrintOptions {
  color?: TerminalColor;
  bold?: boolean;
  dim?: boolean;
  indent?: number;
  wrap?: boolean;
}

interface TerminalDimensions {
  width: number;
  height: number;
}

/**
 * Create renderer instance
 */
function createRenderer(config: CLIConfig): Renderer;
```

### Input Parser

```typescript
// ==================== Input Parser ====================

interface InputParser {
  /**
   * Parse raw input string into a game command
   * Returns null if input doesn't match any command
   */
  parseInput(
    input: string,
    availableCommands: AvailableCommand[],
    phase: GamePhase
  ): ParseResult;

  /**
   * Get input prompt for current phase
   */
  getPrompt(phase: GamePhase): string;

  /**
   * Check if input matches help request
   */
  isHelpRequest(input: string): boolean;

  /**
   * Get command suggestions for partial input
   */
  getSuggestions(
    partialInput: string,
    availableCommands: AvailableCommand[]
  ): string[];
}

interface ParseResult {
  /** Successfully parsed command */
  command: GameCommand | null;

  /** Whether input was understood but invalid */
  invalidReason: string | null;

  /** Whether to show help */
  showHelp: boolean;

  /** Raw input for logging */
  rawInput: string;
}

/**
 * Create input parser instance
 */
function createInputParser(shortcuts: ShortcutMap): InputParser;

/**
 * Map of shortcuts to full commands
 */
interface ShortcutMap {
  /** Combat shortcuts */
  combat: Record<string, CombatActionType>;

  /** Navigation shortcuts */
  navigation: Record<string, string>;

  /** Menu shortcuts */
  menu: Record<string, string>;

  /** Universal shortcuts */
  universal: Record<string, string>;
}

/**
 * Default shortcut mappings
 */
const DEFAULT_SHORTCUTS: ShortcutMap = {
  combat: {
    'a': 'light_attack',
    'l': 'light_attack',
    'h': 'heavy_attack',
    'd': 'dodge',
    'b': 'block',
    'p': 'pass',
    'f': 'flee',
    'i': 'use_item',
  },
  navigation: {
    'n': 'north',
    's': 'south',
    'e': 'east',
    'w': 'west',
    'back': 'back',
    'r': 'return',
  },
  menu: {
    'q': 'quit',
    'esc': 'back',
    'help': 'help',
    '?': 'help',
  },
  universal: {
    '1': 'option_1',
    '2': 'option_2',
    '3': 'option_3',
    '4': 'option_4',
    '5': 'option_5',
    '6': 'option_6',
    '7': 'option_7',
    '8': 'option_8',
    '9': 'option_9',
  },
};
```

### Color System

```typescript
// ==================== Color System ====================

/**
 * Terminal color definitions
 * Uses ANSI escape codes
 */
type TerminalColor =
  | 'white'
  | 'gray'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'black';

/**
 * Color scheme for game elements
 */
interface ColorScheme {
  // Text colors
  normal: TerminalColor;           // white
  flavor: TerminalColor;           // gray
  important: TerminalColor;        // yellow
  danger: TerminalColor;           // red
  positive: TerminalColor;         // green
  info: TerminalColor;             // blue
  magic: TerminalColor;            // blue
  eldritch: TerminalColor;         // magenta

  // Rarity colors
  common: TerminalColor;           // white
  uncommon: TerminalColor;         // green
  rare: TerminalColor;             // yellow
  epic: TerminalColor;             // magenta
  legendary: TerminalColor;        // cyan

  // UI element colors
  prompt: TerminalColor;           // white
  error: TerminalColor;            // red
  warning: TerminalColor;          // yellow
  success: TerminalColor;          // green
  disabled: TerminalColor;         // gray

  // Combat colors
  damage: TerminalColor;           // red
  healing: TerminalColor;          // green
  critical: TerminalColor;         // yellow
  blocked: TerminalColor;          // blue
  dodged: TerminalColor;           // cyan
  status: TerminalColor;           // magenta

  // Dread colors
  whisper: TerminalColor;          // magenta
  corrupted: TerminalColor;        // gray
  watcher: TerminalColor;          // red
}

const DEFAULT_COLOR_SCHEME: ColorScheme = {
  normal: 'white',
  flavor: 'gray',
  important: 'yellow',
  danger: 'red',
  positive: 'green',
  info: 'blue',
  magic: 'blue',
  eldritch: 'magenta',

  common: 'white',
  uncommon: 'green',
  rare: 'yellow',
  epic: 'magenta',
  legendary: 'cyan',

  prompt: 'white',
  error: 'red',
  warning: 'yellow',
  success: 'green',
  disabled: 'gray',

  damage: 'red',
  healing: 'green',
  critical: 'yellow',
  blocked: 'blue',
  dodged: 'cyan',
  status: 'magenta',

  whisper: 'magenta',
  corrupted: 'gray',
  watcher: 'red',
};

/**
 * Color utility functions
 */
interface ColorUtils {
  /** Apply color to text */
  colorize(text: string, color: TerminalColor): string;

  /** Apply bold to text */
  bold(text: string): string;

  /** Apply dim to text */
  dim(text: string): string;

  /** Get color for rarity */
  rarityColor(rarity: Rarity): TerminalColor;

  /** Get color for risk status */
  riskColor(status: ItemRiskStatus): TerminalColor;

  /** Get color for Dread threshold */
  dreadColor(threshold: DreadThreshold): TerminalColor;

  /** Strip all ANSI codes from text */
  stripColors(text: string): string;
}

function createColorUtils(scheme: ColorScheme): ColorUtils;
```

### Dread Visual Effects

```typescript
// ==================== Dread Visual Effects ====================

/**
 * Dread effect processor for visual corruptions
 * All visual effects are presentation-only - core data unchanged
 */
interface DreadEffects {
  /**
   * Apply text corruption to a string
   * Letter substitution, character swaps
   * NOTE: Uses PresentationRNG, never gameplay RNG
   */
  corruptText(
    text: string,
    dreadLevel: number,
    rng: PresentationRNG
  ): string;

  /**
   * Format a corrupted numeric value for display
   * Shows ranges, "???" based on Dread level
   */
  formatCorruptedValue<T>(
    corrupted: CorruptedValue<T>,
    veteranOverride?: T
  ): string;

  /**
   * Generate whisper text injection
   * Returns text to insert in combat log or null
   * NOTE: Uses PresentationRNG, never gameplay RNG
   */
  generateWhisperText(
    dreadLevel: number,
    context: WhisperContext,
    rng: PresentationRNG
  ): WhisperText | null;

  /**
   * Apply screen "flicker" effect
   * Returns modified text with visual glitches
   * NOTE: Uses PresentationRNG, never gameplay RNG
   */
  applyFlicker(
    text: string,
    dreadLevel: number,
    rng: PresentationRNG
  ): string;

  /**
   * Get corruption character substitutions
   */
  getCorruptionMap(intensity: number): Record<string, string>;

  /**
   * Check if screen should show static/noise
   * NOTE: Uses PresentationRNG, never gameplay RNG
   */
  shouldShowStatic(dreadLevel: number, rng: PresentationRNG): boolean;
}

interface WhisperText {
  /** The whisper message */
  text: string;

  /** Whether this is a helpful hint */
  isHint: boolean;

  /** Color for display */
  color: TerminalColor;

  /** Position: inline or margin */
  position: 'inline' | 'margin';
}

/**
 * Corruption intensity by Dread threshold
 */
const CORRUPTION_INTENSITY: Record<DreadThreshold, number> = {
  calm: 0,
  uneasy: 1,
  shaken: 2,
  terrified: 3,
  breaking: 4,
};

/**
 * Character substitution maps for text corruption
 */
const CORRUPTION_MAPS: Record<number, Record<string, string>> = {
  1: { 'o': '0', 'l': '1', 'e': '3' },
  2: { 'o': '0', 'l': '1', 'e': '3', 'a': '@', 's': '$', 'i': '!' },
  3: { 'o': '0', 'l': '1', 'e': '3', 'a': '@', 's': '$', 'i': '!', 't': '+', 'g': '9' },
  4: { /* Heavy corruption - random substitution */ },
};

function createDreadEffects(config: DreadEffectsConfig): DreadEffects;

interface DreadEffectsConfig {
  /** Base corruption chance multiplier */
  corruptionMultiplier: number;

  /** Whisper frequency multiplier */
  whisperFrequency: number;

  /** Enable screen flicker effects */
  enableFlicker: boolean;

  /** Enable static noise effects */
  enableStatic: boolean;
}
```

### Screen Renderers

```typescript
// ==================== Screen Renderers ====================

/**
 * Individual screen render functions
 */

// === Status Display ===

interface StatusBarRenderer {
  /**
   * Render the status bar (HP, Stamina, Dread, Gold)
   */
  render(
    player: SessionPlayerState,
    derivedState: DerivedState,
    gold: number,
    dreadManager: DreadManager,
    rng: PresentationRNG
  ): string[];
}

/**
 * Status bar format:
 * HP: [████████░░] 45/60  STA: ●●●○○  DREAD: 45  GOLD: 127
 */
function renderStatusBar(
  hp: number,
  maxHp: number,
  stamina: number,
  maxStamina: number,
  dread: number,
  gold: number,
  dreadManager: DreadManager,
  rng: PresentationRNG
): string;

// === Combat Display ===

interface CombatRenderer {
  /**
   * Render combat screen with enemy info, actions, log
   */
  render(context: CombatRenderContext): string[];
}

interface CombatRenderContext {
  combatState: CombatState;
  playerState: SessionPlayerState;
  derivedState: DerivedState;
  availableActions: AvailableCombatAction[];
  dreadManager: DreadManager;
  rng: PresentationRNG;
  lessonLearned: LessonLearnedState | null;
}

/**
 * Render damage breakdown for dopamine display
 */
function renderDamageBreakdown(breakdown: DamageBreakdown): string[];

/**
 * Render combat log with Dread corruption
 */
function renderCombatLog(
  log: readonly CombatLogEntry[],
  maxLines: number,
  dreadManager: DreadManager,
  rng: PresentationRNG
): string[];

// === Room/Map Display ===

interface MapRenderer {
  /**
   * Render ASCII floor map with current position
   */
  render(
    floor: FloorState,
    currentRoomId: string,
    dreadManager: DreadManager,
    rng: PresentationRNG
  ): string[];
}

interface RoomRenderer {
  /**
   * Render room description with exits
   */
  render(
    room: RoomInstanceState,
    adjacentRooms: RoomPreview[],
    dreadManager: DreadManager,
    rng: PresentationRNG
  ): string[];
}

interface RoomPreview {
  direction: Direction;
  roomType: RoomType | 'unknown';
  state: RoomState;
  isCorrupted: boolean;
}

// === Backtrack Selection ===

interface BacktrackMenuRenderer {
  /**
   * Render menu of cleared rooms for backtrack selection.
   * Triggered by "back" or "return" command without a target.
   * Player selects a numbered option, which constructs MOVE_BACK with roomId.
   */
  render(
    clearedRooms: BacktrackOption[],
    dreadManager: DreadManager,
    rng: PresentationRNG
  ): string[];
}

interface BacktrackOption {
  optionNumber: number;
  roomId: string;
  roomType: RoomType;
  roomName: string;
  distanceFromCurrent: number;
}

/**
 * Backtrack flow:
 * 1. Player enters "back" or "return"
 * 2. CLI renders BacktrackMenuRenderer showing cleared rooms
 * 3. Player enters a number (e.g., "2")
 * 4. CLI constructs MOVE_BACK command with selected roomId
 * 5. Alternative: Player enters "back 2" to skip menu (direct selection)
 */

// === Item Display ===

interface ItemRenderer {
  /**
   * Render item card (detailed view)
   */
  renderCard(
    item: ResolvedItem,
    riskStatus: ItemRiskStatus,
    currentDread: number,
    rng: PresentationRNG
  ): string[];

  /**
   * Render item in list (compact view)
   */
  renderListItem(
    item: ResolvedItem,
    index: number,
    riskStatus: ItemRiskStatus
  ): string;

  /**
   * Render legendary item reveal
   */
  renderLegendaryReveal(item: ResolvedItem): string[];
}

// === Inventory Display ===

interface InventoryRenderer {
  /**
   * Render inventory grid
   */
  render(
    inventory: InventoryState,
    equipment: EquipmentState,
    itemService: ItemService
  ): string[];
}

// === Menu Display ===

interface MenuRenderer {
  /**
   * Render menu with numbered options
   */
  render(
    title: string,
    options: MenuOption[],
    footer?: string
  ): string[];
}

interface MenuOption {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  disabledReason?: string;
}
```

### ASCII Art

```typescript
// ==================== ASCII Art ====================

interface AsciiArtRenderer {
  /**
   * Render combat header for enemy
   */
  renderCombatHeader(
    enemyName: string,
    enemyType: EnemyType,
    isWatcher: boolean
  ): string[];

  /**
   * Render kill celebration banner
   */
  renderKillCelebration(
    enemyName: string,
    xpGained: number,
    goldGained: number,
    itemDropped: string | null
  ): string[];

  /**
   * Render level up celebration
   */
  renderLevelUp(
    newLevel: number,
    statChoices: StatName[]
  ): string[];

  /**
   * Render extraction sequence
   */
  renderExtraction(progress: number): string[];

  /**
   * Render legendary item frame
   */
  renderLegendaryFrame(
    itemName: string,
    stats: string[],
    flavorText: string
  ): string[];

  /**
   * Render Watcher spawn warning
   */
  renderWatcherSpawn(): string[];

  /**
   * Render death screen
   */
  renderDeath(
    killedBy: string,
    floor: FloorNumber,
    lessonsLearned: string[]
  ): string[];

  /**
   * Render title screen
   */
  renderTitle(): string[];

  /**
   * Render camp banner
   */
  renderCampBanner(): string[];

  /**
   * Render progress bar
   */
  renderProgressBar(
    current: number,
    max: number,
    width: number,
    filled: string,
    empty: string
  ): string;

  /**
   * Render HP bar with color
   */
  renderHPBar(
    current: number,
    max: number,
    width: number
  ): string;

  /**
   * Render stamina pips
   */
  renderStaminaPips(current: number, max: number): string;
}

/**
 * ASCII art templates
 */
const ASCII_TEMPLATES = {
  killBanner: `
  ██████████████████████████████████████
  █                                    █
  █          F A T A L   B L O W       █
  █                                    █
  ██████████████████████████████████████
`,

  levelUp: `
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║          L E V E L   U P !           ║
  ║                                      ║
  ╚══════════════════════════════════════╝
`,

  legendaryFrame: `
╔═══════════════════════════════════════════════╗
║                                               ║
║        {NAME}                                 ║
║        ═══════════════════                    ║
║        Legendary {SLOT}                       ║
║                                               ║
{STATS}
║                                               ║
║        "{FLAVOR}"                             ║
║                                               ║
╚═══════════════════════════════════════════════╝
`,

  extractionProgress: [
    '  ░░░░░░░░░░░░░░░░░░░░  EXTRACTION: 0%',
    '  ▓▓░░░░░░░░░░░░░░░░░░  EXTRACTION: 10%',
    '  ▓▓▓▓░░░░░░░░░░░░░░░░  EXTRACTION: 20%',
    '  ▓▓▓▓▓▓░░░░░░░░░░░░░░  EXTRACTION: 30%',
    '  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  EXTRACTION: 40%',
    '  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  EXTRACTION: 50%',
    '  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  EXTRACTION: 60%',
    '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  EXTRACTION: 70%',
    '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░  EXTRACTION: 80%',
    '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  EXTRACTION: 90%',
    '  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  EXTRACTION: 100%',
  ],

  watcherSpawn: `
  ████████████████████████████████████████████████
  █                                              █
  █     T H E   W A T C H E R   A W A K E N S    █
  █                                              █
  ████████████████████████████████████████████████
`,

  campBanner: `
  ═══════════════════════════════════════════════
                     C A M P
  ═══════════════════════════════════════════════
`,

  safeAtCamp: `
═══════════════════════════════════════════════════
              S A F E   A T   C A M P
═══════════════════════════════════════════════════
`,
};

function createAsciiArtRenderer(): AsciiArtRenderer;
```

### Event Display

```typescript
// ==================== Event Display ====================

interface EventDisplayRenderer {
  /**
   * Render event room with choices
   */
  renderEvent(
    event: EventState,
    eventTemplate: EventTemplate,
    availableChoices: EventChoiceView[]
  ): string[];

  /**
   * Render event outcome
   */
  renderOutcome(
    outcome: EventOutcomeState,
    eventTemplate: EventTemplate
  ): string[];
}

interface EventChoiceView {
  id: string;
  text: string;
  requirements?: string;
  hint?: string;
  enabled: boolean;
  disabledReason?: string;
}
```

---

## Configuration Files

### configs/cli.json

```json
{
  "display": {
    "enableColors": true,
    "enableAsciiArt": true,
    "clearScreen": true,
    "enableSoundText": true,
    "terminalMinWidth": 80,
    "terminalMinHeight": 24
  },

  "combatLog": {
    "maxLines": 20,
    "showTimestamps": false,
    "showTurnNumbers": true,
    "indentEnemyActions": true
  },

  "statusBar": {
    "hpBarWidth": 10,
    "showNumericHP": true,
    "showNumericStamina": false,
    "staminaFilledChar": "●",
    "staminaEmptyChar": "○"
  },

  "dreadEffects": {
    "corruptionMultiplier": 1.0,
    "whisperFrequency": 1.0,
    "enableFlicker": true,
    "enableStatic": false,
    "whisperDelay": 500
  },

  "input": {
    "caseSensitive": false,
    "trimWhitespace": true,
    "historySize": 50
  },

  "dopamine": {
    "killCelebrationDuration": 1500,
    "levelUpDuration": 2000,
    "legendaryRevealDuration": 3000,
    "extractionStepDelay": 300
  }
}
```

### configs/cli-shortcuts.json

```json
{
  "combat": {
    "a": "COMBAT_LIGHT_ATTACK",
    "attack": "COMBAT_LIGHT_ATTACK",
    "l": "COMBAT_LIGHT_ATTACK",
    "light": "COMBAT_LIGHT_ATTACK",
    "h": "COMBAT_HEAVY_ATTACK",
    "heavy": "COMBAT_HEAVY_ATTACK",
    "d": "COMBAT_DODGE",
    "dodge": "COMBAT_DODGE",
    "b": "COMBAT_BLOCK",
    "block": "COMBAT_BLOCK",
    "p": "COMBAT_PASS",
    "pass": "COMBAT_PASS",
    "wait": "COMBAT_PASS",
    "f": "COMBAT_FLEE",
    "flee": "COMBAT_FLEE",
    "run": "COMBAT_FLEE"
  },

  "navigation": {
    "n": "MOVE_NORTH",
    "north": "MOVE_NORTH",
    "s": "MOVE_SOUTH",
    "south": "MOVE_SOUTH",
    "e": "MOVE_EAST",
    "east": "MOVE_EAST",
    "w": "MOVE_WEST",
    "west": "MOVE_WEST",
    "back": "SHOW_BACKTRACK_MENU",
    "return": "SHOW_BACKTRACK_MENU",
    "back <n>": "MOVE_BACK"
  },

  "treasure": {
    "open": "TREASURE_FORCE_OPEN",
    "force": "TREASURE_FORCE_OPEN",
    "pick": "TREASURE_PICK_LOCK",
    "lockpick": "TREASURE_PICK_LOCK",
    "smash": "TREASURE_SMASH",
    "examine": "TREASURE_EXAMINE",
    "look": "TREASURE_EXAMINE",
    "leave": "TREASURE_LEAVE",
    "take": "TREASURE_PICK_UP_ALL",
    "grab": "TREASURE_PICK_UP_ALL"
  },

  "stairwell": {
    "descend": "STAIRWELL_DESCEND",
    "down": "STAIRWELL_DESCEND",
    "deeper": "STAIRWELL_DESCEND",
    "extract": "STAIRWELL_EXTRACT",
    "leave": "STAIRWELL_EXTRACT",
    "escape": "STAIRWELL_EXTRACT"
  },

  "camp": {
    "stash": "CAMP_VIEW_STASH",
    "inventory": "CAMP_VIEW_STASH",
    "equip": "CAMP_VIEW_EQUIPMENT",
    "gear": "CAMP_VIEW_EQUIPMENT",
    "shop": "CAMP_VIEW_MERCHANT",
    "merchant": "CAMP_VIEW_MERCHANT",
    "buy": "CAMP_VIEW_MERCHANT",
    "chronicler": "CAMP_VIEW_CHRONICLER",
    "bestiary": "CAMP_VIEW_CHRONICLER",
    "character": "CAMP_VIEW_CHARACTER",
    "stats": "CAMP_VIEW_CHARACTER",
    "expedition": "CAMP_BEGIN_EXPEDITION",
    "embark": "CAMP_BEGIN_EXPEDITION",
    "go": "CAMP_BEGIN_EXPEDITION"
  },

  "universal": {
    "help": "SHOW_HELP",
    "?": "SHOW_HELP",
    "quit": "QUIT",
    "exit": "QUIT",
    "q": "QUIT"
  }
}
```

---

## Events Subscribed

The CLI presentation subscribes to game events for reactive display updates:

| Event | Display Response |
|-------|------------------|
| `SESSION_STARTED` | Clear screen, show dungeon entry |
| `SESSION_ENDED` | Show extraction/death summary |
| `ROOM_ENTERED` | Render new room description |
| `COMBAT_STARTED` | Switch to combat display with ASCII header |
| `COMBAT_ENDED` | Show victory/defeat, rewards |
| `PLAYER_ATTACKED` | Animate damage numbers, update log |
| `ENEMY_ATTACKED` | Animate damage, show status |
| `DAMAGE_DEALT` | Highlight damage with color |
| `CRITICAL_HIT` | Yellow flash, larger numbers |
| `ENEMY_KILLED` | Kill celebration banner |
| `PLAYER_KILLED` | Death screen with lessons |
| `ENEMY_STAGGERED` | Flash "STAGGERED!" |
| `STATUS_APPLIED` | Log status with duration |
| `STATUS_REMOVED` | Log removal |
| `ITEM_FOUND` | Highlight loot drop |
| `ITEM_EQUIPPED` | Update equipment display |
| `ITEM_IDENTIFIED` | Reveal animation |
| `LEVEL_UP` | Level up celebration |
| `DREAD_CHANGED` | Update Dread display |
| `DREAD_THRESHOLD_CROSSED` | Flash warning, visual corruption change |
| `WATCHER_WARNING` | Display warning text |
| `WATCHER_SPAWNED` | Watcher spawn ASCII art |
| `WHISPER` | Insert whisper into display |
| `EXTRACTION_STARTED` | Begin extraction sequence |
| `EXTRACTION_COMPLETED` | Show summary, "Safe at Camp" |
| `GOLD_CHANGED` | Flash gold amount |
| `XP_GAINED` | Show XP with progress |

---

## State Managed

The CLI presentation layer manages **transient UI state only** - no game state:

```typescript
interface CLITransientState {
  /** Current scroll position in combat log */
  combatLogScroll: number;

  /** Input history for up/down navigation */
  inputHistory: string[];
  inputHistoryIndex: number;

  /** Current partial input (for suggestions) */
  currentInput: string;

  /** Last rendered screen type */
  lastScreen: ScreenType;

  /** Queued events for sequential display */
  pendingEvents: GameEvent[];

  /** Animation state for dopamine moments */
  animationState: AnimationState | null;

  /** Cached corruption results (per render frame) */
  corruptionCache: Map<string, string>;

  /** Last whisper shown (to avoid repetition) */
  lastWhisper: string | null;

  /** Help overlay visible */
  showingHelp: boolean;

  /** Confirmation dialog state */
  confirmationPending: ConfirmationDialog | null;
}

interface AnimationState {
  type: 'kill' | 'levelup' | 'legendary' | 'extraction' | 'death';
  startTime: number;
  duration: number;
  data: unknown;
}

interface ConfirmationDialog {
  message: string;
  onConfirm: GameCommand;
  onCancel: () => void;
}
```

---

## Edge Cases and Error Handling

### Input Handling

| Case | Handling |
|------|----------|
| Empty input | Show prompt again (no action) |
| Unknown command | Display "Unknown command. Type 'help' for options." |
| Invalid number selection | Display "Invalid option. Choose 1-N." |
| Command unavailable in phase | Display "[Command] not available here." |
| Missing required parameter | Display "Usage: [command] [param]" |
| Case mismatch | Normalize to lowercase before parsing |

### Display Handling

| Case | Handling |
|------|----------|
| Terminal too narrow | Show "Terminal too narrow. Need 80+ columns." |
| Terminal too short | Truncate output, add "..." |
| Colors not supported | Fall back to plain text |
| Unicode not supported | Fall back to ASCII alternatives |
| Text overflow | Word wrap with hanging indent |
| Long item names | Truncate with "..." |

### Dread Corruption

| Case | Handling |
|------|----------|
| Corruption produces unreadable text | Ensure minimum readability (max 30% corruption) |
| Same value corrupted differently | Cache corruption results per render frame |
| Whisper conflicts with important text | Whispers yield to critical information |
| Player has veteran knowledge | Show both corrupted and veteran values |

### Event Queue

| Case | Handling |
|------|----------|
| Multiple events same frame | Queue and display sequentially |
| Animation interrupted by input | Complete animation, then process input |
| Long animation (extraction) | Allow Ctrl+C to skip |
| Event during confirmation dialog | Queue event, show after dialog resolves |

### Terminal State

| Case | Handling |
|------|----------|
| Ctrl+C during game | Trigger graceful shutdown with save |
| Terminal resize | Re-detect dimensions, re-render |
| Process backgrounded | Pause render loop |
| Process foregrounded | Restore screen, re-render |
| Crash/force quit | On next start, offer crash recovery |

---

## Test Strategy

### Unit Tests

1. **Input Parser Tests**
   - Parse numeric shortcuts (1-9)
   - Parse word commands (attack, flee)
   - Parse abbreviations (a, h, d)
   - Handle case insensitivity
   - Reject invalid commands
   - Generate suggestions for partial input

2. **Color Utils Tests**
   - Apply each color correctly
   - Strip colors produces plain text
   - Rarity to color mapping
   - Risk status to color mapping
   - Dread threshold to color mapping

3. **Dread Effects Tests**
   - Text corruption at each threshold
   - Corruption intensity scaling
   - Whisper generation frequency
   - Flicker effect application
   - Corruption cache prevents frame inconsistency

4. **ASCII Art Tests**
   - Kill banner renders correctly
   - Level up banner renders correctly
   - Progress bar at 0%, 50%, 100%
   - HP bar color changes by percentage
   - Legendary frame with variable content

5. **Status Bar Tests**
   - HP bar accuracy
   - Stamina pip count
   - Dread display with corruption
   - Gold display

6. **Combat Log Tests**
   - Entry formatting
   - Turn number prefixes
   - Damage color coding
   - Status effect display
   - Log truncation at max lines

### Snapshot Tests

Snapshot tests capture expected output for complex renders:

```typescript
// Camp main menu snapshot
test('camp main menu renders correctly', () => {
  const state = createTestState('camp_main');
  const output = renderer.render(state, []);
  expect(output).toMatchSnapshot();
});

// Combat screen snapshot
test('combat screen renders correctly', () => {
  const state = createCombatState(/* ... */);
  const output = combatRenderer.render({
    combatState: state.combat,
    playerState: state.player,
    // ...
  });
  expect(output).toMatchSnapshot();
});

// Dread corruption snapshot (seeded RNG)
test('dread corruption at 70 matches snapshot', () => {
  const rng = createRNG(12345);
  const output = dreadEffects.corruptText('The enemy attacks!', 70, rng);
  expect(output).toMatchSnapshot();
});

// Kill celebration snapshot
test('kill celebration banner matches snapshot', () => {
  const output = asciiArt.renderKillCelebration(
    'Bone Knight',
    45,
    12,
    'Rusted Helm'
  );
  expect(output).toMatchSnapshot();
});

// Legendary reveal snapshot
test('legendary reveal matches snapshot', () => {
  const output = asciiArt.renderLegendaryFrame(
    "Soulreaver's Edge",
    ['Damage: 24-31', '+15% Critical Chance', 'Lifesteal: 10%'],
    'Forged in the Pit of Endless Screaming, where hope goes to die.'
  );
  expect(output).toMatchSnapshot();
});
```

### Integration Tests

1. **Full Input Loop**
   - Start game -> camp main -> begin expedition -> room -> combat -> extract
   - Verify each screen renders and accepts correct commands

2. **Event Reaction**
   - Emit event -> verify display updates
   - Multiple events -> verify queue processing

3. **Dread Progression**
   - Cross thresholds -> verify visual changes
   - Watcher spawn -> verify warning sequence

4. **Dopamine Sequence**
   - Kill enemy -> verify celebration
   - Level up -> verify banner and stat choice
   - Find legendary -> verify reveal sequence

### Property-Based Tests

```typescript
property("input never crashes parser", (randomInput: string) => {
  const result = inputParser.parseInput(
    randomInput,
    availableCommands,
    'dungeon_combat'
  );
  // Should always return a result, never throw
  return result !== undefined;
});

property("corruption preserves length for display alignment", (text: string, dread: number) => {
  const corrupted = dreadEffects.corruptText(text, dread, rng);
  // Corrupted text may differ in length due to substitutions
  // but should be within reasonable bounds
  return Math.abs(corrupted.length - text.length) < text.length * 0.3;
});

property("colors always have reset codes", (text: string, color: TerminalColor) => {
  const colored = colorUtils.colorize(text, color);
  const stripped = colorUtils.stripColors(colored);
  return stripped === text;
});
```

---

## Implementation Notes

### Render Loop

The CLI uses an event-driven render loop:

```typescript
async function mainLoop(app: CLIApplication): Promise<void> {
  const eventQueue: GameEvent[] = [];

  // Subscribe to all events
  gameSession.subscribeAll((event) => {
    eventQueue.push(event);
  });

  while (!app.shouldQuit()) {
    // Process pending events
    while (eventQueue.length > 0) {
      const event = eventQueue.shift()!;
      await handleEvent(event);
    }

    // Render current state
    const state = gameSession.getState();
    renderer.render(state, []);

    // Get available commands
    const availableCommands = gameSession.getAvailableCommands();

    // Display prompt and wait for input
    const input = await readInput(inputParser.getPrompt(state.phase));

    // Parse input
    const parseResult = inputParser.parseInput(input, availableCommands, state.phase);

    if (parseResult.showHelp) {
      renderHelp(state.phase, availableCommands);
      continue;
    }

    if (parseResult.command) {
      // Execute command
      const result = gameSession.executeCommand(parseResult.command);

      if (!result.success) {
        displayError(result.error);
      }
    } else if (parseResult.invalidReason) {
      displayError({ message: parseResult.invalidReason });
    }
  }
}
```

### Dopamine Animation Timing

Key moments use delays for impact:

```typescript
async function showKillCelebration(
  enemyName: string,
  rewards: CombatOutcome
): Promise<void> {
  // Clear and show banner
  renderer.clear();
  const banner = asciiArt.renderKillCelebration(
    enemyName,
    rewards.xpAwarded,
    rewards.goldDropped,
    rewards.lootDropped?.[0]?.name ?? null
  );

  for (const line of banner) {
    renderer.println(line);
    await delay(50); // Slight delay per line for "reveal" effect
  }

  await delay(config.dopamine.killCelebrationDuration);
}

async function showExtractionSequence(floor: FloorNumber): Promise<void> {
  for (let progress = 0; progress <= 100; progress += 10) {
    renderer.clear();
    renderer.println('You step onto the Waystone. The ritual begins.');
    renderer.newline();

    if (progress < 30) {
      renderer.println('The dungeon SCREAMS.', { color: 'red' });
    } else if (progress < 70) {
      renderer.println('The light burns brighter. The shadows retreat—', { color: 'yellow' });
    } else {
      renderer.println('You feel yourself pulled UPWARD—', { color: 'cyan' });
    }

    renderer.newline();
    renderer.println(ASCII_TEMPLATES.extractionProgress[progress / 10]);

    await delay(config.dopamine.extractionStepDelay);
  }

  renderer.clear();
  renderer.println(ASCII_TEMPLATES.safeAtCamp, { color: 'green', bold: true });
}
```

### Sound Through Text

Use formatting and pacing to create impact:

```typescript
function renderImpactText(text: string, intensity: 'light' | 'medium' | 'heavy'): string[] {
  const lines: string[] = [];

  if (intensity === 'heavy') {
    lines.push('');
    lines.push(`  ${text.toUpperCase()}`);
    lines.push('');
  } else if (intensity === 'medium') {
    lines.push(`  ${text}`);
  } else {
    lines.push(text);
  }

  return lines;
}

// Example: Heavy attack impact
function renderHeavyAttackHit(damage: number, breakdown: DamageBreakdown): string[] {
  return [
    '',
    '  CRACK.',
    '',
    `  ${damage} damage.`,
    '',
  ];
}
```

### Veteran Knowledge Display

When player has veteran knowledge but Dread corrupts:

```typescript
function formatStatWithVeteranOverride(
  corrupted: CorruptedValue<number>,
  label: string
): string {
  if (!corrupted.wasCorrupted) {
    return `${label}: ${corrupted.actual}`;
  }

  if (corrupted.veteranOverride !== undefined) {
    // Show both corrupted and veteran
    return `${label}: ${corrupted.display} [Veteran: ${corrupted.veteranOverride}]`;
  }

  return `${label}: ${corrupted.display}`;
}

// At Terrified level with veteran knowledge:
// HP: ??? [Veteran: 24]
// HP: 19?...29? [Veteran: 24]
```

---

## Public Exports

```typescript
// src/presentation/cli/index.ts

export type {
  // Application
  CLIApplication,
  CLIConfig,

  // Renderer
  Renderer,
  ScreenType,
  RenderContext,
  PrintOptions,
  TerminalDimensions,
  PresentationRNG,

  // Input
  InputParser,
  ParseResult,
  ShortcutMap,

  // Colors
  TerminalColor,
  ColorScheme,
  ColorUtils,

  // Dread effects
  DreadEffects,
  DreadEffectsConfig,
  WhisperText,

  // Screen renderers
  StatusBarRenderer,
  CombatRenderer,
  CombatRenderContext,
  MapRenderer,
  RoomRenderer,
  RoomPreview,
  ItemRenderer,
  InventoryRenderer,
  MenuRenderer,
  MenuOption,
  EventDisplayRenderer,
  EventChoiceView,

  // ASCII art
  AsciiArtRenderer,

  // State
  CLITransientState,
  AnimationState,
  ConfirmationDialog,
};

export {
  // Factory functions
  createCLIApplication,
  createRenderer,
  createInputParser,
  createColorUtils,
  createDreadEffects,
  createAsciiArtRenderer,
  createPresentationRNG,

  // Constants
  DEFAULT_SHORTCUTS,
  DEFAULT_COLOR_SCHEME,
  CORRUPTION_INTENSITY,
  CORRUPTION_MAPS,
  ASCII_TEMPLATES,

  // Utilities
  renderStatusBar,
  renderDamageBreakdown,
  renderCombatLog,
  renderProgressBar,
  renderHPBar,
  renderStaminaPips,
};
```

---

## Design Philosophy

### Information, Not Decoration

Colors and formatting serve gameplay clarity:
- Red = danger (damage, warnings)
- Green = positive (healing, safe)
- Yellow = important (gold, rare items, critical hits)
- Gray = secondary information

Never use color purely for aesthetics. Every color choice should communicate game state.

### Scannable in Seconds

Players should understand the screen at a glance:
- Status bar always at top
- Most important info first
- Consistent layouts per screen type
- Clear visual hierarchy (bold headers, indented details)

### Dopamine Through Pacing

Big moments deserve big presentation:
- Kill celebrations pause gameplay
- Legendary reveals build anticipation
- Extraction sequence creates tension
- Numbers cascade for satisfaction

But routine actions should be instant. Don't slow down the loop.

### Dread Corrupts Display, Never Input

The cardinal rule: players can always execute their intended action. Dread makes information unreliable, but:
- Commands always work
- Menu options always function
- Numbers selection always selects

The corruption is in what they SEE, not what they DO.

### Graceful Degradation

Support terminal variety:
- No colors? Use bold/dim instead
- No Unicode? Use ASCII fallbacks
- Small terminal? Truncate, don't crash
- Slow connection? Skip animations

The game should be playable on any terminal.
