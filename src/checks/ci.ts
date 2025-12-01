import type { CheckModule } from './define'
import { createFileCheck, defineCheckModule } from './define'

const SHARED_WORKFLOW = 'SylphxAI/.github/.github/workflows/release.yml'

const defaultCiWorkflow = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run lint

      - name: Type check
        run: bun run typecheck

      - name: Test
        run: bun test

      - name: Build
        run: bun run build
`

const defaultRustCiWorkflow = `name: Rust CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Test
        run: cargo test --all-features

      - name: Build
        run: cargo build --release
`

const defaultReleaseWorkflow = `name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    uses: SylphxAI/.github/.github/workflows/release.yml@main
    secrets: inherit
`

export const ciModule: CheckModule = defineCheckModule(
	{
		category: 'ci',
		label: '🔄 CI/CD',
		description: 'Check CI/CD configuration',
	},
	[
		createFileCheck({
			name: 'ci/has-workflow',
			fileName: '.github/workflows/ci.yml',
			fixable: true,
			fixContent: defaultCiWorkflow,
			hint: 'Run with --fix to create CI workflow',
			missingMessage: 'Missing CI workflow (.github/workflows/ci.yml)',
			existsMessage: 'CI workflow exists',
		}),

		{
			name: 'ci/publish-workflow',
			description: 'Check if using shared release workflow',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { mkdirSync, writeFileSync } = await import('node:fs')
				const { fileExists, readFile } = await import('../utils/fs')

				const workflowDir = join(ctx.cwd, '.github', 'workflows')
				const releasePath = join(workflowDir, 'release.yml')
				const releaseYamlPath = join(workflowDir, 'release.yaml')

				const exists = fileExists(releasePath) || fileExists(releaseYamlPath)

				if (!exists) {
					return {
						passed: false,
						message: 'Missing release workflow (.github/workflows/release.yml)',
						hint: 'Run with --fix to create release workflow using shared workflow',
						fix: async () => {
							mkdirSync(workflowDir, { recursive: true })
							writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
						},
					}
				}

				const content = readFile(releasePath) || readFile(releaseYamlPath) || ''
				const usesSharedWorkflow = content.includes(SHARED_WORKFLOW)
				const usesSecretsInherit = content.includes('secrets: inherit')

				// Collect ALL issues (not just the first one)
				const missing: string[] = []
				if (!usesSharedWorkflow) missing.push('shared workflow')
				if (!usesSecretsInherit) missing.push('secrets: inherit')

				if (missing.length > 0) {
					return {
						passed: false,
						message: `Release workflow missing: ${missing.join(', ')}`,
						hint: !usesSharedWorkflow
							? `Use: uses: ${SHARED_WORKFLOW}@main`
							: 'Add: secrets: inherit',
						fix: async () => {
							writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
						},
					}
				}

				return {
					passed: true,
					message: 'Using shared release workflow with secrets: inherit',
				}
			},
		},

		{
			name: 'ci/rust-workflow',
			description: 'Check if Rust CI workflow exists (for Rust projects)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { mkdirSync, writeFileSync, readdirSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				// Only check if this is a Rust project
				const hasCargoToml = fileExists(join(ctx.cwd, 'Cargo.toml'))
				if (!hasCargoToml) {
					return {
						passed: true,
						message: 'Not a Rust project (skipped)',
						skipped: true,
					}
				}

				const workflowDir = join(ctx.cwd, '.github', 'workflows')

				// Check if any workflow file contains Rust CI steps
				if (fileExists(workflowDir)) {
					try {
						const files = readdirSync(workflowDir)
						for (const file of files) {
							if (file.endsWith('.yml') || file.endsWith('.yaml')) {
								const { readFile } = await import('../utils/fs')
								const content = readFile(join(workflowDir, file)) ?? ''
								// Check for common Rust CI indicators
								if (
									content.includes('cargo test') ||
									content.includes('cargo clippy') ||
									content.includes('rust-toolchain') ||
									content.includes('dtolnay/rust-toolchain')
								) {
									return {
										passed: true,
										message: `Rust CI workflow found in ${file}`,
									}
								}
							}
						}
					} catch {
						// Ignore errors
					}
				}

				const rustCiPath = join(workflowDir, 'rust.yml')

				return {
					passed: false,
					message: 'Missing Rust CI workflow',
					hint: 'Run with --fix to create Rust CI workflow',
					fix: async () => {
						mkdirSync(workflowDir, { recursive: true })
						writeFileSync(rustCiPath, defaultRustCiWorkflow, 'utf-8')
					},
				}
			},
		},
	]
)
