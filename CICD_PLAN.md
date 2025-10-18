# CI/CD Release Plan

This document outlines the comprehensive CI/CD strategy for automating releases across multiple platforms.

## Overview

The release pipeline automatically builds and publishes binaries, installers, and packages for all major operating systems when a version tag is pushed.

## Supported Platforms

### ✅ Windows
- **Standalone Binary** (`.exe` in ZIP)
- **MSI Installer** (via cargo-wix)
- Architecture: x86_64

### ✅ macOS
- **Intel Binary** (x86_64)
- **Apple Silicon Binary** (ARM64/aarch64)
- **Universal Binary** (Intel + ARM combined)
- Format: tar.gz

### ✅ Linux - Debian/Ubuntu
- **`.deb` Package** (via cargo-deb)
- Architecture: amd64
- Includes proper dependencies and metadata

### ✅ Linux - Fedora/RHEL
- **`.rpm` Package** (via cargo-generate-rpm)
- Architecture: x86_64
- Compatible with Fedora, RHEL, CentOS, AlmaLinux

### ✅ Linux - Arch Linux
- **AUR Package** (PKGBUILD provided)
- Architecture: x86_64
- Community-maintained via AUR

### ✅ Linux - Generic (Fallback)
- **Static Binary** (musl-libc for compatibility)
- **AppImage** (portable, runs anywhere)
- **Standard Binary** (glibc-based)
- Format: tar.gz

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:** Pull requests, pushes to main

**Jobs:**
- **Test**: Runs tests on Linux, Windows, macOS
- **Lint**: Checks code formatting and clippy warnings
- **Build Packages**: Tests package builds (Debian)
- **Security Audit**: Runs cargo-audit for vulnerabilities

**Purpose:** Ensure code quality before merging

### 2. Release Workflow (`release.yml`)

**Triggers:** Git tags matching `v*.*.*` (e.g., `v0.1.0`)

**Jobs:**

1. **create-release**
   - Extracts version from tag
   - Generates changelog from git commits
   - Creates GitHub Release (draft for pre-releases)

2. **build-linux**
   - Builds for `x86_64-unknown-linux-gnu`
   - Builds static binary for `x86_64-unknown-linux-musl`
   - Strips and compresses binaries
   - Uploads tar.gz archives

3. **build-deb**
   - Builds Debian package
   - Includes dependencies and metadata
   - Uploads `.deb` file

4. **build-rpm**
   - Builds RPM package
   - Uploads `.rpm` file

5. **build-appimage**
   - Creates AppImage bundle
   - Includes desktop integration
   - Uploads AppImage file

6. **build-windows**
   - Builds Windows binary
   - Creates ZIP archive
   - Uploads ZIP file

7. **build-windows-installer**
   - Creates MSI installer
   - Uploads MSI file

8. **build-macos**
   - Builds for Intel (x86_64)
   - Builds for Apple Silicon (aarch64)
   - Uploads separate tar.gz for each

9. **build-macos-universal**
   - Combines Intel + ARM binaries
   - Uses `lipo` to create universal binary
   - Uploads universal tar.gz

## Release Process

### Automated Steps

1. **Developer pushes tag:**
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. **GitHub Actions triggers:**
   - Creates release
   - Builds all platform binaries in parallel
   - Generates installers/packages
   - Uploads all artifacts to release

3. **Release published:**
   - All binaries available for download
   - Changelog auto-generated
   - Pre-release flag set if tag contains `alpha`, `beta`, or `rc`

### Manual Steps

After automated release completes:

1. **Update AUR package** (Arch Linux)
   - Update PKGBUILD version
   - Update checksums
   - Push to AUR

2. **Verify downloads** (spot-check 2-3 platforms)

3. **Announce release** (optional)

## File Structure

