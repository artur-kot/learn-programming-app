# Installation Guide

Learn Programming TUI (`learnp`) can be installed on multiple platforms using various methods.

## Table of Contents

- [Quick Install (Linux/macOS)](#quick-install-linuxmacos)
- [Windows](#windows)
- [Package Managers](#package-managers)
  - [Debian/Ubuntu (.deb)](#debianubuntu-deb)
  - [Fedora/RHEL (.rpm)](#fedorarhel-rpm)
  - [Arch Linux (AUR)](#arch-linux-aur)
  - [macOS (Homebrew)](#macos-homebrew)
- [Manual Installation](#manual-installation)
- [Building from Source](#building-from-source)

---

## Quick Install (Linux/macOS)

Run the installation script:

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/learn-programming-app/main/install.sh | bash
```

Or download and run it manually:

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/learn-programming-app/main/install.sh -o install.sh
chmod +x install.sh
./install.sh
```

### Custom Installation Directory

```bash
INSTALL_DIR=/usr/local/bin ./install.sh
```

### Specific Version

```bash
VERSION=0.1.0 ./install.sh
```

---

## Windows

### Method 1: MSI Installer (Recommended)

1. Download the latest `.msi` installer from [Releases](https://github.com/yourusername/learn-programming-app/releases)
2. Run the installer
3. The application will be available in your PATH as `learnp`

### Method 2: Portable ZIP

1. Download the latest Windows ZIP from [Releases](https://github.com/yourusername/learn-programming-app/releases)
2. Extract `learnp.exe` to a directory of your choice
3. Add that directory to your PATH (optional)

**Add to PATH:**

1. Open System Properties → Environment Variables
2. Edit the `Path` variable
3. Add the directory containing `learnp.exe`

---

## Package Managers

### Debian/Ubuntu (.deb)

Download and install the `.deb` package:

```bash
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp_0.1.0_amd64.deb
sudo dpkg -i learnp_0.1.0_amd64.deb

# Install dependencies if needed
sudo apt-get install -f
```

### Fedora/RHEL (.rpm)

Download and install the `.rpm` package:

```bash
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-1.x86_64.rpm
sudo rpm -i learnp-0.1.0-1.x86_64.rpm

# Or using dnf
sudo dnf install learnp-0.1.0-1.x86_64.rpm
```

### Arch Linux (AUR)

#### Using an AUR Helper (yay, paru, etc.)

```bash
yay -S learnp-bin
```

#### Manual Installation

```bash
git clone https://aur.archlinux.org/learnp-bin.git
cd learnp-bin
makepkg -si
```

### macOS (Homebrew)

*Note: Homebrew tap coming soon*

For now, use the [Quick Install](#quick-install-linuxmacos) script or download the macOS binary manually.

---

## Manual Installation

### Linux (Generic)

Download the static binary for maximum compatibility:

```bash
# Download
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-x86_64-unknown-linux-musl.tar.gz

# Extract
tar xzf learnp-0.1.0-x86_64-unknown-linux-musl.tar.gz

# Make executable
chmod +x learnp

# Move to PATH
sudo mv learnp /usr/local/bin/
```

### Linux (AppImage)

```bash
# Download
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-x86_64.AppImage

# Make executable
chmod +x learnp-0.1.0-x86_64.AppImage

# Run directly or move to PATH
./learnp-0.1.0-x86_64.AppImage

# Optional: Move to PATH
sudo mv learnp-0.1.0-x86_64.AppImage /usr/local/bin/learnp
```

### macOS

#### Intel (x86_64)

```bash
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-x86_64-apple-darwin.tar.gz
tar xzf learnp-0.1.0-x86_64-apple-darwin.tar.gz
chmod +x learnp
sudo mv learnp /usr/local/bin/
```

#### Apple Silicon (M1/M2)

```bash
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-aarch64-apple-darwin.tar.gz
tar xzf learnp-0.1.0-aarch64-apple-darwin.tar.gz
chmod +x learnp
sudo mv learnp /usr/local/bin/
```

#### Universal Binary (Intel + Apple Silicon)

```bash
wget https://github.com/yourusername/learn-programming-app/releases/download/v0.1.0/learnp-0.1.0-universal-apple-darwin.tar.gz
tar xzf learnp-0.1.0-universal-apple-darwin.tar.gz
chmod +x learnp-universal
sudo mv learnp-universal /usr/local/bin/learnp
```

---

## Building from Source

### Prerequisites

- Rust 1.70+ ([install via rustup](https://rustup.rs/))
- Git
- Standard build tools (gcc/clang, make)

### Build Steps

```bash
# Clone repository
git clone https://github.com/yourusername/learn-programming-app.git
cd learn-programming-app

# Build release binary
cargo build --release

# Binary will be at: target/release/learnp
sudo cp target/release/learnp /usr/local/bin/
```

### Build Packages

**Debian/Ubuntu (.deb):**

```bash
cargo install cargo-deb
cargo deb
# Package will be in: target/debian/
```

**Fedora/RHEL (.rpm):**

```bash
cargo install cargo-generate-rpm
cargo build --release
cargo generate-rpm
# Package will be in: target/generate-rpm/
```

**Windows (.msi):**

```bash
cargo install cargo-wix
cargo wix
# Installer will be in: target/wix/
```

---

## Verification

After installation, verify the installation:

```bash
learnp --version
```

You should see:

```
learnp 0.1.0
```

---

## Updating

### Using Package Managers

Simply install the newer version using the same method as installation.

### Manual Update

Download and install the latest version from [Releases](https://github.com/yourusername/learn-programming-app/releases).

### Using Install Script

```bash
./install.sh  # Will automatically fetch and install the latest version
```

---

## Uninstallation

### Package Managers

**Debian/Ubuntu:**
```bash
sudo apt remove learnp
```

**Fedora/RHEL:**
```bash
sudo rpm -e learnp
```

**Arch Linux:**
```bash
yay -R learnp-bin
```

**Windows MSI:**
- Use "Add or Remove Programs" in Windows Settings

### Manual Uninstall

```bash
# Remove binary
sudo rm /usr/local/bin/learnp

# Remove config and data (optional)
rm -rf ~/.local/share/Learn\ Programming
rm -rf ~/.config/learnp  # If config directory exists
```

---

## Troubleshooting

### Command not found

Ensure the installation directory is in your PATH:

```bash
echo $PATH
```

Add to your shell configuration (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Permission denied

Make sure the binary is executable:

```bash
chmod +x /path/to/learnp
```

### Missing dependencies (Linux)

Install required system libraries:

**Debian/Ubuntu:**
```bash
sudo apt-get install libssl-dev pkg-config
```

**Fedora/RHEL:**
```bash
sudo dnf install openssl-devel
```

**Arch Linux:**
```bash
sudo pacman -S openssl pkg-config
```

---

## Runtime Dependencies

### Required

- Git (for course update checking)
- Node.js + npm (for JavaScript exercises)

### Optional

- [Ollama](https://ollama.ai/) (for AI-powered hints)

Install dependencies:

**macOS (Homebrew):**
```bash
brew install git node ollama
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git nodejs npm
# Install Ollama separately from https://ollama.ai/
```

**Arch Linux:**
```bash
sudo pacman -S git nodejs npm
# Install Ollama from AUR
yay -S ollama
```

---

## Getting Started

After installation, navigate to a course directory and run:

```bash
learnp
```

Or specify a course path:

```bash
learnp /path/to/course
```

For more information, see the [README](README.md).
