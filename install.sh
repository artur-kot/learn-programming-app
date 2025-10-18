#!/usr/bin/env bash
# Installation script for Learn Programming TUI
# Supports Linux and macOS

set -e

VERSION="${VERSION:-latest}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
REPO="yourusername/learn-programming-app"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS and architecture
detect_platform() {
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch=$(uname -m)

    case "$os" in
        linux*)
            OS="linux"
            ;;
        darwin*)
            OS="darwin"
            ;;
        *)
            error "Unsupported operating system: $os"
            ;;
    esac

    case "$arch" in
        x86_64|amd64)
            ARCH="x86_64"
            ;;
        aarch64|arm64)
            ARCH="aarch64"
            ;;
        *)
            error "Unsupported architecture: $arch"
            ;;
    esac

    info "Detected platform: $OS-$ARCH"
}

# Get latest release version
get_latest_version() {
    if [ "$VERSION" = "latest" ]; then
        info "Fetching latest release version..."
        VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
        if [ -z "$VERSION" ]; then
            error "Failed to fetch latest version"
        fi
        info "Latest version: v$VERSION"
    fi
}

# Download and install
install_binary() {
    local target

    if [ "$OS" = "linux" ]; then
        # Try musl static binary first (most compatible)
        target="x86_64-unknown-linux-musl"
    elif [ "$OS" = "darwin" ]; then
        if [ "$ARCH" = "x86_64" ]; then
            target="x86_64-apple-darwin"
        elif [ "$ARCH" = "aarch64" ]; then
            target="aarch64-apple-darwin"
        fi
    fi

    local download_url="https://github.com/$REPO/releases/download/v$VERSION/learnp-$VERSION-$target.tar.gz"

    info "Downloading from: $download_url"

    local tmp_dir=$(mktemp -d)
    cd "$tmp_dir"

    if ! curl -fsSL "$download_url" -o learnp.tar.gz; then
        error "Failed to download binary. Check if release exists for your platform."
    fi

    info "Extracting archive..."
    tar xzf learnp.tar.gz

    # Create install directory if it doesn't exist
    mkdir -p "$INSTALL_DIR"

    info "Installing to $INSTALL_DIR/learnp..."
    mv learnp "$INSTALL_DIR/learnp"
    chmod +x "$INSTALL_DIR/learnp"

    # Cleanup
    cd - > /dev/null
    rm -rf "$tmp_dir"

    info "Installation complete!"
}

# Check if install dir is in PATH
check_path() {
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        warn "$INSTALL_DIR is not in your PATH"
        echo ""
        echo "Add this to your shell configuration file (~/.bashrc, ~/.zshrc, etc.):"
        echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
        echo ""
    else
        info "$INSTALL_DIR is already in your PATH"
    fi
}

# Main
main() {
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     Learn Programming TUI - Installation Script          ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    detect_platform
    get_latest_version
    install_binary
    check_path

    echo ""
    info "You can now run: learnp [course-directory]"
    echo ""
}

main "$@"
