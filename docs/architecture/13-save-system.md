# 13 - Save System

## Purpose

Handles all persistence operations for DARKDELVE: profile management, game state serialization, and atomic save operations. The save system ensures data integrity through atomic writes and provides recovery mechanisms for corrupted saves.

**Design Philosophy**: Crash = run lost, return to camp. Mid-dungeon saves are explicitly forbidden to prevent save-scumming and simplify state management.

---

## Responsibilities

1. Manage multiple independent player profiles
2. Serialize and deserialize game state to JSON files
3. Perform atomic save operations with integrity verification
4. Detect and recover from save file corruption
5. Trigger saves only on commit actions (extraction, death, transactions)
6. Create and manage profile directory structure

---

## Dependencies

- **01-foundation**: Types, Result, FileSystem, Timestamp, Logger
- **03-state-management**: GameState, ProfileState, serializeState, deserializeState

---

## Interface Contracts

### Profile Manager

```typescript
// ==================== Profile Manager ====================

/**
 * Manages player profiles and their persistence.
 */
interface ProfileManager {
  /**
   * Get list of all profile names
   */
  listProfiles(): Promise<Result<string[], SaveError>>;

  /**
   * Check if a profile exists
   */
  profileExists(profileName: string): Promise<boolean>;

  /**
   * Create a new profile with default state
   * @param profileName - Filesystem-safe name (alphanumeric, underscore, dash)
   * @param playerType - Human or AI agent
   * @param agentId - Required if playerType is 'ai_agent'
   */
  createProfile(
    profileName: string,
    playerType: 'human' | 'ai_agent',
    agentId?: string
  ): Promise<Result<ProfileState, SaveError>>;

  /**
   * Load an existing profile
   */
  loadProfile(profileName: string): Promise<Result<ProfileState, SaveError>>;

  /**
   * Delete a profile and all its data
   */
  deleteProfile(profileName: string): Promise<Result<void, SaveError>>;

  /**
   * Rename a profile
   */
  renameProfile(
    oldName: string,
    newName: string
  ): Promise<Result<void, SaveError>>;

  /**
   * Get the currently active profile name (or null)
   */
  getActiveProfile(): string | null;

  /**
   * Set the active profile for subsequent save operations
   */
  setActiveProfile(profileName: string): void;

  /**
   * Get profile metadata without loading full state
   */
  getProfileMetadata(profileName: string): Promise<Result<ProfileMetadata, SaveError>>;
}

interface ProfileMetadata {
  /** Profile display name */
  name: string;

  /** Creation timestamp */
  createdAt: Timestamp;

  /** Last played timestamp */
  lastPlayed: Timestamp;

  /** Player type */
  playerType: 'human' | 'ai_agent';

  /** AI agent identifier */
  agentId?: string;

  /** Character level */
  level: number;

  /** Character class */
  class: CharacterClass;

  /** Total runs completed */
  runsCompleted: number;

  /** Deepest floor reached */
  deepestFloor: FloorNumber;

  /** Save file version */
  version: string;
}

/**
 * Create a profile manager instance
 */
function createProfileManager(
  fileSystem: FileSystem,
  profilesPath: string,
  logger: Logger
): ProfileManager;
```

### Save Service

