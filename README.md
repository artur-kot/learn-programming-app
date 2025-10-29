# Learn Programming - Interactive Programming Learning TUI

A Terminal User Interface (TUI) application built in Rust for learning programming through interactive exercises. The app runs tests on demand, displays output in real-time, and tracks your progress.

## Features

- **Interactive TUI Interface**: Beautiful terminal interface built with `ratatui`
- **On-Demand Test Running**: Run tests with a single keypress
- **Real-time Streaming Output**: Watch test results appear as they run, just like in a terminal
- **Scrollable Output**: Full navigation support for long test outputs
- **Progress Tracking**: Saves your progress in a local SQLite database
- **Course Management**: Load and manage multiple programming courses
- **Exercise Completion**: Visual indicators showing which exercises are completed
- **Dual-Panel View**: Exercise details on the left, test output on the right

## Installation

### Install from installer
Choose proper installer for your system in Releases.

### Install from source

```bash
# Clone or navigate to the repository
cd learn-programming-app

# Install the application
cargo install --path .

# The binary will be installed to ~/.cargo/bin/learnp
```
This project is open source and available under the MIT License.
