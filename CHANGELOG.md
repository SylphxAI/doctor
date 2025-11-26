# sylphx-doctor

## 1.1.0 (2025-11-26)

### ✨ Features

- add info severity and improved report with Quick Actions ([759ead9](https://github.com/SylphxAI/doctor/commit/759ead96a6abaf049f0412877474d4fcb7b778d1))
- add dependency checks for outdated packages and security ([627ebb8](https://github.com/SylphxAI/doctor/commit/627ebb8392b0e240b0afa0d8fb597f769500c2c3))
- add hints to check results showing how to fix issues ([a8c65b5](https://github.com/SylphxAI/doctor/commit/a8c65b58403eb29600dde12fd7ff7881e62a8cb5))

### 🐛 Bug Fixes

- **ci:** remove redundant bun setup (bump action handles it) ([484c025](https://github.com/SylphxAI/doctor/commit/484c02589c9068afa0a57db8ca18ebf59df16d56))

### 📚 Documentation

- update README for @sylphx/doctor rename ([36fe2d5](https://github.com/SylphxAI/doctor/commit/36fe2d546c264200891be4f573669d8a7350f302))

## 0.2.0

### Minor Changes

- c991395: Improve check structure and add missing checks

  New Features:

  - Auto-detect monorepo vs single-package repos
  - Hide skipped checks from output for cleaner reports
  - Smart turbo.json detection (validate if exists, only require for monorepos)

  New Checks:

  - `files/gitignore` - Check .gitignore exists (auto-fix supported)
  - `files/changelog` - Check CHANGELOG.md exists
  - `pkg/repository` - Check package.json has repository field
  - `pkg/keywords` - Check package.json has keywords

  Improvements:

  - Monorepo section hidden when not applicable
  - Refactored monorepo checks with helper functions
  - All checks now have access to `ctx.isMonorepo` for conditional logic

## 0.1.0

### Minor Changes

- 1f2ae7a: Initial release of sylphx-doctor CLI

  Features:

  - Progressive presets (init → dev → stable) for gradual adoption
  - 40+ checks across files, config, package.json, testing, formatting, build, CI/CD, git hooks, and GitHub
  - Auto-fix support for most issues
  - Pre-commit hook integration via lefthook
  - Automatic upgrade suggestions when ready for next preset level
  - Full automation via `sylphx-doctor init`

  Commands:

  - `sylphx-doctor check` - Check project against standards
  - `sylphx-doctor check --fix` - Auto-fix fixable issues
  - `sylphx-doctor init` - Initialize sylphx-doctor in a project
  - `sylphx-doctor upgrade` - Preview upgrade to next preset level
