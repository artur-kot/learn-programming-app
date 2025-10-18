# GitHub Workflows Summary

## Overview

Your project now has 3 automated workflows:

## 1. CI (Continuous Integration)
**File:** `.github/workflows/ci.yml`
**Triggers:** Every pull request and push to main

### Jobs:
- ✅ **Test** - Runs tests on Linux, Windows, macOS
- ✅ **Lint** - Checks code formatting and clippy warnings
- ✅ **Build Packages** - Verifies Debian package builds
- ✅ **Security Audit** - Scans for security vulnerabilities

**Purpose:** Ensure code quality before merging

---

## 2. Release (Production Releases)
**File:** `.github/workflows/release.yml`

### Triggers:

#### A. Tag-based (Automatic)
```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

#### B. Manual (GitHub UI)
1. Go to **Actions** tab
2. Select **Release** workflow
3. Click **Run workflow**
4. Enter version and options
5. Click **Run workflow** button

### What It Builds:
- ✅ Linux binaries (gnu + musl)
- ✅ Debian package (.deb)
- ✅ RPM package (.rpm)
- ✅ Windows binary + MSI installer
- ✅ macOS binaries (Intel + ARM + Universal)

**Purpose:** Create production-ready releases with all packages

---

## 3. Nightly Release (Automatic Pre-releases)
**File:** `.github/workflows/nightly.yml`
**Triggers:** Automatically after successful CI on main branch

### What It Builds:
- ✅ Linux binaries (gnu + musl)
- ✅ Windows binary
- ✅ macOS binaries (Intel + ARM)

### What It Does:
1. Waits for CI to succeed on main
2. Deletes previous `nightly` release
3. Creates new `nightly` tag
4. Builds binaries for all platforms
5. Publishes as pre-release

**Purpose:** Provide bleeding-edge builds for testers

---

## Quick Start

### To create a stable release:
```bash
# Update version in Cargo.toml
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### To manually trigger a release:
- GitHub → Actions → Release → Run workflow

### To get nightly builds:
- Just push to main - automatic after CI succeeds
- Or download from: `releases/tag/nightly`

---

## Important Notes

### Manual Release Features:
- ✅ Can release from any branch
- ✅ Automatically creates git tag
- ✅ Choose version number
- ✅ Mark as pre-release or stable
- ✅ Useful for hotfixes and testing

### Nightly Release Features:
- ⚡ Zero manual work required
- 🔄 Updates daily (if changes exist)
- ⚠️ Always marked as pre-release
- 📦 Only binaries (no packages)
- 🗑️ Replaces previous nightly

### Version Detection:
- **Tag releases:** Extracts from `v*.*.*` tag
- **Manual releases:** Uses input version
- **Nightly releases:** Uses Cargo.toml + date + commit

---

## Permissions

All workflows have `contents: write` permission to:
- Create releases
- Create/update tags
- Upload assets

---

## Workflow Files Location

```
.github/workflows/
├── ci.yml       # Run on PR/main push
├── release.yml  # Run on tag or manual trigger
└── nightly.yml  # Run after successful CI on main
```

---

## Testing the Workflows

### Test CI:
```bash
git checkout -b test-ci
# Make changes
git push origin test-ci
# Open PR to main
```

### Test Release:
```bash
# Use manual trigger from GitHub UI
# Set version to 0.0.1-test
# Mark as pre-release
```

### Test Nightly:
```bash
# Just push to main
git push origin main
# Wait for CI to finish
# Nightly will start automatically
```

---

## Monitoring

### Check workflow status:
1. GitHub repository → **Actions** tab
2. See all workflow runs
3. Click on any run to see logs
4. Each job shows detailed output

### Check releases:
1. GitHub repository → **Releases**
2. See all published releases
3. Download artifacts
4. View changelogs

---

## Troubleshooting

### CI failing?
- Check test failures
- Check formatting: `cargo fmt --all -- --check`
- Check lints: `cargo clippy --all-targets --all-features -- -D warnings`
- Check security: `cargo audit`

### Release failing?
- Check if tag already exists
- Verify Cargo.toml version
- Check LICENSE and README.md exist
- Check build succeeds locally: `cargo build --release`

### Nightly not triggering?
- Verify CI succeeded
- Check workflow is enabled
- Check Actions tab for errors
- Verify you pushed to `main` branch

---

## Disabling Workflows

### Disable nightly releases:
1. Settings → Actions → General
2. Find "Nightly Release" workflow
3. Click disable

### Disable manual releases:
- Remove `workflow_dispatch:` from release.yml

---

## Next Steps

1. ✅ Workflows are configured and ready
2. ✅ Test with a manual release first
3. ✅ Push to main to test nightly
4. ✅ Create your first stable release with a tag

For detailed information, see:
- [RELEASES.md](RELEASES.md) - Complete release guide
- [CICD_PLAN.md](CICD_PLAN.md) - CI/CD architecture
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - Pre-release checklist
