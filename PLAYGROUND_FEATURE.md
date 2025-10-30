# Playground Feature

## Overview
The playground feature allows users to extract a passing exercise to a sandbox environment (`./playground` folder) where they can experiment freely without affecting the original exercise.

## How to Use

1. **Run a test** - Navigate to an exercise and press `Enter` to run the test
2. **Wait for test to pass** - When the test passes, you'll see:
   ```
   ✓ Exercise Name passed! | p - extract to playground, ↑/↓ scroll, Enter - run again, Esc - back
   ```
3. **Extract to playground** - Press `p` to extract the exercise to a playground folder
4. **Experiment freely** - The entire exercise folder is copied to `./playground/` where you can modify code without affecting the original

## User Flow

### First Time Extraction
```
User presses 'p' → Playground created at ./playground/ → Success message shown
```

### Overwriting Existing Playground
```
User presses 'p' → Confirmation prompt appears → User presses 'y' or 'n'
  → 'y': Old playground deleted, new one created
  → 'n' or 'Esc': Operation cancelled, returns to test output
```

## File Structure After Extraction

```
001-hello-world/
├── exercise.json
├── README.md
├── 001-hello-world.js           ← Original (unchanged, tests still pass)
├── 001-hello-world.test.js
├── package.json
├── .gitignore                   ← Auto-created/updated to exclude playground/
└── playground/                  ← NEW - Sandbox for experimentation
    ├── exercise.json
    ├── 001-hello-world.js       ← Copy - safe to modify
    ├── 001-hello-world.test.js
    ├── package.json
    └── pnpm-lock.yaml
    (Note: README.md is NOT copied - refer to original)
```

## Benefits

- ✅ **Original exercise remains untouched** - Tests continue to pass
- ✅ **Safe experimentation** - Modify code freely in playground
- ✅ **Easy reset** - Delete playground and re-extract anytime
- ✅ **No git tracking** - Playgrounds are automatically .gitignored
- ✅ **Per-exercise sandboxes** - Each exercise can have its own playground

## Technical Details

### Implementation
- **Module**: `src/playground.rs`
- **UI Integration**: `src/ui.rs` (hotkey handler, display modes)
- **Hotkey**: `p` (only visible when test passes)

### Functions
- `extract_to_playground(exercise) -> Result<PathBuf>` - Copies exercise folder
- `playground_exists(exercise) -> bool` - Checks if playground exists
- `remove_playground(exercise) -> Result<()>` - Removes existing playground

### Git Ignore
Playgrounds are automatically excluded from version control:
- Root `.gitignore` contains `**/playground/`
- Exercise `.gitignore` is created/updated with `playground/`

### Display Modes
- `PlaygroundConfirm` - Shows overwrite confirmation dialog

### Status Messages
- **Test passed**: `✓ Exercise passed! | p - extract to playground, ...`
- **Extraction success**: `✓ Extracted to ./playground | p - extract again, ...`
- **Extraction error**: `✗ Failed to extract playground: <error> | Esc - back`
- **Confirmation prompt**: `Playground exists. Overwrite? y - yes, n - cancel`

## Testing

To test the feature:

1. Build the project:
   ```bash
   cargo build --release
   ```

2. Run the app:
   ```bash
   ./target/release/learnp example-course
   ```

3. Navigate to an exercise and run the test (press `Enter`)

4. When test passes, press `p` to extract to playground

5. Verify:
   - Playground folder created at `<exercise>/playground/`
   - Exercise files copied correctly (excluding README.md)
   - `.gitignore` created/updated
   - Original exercise still passes tests

6. Press `p` again to test overwrite confirmation

7. Press `y` to confirm overwrite, or `n`/`Esc` to cancel

## Error Handling

The feature handles:
- File permission errors
- Disk space issues
- Invalid paths
- Failed copies

All errors are displayed in the status bar with appropriate messages.