```typescript
// ==================== Save Service ====================

/**
 * Handles save/load operations with atomic writes.
 */
interface SaveService {
  /**
   * Save current game state to active profile
   * Uses atomic write: temp file -> verify -> rename
   */
  save(state: GameState, trigger: SaveTrigger): Promise<Result<void, SaveError>>;

  /**
   * Load game state from active profile
   */
  load(): Promise<Result<GameState, SaveError>>;

  /**
   * Check if save file exists for active profile
   */
  hasSaveData(): Promise<boolean>;

  /**
   * Get last save timestamp for active profile
   */
  getLastSaveTime(): Promise<Timestamp | null>;

  /**
   * Create backup of current save
   */
  createBackup(backupName?: string): Promise<Result<string, SaveError>>;

  /**
   * Restore from a backup
   */
  restoreFromBackup(backupName: string): Promise<Result<GameState, SaveError>>;

  /**
   * List available backups
   */
  listBackups(): Promise<Result<BackupInfo[], SaveError>>;

  /**
   * Validate save file integrity
   */
  validateSave(): Promise<Result<SaveValidation, SaveError>>;

  /**
   * Attempt to recover corrupted save
   */
  attemptRecovery(): Promise<Result<GameState, SaveError>>;
}

/**
 * Events that trigger a save operation
 */
type SaveTrigger =
  | 'extraction'           // Successful dungeon extraction
  | 'death'                // Player death
  | 'merchant_transaction' // Buy/sell at merchant
  | 'stash_deposit'        // Item deposited to stash
  | 'stash_withdrawal'     // Item withdrawn from stash
  | 'item_identified';     // Item identified (gold spent)

/**
 * Events that explicitly DO NOT trigger saves
 */
type NonSaveTrigger =
  | 'mid_dungeon'          // NEVER save mid-dungeon
  | 'stash_rearrangement'  // Just moving items around
  | 'equipment_change'     // Swapping gear at camp
  | 'settings_change';     // UI preferences

interface BackupInfo {
  name: string;
  timestamp: Timestamp;
  size: number;
  trigger: SaveTrigger | 'manual';
}

interface SaveValidation {
  valid: boolean;
  version: string;
  checksum: string;
  errors: string[];
  warnings: string[];
}

/**
 * Create a save service instance
 */
function createSaveService(
  fileSystem: FileSystem,
  profileManager: ProfileManager,
  logger: Logger
): SaveService;
```

### Save Errors

```typescript
// ==================== Error Types ====================

interface SaveError {
  code: SaveErrorCode;
  message: string;
  context?: Record<string, unknown>;
}

type SaveErrorCode =
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_ALREADY_EXISTS'
  | 'INVALID_PROFILE_NAME'
  | 'SAVE_FILE_NOT_FOUND'
  | 'SAVE_FILE_CORRUPTED'
  | 'CHECKSUM_MISMATCH'
  | 'VERSION_MISMATCH'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'WRITE_FAILED'
  | 'READ_FAILED'
  | 'PERMISSION_DENIED'
  | 'DISK_FULL'
  | 'BACKUP_NOT_FOUND'
  | 'RECOVERY_FAILED'
  | 'ATOMIC_WRITE_FAILED'
  | 'NO_ACTIVE_PROFILE';
```

### Stash Manager

```typescript
// ==================== Stash Manager ====================

/**
 * Dedicated interface for stash persistence.
 * Stash is saved separately for faster access and smaller files.
 */
interface StashManager {
  /**
   * Load stash for active profile
   */
  loadStash(): Promise<Result<StashState, SaveError>>;

  /**
   * Save stash for active profile
   */
  saveStash(stash: StashState): Promise<Result<void, SaveError>>;

  /**
   * Get stash capacity from profile
   */
  getCapacity(): number;
}

function createStashManager(
  fileSystem: FileSystem,
  profileManager: ProfileManager,
  logger: Logger
): StashManager;
```

### Save Data Structures

