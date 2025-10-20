# Shared Database Implementation - TUI

## Overview

The TUI app now uses **OS-specific shared database locations** to enable progress sharing with the VS Code extension.

---

## Changes Made

### 1. New Module: `src/paths.rs`

Created comprehensive path utilities for cross-platform database management:

**Key Functions:**
- `get_data_directory()` - Returns OS-appropriate data directory
  - Windows: `%LOCALAPPDATA%\LearnProgramming`
  - macOS: `~/Library/Application Support/LearnProgramming`
  - Linux: `~/.local/share/learn-programming`

- `get_shared_database_path(course_path, course_name)` - Generates unique database path
  - Uses SHA256 hash of course path (first 16 chars)
  - Format: `{course-name}-{hash}.db`
  - Example: `javascript-basics-a1b2c3d4e5f6g7h8.db`

- `update_course_mapping(course_path, db_path)` - Creates mapping file
  - File: `{data-directory}/course-mappings.json`
  - Maps course paths to database locations

- `get_database_from_mapping(course_path)` - Retrieves DB path from mapping

- `get_stored_courses()` - Lists all stored course databases

### 2. Updated: `src/database.rs`

**Constructor Changes:**
```rust
// OLD
pub fn new(course_name: &str) -> Result<Self>

// NEW
pub fn new(course_path: &Path, course_name: &str) -> Result<Self>
```

**New Features:**
- Uses `get_shared_database_path()` instead of `directories` crate
- **WAL mode** enabled for concurrent access (TUI + VS Code)
- **Metadata table** for cross-tool compatibility
- **Tool usage tracking** (records 'tui' as last tool used)
- **Schema versioning** (v1.0)

**New Methods:**
- `init_schema()` - Creates metadata table
- `record_tool_usage()` - Records TUI access with timestamp

### 3. Updated: `src/ui.rs`

Changed database initialization to pass course path:

```rust
// OLD
let database = Database::new(&course.name)?;

// NEW
let database = Database::new(&course_path, &course.name)?;
```

### 4. Updated: `src/main.rs`

Added paths module:

```rust
mod paths;
```

### 5. Updated: `Cargo.toml`

Added new dependencies:

```toml
sha2 = "0.10"      # For path hashing
dirs = "5.0"       # For home directory detection
```

---

## Database Schema

### Updated Schema (v1.0)

```sql
-- Existing table (unchanged structure)
CREATE TABLE IF NOT EXISTS exercise_progress (
  exercise_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0,
  last_attempt TEXT,
  completed_at TEXT
);

-- NEW: Metadata table for cross-tool compatibility
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Schema version
INSERT OR IGNORE INTO metadata (key, value) VALUES ('schema_version', '1.0');

-- Tool tracking (updated on each access)
INSERT OR REPLACE INTO metadata (key, value) VALUES
  ('last_tool', 'tui'),
  ('last_updated', '2025-10-20T12:00:00Z');
```

---

## Database Locations

### OS-Specific Paths

| Operating System | Database Location |
|-----------------|-------------------|
| **Windows** | `C:\Users\{user}\AppData\Local\LearnProgramming\courses\` |
| **macOS** | `~/Library/Application Support/LearnProgramming/courses/` |
| **Linux** | `~/.local/share/learn-programming/courses/` |

### Database Naming

Each course gets a unique database file:
```
{course-name}-{path-hash}.db
```

Example: `javascript-basics-a1b2c3d4e5f6g7h8.db`

The hash is derived from the course's absolute path, ensuring the same course always maps to the same database regardless of which tool opens it.

---

## Benefits

### For Users

1. **Seamless Tool Switching**
   - Start in TUI, continue in VS Code
   - Progress automatically syncs
   - No manual export/import needed

2. **Better Data Management**
   - Standard OS locations
   - Easy to backup
   - Easy to find

3. **Concurrent Usage**
   - Run TUI and VS Code simultaneously
   - WAL mode prevents database locking
   - Both tools can access progress

### For Developers

1. **Standard Path Discovery**
   - Same hashing algorithm as VS Code
   - Cross-tool compatible

2. **Future-Proof**
   - Schema versioning
   - Tool tracking
   - Migration path for changes

---

## Testing

### Compilation Test

```bash
cd /c/Users/artur/Development/learn-programming-app
cargo check
```

**Result**: ✅ Compiles successfully

### Manual Testing

1. **Run TUI with a course:**
   ```bash
   cargo run -- /path/to/course
   ```

2. **Complete an exercise** in TUI

3. **Check database location:**
   - Windows: Check `%LOCALAPPDATA%\LearnProgramming\courses\`
   - macOS: Check `~/Library/Application Support/LearnProgramming/courses/`
   - Linux: Check `~/.local/share/learn-programming/courses/`

4. **Open same course in VS Code extension**

5. **Verify progress appears** in VS Code tree view

6. **Complete another exercise in VS Code**

7. **Return to TUI**

8. **Verify both exercises show as completed**

---

## Cross-Tool Compatibility

### Shared Schema

Both TUI and VS Code now use:
- ✅ Identical database schema
- ✅ Same path hashing algorithm (SHA256)
- ✅ Compatible data types
- ✅ WAL mode for concurrency
- ✅ Metadata table for tracking

### Course Mapping File

Both tools maintain `course-mappings.json`:

**Location**: `{data-directory}/course-mappings.json`

**Format**:
```json
{
  "/absolute/path/to/course1": "/data/dir/courses/course1-hash.db",
  "/absolute/path/to/course2": "/data/dir/courses/course2-hash.db"
}
```

This file helps both tools discover databases created by the other tool.

---

## Migration from Old Databases

### Automatic Migration

The TUI app now uses the new shared location. Old databases stored in `directories::ProjectDirs` will not be automatically migrated.

If users have existing progress, they can:

1. **Locate old database:**
   - Windows: `%APPDATA%\learnp\Learn Programming\data\`
   - macOS: `~/Library/Application Support/com.learnp.Learn-Programming/`
   - Linux: `~/.local/share/learnp/Learn-Programming/`

2. **Note the course name** from filename

3. **Run TUI once** with the course to create new database

4. **Copy data manually** using SQLite:
   ```bash
   sqlite3 old.db ".dump exercise_progress" | sqlite3 new.db
   ```

Or simply start fresh - the new system will track progress going forward.

---

## Example Usage

### Course Path Example

```
Course Directory: /Users/artur/Development/example-js-course
Course Name: JavaScript Basics
```

### Generated Paths

```
Canonical Path: /Users/artur/Development/example-js-course
Path Hash (SHA256): a1b2c3d4e5f6g7h8... (full hash)
Short Hash: a1b2c3d4e5f6g7h8 (first 16 chars)
Sanitized Name: javascript-basics

