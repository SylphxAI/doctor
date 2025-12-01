# @sylphx/doctor

Project health checker for modern TypeScript/Rust monorepos.

## What is Doctor?

Doctor ensures your **project structure and configuration** is correct. It complements code-level tools like Biome.

| Tool | Level | Checks |
|------|-------|--------|
| **Biome** | Code | Formatting, linting rules, import sorting |
| **TypeScript** | Code | Type errors, strict mode |
| **Doctor** | Project | Config files, dependencies, scripts, CI/CD, release workflow |

### Doctor Checks

- **Config exists** - biome.json, tsconfig.json, turbo.json
- **Config correct** - extends shared configs, proper settings
- **Dependencies** - correct versions, no legacy tools
- **Scripts** - lint, build, test scripts use modern tools
- **Project structure** - README, LICENSE, exports field
- **CI/CD** - workflows exist, release process configured
- **Git hooks** - lefthook configured, pre-commit/pre-push

### Doctor Does NOT Check

- Code style (Biome)
- Type errors (TypeScript)
- Unused variables (Biome)
- Import order (Biome)

> **Philosophy**: Doctor checks that Biome is configured correctly. Biome checks your code.

## Supported Ecosystems

| Ecosystem | Status | Checks |
|-----------|--------|--------|
| TypeScript | ✅ Full | 60+ checks |
| Rust | 🚧 Planned | Coming soon |
| Go | ❌ Not planned | - |
| Python | ❌ Not planned | - |

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

## Presets

| Preset | Description | Use when |
|--------|-------------|----------|
| `init` | Minimal checks | New project, just started |
| `dev` | Balanced checks | Active development |
| `stable` | Strict checks | Production-ready |

## Configuration

Create `sylphx-doctor.config.ts`:

```ts
import { defineConfig } from '@sylphx/doctor'

export default defineConfig({
  preset: 'dev',

  // Override specific rules
  rules: {
    'docs/vitepress': 'off',
    'github/topics': 'warn',
    'test/coverage-threshold': 'error',
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

## All Checks

### Files
| Check | Description | Fixable |
|-------|-------------|---------|
| `files/readme` | README.md exists | ❌ |
| `files/license` | LICENSE exists | ✅ MIT |
| `files/gitignore` | .gitignore exists | ❌ |
| `files/changelog` | CHANGELOG.md exists | ❌ |
| `files/progress` | progress.md exists | ❌ |
| `files/biome-config` | biome.json exists | ❌ |
| `files/turbo-config` | turbo.json exists | ❌ |

### Package.json
| Check | Description | Fixable |
|-------|-------------|---------|
| `pkg/name` | Has name field | ❌ |
| `pkg/description` | Has description field | ❌ |
| `pkg/repository` | Has repository field | ❌ |
| `pkg/keywords` | Has keywords array | ❌ |
| `pkg/type-module` | Has "type": "module" | ✅ |
| `pkg/exports` | Has exports field | ❌ |
| `pkg/scripts-lint` | lint script uses biome | ✅ |
| `pkg/scripts-format` | format script uses biome | ✅ |
| `pkg/scripts-build` | build script uses bunup | ✅ |
| `pkg/scripts-test` | test script uses bun test | ✅ |
| `pkg/scripts-typecheck` | typecheck script uses tsc | ✅ |
| `pkg/scripts-bench` | bench script uses bun bench | ✅ |
| `pkg/scripts-coverage` | coverage script configured | ✅ |

### Config
| Check | Description | Fixable |
|-------|-------------|---------|
| `config/biome-extends` | biome.json extends @sylphx/biome-config | ✅ |
| `config/tsconfig-extends` | tsconfig extends @sylphx/tsconfig | ✅ |
| `config/biome-config-dep` | @sylphx/biome-config installed | ✅ |
| `config/tsconfig-dep` | @sylphx/tsconfig installed | ✅ |
| `config/no-tsconfig-build` | No tsconfig.build.json | ✅ |

### Build
| Check | Description | Fixable |
|-------|-------------|---------|
| `build/esm-only` | No CJS output (ESM only) | ✅ |
| `build/exports-valid` | exports properly configured | ❌ |
| `build/bunup-dep` | bunup installed | ✅ |
| `build/suggest-bunup` | Suggests bunup over legacy bundlers | ❌ |

### Format & Lint
| Check | Description | Fixable |
|-------|-------------|---------|
| `format/biome-check` | biome check passes | ❌ |
| `format/biome-format` | biome format passes | ❌ |
| `format/biome-dep` | @biomejs/biome installed | ✅ |
| `format/no-eslint` | No eslint dependency | ✅ |
| `format/eslint-config-orphan` | No orphan eslint config | ✅ |
| `format/prettier-config-orphan` | No orphan prettier config | ✅ |
| `format/typecheck` | tsc --noEmit passes | ❌ |

### Testing
| Check | Description | Fixable |
|-------|-------------|---------|
| `test/has-tests` | Test files exist | ❌ |
| `test/passes` | Tests pass | ❌ |
| `test/coverage-threshold` | Coverage meets threshold | ❌ |
| `test/no-legacy-frameworks` | No jest/vitest/mocha | ✅ |
| `test/no-jest-config` | No jest config files | ✅ |
| `bench/has-files` | Benchmark files exist | ❌ |

### Runtime
| Check | Description | Fixable |
|-------|-------------|---------|
| `runtime/bun-lock` | bun.lock exists | ❌ |
| `runtime/no-npm-lock` | No package-lock.json | ✅ |
| `runtime/no-yarn-lock` | No yarn.lock | ✅ |
| `runtime/no-pnpm-lock` | No pnpm-lock.yaml | ✅ |
| `runtime/no-ts-node` | No ts-node dependency | ✅ |
| `runtime/no-other-pkg-managers` | No npm/yarn/pnpm | ✅ |

### Release
| Check | Description | Fixable |
|-------|-------------|---------|
| `release/no-manual-version` | Don't manually edit version | ❌ |
| `release/no-release-commit` | No "release" in recent commits | ❌ |
| `release/no-direct-publish` | No npm publish in scripts | ❌ |
| `release/bump-dep` | bump installed | ✅ |
| `release/no-changesets` | No .changeset directory | ✅ |
| `release/no-changesets-dep` | No changesets dependency | ✅ |

### Hooks
| Check | Description | Fixable |
|-------|-------------|---------|
| `hooks/pre-commit` | Pre-commit hook exists | ❌ |
| `hooks/lefthook-pre-commit` | Lefthook pre-commit configured | ❌ |
| `hooks/lefthook-pre-push` | Lefthook pre-push configured | ❌ |
| `hooks/lefthook-doctor` | Doctor in lefthook config | ❌ |
| `hooks/lefthook-installed` | Lefthook hooks installed | ✅ |
| `hooks/lefthook-dep` | lefthook installed | ✅ |
| `hooks/no-husky` | No husky dependency | ✅ |
| `hooks/lefthook-prepare` | prepare script runs lefthook | ✅ |
| `hooks/doctor-dep` | @sylphx/doctor installed | ✅ |

### Monorepo
| Check | Description | Fixable |
|-------|-------------|---------|
| `monorepo/root-private` | Root has "private": true | ✅ |
| `monorepo/packages-readme` | All packages have README | ❌ |
| `monorepo/packages-license` | All packages have LICENSE | ❌ |
| `monorepo/workspace-protocol` | Uses workspace: protocol | ❌ |
| `monorepo/workspace-star` | Uses workspace:* (not ^) | ❌ |
| `monorepo/consistent-versions` | Consistent dep versions | ❌ |
| `monorepo/turbo-tasks` | Turbo has standard tasks | ❌ |
| `monorepo/turbo-dep` | turbo installed | ✅ |

### CI/CD
| Check | Description | Fixable |
|-------|-------------|---------|
| `ci/has-workflow` | CI workflow exists | ❌ |
| `ci/publish-workflow` | Publish workflow exists | ❌ |

### GitHub
| Check | Description | Fixable |
|-------|-------------|---------|
| `github/description` | Repo has description | ❌ |
| `github/website` | Repo has website URL | ❌ |
| `github/topics` | Repo has topics (≥3) | ❌ |

### Docs
| Check | Description | Fixable |
|-------|-------------|---------|
| `docs/vitepress` | VitePress docs exist | ❌ |
| `docs/vercel-config` | vercel.json for docs | ❌ |

### Dependencies
| Check | Description | Fixable |
|-------|-------------|---------|
| `deps/outdated` | No outdated dependencies | ❌ |
| `deps/security` | No security vulnerabilities | ❌ |

### Credits
| Check | Description | Fixable |
|-------|-------------|---------|
| `credits/has-section` | README has Sylphx credits | ❌ |
| `credits/mentions-packages` | Credits mention all @sylphx packages | ❌ |

## License

MIT