```
.github/workflows/
├── ci.yml          # Continuous Integration (PRs and main)
└── release.yml     # Release automation (tags)

PKGBUILD            # Arch Linux AUR package definition
install.sh          # Universal installation script
INSTALLATION.md     # User installation guide
RELEASE_CHECKLIST.md # Release process checklist
Cargo.toml          # Package metadata for cargo-deb/rpm/wix
```

## Configuration Files

### Cargo.toml Metadata

```toml
[package.metadata.deb]
# Debian package configuration

[package.metadata.generate-rpm]
# RPM package configuration

[package.metadata.wix]
# Windows MSI installer configuration
```

### PKGBUILD (Arch Linux)

Defines how to build the package from binary release.

### install.sh

Shell script that:
- Detects OS and architecture
- Downloads appropriate binary
- Installs to user directory
- Checks PATH configuration

## Installation Methods

### 1. Quick Install Script
```bash
curl -fsSL https://raw.githubusercontent.com/user/repo/main/install.sh | bash
```

### 2. Package Managers
- **Debian/Ubuntu**: `sudo dpkg -i learnp.deb`
- **Fedora/RHEL**: `sudo rpm -i learnp.rpm`
- **Arch**: `yay -S learnp-bin`

### 3. Direct Binary Download
Download from GitHub Releases page

### 4. AppImage (Linux fallback)
Portable, runs on any Linux distribution

## Platform-Specific Notes

### Windows
- MSI installer requires WiX Toolset (installed in CI)
- Binary is statically linked with MSVC runtime
- PATH is automatically updated by MSI installer

### macOS
- Universal binary recommended for M1/M2 Macs
- Binaries are code-signed in CI (if certificates provided)
- No DMG created (future enhancement)

### Linux
- Musl binary provides maximum compatibility
- Deb/RPM include automatic dependency resolution
- AppImage requires FUSE on some systems

## Version Management

Follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (0.1.0 → 0.2.0)
- **PATCH**: Bug fixes (0.1.0 → 0.1.1)

Pre-release tags:
- `v0.1.0-alpha.1` - Alpha release
- `v0.1.0-beta.1` - Beta release
- `v0.1.0-rc.1` - Release candidate

## Caching Strategy

All workflows use cargo caching to speed up builds:
- Cargo registry
- Cargo git index
- Target directory

Cache keys based on `Cargo.lock` hash.

## Security

- **Audit**: `cargo audit` runs on every PR
- **Dependencies**: Only vetted crates used
- **Signing**: Binaries can be signed (macOS, Windows)
- **Checksums**: SHA256 provided for all releases

## Future Enhancements

- [ ] Homebrew tap for macOS
- [ ] Chocolatey package for Windows
- [ ] Snap package for Linux
- [ ] Flatpak package for Linux
- [ ] Auto-update mechanism
- [ ] Code signing for Windows/macOS
- [ ] Notarization for macOS binaries
- [ ] Docker images
- [ ] Nix package

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs
2. Test build locally: `cargo build --release`
3. Verify Cargo.toml metadata is correct

### Package Creation Fails

- **Deb**: Ensure `cargo-deb` dependencies are installed
- **RPM**: Verify `cargo-generate-rpm` configuration
- **MSI**: Check WiX GUIDs are valid

### Release Not Created

- Verify tag format: `v*.*.*`
- Check GitHub Actions permissions
- Ensure `GITHUB_TOKEN` has write access

## Testing Releases

Before tagging:

```bash
# Test Debian package locally
cargo install cargo-deb
cargo deb

# Test RPM package locally
cargo install cargo-generate-rpm
cargo build --release
cargo generate-rpm

# Test Windows installer locally (Windows only)
cargo install cargo-wix
cargo wix
```

## Metrics

Track these metrics post-release:
- Download counts per platform
- Installation success rate
- Bug reports by platform
- Build time per platform

## Support

For issues with the CI/CD pipeline:
1. Check workflow logs in GitHub Actions
2. Review this document
3. Check `RELEASE_CHECKLIST.md`
4. Open issue in repository