Database Filename: javascript-basics-a1b2c3d4e5f6g7h8.db

Full Database Path (macOS):
~/Library/Application Support/LearnProgramming/courses/javascript-basics-a1b2c3d4e5f6g7h8.db
```

---

## Troubleshooting

### Database Not Found

**Problem**: TUI can't find VS Code's database

**Solution**:
1. Check that both tools use same course path
2. Verify `course-mappings.json` exists
3. Ensure paths are canonicalized identically

### Database Locked

**Problem**: "Database is locked" error

**Solution**:
1. WAL mode should prevent this
2. Check if database file permissions are correct
3. Ensure both tools enable WAL mode

### Schema Mismatch

**Problem**: Database structure differs

**Solution**:
1. Check `schema_version` in metadata table
2. Ensure both tools are up to date
3. Both tools should create identical tables

---

## Future Enhancements

Possible improvements:

1. **Automatic Migration**
   - Detect old databases
   - Copy progress to new location
   - Notify user of migration

2. **Database Management Commands**
   - `learnp --list-courses` - Show all stored courses
   - `learnp --cleanup` - Remove old databases
   - `learnp --export` - Export progress to JSON

3. **Progress Export/Import**
   - Export to JSON format
   - Import from backup
   - Share with team members

---

## Version Compatibility

| Component | Version | Status |
|-----------|---------|--------|
| TUI App | 0.1.0 | ✅ Updated |
| VS Code Extension | 0.2.0 | ✅ Updated |
| Database Schema | 1.0 | ✅ Compatible |
| Path Algorithm | SHA256 | ✅ Identical |

---

## Commands

### Build and Run

```bash
# Check compilation
cargo check

# Build release
cargo build --release

# Run with course
cargo run -- /path/to/course

# Or run from course directory
cd /path/to/course
cargo run --bin learnp
```

### Database Inspection

```bash
# Find database
ls ~/Library/Application\ Support/LearnProgramming/courses/

# Open database
sqlite3 ~/.../LearnProgramming/courses/course-name-hash.db

# Check schema version
sqlite3 database.db "SELECT * FROM metadata WHERE key='schema_version';"

# Check last tool used
sqlite3 database.db "SELECT * FROM metadata WHERE key='last_tool';"

# View all progress
sqlite3 database.db "SELECT * FROM exercise_progress;"
```

---

## Code References

### Key Files

- `src/paths.rs` - Path utilities and database location logic
- `src/database.rs` - Database implementation with shared storage
- `src/ui.rs:63` - Database initialization with course path
- `src/main.rs:5` - Paths module declaration

### Important Functions

- `paths::get_data_directory()` - OS-specific data dir
- `paths::get_shared_database_path()` - Generate DB path
- `database::Database::new()` - Initialize with shared location
- `database::init_schema()` - Create tables
- `database::record_tool_usage()` - Track TUI access

---

## Testing Checklist

- [x] TUI compiles without errors
- [ ] TUI runs with example course
- [ ] Database created in correct OS-specific location
- [ ] Progress saved successfully
- [ ] WAL mode enabled (check with `PRAGMA journal_mode`)
- [ ] Metadata table contains schema_version and last_tool
- [ ] Course mapping file created
- [ ] VS Code can read TUI-created database
- [ ] TUI can read VS Code-created database
- [ ] Both tools can run concurrently

---

**Implementation Date**: 2025-10-20
**Status**: ✅ Complete - Ready for Testing
**Breaking Changes**: Database location changed (users start fresh or manually migrate)

---

For complete integration guide with VS Code extension, see:
`../learn-programming-vscodeplugin/TUI_INTEGRATION.md`