```typescript
// ==================== Save File Structures ====================

/**
 * Profile metadata file (profile.json)
 */
interface ProfileFile {
  /** Schema version for migrations */
  version: string;

  /** Profile display name */
  name: string;

  /** Creation timestamp */
  createdAt: Timestamp;

  /** Last played timestamp */
  lastPlayed: Timestamp;

  /** Player type */
  playerType: 'human' | 'ai_agent';

  /** AI agent identifier */
  agentId?: string;

  /** Total playtime in seconds */
  totalPlayTime: number;
}

/**
 * Main save file (save.json)
 */
interface SaveFile {
  /** Schema version for migrations */
  version: string;

  /** Checksum for integrity verification */
  checksum: string;

  /** Last save timestamp */
  savedAt: Timestamp;

  /** Save trigger that caused this write */
  trigger: SaveTrigger;

  /** Character data */
  character: CharacterSaveData;

  /** Persistent gold (at camp) */
  gold: number;

  /** Veteran Knowledge state */
  veteranKnowledge: VeteranKnowledgeSaveData;

  /** Bestiary discoveries */
  bestiary: BestiarySaveData;

  /** Unlocked content */
  unlocks: UnlocksSaveData;

  /** Gameplay statistics */
  statistics: StatisticsSaveData;

  /** Active Lesson Learned bonus */
  lessonLearned: LessonLearnedSaveData | null;

  /** Event memory flags */
  eventMemory: EventMemorySaveData;

  /** Profile settings */
  settings: ProfileSettingsSaveData;
}

interface CharacterSaveData {
  class: CharacterClass;
  level: number;
  xp: number;
  baseStats: StatBlock;
  equipment: EquipmentSaveData;
}

interface EquipmentSaveData {
  weapon: EquippedItemSaveData;
  armor: EquippedItemSaveData | null;
  helm: EquippedItemSaveData | null;
  accessory: EquippedItemSaveData | null;
}

interface EquippedItemSaveData {
  id: EntityId;
  templateId: string;
  identified: boolean;
  source: ItemSource;
}

interface VeteranKnowledgeSaveData {
  monsters: Record<string, MonsterKnowledgeSaveData>;
}

interface MonsterKnowledgeSaveData {
  encounters: number;
  deaths: number;
  tier: 0 | 1 | 2 | 3;
}

interface BestiarySaveData {
  discovered: string[];
}

interface UnlocksSaveData {
  classes: CharacterClass[];
  items: string[];
  mutators: string[];
}

interface StatisticsSaveData {
  runsCompleted: number;
  runsFailed: number;
  totalGoldEarned: number;
  enemiesKilled: Record<string, number>;
  deepestFloor: FloorNumber;
  bossesDefeated: number;
  totalPlayTime: number;
  fastestBossKill: number | null;
}

interface LessonLearnedSaveData {
  enemyType: string;
  damageBonus: number;
  runsRemaining: number;
}

interface EventMemorySaveData {
  woundedAdventurerHelped: boolean;
  shrineDesecrated: boolean;
  hoodedFigureEncountered: boolean;
}

interface ProfileSettingsSaveData {
  activeMutators: string[];
  showDamageNumbers: boolean;
  showCombatLog: boolean;
  confirmDestructiveActions: boolean;
}

/**
 * Stash file (stash.json)
 */
interface StashFile {
  /** Schema version */
  version: string;

  /** Checksum */
  checksum: string;

  /** Last modified timestamp */
  modifiedAt: Timestamp;

  /** Stash capacity */
  capacity: number;

  /** Items in stash */
  items: StashedItemSaveData[];
}

interface StashedItemSaveData {
  id: EntityId;
  templateId: string;
  identified: boolean;
}
```

### Atomic Write Operations

```typescript
// ==================== Atomic Write ====================

/**
 * Performs atomic file write with integrity verification.
 *
 * Process:
 * 1. Write to temp file (save.json.tmp)
 * 2. Read back and verify checksum
 * 3. Rename existing to backup (save.json.bak)
 * 4. Rename temp to save (save.json)
 * 5. Delete backup on success
 */
interface AtomicWriter {
  /**
   * Write data atomically to target path
   */
  write(
    targetPath: string,
    data: string,
    checksum: string
  ): Promise<Result<void, SaveError>>;

  /**
   * Check if a write operation is in progress
   */
  isWriteInProgress(): boolean;
}

function createAtomicWriter(
  fileSystem: FileSystem,
  logger: Logger
): AtomicWriter;

/**
 * Generate checksum for save data
 */
function generateChecksum(data: string): string;

/**
 * Verify checksum matches data
 */
function verifyChecksum(data: string, checksum: string): boolean;
```

### Schema Migration

```typescript
// ==================== Schema Migration ====================

/**
 * Current save file schema version
 */
const CURRENT_SAVE_VERSION = '1.0.0';

/**
 * Migrate save data from older versions
 */
interface SchemaMigrator {
  /**
   * Check if migration is needed
   */
  needsMigration(version: string): boolean;

  /**
   * Get the migration path from version to current
   */
  getMigrationPath(fromVersion: string): string[];

  /**
   * Migrate save data to current version
   */
  migrate(data: unknown, fromVersion: string): Result<SaveFile, SaveError>;
}

function createSchemaMigrator(): SchemaMigrator;

/**
 * Migration definition
 */
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: unknown) => unknown;
  description: string;
}
```

---

## Configuration Files

### configs/save.json

