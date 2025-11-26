# Progress

## Current Status

✅ MVP Complete

## Completed

- [x] Project structure and configuration
- [x] CLI with check, init, upgrade commands
- [x] Preset system (init/dev/stable)
- [x] All check categories implemented:
  - Files (readme, license, progress, biome, turbo)
  - Config (biome extends, tsconfig extends, turbo pipeline)
  - Package.json (name, description, type, scripts, exports)
  - Testing (has-tests, passes, coverage, bench)
  - Formatting (biome check, biome format)
  - Build (bunup config, exports valid)
  - Runtime (bun lock, no npm/yarn lock)
  - Docs (vitepress, vercel config)
  - CI/CD (workflow, publish workflow)
  - Hooks (pre-commit, lefthook)
  - GitHub (description, website, topics)
- [x] Auto-fix functionality
- [x] Config file support (sylphx-doctor.config.ts)
- [x] Pre-commit mode

## In Progress

- [ ] Publish to npm

## Planned

- [ ] Add more detailed error messages
- [ ] Add --json output option
- [ ] Add scan command for multiple repos
- [ ] Create shared config packages (@sylphx/biome-config, @sylphx/tsconfig)
