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

				if (!usesSharedWorkflow) {
					return {
						passed: false,
						message: 'Release workflow not using shared reusable workflow',
						hint: `Use: uses: ${SHARED_WORKFLOW}@main`,
						fix: async () => {
							writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
						},
					}
				}

				if (!usesSecretsInherit) {
					return {
						passed: false,
						message: 'Release workflow missing secrets: inherit',
						hint: 'Add: secrets: inherit',
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
	]
)