```json
{
  "profilesDirectory": "profiles",
  "defaultProfileName": "default",

  "saveFiles": {
    "profile": "profile.json",
    "save": "save.json",
    "stash": "stash.json",
    "analyticsDir": "analytics"
  },

  "atomicWrite": {
    "tempSuffix": ".tmp",
    "backupSuffix": ".bak",
    "verifyAfterWrite": true,
    "keepBackupOnSuccess": false
  },

  "stash": {
    "defaultCapacity": 12,
    "maxCapacity": 20
  },

  "backups": {
    "maxBackups": 5,
    "autoBackupOnExtraction": true,
    "backupDirectory": "backups"
  },

  "validation": {
    "checksumAlgorithm": "sha256",
    "validateOnLoad": true,
    "strictSchemaValidation": true
  },

  "recovery": {
    "attemptAutoRecovery": true,
    "useBackupOnCorruption": true,
    "logRecoveryAttempts": true
  },

  "profileNameRules": {
    "minLength": 1,
    "maxLength": 32,
    "allowedCharacters": "alphanumeric_dash_underscore",
    "reservedNames": ["default", "backup", "temp", "system"]
  }
}
```

---

## Events Emitted/Subscribed

### Events Emitted

```typescript
// Emitted after successful save
interface GameSavedEvent {
  type: 'GAME_SAVED';
  timestamp: Timestamp;
  profileId: string;
  trigger: SaveTrigger;
}

// Emitted after successful load
interface GameLoadedEvent {
  type: 'GAME_LOADED';
  timestamp: Timestamp;
  profileId: string;
  lastPlayed: Timestamp;
}

// Emitted when profile is created
interface ProfileCreatedEvent {
  type: 'PROFILE_CREATED';
  timestamp: Timestamp;
  profileName: string;
  playerType: 'human' | 'ai_agent';
}

// Emitted when profile is deleted
interface ProfileDeletedEvent {
  type: 'PROFILE_DELETED';
  timestamp: Timestamp;
  profileName: string;
}

// Emitted when recovery is attempted
interface SaveRecoveryAttemptedEvent {
  type: 'SAVE_RECOVERY_ATTEMPTED';
  timestamp: Timestamp;
  profileName: string;
  success: boolean;
  method: 'backup' | 'partial' | 'reset';
}
```

### Events Subscribed

The save system listens to these events to trigger saves:

| Event | Save Trigger |
|-------|--------------|
| `EXTRACTION_COMPLETED` | `extraction` |
| `DEATH_OCCURRED` | `death` |
| `ITEM_PURCHASED` | `merchant_transaction` |
| `ITEM_SOLD` | `merchant_transaction` |
| `STASH_ITEM_ADDED` (deposit) | `stash_deposit` |
| `STASH_ITEM_REMOVED` (withdrawal) | `stash_withdrawal` |
| `ITEM_IDENTIFIED` | `item_identified` |

---

## State Managed

The save system does not maintain runtime state beyond:

- **Active profile name**: Currently selected profile
- **Write lock**: Prevents concurrent writes during atomic save
- **Dirty flag**: Tracks if changes need saving (optional optimization)

All persistent state is managed by `03-state-management` and serialized through this system.

---

## Edge Cases and Error Handling

### Save Trigger Rules

| Trigger | Save? | Rationale |
|---------|-------|-----------|
| Dungeon extraction | YES | Commit point - loot secured |
| Player death | YES | Commit point - consequences applied |
| Merchant buy/sell | YES | Gold changed hands |
| Stash deposit | YES | Item moved to safe storage |
| Stash withdrawal | YES | Item at risk now |
| Item identified | YES | Gold spent |
| Mid-dungeon | NEVER | Crash = run lost by design |
| Stash rearrangement | NO | No meaningful change |
| Equipment swap at camp | NO | Reversible, no commit |
| UI settings change | NO | Preference only |

### Corruption Recovery

| Scenario | Recovery Strategy |
|----------|-------------------|
| Checksum mismatch | Try backup file |
| JSON parse error | Try backup file |
| Missing required fields | Migrate if version older, else try backup |
| Backup also corrupted | Offer profile reset with warning |
| Profile.json missing | Recreate from save.json metadata |
| Save.json missing but stash exists | Partial recovery, warn player |
| All files missing | Profile effectively deleted |

