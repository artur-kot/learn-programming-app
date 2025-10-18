# Release Workflows

This document explains the different ways to create releases for this project.

## Release Types

### 1. Stable Release (Tag-based)
**Trigger:** Pushing a version tag
**Target:** Production users
**Naming:** `v*.*.*` (e.g., `v0.1.0`, `v1.2.3`)

#### How to Create:
```bash
# Update version in Cargo.toml first
git add Cargo.toml
git commit -m "bump version to 0.1.0"
git push

# Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

**What happens:**
- ✅ CI builds for all platforms (Linux, Windows, macOS)
- ✅ Creates packages (.deb, .rpm, .msi, AppImage)
- ✅ Publishes stable GitHub Release
- ✅ Auto-generates changelog
- ✅ Marks as pre-release if tag contains `alpha`, `beta`, or `rc`

---

### 2. Manual Release (GitHub UI)
**Trigger:** Manual workflow dispatch from GitHub
**Target:** Special releases, hotfixes
**Naming:** Any version (you specify)

#### How to Create:
1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Release** workflow
4. Click **Run workflow** dropdown
5. Fill in:
   - **Branch:** Select branch to release from
   - **Version:** Enter version (e.g., `0.1.1-hotfix`)
   - **Pre-release:** Check if it's a pre-release
6. Click **Run workflow**

**What happens:**
- ✅ Creates git tag automatically
- ✅ Builds for all platforms
- ✅ Creates packages
- ✅ Publishes GitHub Release with specified settings

**Use cases:**
- Emergency hotfix releases
- Special beta/RC releases
- Testing release process
- Releasing from non-main branches

---

### 3. Nightly Release (Automatic)
**Trigger:** Successful CI on main branch
**Target:** Early adopters, testers
**Naming:** `nightly` (fixed tag, updated daily)

#### How it Works:
- ⚡ **Automatic** - no manual action needed
- Runs after every successful CI pipeline on `main`
- Replaces previous nightly release
- Updates `nightly` tag

**What happens:**
- ✅ Builds binaries for Linux, Windows, macOS
- ✅ Creates pre-release marked as "Nightly Build"
- ✅ Includes recent commits from last 24 hours
- ✅ Adds warning about potential instability
- ⚠️ **Does NOT** create packages (.deb, .rpm, etc.) - only binaries

**Downloading nightly:**
```bash
# Always available at:
https://github.com/yourusername/learn-programming-app/releases/tag/nightly

# Install script automatically uses latest nightly:
curl -fsSL https://raw.githubusercontent.com/user/repo/main/install.sh | VERSION=nightly bash
```

---

## Workflow Comparison

| Feature | Stable Release | Manual Release | Nightly Release |
|---------|---------------|----------------|-----------------|
| **Trigger** | Push tag | Manual button | Auto on main CI |
| **Platforms** | All | All | All |
| **Packages** | Yes (.deb, .rpm, .msi) | Yes | No |
| **Binaries** | Yes | Yes | Yes |
| **Pre-release** | Auto-detect | User choice | Always |
| **Changelog** | Full history | Full history | Last 24h |
| **Frequency** | On-demand | On-demand | Daily (if changes) |

---

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Examples:
  0.1.0         - Initial release
  0.1.1         - Patch (bug fix)
  0.2.0         - Minor (new features)
  1.0.0         - Major (breaking changes)
  0.2.0-alpha.1 - Pre-release alpha
  0.2.0-beta.2  - Pre-release beta
  0.2.0-rc.1    - Release candidate
```

**Pre-release detection:**
- Tags containing `alpha`, `beta`, or `rc` are automatically marked as pre-releases
- Nightly builds are always pre-releases

---

## Release Artifacts

### Stable & Manual Releases

**Linux:**
- `learnp-{version}-x86_64-unknown-linux-gnu.tar.gz` - Standard binary
- `learnp-{version}-x86_64-unknown-linux-musl.tar.gz` - Static binary
- `learnp_{version}_amd64.deb` - Debian/Ubuntu package
- `learnp-{version}-1.x86_64.rpm` - Fedora/RHEL package

**Windows:**
- `learnp-{version}-x86_64-windows.zip` - Portable binary
- `learnp-{version}-x86_64.msi` - Windows installer

