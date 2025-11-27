# sylphx-doctor

## 1.21.1 (2025-11-27)

### 🐛 Bug Fixes

- restore reusable workflow ([034327f](https://github.com/SylphxAI/doctor/commit/034327ffe7410e2dbecfadc90f5b00eeac5e09f3))

## 1.21.0 (2025-11-27)

### ✨ Features

- add workflow_dispatch trigger for release ([0094752](https://github.com/SylphxAI/doctor/commit/0094752a98b3880dd443ea5161c2101116b2a1a4))
- add --stage flag to filter checks by hook (commit/push) ([b7c39f5](https://github.com/SylphxAI/doctor/commit/b7c39f5fbb6dd4a3a1bccfed7d7c2f7ad0c008c6))
- **release:** make prepublishOnly chainable with && ([67cce85](https://github.com/SylphxAI/doctor/commit/67cce85bb92fa782951489fc86cb297008e0c6e9))

### 🐛 Bug Fixes

- use bump action directly instead of reusable workflow ([1382d80](https://github.com/SylphxAI/doctor/commit/1382d801c7b45e6612c681607e7c31901a02caba))
- add permissions for release workflow ([1d50f0c](https://github.com/SylphxAI/doctor/commit/1d50f0cc774f740f4cf5e0f477ab104ebc05b62d))
- remove deprecated build-command input ([40407c3](https://github.com/SylphxAI/doctor/commit/40407c33714da5b0374ebdeb6ef00688ac663dee))

### ♻️ Refactoring

- modular hooks with commit/push/prepublish commands ([9a64451](https://github.com/SylphxAI/doctor/commit/9a64451d10ded816894a4320b54208585fb88f6f))

## 1.20.0 (2025-11-27)

### ✨ Features

- **monorepo:** split workspace protocol checks ([4cf76c5](https://github.com/SylphxAI/doctor/commit/4cf76c5db41f2cd3324a397e1e556ab1d48947f2))

### 🐛 Bug Fixes

- **monorepo:** clarify workspace protocol check description ([3fc5ef2](https://github.com/SylphxAI/doctor/commit/3fc5ef2b743651a593da2a20fdc752e0f7039c8c))

## 1.19.2 (2025-11-27)

### ♻️ Refactoring

- **checks:** remove cleanup module, distribute checks to categories ([6d85281](https://github.com/SylphxAI/doctor/commit/6d8528171d50540746a25033880631b04ee02d1d))

### ✅ Tests

- **presets:** add completeness check for checks ↔ presets sync ([7d74524](https://github.com/SylphxAI/doctor/commit/7d745246500f1eb9dc6c756d98f6969fc791de16))

## 1.19.1 (2025-11-27)

### 🐛 Bug Fixes

- **hooks:** add --no-errors-on-unmatched to biome commands ([81cc419](https://github.com/SylphxAI/doctor/commit/81cc419d85c5dfd594ab685df4322fd5c209cb77))
- **release:** allow release commits on bump/release branch ([f6e397e](https://github.com/SylphxAI/doctor/commit/f6e397ef6bf73308bf068e020af14c473e3fce2f))
- **release:** align release commit detection with @sylphx/bump ([9b7f45e](https://github.com/SylphxAI/doctor/commit/9b7f45e0a5870d33c8d1d9f442c067ce32c66b74))

## 1.19.0 (2025-11-27)

### ✨ Features

- **credits:** add credits check and CLI footer for @sylphx packages ([0ffdf8e](https://github.com/SylphxAI/doctor/commit/0ffdf8e971a37d018666173225dc9e2d4127dcc7))

### 🐛 Bug Fixes

- **release:** allow release commits on bump/release branch ([f6e397e](https://github.com/SylphxAI/doctor/commit/f6e397ef6bf73308bf068e020af14c473e3fce2f))
- **release:** align release commit detection with @sylphx/bump ([9b7f45e](https://github.com/SylphxAI/doctor/commit/9b7f45e0a5870d33c8d1d9f442c067ce32c66b74))

### ♻️ Refactoring

- **credits:** split into has-section and mentions-packages checks ([ab4743a](https://github.com/SylphxAI/doctor/commit/ab4743ae2350c4f0cfb815e8aa838a66ac75909c))

### 🔧 Chores

- **release:** @sylphx/doctor@1.18.0 (#44) ([28b4ba3](https://github.com/SylphxAI/doctor/commit/28b4ba3e12a5b4f880f5b6c23498f6bcd762576a))

## 1.18.0 (2025-11-27)

### ✨ Features

- **credits:** add credits check and CLI footer for @sylphx packages ([0ffdf8e](https://github.com/SylphxAI/doctor/commit/0ffdf8e971a37d018666173225dc9e2d4127dcc7))

### ♻️ Refactoring

- **credits:** split into has-section and mentions-packages checks ([ab4743a](https://github.com/SylphxAI/doctor/commit/ab4743ae2350c4f0cfb815e8aa838a66ac75909c))

## 1.17.0 (2025-11-27)

### ✨ Features

- **checks:** add hooks/doctor-dep and release/bump-dep checks ([8efb30d](https://github.com/SylphxAI/doctor/commit/8efb30da33f7e17b65e266585c2afc2704ff0a39))

## 1.16.1 (2025-11-27)

### ♻️ Refactoring

- **deps:** move shared config dep checks to config category ([6eb6e9f](https://github.com/SylphxAI/doctor/commit/6eb6e9f48b35a8633f9710f1256acc0b4b56760c))
- **deps:** move package manager check to runtime category ([638773e](https://github.com/SylphxAI/doctor/commit/638773e9914aad0a2d7331a2f2779bc8c68d0bc6))
- **deps:** split banned package checks by category ([805cdf8](https://github.com/SylphxAI/doctor/commit/805cdf870627fbdff24fbb686e0b4ee2f492dd48))

### 🔧 Chores

- trigger release ([51f5c57](https://github.com/SylphxAI/doctor/commit/51f5c57820df3a3968dad675f5044a8ef91b99af))

## 1.16.0 (2025-11-27)

### ✨ Features

- **deps:** add check for required devDependencies ([c60d4db](https://github.com/SylphxAI/doctor/commit/c60d4db7a041a3071adbfb347e80572058a9a6d9))

### ♻️ Refactoring

- **deps:** move tool dep checks to their functional categories ([3b4f0dc](https://github.com/SylphxAI/doctor/commit/3b4f0dcf7bfc2d55e0e6d947e9dd9b0d3ef5329b))

## 1.15.0 (2025-11-27)

### ✨ Features

- **hooks:** add check for lefthook installation ([3530576](https://github.com/SylphxAI/doctor/commit/35305761e0c6b99bd96007753c47840a87d820ee))

### 🔧 Chores

- **hooks:** add pre-push hook to lefthook.yml ([9d77ba1](https://github.com/SylphxAI/doctor/commit/9d77ba1182c50499e36bc659b1d6f8f6b6c8ad62))

## 1.14.10 (2025-11-27)

### 🐛 Bug Fixes

- **presets:** add new hooks check names to presets ([62fbb00](https://github.com/SylphxAI/doctor/commit/62fbb00af7ccc3e090e902f56e7f836a8a39dc14))

## 1.14.9 (2025-11-27)

### 🐛 Bug Fixes

- **checks:** report ALL issues at once in ci and build checks ([065246d](https://github.com/SylphxAI/doctor/commit/065246ddfb669fdc9553ea730bb7985bf2a10a86))

## 1.14.8 (2025-11-27)

### ♻️ Refactoring

- **hooks:** split lefthook check into granular checks ([5e4386b](https://github.com/SylphxAI/doctor/commit/5e4386baa6b51ff32674df5fb04e415cb5ec942c))

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