### Atomic Write Failures

| Failure Point | Recovery |
|---------------|----------|
| Temp file write fails | Report error, original unchanged |
| Verify fails | Delete temp, report error |
| Backup rename fails | Delete temp, report error |
| Final rename fails | Restore backup, report error |
| Backup delete fails | Log warning, non-fatal |
| Disk full | Detect early, report before write |

### Profile Name Validation

| Input | Result |
|-------|--------|
| `player1` | Valid |
| `Player_One` | Valid |
| `my-save` | Valid |
| `save 1` | Invalid (space) |
| `save/1` | Invalid (slash) |
| `default` | Invalid (reserved) |
| `` | Invalid (empty) |
| `a` * 50 | Invalid (too long) |
| `../etc` | Invalid (path traversal) |

### Concurrent Access

| Scenario | Handling |
|----------|----------|
| Save while save in progress | Queue or reject with error |
| Load while save in progress | Wait for save to complete |
| Multiple processes same profile | OS file lock, second fails |

---

## Test Strategy

### Unit Tests

1. **Serialization Tests**
   - Round-trip: state -> JSON -> state identical
   - All state fields serialized correctly
   - Default values populated for missing fields
   - Invalid JSON rejected with clear error

2. **Checksum Tests**
   - Same data produces same checksum
   - Different data produces different checksum
   - Corrupted data detected by checksum mismatch
   - Checksum algorithm matches config

3. **Atomic Write Tests**
   - Successful write leaves only final file
   - Failed write leaves original unchanged
   - Concurrent writes handled correctly
   - Temp/backup files cleaned up

4. **Profile Manager Tests**
   - Create profile creates correct directory structure
   - Load profile returns correct state
   - Delete profile removes all files
   - Invalid profile names rejected
   - Reserved names rejected

5. **Migration Tests**
   - Old versions migrate successfully
   - Migration path calculated correctly
   - Unknown version handled gracefully
   - Data preserved through migration

### Integration Tests

1. **Save/Load Cycle**
   ```typescript
   test("save and load preserves state", async () => {
     const originalState = createTestState();
     await saveService.save(originalState, 'extraction');
     const loadedState = await saveService.load();
     expect(loadedState.value).toEqual(originalState);
   });
   ```

2. **Corruption Recovery**
   ```typescript
   test("corrupted save falls back to backup", async () => {
     await saveService.save(validState, 'extraction');
     await corruptSaveFile();
     const result = await saveService.load();
     expect(result.success).toBe(true);
     expect(result.value).toEqual(validState);
   });
   ```

3. **Trigger Integration**
   ```typescript
   test("extraction event triggers save", async () => {
     eventBus.emit(createEvent('EXTRACTION_COMPLETED', { ... }));
     await waitForSave();
     expect(await saveService.hasSaveData()).toBe(true);
   });
   ```

### Property Tests

```typescript
property("serialization is reversible", (state: GameState) => {
  const serialized = serializeState(state);
  const deserialized = deserializeState(serialized);
  return isOk(deserialized) && deepEqual(deserialized.value, state);
});

property("checksum detects changes", (data: string, index: number, char: string) => {
  const original = generateChecksum(data);
  const modified = data.slice(0, index) + char + data.slice(index + 1);
  const corrupted = generateChecksum(modified);
  return data === modified || original !== corrupted;
});

property("profile names are filesystem safe", (name: string) => {
  if (!isValidProfileName(name)) return true;
  const path = `profiles/${name}/save.json`;
  return !path.includes('..') && !path.includes('//');
});
```

---

## Implementation Notes

### File System Layout

```
profiles/
├── default/
│   ├── profile.json     # Metadata, last played, player type
│   ├── save.json        # Character, equipment, progression
│   ├── stash.json       # Stored items (separate for faster access)
│   ├── backups/         # Auto-backups on extraction
│   │   ├── backup_001.json
│   │   └── backup_002.json
│   └── analytics/       # Event logs (see 14-analytics)
│       └── events_2026-01.jsonl
├── ironman_run/
│   ├── profile.json
│   ├── save.json
│   ├── stash.json
│   └── analytics/
└── ai_agent_001/
    ├── profile.json
    ├── save.json
    ├── stash.json
    └── analytics/
```

