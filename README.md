# JS Learner - Interactive JavaScript Learning TUI

A beautiful Terminal User Interface (TUI) application built in Rust for learning JavaScript through interactive exercises. The app watches your code changes in real-time, runs tests automatically, and tracks your progress.

## Features

- **Interactive TUI Interface**: Beautiful terminal interface built with `ratatui`
- **Real-time File Watching**: Automatically detects changes to your exercise files
- **Automatic Test Running**: Runs tests in the background when files change
- **Progress Tracking**: Saves your progress in a local SQLite database
- **Course Management**: Load and manage multiple JavaScript courses
- **Exercise Completion**: Visual indicators showing which exercises are completed

## Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs)
- **Node.js & npm**: Install from [nodejs.org](https://nodejs.org)

## Installation

### Build from source

```bash
# Clone the repository
cd learn-programming-app

# Build the application
cargo build --release

# The binary will be available at ./target/release/js-learner
```

## Getting Started

### 1. Prepare the Course

First, install the npm dependencies for the example course:

```bash
cd example-js-course
npm install
cd ..
```

### 2. Run the Application

```bash
# Run with the example course (default)
cargo run --release

# Or specify a course directory
cargo run --release -- /path/to/course
```

### 3. Using the Interface

**List Mode:**
- `↓` or `j` - Move down
- `↑` or `k` - Move up
- `w` or `Enter` - Start watching selected exercise
- `q` - Quit

**Watch Mode:**
- `Esc` - Stop watching and return to list
- `r` - Run tests manually
- `q` - Quit

### 4. Complete Exercises

1. Select an exercise from the list
2. Press `w` or `Enter` to start watching
3. Open the exercise file in your favorite editor
4. Edit the file to solve the exercise
5. Save the file - tests run automatically!
6. When all tests pass, the exercise is marked as complete ✓

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

- **Windows**: `%APPDATA%\js-learner\data\`
- **macOS**: `~/Library/Application Support/com.js-learner.js-learner/`
- **Linux**: `~/.local/share/js-learner/`

Each course has its own SQLite database file to track exercise completion.

## Architecture

The application is structured into several modules:

- `course.rs` - Course and exercise metadata parsing
- `database.rs` - SQLite progress tracking
- `watcher.rs` - File system watching with `notify`
- `test_runner.rs` - Jest test execution
- `ui.rs` - TUI interface with `ratatui`
- `main.rs` - Application entry point

## Technologies Used

- **Rust** - Safe, fast systems programming language
- **ratatui** - Terminal UI framework
- **crossterm** - Cross-platform terminal manipulation
- **notify** - File system watcher
- **rusqlite** - SQLite database bindings
- **tokio** - Async runtime
- **Jest** - JavaScript testing framework

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
7. Run `js-learner /path/to/your-course`

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Create new courses

## License

This project is open source and available under the MIT License.
