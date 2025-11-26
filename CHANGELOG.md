# sylphx-doctor

## 1.4.0 (2025-11-26)

### ✨ Features

- **checks:** add cleanup module to detect legacy/deprecated files ([03d6f63](https://github.com/SylphxAI/doctor/commit/03d6f635801037d7786c59447fe96e290ea0b69a))

### ⚡️ Performance

- **runner:** run all checks in parallel with Promise.all ([dd8e873](https://github.com/SylphxAI/doctor/commit/dd8e873252be75b21bb57d895e440c328c1df691))

### 🔧 Chores

- **release:** @sylphx/doctor@1.3.0 ([d879157](https://github.com/SylphxAI/doctor/commit/d8791577e461cfd3c03a77afdd885012f3c2b443))

## 1.3.0 (2025-11-26)

### ✨ Features

- **checks:** add cleanup module to detect legacy/deprecated files ([03d6f63](https://github.com/SylphxAI/doctor/commit/03d6f635801037d7786c59447fe96e290ea0b69a))

### ⚡️ Performance

- **runner:** run all checks in parallel with Promise.all ([dd8e873](https://github.com/SylphxAI/doctor/commit/dd8e873252be75b21bb57d895e440c328c1df691))

## 1.2.2 (2025-11-26)

### 🐛 Bug Fixes

- use correct package name @sylphx/doctor and bin name doctor ([94d2e1c](https://github.com/SylphxAI/doctor/commit/94d2e1c417e10b6606efd6863bb135175e76aeea))
- **hooks:** use @sylphx/doctor package name instead of sylphx-doctor ([b992f90](https://github.com/SylphxAI/doctor/commit/b992f907ba6035e03ee1cbbd2980e115a9709bbf))

## 1.2.1 (2025-11-26)

### 🐛 Bug Fixes

- **checks:** make CHANGELOG.md check info severity instead of warning ([25cfdf7](https://github.com/SylphxAI/doctor/commit/25cfdf7e23f7bd7ff36416457cd0fc19a66a4b9b))

## 1.2.0 (2025-11-26)

### ✨ Features

- require shared reusable workflow for releases ([7c942b0](https://github.com/SylphxAI/doctor/commit/7c942b04024603402324d444abd6dcdb3a6de10d))

### ♻️ Refactoring

- **checks:** migrate all check modules to modular architecture ([b2b0a68](https://github.com/SylphxAI/doctor/commit/b2b0a68fc06461e0edd816cc1712f1e126498063))
- **checks:** add modular check architecture ([e942eb8](https://github.com/SylphxAI/doctor/commit/e942eb8aabfcb45f5384a89022670be311287354))

### 🔧 Chores

- trigger release workflow ([a0a6504](https://github.com/SylphxAI/doctor/commit/a0a6504b33fb73cc9d1a5219eadb1c98f24ef357))

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