### Checksum Algorithm

Use SHA-256 for checksum generation:

```typescript
import { createHash } from 'crypto';

function generateChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
```

### Atomic Write Implementation

```typescript
async function atomicWrite(
  fs: FileSystem,
  targetPath: string,
  data: string,
  checksum: string
): Promise<Result<void, SaveError>> {
  const tempPath = `${targetPath}.tmp`;
  const backupPath = `${targetPath}.bak`;

  // Step 1: Write to temp
  try {
    await fs.writeFile(tempPath, data);
  } catch (e) {
    return err({ code: 'WRITE_FAILED', message: 'Failed to write temp file' });
  }

  // Step 2: Verify temp file
  try {
    const written = await fs.readFile(tempPath);
    if (generateChecksum(written) !== checksum) {
      await fs.unlink(tempPath);
      return err({ code: 'CHECKSUM_MISMATCH', message: 'Verification failed' });
    }
  } catch (e) {
    return err({ code: 'READ_FAILED', message: 'Failed to verify temp file' });
  }

  // Step 3: Backup existing (if exists)
  const exists = await fs.exists(targetPath);
  if (exists) {
    try {
      await fs.rename(targetPath, backupPath);
    } catch (e) {
      await fs.unlink(tempPath);
      return err({ code: 'ATOMIC_WRITE_FAILED', message: 'Failed to create backup' });
    }
  }

  // Step 4: Rename temp to target
  try {
    await fs.rename(tempPath, targetPath);
  } catch (e) {
    // Restore backup if rename failed
    if (exists) {
      await fs.rename(backupPath, targetPath);
    }
    return err({ code: 'ATOMIC_WRITE_FAILED', message: 'Failed to finalize save' });
  }

  // Step 5: Delete backup on success
  if (exists) {
    try {
      await fs.unlink(backupPath);
    } catch (e) {
      // Non-fatal, just log
    }
  }

  return ok(undefined);
}
```

### Save Trigger Subscription

```typescript
function setupSaveTriggers(
  eventBus: EventBus,
  saveService: SaveService,
  stateStore: StateStore
): void {
  const triggerSave = (trigger: SaveTrigger) => {
    const state = stateStore.getState();
    saveService.save(state, trigger);
  };

  eventBus.subscribe('EXTRACTION_COMPLETED', () => triggerSave('extraction'));
  eventBus.subscribe('DEATH_OCCURRED', () => triggerSave('death'));
  eventBus.subscribe('ITEM_PURCHASED', () => triggerSave('merchant_transaction'));
  eventBus.subscribe('ITEM_SOLD', () => triggerSave('merchant_transaction'));
  // Note: STASH events need special handling for deposit vs withdrawal
  eventBus.subscribe('ITEM_IDENTIFIED', () => triggerSave('item_identified'));
}
```

### Default Profile Creation

On first launch, create the default profile:

```typescript
async function ensureDefaultProfile(
  profileManager: ProfileManager
): Promise<void> {
  const exists = await profileManager.profileExists('default');
  if (!exists) {
    await profileManager.createProfile('default', 'human');
  }
}
```

---

## Public Exports

```typescript
// src/core/save/index.ts

export type {
  // Managers
  ProfileManager,
  SaveService,
  StashManager,
  AtomicWriter,
  SchemaMigrator,

  // Data types
  ProfileMetadata,
  BackupInfo,
  SaveValidation,
  SaveError,
  SaveErrorCode,
  SaveTrigger,

  // File structures
  ProfileFile,
  SaveFile,
  StashFile,
  CharacterSaveData,
  EquipmentSaveData,
  EquippedItemSaveData,
  VeteranKnowledgeSaveData,
  MonsterKnowledgeSaveData,
  BestiarySaveData,
  UnlocksSaveData,
  StatisticsSaveData,
  LessonLearnedSaveData,
  EventMemorySaveData,
  ProfileSettingsSaveData,
  StashedItemSaveData,
};

export {
  // Factory functions
  createProfileManager,
  createSaveService,
  createStashManager,
  createAtomicWriter,
  createSchemaMigrator,

  // Utilities
  generateChecksum,
  verifyChecksum,

  // Constants
  CURRENT_SAVE_VERSION,
};
```