**macOS:**
- `learnp-{version}-x86_64-apple-darwin.tar.gz` - Intel binary
- `learnp-{version}-aarch64-apple-darwin.tar.gz` - Apple Silicon binary
- `learnp-{version}-universal-apple-darwin.tar.gz` - Universal binary

### Nightly Releases

**Linux:**
- `learnp-nightly-x86_64-unknown-linux-gnu.tar.gz`
- `learnp-nightly-x86_64-unknown-linux-musl.tar.gz`

**Windows:**
- `learnp-nightly-x86_64-windows.zip`

**macOS:**
- `learnp-nightly-x86_64-apple-darwin.tar.gz`
- `learnp-nightly-aarch64-apple-darwin.tar.gz`

---

## Disabling Nightly Releases

If you want to disable automatic nightly releases:

1. Go to repository Settings
2. Click **Actions** → **General**
3. Find the **Nightly Release** workflow
4. Click **Disable workflow**

Or delete `.github/workflows/nightly.yml`

---

## Rollback

If a release has critical issues:

### For stable/manual releases:
1. Mark the release as "pre-release" on GitHub
2. Create a hotfix with incremented patch version
3. Release the hotfix

### For nightly releases:
- Just wait for the next successful main branch push
- Or manually trigger a new build from Actions

---

## CI/CD Pipeline Flow

```
┌─────────────────────┐
│  Push to main       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CI Workflow        │
│  - Test             │
│  - Lint             │
│  - Build packages   │
│  - Security audit   │
└──────────┬──────────┘
           │
           ▼ (if success)
┌─────────────────────┐
│  Nightly Release    │
│  - Build binaries   │
│  - Create pre-release│
└─────────────────────┘


┌─────────────────────┐
│  Push tag v*.*.*    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Release Workflow   │
│  - Build all        │
│  - Create packages  │
│  - Publish release  │
└─────────────────────┘


┌─────────────────────┐
│  Manual trigger     │
│  (GitHub UI)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Release Workflow   │
│  - Create tag       │
│  - Build all        │
│  - Create packages  │
│  - Publish release  │
└─────────────────────┘
```

---

## Troubleshooting

### Manual release fails to create tag
**Error:** `Tag already exists`

**Solution:** Delete the tag first:
```bash
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
```

### Nightly release not triggering
**Check:**
1. CI workflow completed successfully
2. Changes were pushed to `main` branch
3. Workflow is not disabled
4. Check Actions tab for errors

### Release builds failing
**Common issues:**
- Cargo.toml version mismatch
- Missing LICENSE or README.md files
- Build errors (run `cargo build --release` locally)
- Permission issues (check GitHub token permissions)

---

## Best Practices

1. **Always update Cargo.toml version** before creating a stable release
2. **Test locally first**: `cargo build --release && cargo test`
3. **Use pre-releases** for beta testing before stable releases
4. **Write clear commit messages** - they appear in changelogs
5. **Monitor nightly builds** - they help catch issues early
6. **Document breaking changes** in release notes
7. **Update CHANGELOG.md** manually for major releases

---

## Examples

### Creating a patch release:
```bash
# Fix a bug
git add .
git commit -m "fix: resolve issue with file loading"
git push

# Update version
# Edit Cargo.toml: 0.1.0 -> 0.1.1
git add Cargo.toml
git commit -m "bump version to 0.1.1"
git push

# Create release
git tag -a v0.1.1 -m "Release v0.1.1 - Bug fixes"
git push origin v0.1.1
```

### Creating a pre-release:
```bash
# Edit Cargo.toml: 0.1.0 -> 0.2.0-beta.1
git add Cargo.toml
git commit -m "bump version to 0.2.0-beta.1"
git push

git tag -a v0.2.0-beta.1 -m "Release v0.2.0-beta.1 - New features (beta)"
git push origin v0.2.0-beta.1
```

### Emergency hotfix (manual):
1. Create hotfix branch: `git checkout -b hotfix/critical-fix`
2. Fix the issue and push
3. Go to GitHub Actions → Release → Run workflow
4. Select `hotfix/critical-fix` branch
5. Enter version: `0.1.2-hotfix`
6. Check "pre-release" if needed
7. Click Run

---

## See Also

- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - Pre-release checklist
- [CICD_PLAN.md](CICD_PLAN.md) - Detailed CI/CD documentation
- [INSTALLATION.md](INSTALLATION.md) - Installation instructions
