# learnp

A terminal app for learning programming through hands-on exercises with instant feedback.

![screenshot](./readme/learnp-1.png)

## Installation

Download the installer for your platform from the [latest release](https://github.com/artur-kot/learn-programming-app/releases/latest):

- **Windows**: `.msi` installer or `.zip` portable
- **macOS**: `.pkg` installer (separate for Intel and Apple Silicon)
- **Linux**: `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL), or `.tar.gz`

After installing, the `learnp` command will be available in your terminal.

## Quick Start

1. Clone a course repository:
   ```bash
   git clone https://github.com/artur-kot/learn-programming-javascript
   cd learn-programming-javascript
   ```

2. Run learnp:
   ```bash
   learnp
   ```

3. Navigate exercises with arrow keys (or `j`/`k`), press Enter to run tests, and start coding!

## How It Works

Each course contains programming exercises with tests. The app:
- Shows exercises in a dual-panel interface with README and test output
- Runs tests when you press Enter
- Tracks your progress automatically
- Unlocks exercises as you complete them

Press `o` to open the current exercise in your preferred editor, make changes, then come back and test.

## Key Features

**Smart Testing** — One-keystroke test execution with real-time output. The app auto-detects your language (JavaScript, Python, Rust, Go) and runs the appropriate tests.

**AI Hints** — Stuck? Press `h` after a test failure to get context-aware hints. Requires [Ollama](https://ollama.com) installed locally.

**Progress Tracking** — Completed exercises are marked with checkmarks. Run all tests at once with Shift+A.

**Playground Mode** — Press `p` on a completed exercise to extract it to `./playground` for experimentation.

**Editor Integration** — Auto-detects VSCode, Cursor, JetBrains IDEs, Vim, and more.

## Optional Setup

### For AI Hints
Install [Ollama](https://ollama.com) and pull a model:
```bash
ollama pull qwen2.5-coder
```

The first time you request a hint, you'll choose which model to use.

### For Running Exercises
Depending on the course language, you'll need:
- **JavaScript**: Node.js and pnpm
- **Python**: Python and pytest
- **Rust**: Rust toolchain
- **Go**: Go toolchain

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑`/`↓` or `j`/`k` | Navigate exercises |
| `Enter` | Run tests |
| `r` | Read exercise (full screen) |
| `o` | Open in editor |
| `h` | Get AI hint (after test failure) |
| `p` | Extract to playground (after passing) |
| `Shift+A` | Run all tests |
| `Esc` or `q` | Back/Quit |

## Courses

- [JavaScript](https://github.com/artur-kot/learn-programming-javascript) — work in progress, contributions welcome

## Possible options

Unlock all exercises (skip progression):
```bash
learnp --unblock-all
```

Manage configuration:
```bash
learnp config          # Open config file
learnp config --path   # Show config location
```

## License

MIT
