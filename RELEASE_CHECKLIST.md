# Release Checklist

Follow this checklist when preparing a new release.

## Pre-Release

- [ ] **Update version number**
  - [ ] Update `version` in `Cargo.toml`
  - [ ] Update version in `PKGBUILD`
  - [ ] Update any hardcoded version references in docs

- [ ] **Update documentation**
  - [ ] Update `README.md` with new features
  - [ ] Update `CHANGELOG.md` (or let CI generate it)
  - [ ] Update `INSTALLATION.md` if installation process changed
  - [ ] Check all documentation links are valid

- [ ] **Code quality checks**
  - [ ] Run `cargo fmt` to format code
  - [ ] Run `cargo clippy -- -D warnings` to check for issues
  - [ ] Run `cargo test` to ensure all tests pass
  - [ ] Build release binary locally: `cargo build --release`
  - [ ] Test the release binary on your platform

- [ ] **Test across platforms (if possible)**
  - [ ] Test on Linux
  - [ ] Test on Windows
  - [ ] Test on macOS

- [ ] **Update Cargo.toml metadata**
  - [ ] Verify authors are correct
  - [ ] Verify repository URL is correct
  - [ ] Update homepage if needed
  - [ ] Check license is correct

- [ ] **Update package metadata**
  - [ ] Update WiX GUIDs if this is a major version change
  - [ ] Verify .deb package dependencies
  - [ ] Verify .rpm package dependencies

## Release Process

1. **Create and push tag**
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. **Monitor CI/CD pipeline**
   - [ ] Check GitHub Actions workflow starts
   - [ ] Monitor build jobs for all platforms
   - [ ] Verify no build failures

3. **Verify release artifacts**
   - [ ] Linux binary (musl)
   - [ ] Linux binary (gnu)
   - [ ] Debian package (.deb)
   - [ ] RPM package (.rpm)
   - [ ] AppImage
   - [ ] Windows binary (ZIP)
   - [ ] Windows installer (MSI)
   - [ ] macOS Intel binary
   - [ ] macOS ARM binary
   - [ ] macOS universal binary

4. **Test release artifacts**
   - [ ] Download and test at least 2-3 platform binaries
   - [ ] Test installation packages (.deb, .rpm, .msi)
   - [ ] Verify `learnp --version` shows correct version

## Post-Release

- [ ] **Update AUR package**
  - [ ] Update PKGBUILD version
  - [ ] Update sha256sums
  - [ ] Push to AUR repository
  - [ ] Test AUR installation

- [ ] **Announce release**
  - [ ] Create announcement in GitHub Discussions (if enabled)
  - [ ] Update project website (if any)
  - [ ] Post to relevant communities (Reddit, HN, etc.)
  - [ ] Tweet/social media announcement

- [ ] **Create Homebrew tap (if applicable)**
  - [ ] Create formula for Homebrew
  - [ ] Test Homebrew installation

- [ ] **Update download statistics tracking**
  - [ ] Note initial download counts for tracking

- [ ] **Monitor for issues**
  - [ ] Check GitHub Issues for installation problems
  - [ ] Monitor CI for any failed builds
  - [ ] Be ready to do a patch release if critical bugs found

## Release Types

### Patch Release (0.1.x)
- Bug fixes only
- No breaking changes
- Can be released quickly

### Minor Release (0.x.0)
- New features
- No breaking changes
- Follow full checklist

### Major Release (x.0.0)
- Breaking changes
- Requires migration guide
- Extended testing period
- Announce breaking changes clearly

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Emergency Hotfix Process

If a critical bug is found after release:

1. Create hotfix branch from release tag
2. Fix the bug
3. Increment patch version
4. Create new tag
5. Push tag to trigger CI/CD
6. Announce hotfix release
7. Merge hotfix back to main

## Rollback Procedure

If a release needs to be rolled back:

1. Mark the GitHub release as "pre-release" or delete it
2. Create a new patch release with the fix
3. Notify users about the issue
4. Update download links in documentation

## Notes

- Always test the installation process on a clean system if possible
- Keep release notes clear and user-focused
- Include migration guides for breaking changes
- Consider creating a release candidate (RC) for major versions
- Document known issues in release notes if any exist
