# sylphx-doctor

## 1.14.7 (2025-11-27)

### 🐛 Bug Fixes

- **hooks:** report ALL missing components at once ([2649cfd](https://github.com/SylphxAI/doctor/commit/2649cfdbd2bb784c57db0321452109619e53e62d))

## 1.14.6 (2025-11-27)

### 🐛 Bug Fixes

- **score:** info severity should not count against score ([9b0d38f](https://github.com/SylphxAI/doctor/commit/9b0d38f38373a07bf9af66440691909236903575))

## 1.14.5 (2025-11-26)

### 🐛 Bug Fixes

- **pkg:** typecheck must use turbo in monorepo root ([4bca2d6](https://github.com/SylphxAI/doctor/commit/4bca2d654632a7ccc0c8124052338e63444567a4))

## 1.14.4 (2025-11-26)

### 🐛 Bug Fixes

- **pkg:** typecheck script should always use tsc, not turbo ([cb783a3](https://github.com/SylphxAI/doctor/commit/cb783a3be93fcca2cb1386794dc8ff2119b10f2b))
- **pkg:** lint script should always use biome, not turbo ([4b52412](https://github.com/SylphxAI/doctor/commit/4b5241271d99f85a0420ebcc152d834008d3e0ca))

### 📚 Documentation

- **pkg:** add detailed comments explaining script choices ([6c9242d](https://github.com/SylphxAI/doctor/commit/6c9242de3544e3a9917493d3ead43112696beef6))
- **pkg:** clarify why turbo is needed for test/build in monorepos ([afa4676](https://github.com/SylphxAI/doctor/commit/afa4676b2c9e93d69282a1f6584a6f5c2f36581f))

## 1.14.3 (2025-11-26)

### 🐛 Bug Fixes

- **reporter:** handle multi-line hints in Quick Actions section ([8893a30](https://github.com/SylphxAI/doctor/commit/8893a30727fd9081dd5b2c8718e527eaf5365cc8))

## 1.14.2 (2025-11-26)

### 🐛 Bug Fixes

- use '.' instead of 'root' for monorepo root path ([68bbafc](https://github.com/SylphxAI/doctor/commit/68bbafc1388750adec2a48006269c07412afa1ba))

## 1.14.1 (2025-11-26)

### 🐛 Bug Fixes

- **reporter:** display hints with one package per line ([a4107fd](https://github.com/SylphxAI/doctor/commit/a4107fd3b939836878dde043a923688648d4deb4))
- **deps:** show which packages have banned dependencies in hint ([121dffb](https://github.com/SylphxAI/doctor/commit/121dffb66be5a5aa14c63973748b2254e459230b))

### ♻️ Refactoring

- consolidate formatting utilities and simplify check modules ([9bd676a](https://github.com/SylphxAI/doctor/commit/9bd676af1308c463a580366e94745c8212cdd86e))

## 1.14.0 (2025-11-26)

### ✨ Features

- **checks:** check all packages in monorepo with detailed error messages ([ee35584](https://github.com/SylphxAI/doctor/commit/ee355846de809c446971bb61e3e447326690f9ae))

## 1.13.2 (2025-11-26)

### 🐛 Bug Fixes

- **reporter:** only show error/warn hints in Quick Actions ([2c643e4](https://github.com/SylphxAI/doctor/commit/2c643e4143ea0e18d01eaf2734d73f05f8d55b4d))

## 1.13.1 (2025-11-26)

### 🐛 Bug Fixes

- **release:** add build-command to include dist/ in package ([742c447](https://github.com/SylphxAI/doctor/commit/742c447e734f76bb87c6838aaecd4619dd88063e))

## 1.13.0 (2025-11-26)

### ✨ Features

- **prepublish:** use local source for perfect solution ([1ac69ef](https://github.com/SylphxAI/doctor/commit/1ac69efc76a2adb7b5b3b404df4df484ed492b41))

## 1.12.2 (2025-11-26)

### 🐛 Bug Fixes

- **prepublish:** use inline CI check to bootstrap ([048fe73](https://github.com/SylphxAI/doctor/commit/048fe73360fd743990fafd5f6053682bc6969e50))

## 1.12.1 (2025-11-26)

### 🐛 Bug Fixes

- **release:** accept local CLI path for self-publishing ([a91d69a](https://github.com/SylphxAI/doctor/commit/a91d69ac24b862331cce232faa03ef8c3f53f85b))
- **prepublish:** use local CLI to avoid chicken-egg problem ([9160c52](https://github.com/SylphxAI/doctor/commit/9160c523b1b22559545db3092e1e7743a29528f5))

## 1.12.0 (2025-11-26)

### ✨ Features

- **deps:** check banned packages in all workspace packages ([8186c75](https://github.com/SylphxAI/doctor/commit/8186c75984f8e688419d55826007980b18c54e0f))

### ♻️ Refactoring

- **deps:** use getAllPackages helper for banned check ([74d34be](https://github.com/SylphxAI/doctor/commit/74d34beb3e331335c07f0eff81060786e02c354c))

## 1.11.0 (2025-11-26)

### ✨ Features

- **deps:** add banned packages check ([d8b7055](https://github.com/SylphxAI/doctor/commit/d8b70559bf791f2754daf208da2db492fc0f5d0d))

### 🐛 Bug Fixes

- **deps:** banned packages always error regardless of preset ([9ced8b5](https://github.com/SylphxAI/doctor/commit/9ced8b5f2d9162229a48f4de92b6449905c3eb94))

## 1.10.0 (2025-11-26)

### ✨ Features

- **release:** check version changes in all package.json files (monorepo support) ([de8dd70](https://github.com/SylphxAI/doctor/commit/de8dd7097a0e6516c4b68d4371fe48cc0028a269))
- **cli:** add prepublish command for centralized publish blocking ([d2e2c0e](https://github.com/SylphxAI/doctor/commit/d2e2c0e16e3e60e96c952d3d3459aff1076ee470))
- **release:** add prepublishOnly check and block direct npm publish ([927514c](https://github.com/SylphxAI/doctor/commit/927514ca49ffe4725c3fa082ae1fd87411e01523))
- **release:** add checks to enforce automated release workflow ([33ce7a5](https://github.com/SylphxAI/doctor/commit/33ce7a599ae75d28360166deafca6afa042c67ce))

### 🐛 Bug Fixes

- **package:** use isRoot variable correctly after refactoring ([61701ab](https://github.com/SylphxAI/doctor/commit/61701ab9ce78753333ee2bda8ceb7ef3f1919a0f))
- **hooks:** use correct package name @sylphx/doctor in lefthook ([45a127d](https://github.com/SylphxAI/doctor/commit/45a127dd7925ca532c41d2a1fcfc4343513be096))
- **release:** improve prepublishOnly error message with actionable steps ([6320043](https://github.com/SylphxAI/doctor/commit/63200438f10b3ebd389b6120b36a8d32cded0d89))

### ♻️ Refactoring

- extract common utilities (isCI, isMonorepoRoot) ([e5e03dd](https://github.com/SylphxAI/doctor/commit/e5e03ddfe54b0750b7c705ce325aa14339a32686))
- **release:** use async writeFile instead of sync ([c101e9c](https://github.com/SylphxAI/doctor/commit/c101e9c33ccb6cfd0608e57f220883c961d348f7))

## 1.9.0 (2025-11-26)

### ✨ Features

- **reporter:** show version number in report header ([ad9d8d7](https://github.com/SylphxAI/doctor/commit/ad9d8d78472817e9fa9c028b3ccd4a8c92b0c5ba))

## 1.8.0 (2025-11-26)

### ✨ Features

- **checks:** enforce standards and support workspace configs ([3ff20d3](https://github.com/SylphxAI/doctor/commit/3ff20d325a345f013cc6ae24592b65b9f4abc432))
- **files:** restore progress.md check with info severity ([c085077](https://github.com/SylphxAI/doctor/commit/c085077546a98702594a73df46ffad4ceee68235))

### 🐛 Bug Fixes

- **build:** check bunup config only when build script uses bunup ([64d662b](https://github.com/SylphxAI/doctor/commit/64d662b13aecd721c0d451b475aaa2bfde66e15d))
- **pkg:** accept bun run --filter for monorepo root scripts ([9201287](https://github.com/SylphxAI/doctor/commit/920128783ce9034111b88e9cdab3fe7835a2a222))

### ♻️ Refactoring

- **build:** remove bunup config check (works with defaults) ([d60de15](https://github.com/SylphxAI/doctor/commit/d60de156dac9b8f46bfbc5b85c4f1edccef0ff66))
- **checks:** simplify and improve check logic ([2f71605](https://github.com/SylphxAI/doctor/commit/2f7160577de4791973327e2e99f0b72ffeebdb45))
- **pkg:** monorepo always requires turbo (company standard) ([d2a4563](https://github.com/SylphxAI/doctor/commit/d2a4563435291efb16d16aee9867fe617bc2aba3))

## 1.7.1 (2025-11-26)

### 🐛 Bug Fixes

- **cli:** pre-push mode only shows hint, no checks ([f965d6e](https://github.com/SylphxAI/doctor/commit/f965d6e3400ae3dca416c61b1a7459240ee8dcf0))

## 1.7.0 (2025-11-26)

### ✨ Features

- **cli:** add --pre-push mode with release hint ([b583c53](https://github.com/SylphxAI/doctor/commit/b583c5309e7b373dd6fe885b2b51fe4432211936))

## 1.6.1 (2025-11-26)

### 🐛 Bug Fixes

- **pkg:** prefer turbo scripts for monorepo root with turbo.json ([713fce6](https://github.com/SylphxAI/doctor/commit/713fce6440921d6e74725a90d96eeb902b40f8fc))

## 1.6.0 (2025-11-26)

### ✨ Features

- **pkg:** validate script content, not just existence ([fdfb6fc](https://github.com/SylphxAI/doctor/commit/fdfb6fcaf65e4cac3da8502a30b89e84c2c484ca))
- **monorepo:** improve monorepo support with workspace discovery ([f99f188](https://github.com/SylphxAI/doctor/commit/f99f1885ce116b649021a025131e6efd6bf4363b))
- **checks:** add cleanup module to detect legacy/deprecated files ([03d6f63](https://github.com/SylphxAI/doctor/commit/03d6f635801037d7786c59447fe96e290ea0b69a))
- require shared reusable workflow for releases ([7c942b0](https://github.com/SylphxAI/doctor/commit/7c942b04024603402324d444abd6dcdb3a6de10d))
- add info severity and improved report with Quick Actions ([759ead9](https://github.com/SylphxAI/doctor/commit/759ead96a6abaf049f0412877474d4fcb7b778d1))
- add dependency checks for outdated packages and security ([627ebb8](https://github.com/SylphxAI/doctor/commit/627ebb8392b0e240b0afa0d8fb597f769500c2c3))
- add hints to check results showing how to fix issues ([a8c65b5](https://github.com/SylphxAI/doctor/commit/a8c65b58403eb29600dde12fd7ff7881e62a8cb5))

### 🐛 Bug Fixes

- use correct package name @sylphx/doctor and bin name doctor ([94d2e1c](https://github.com/SylphxAI/doctor/commit/94d2e1c417e10b6606efd6863bb135175e76aeea))
- **hooks:** use @sylphx/doctor package name instead of sylphx-doctor ([b992f90](https://github.com/SylphxAI/doctor/commit/b992f907ba6035e03ee1cbbd2980e115a9709bbf))
- **checks:** make CHANGELOG.md check info severity instead of warning ([25cfdf7](https://github.com/SylphxAI/doctor/commit/25cfdf7e23f7bd7ff36416457cd0fc19a66a4b9b))
- **ci:** remove redundant bun setup (bump action handles it) ([484c025](https://github.com/SylphxAI/doctor/commit/484c02589c9068afa0a57db8ca18ebf59df16d56))

### ⚡️ Performance

- **runner:** run all checks in parallel with Promise.all ([dd8e873](https://github.com/SylphxAI/doctor/commit/dd8e873252be75b21bb57d895e440c328c1df691))

### ♻️ Refactoring

- **checks:** migrate all check modules to modular architecture ([b2b0a68](https://github.com/SylphxAI/doctor/commit/b2b0a68fc06461e0edd816cc1712f1e126498063))
- **checks:** add modular check architecture ([e942eb8](https://github.com/SylphxAI/doctor/commit/e942eb8aabfcb45f5384a89022670be311287354))

### 📚 Documentation

- update README for @sylphx/doctor rename ([36fe2d5](https://github.com/SylphxAI/doctor/commit/36fe2d546c264200891be4f573669d8a7350f302))

### 🔧 Chores

- **release:** @sylphx/doctor@1.5.0 ([98fe357](https://github.com/SylphxAI/doctor/commit/98fe3578afc9264b18e41057060c7f856114feba))
- **release:** @sylphx/doctor@1.4.0 ([b761ff7](https://github.com/SylphxAI/doctor/commit/b761ff7d09283d912d31df8f64065a6c9b02ff13))
- **release:** @sylphx/doctor@1.3.0 ([d879157](https://github.com/SylphxAI/doctor/commit/d8791577e461cfd3c03a77afdd885012f3c2b443))
- **release:** @sylphx/doctor@1.2.2 (#8) ([0cc3b54](https://github.com/SylphxAI/doctor/commit/0cc3b543398d669219704e9814050e9cea84cf53))
- **release:** @sylphx/doctor@1.2.1 (#7) ([314313d](https://github.com/SylphxAI/doctor/commit/314313d74e2c291be952dccacef3b057f907d84d))
- **release:** @sylphx/doctor@1.2.0 (#6) ([b6e023c](https://github.com/SylphxAI/doctor/commit/b6e023c674dc367c03f3d3c57c9b94226d48f1c0))
- trigger release workflow ([a0a6504](https://github.com/SylphxAI/doctor/commit/a0a6504b33fb73cc9d1a5219eadb1c98f24ef357))
- **release:** @sylphx/doctor@1.1.0 (#5) ([d1508a6](https://github.com/SylphxAI/doctor/commit/d1508a698ab2c82b8994ec9ce1e86377a7c409d3))

## 1.5.0 (2025-11-26)

### ✨ Features

- **checks:** add cleanup module to detect legacy/deprecated files ([03d6f63](https://github.com/SylphxAI/doctor/commit/03d6f635801037d7786c59447fe96e290ea0b69a))

### ⚡️ Performance

- **runner:** run all checks in parallel with Promise.all ([dd8e873](https://github.com/SylphxAI/doctor/commit/dd8e873252be75b21bb57d895e440c328c1df691))

### 🔧 Chores

- **release:** @sylphx/doctor@1.4.0 ([b761ff7](https://github.com/SylphxAI/doctor/commit/b761ff7d09283d912d31df8f64065a6c9b02ff13))
- **release:** @sylphx/doctor@1.3.0 ([d879157](https://github.com/SylphxAI/doctor/commit/d8791577e461cfd3c03a77afdd885012f3c2b443))

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
