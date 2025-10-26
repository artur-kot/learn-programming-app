#!/bin/bash
# Script to build macOS .pkg installer for learnp

set -e

# Check arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <version> <arch> <target>"
    echo "Example: $0 0.8.2 intel x86_64-apple-darwin"
    exit 1
fi

VERSION="$1"
ARCH="$2"
TARGET="$3"

BINARY_PATH="target/${TARGET}/release/learnp"
SCRIPTS_DIR="scripts/macos"
BUILD_DIR="target/macos-pkg-${ARCH}"
INSTALL_ROOT="${BUILD_DIR}/root"
INSTALL_DIR="${INSTALL_ROOT}/usr/local/bin"
PKG_OUTPUT="learnp-${VERSION}-${ARCH}.pkg"

echo "Building macOS .pkg installer..."
echo "Version: ${VERSION}"
echo "Architecture: ${ARCH}"
echo "Target: ${TARGET}"

# Verify binary exists
if [ ! -f "${BINARY_PATH}" ]; then
    echo "Error: Binary not found at ${BINARY_PATH}"
    exit 1
fi

# Create directory structure
mkdir -p "${INSTALL_DIR}"
mkdir -p "${BUILD_DIR}/scripts"

# Copy binary to install location
echo "Copying binary..."
cp "${BINARY_PATH}" "${INSTALL_DIR}/learnp"
chmod +x "${INSTALL_DIR}/learnp"

# Copy scripts
echo "Copying installation scripts..."
cp "${SCRIPTS_DIR}/postinstall" "${BUILD_DIR}/scripts/"
chmod +x "${BUILD_DIR}/scripts/postinstall"

# Build the package
echo "Building package..."
pkgbuild --root "${INSTALL_ROOT}" \
    --identifier "com.learnp.cli" \
    --version "${VERSION}" \
    --install-location "/" \
    --scripts "${BUILD_DIR}/scripts" \
    "${PKG_OUTPUT}"

echo "Package created: ${PKG_OUTPUT}"
echo "Size: $(du -h "${PKG_OUTPUT}" | cut -f1)"
echo "Done!"
