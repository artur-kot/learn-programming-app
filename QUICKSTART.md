# Quick Start Guide

Get started with Learn Programming in 3 simple steps!

## Prerequisites

Make sure you have installed:
- **Rust & Cargo**: [rustup.rs](https://rustup.rs)
- **Node.js & npm**: [nodejs.org](https://nodejs.org)

## Setup

### Step 1: Install Learn Programming

```bash
cd learn-programming-app
cargo install --path .
```

This installs the `learnp` command to your system (in `~/.cargo/bin/`).

### Step 2: Install Course Dependencies

```bash
cd example-js-course
npm install
```

This installs Jest and other testing dependencies needed to run the exercises.

### Step 3: Start Learning!

```bash
learnp
```

## Using the Application

### Controls

**When viewing README:**
- **↑/↓** or **j/k** - Navigate through exercises
- **Enter** - Run tests for the selected exercise (output streams in real-time!)
- **r** - Show README/exercise details
- **q** - Quit

**When viewing test output:**
- **↑/↓** - Scroll output up/down
- **Page Up/Down** - Scroll faster
- **Home/End** - Jump to top/bottom
- **Esc** - Exit scrolling mode and return to README
- **r** - Return to README (same as Esc)
- **Enter** - Run tests again
- **q** - Quit

### Workflow

1. **Select an exercise** using arrow keys
2. **Read the instructions** in the right panel
3. **Open the exercise file** in your editor (e.g., `exercises/01-hello-world/exercise.js`)
4. **Write your solution**
5. **Press Enter** in the TUI to run tests
6. **Watch test results stream in real-time** in the right panel (just like running in a terminal!)
7. **Scroll through output** if needed using arrow keys
8. **Keep iterating** until all tests pass ✓

### Example: Completing the First Exercise

1. Start the app: `learnp`
2. The first exercise "Hello World" is selected by default
3. Open `exercises/01-hello-world/exercise.js` in your editor
4. Modify the `sayHello` function to return `"Hello, World!"`
5. Save the file
6. Press **Enter** in the TUI to run tests
7. You should see "✓ ALL TESTS PASSED!" in green
8. The exercise will be marked complete with a ✓

### Tips

- **Dual Editor/Terminal Setup**: Keep the TUI running in one terminal while editing in your code editor
- **Quick Feedback Loop**: Press Enter after each save to see if your solution works
- **Test Output**: The full Jest output is displayed, helping you debug failing tests
- **Progress Tracking**: Your completed exercises are saved and persist between sessions

## Troubleshooting

### Error: "node_modules not found"
**Solution**: Run `npm install` in the course directory first.

### Error: "program not found" (npm)
**Solution**: Make sure Node.js and npm are properly installed and in your PATH.

### Error: "course.json not found"
**Solution**: Make sure you're running `learnp` from within a course directory, or provide the path: `learnp /path/to/course`

## Next Steps

- Complete all exercises in `example-js-course`
- Create your own course (see README.md)
- Share your courses with others!

Happy Learning! 🚀
