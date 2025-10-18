# Learn Programming - Interactive Programming Learning TUI

A beautiful Terminal User Interface (TUI) application built in Rust for learning programming through interactive exercises. The app runs tests on demand, displays output in real-time, and tracks your progress.

## Features

- **Interactive TUI Interface**: Beautiful terminal interface built with `ratatui`
- **On-Demand Test Running**: Run tests with a single keypress
- **Real-time Streaming Output**: Watch test results appear as they run, just like in a terminal
- **Scrollable Output**: Full navigation support for long test outputs
- **Progress Tracking**: Saves your progress in a local SQLite database
- **Course Management**: Load and manage multiple programming courses
- **Exercise Completion**: Visual indicators showing which exercises are completed
- **Dual-Panel View**: Exercise details on the left, test output on the right

## Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs)
- **Node.js & npm**: Install from [nodejs.org](https://nodejs.org)

## Installation

### Install from source

```bash
# Clone or navigate to the repository
cd learn-programming-app

# Install the application
cargo install --path .

# The binary will be installed to ~/.cargo/bin/learnp
```

## Getting Started

### 1. Install Dependencies

**Important**: Before running the application, you must install the course dependencies (Jest and testing tools):

```bash
cd example-js-course
npm install
```

This step is required only once per course. The application will show an error if `node_modules` is missing.

### 2. Run the Application

```bash
# Run from within the course directory (recommended)
learnp

# Or specify a course directory path from anywhere
learnp /path/to/course
```

**First-time setup summary:**
```bash
# 1. Install the learnp tool
cargo install --path .

# 2. Navigate to a course
cd example-js-course

# 3. Install course dependencies (one-time setup)
npm install

# 4. Start learning!
learnp
```

### 3. Using the Interface

**Exercise Navigation (when viewing README):**
- `↓` or `j` - Move to next exercise
- `↑` or `k` - Move to previous exercise
- `Enter` - Run tests for selected exercise
- `r` - Show README (exercise details)
- `q` - Quit

**Scrolling (when viewing test output):**
- `↓` / `↑` - Scroll down/up one line
- `Page Down` / `Page Up` - Scroll down/up 10 lines
- `Home` - Scroll to top
- `End` - Scroll to bottom
- `Esc` - Exit scrolling mode and return to README

### 4. Complete Exercises

1. Select an exercise from the list
2. The right panel shows the exercise README
3. Open the exercise file in your favorite editor (e.g., VS Code, Vim)
4. Edit the file to solve the exercise
5. Press `Enter` in the TUI to run tests
6. The right panel switches to show **real-time streaming test output**
7. Watch the test results appear as they run
8. Use arrow keys to scroll through the output if needed
9. When all tests pass, the exercise is marked as complete ✓
10. Press `r` to go back to README view

## Course Structure

A course should have the following structure:

```
your-course/
├── course.json              # Course metadata
├── package.json             # npm configuration with Jest
├── exercises/
│   ├── 01-exercise-name/
│   │   ├── exercise.js      # Exercise file for students
│   │   ├── exercise.test.js # Test file
│   │   └── README.md        # Exercise description
│   ├── 02-another-exercise/
│   │   ├── exercise.js
│   │   ├── exercise.test.js
│   │   └── README.md
│   └── ...
```

### course.json Example

```json
{
  "name": "JavaScript Fundamentals",
  "description": "Learn the basics of JavaScript",
  "author": "Your Name",
  "version": "1.0.0",
  "exercises": [
    {
      "id": "01-hello-world",
      "title": "Hello World",
      "description": "Your first JavaScript function",
      "order": 1
    }
  ]
}
```

## Example Course

The repository includes a complete example course with 4 exercises covering:

1. **Hello World** - Write your first JavaScript function
2. **Variables and Data Types** - Learn about variables, strings, numbers
3. **Functions** - Create functions with parameters
4. **Arrays** - Work with arrays and array methods

## Data Storage

The application stores progress data in your system's standard configuration directory:

- **Windows**: `%APPDATA%\learnp\Learn Programming\data\`
- **macOS**: `~/Library/Application Support/com.learnp.Learn Programming/`
- **Linux**: `~/.local/share/learnp/`

Each course has its own SQLite database file to track exercise completion.

## Architecture

The application is structured into several modules:

- `course.rs` - Course and exercise metadata parsing
- `database.rs` - SQLite progress tracking
- `test_runner.rs` - Jest test execution and output capture
- `ui.rs` - TUI interface with `ratatui` (dual-panel display)
- `main.rs` - Application entry point

## Technologies Used

- **Rust** - Safe, fast systems programming language
- **ratatui** - Terminal UI framework
- **crossterm** - Cross-platform terminal manipulation
- **rusqlite** - SQLite database bindings
- **tokio** - Async runtime
- **Jest** - JavaScript testing framework (for exercises)

## Creating Your Own Course

1. Create a new directory for your course
2. Add a `course.json` with course metadata
3. Add a `package.json` with Jest configuration
4. Create exercise directories under `exercises/`
5. For each exercise, add:
   - `exercise.js` - The file students will edit
   - `exercise.test.js` - Jest tests
   - `README.md` - Exercise description
6. Run `npm install` in your course directory
7. Navigate to your course directory and run `learnp`

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Create new courses

## License

This project is open source and available under the MIT License.
