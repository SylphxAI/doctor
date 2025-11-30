# @sylphx/doctor

CLI tool to check and enforce project standards across SylphxAI repositories.

## Installation

```bash
bun add -D @sylphx/doctor
```

Or run directly:

```bash
bunx @sylphx/doctor check
```

## Usage

### Check project

```bash
# Check with default preset (dev)
doctor check

# Check with specific preset
doctor check --preset=init
doctor check --preset=stable

# Auto-fix fixable issues
doctor check --fix

# Pre-commit mode (only errors, no warnings)
doctor check --pre-commit
```

### Initialize config

```bash
# Create config file with init preset
doctor init

# Create config and auto-fix
doctor init --fix

# Start with specific preset
doctor init --preset=dev
```

### Check upgrade readiness

```bash
# Preview upgrade to next preset level
doctor upgrade

# Preview upgrade to specific preset
doctor upgrade --target=stable
```

> **💡 Auto-suggestion**: When all checks pass, doctor automatically checks if you're ready for the next preset level and shows a suggestion like:
> ```
> 🎉 Ready to upgrade to dev preset!
>    Run: doctor upgrade or update your config manually
> ```

## Presets

| Preset | Description | Use when |
|--------|-------------|----------|
| `init` | Minimal checks | New project, just started |
| `dev` | Balanced checks | Active development |
| `stable` | Strict checks | Production-ready |

## Configuration

Create `sylphx-doctor.config.ts` in your project root:

```ts
import { defineConfig } from '@sylphx/doctor'

export default defineConfig({
  preset: 'dev',

  // Override specific rules
  rules: {
    'docs/vitepress': 'off',      // Disable a check
    'github/topics': 'warn',       // Downgrade to warning
    'test/coverage-threshold': 'error', // Upgrade to error
  },

  // Configure rule options
  options: {
    'test/coverage-threshold': { min: 60 },
    'github/topics': { min: 5 },
  },
})
```

## Pre-commit Hook

Add to `lefthook.yml`:

```yaml
pre-commit:
  parallel: true
  commands:
    doctor:
      run: bunx @sylphx/doctor check --pre-commit
```

## Checks

### Files
- `files/readme` - README.md exists
- `files/license` - LICENSE exists (auto-fix: MIT)
- `files/progress` - progress.md exists
- `files/biome-config` - biome.json exists
- `files/turbo-config` - turbo.json exists

### Config
- `config/biome-extends` - biome.json extends shared config
- `config/tsconfig-extends` - tsconfig.json extends shared config
- `config/turbo-pipeline` - turbo.json has standard pipeline

### Package.json
- `pkg/name` - has name field
- `pkg/description` - has description field
- `pkg/type-module` - has "type": "module"
- `pkg/scripts-lint` - has lint script
- `pkg/scripts-format` - has format script
- `pkg/scripts-build` - has build script
- `pkg/scripts-test` - has test script
- `pkg/scripts-bench` - has bench script
- `pkg/scripts-coverage` - has test:coverage script
- `pkg/exports` - has exports field

### Testing
- `test/has-tests` - test files exist
- `test/passes` - tests pass
- `test/coverage-threshold` - coverage meets threshold (default: 80%)
- `bench/has-files` - benchmark files exist if bench script defined

### Formatting
- `format/biome-check` - biome check passes
- `format/biome-format` - biome format passes

### Build
- `build/esm-only` - no CJS output (ESM only, auto-fix removes require conditions)
- `build/exports-valid` - package.json exports properly configured

### Runtime
- `runtime/bun-lock` - bun.lockb exists
- `runtime/no-npm-lock` - no package-lock.json
- `runtime/no-yarn-lock` - no yarn.lock

### Documentation
- `docs/vitepress` - VitePress docs exist
- `docs/vercel-config` - vercel.json exists for docs

### CI/CD
- `ci/has-workflow` - CI workflow exists
- `ci/publish-workflow` - using shared publish workflow

### Git Hooks
- `hooks/pre-commit` - pre-commit hook configured
- `hooks/lefthook-config` - lefthook.yml exists

### GitHub
- `github/description` - repo has description
- `github/website` - repo has website URL
- `github/topics` - repo has topics (default: ≥3)

## License

MIT
