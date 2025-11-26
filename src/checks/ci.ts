import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { directoryExists, fileExists, readFile } from '../utils/fs'

export const hasWorkflowCheck: Check = {
	name: 'ci/has-workflow',
	category: 'ci',
	description: 'Check if CI workflow exists',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const workflowDir = join(ctx.cwd, '.github', 'workflows')
		const hasDir = await directoryExists(workflowDir)

		if (!hasDir) {
			return {
				name: 'ci/has-workflow',
				category: 'ci',
				passed: false,
				message: 'No .github/workflows directory',
				severity: ctx.severity,
				fixable: true,
				fix: async () => {
					const ciPath = join(workflowDir, 'ci.yml')
					mkdirSync(dirname(ciPath), { recursive: true })
					writeFileSync(ciPath, defaultCiWorkflow, 'utf-8')
				},
			}
		}

		const ciPath = join(workflowDir, 'ci.yml')
		const ciYamlPath = join(workflowDir, 'ci.yaml')
		const exists = fileExists(ciPath) || fileExists(ciYamlPath)

		return {
			name: 'ci/has-workflow',
			category: 'ci',
			passed: exists,
			message: exists ? 'CI workflow exists' : 'Missing CI workflow (.github/workflows/ci.yml)',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				mkdirSync(workflowDir, { recursive: true })
				writeFileSync(ciPath, defaultCiWorkflow, 'utf-8')
			},
		}
	},
}

const SHARED_WORKFLOW = 'SylphxAI/.github/.github/workflows/release.yml'

export const publishWorkflowCheck: Check = {
	name: 'ci/publish-workflow',
	category: 'ci',
	description: 'Check if using shared release workflow',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const workflowDir = join(ctx.cwd, '.github', 'workflows')
		const releasePath = join(workflowDir, 'release.yml')
		const releaseYamlPath = join(workflowDir, 'release.yaml')

		const exists = fileExists(releasePath) || fileExists(releaseYamlPath)

		if (!exists) {
			return {
				name: 'ci/publish-workflow',
				category: 'ci',
				passed: false,
				message: 'Missing release workflow (.github/workflows/release.yml)',
				severity: ctx.severity,
				fixable: true,
				hint: 'Run with --fix to create release workflow using shared workflow',
				fix: async () => {
					mkdirSync(workflowDir, { recursive: true })
					writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
				},
			}
		}

		// Check if it uses the shared reusable workflow
		const content = readFile(releasePath) || readFile(releaseYamlPath) || ''
		const usesSharedWorkflow = content.includes(SHARED_WORKFLOW)
		const usesSecretsInherit = content.includes('secrets: inherit')

		if (!usesSharedWorkflow) {
			return {
				name: 'ci/publish-workflow',
				category: 'ci',
				passed: false,
				message: 'Release workflow not using shared reusable workflow',
				severity: ctx.severity,
				fixable: true,
				hint: `Use: uses: ${SHARED_WORKFLOW}@main`,
				fix: async () => {
					writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
				},
			}
		}

		if (!usesSecretsInherit) {
			return {
				name: 'ci/publish-workflow',
				category: 'ci',
				passed: false,
				message: 'Release workflow missing secrets: inherit',
				severity: ctx.severity,
				fixable: true,
				hint: 'Add: secrets: inherit',
				fix: async () => {
					writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
				},
			}
		}

		return {
			name: 'ci/publish-workflow',
			category: 'ci',
			passed: true,
			message: 'Using shared release workflow with secrets: inherit',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

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

export const ciChecks: Check[] = [hasWorkflowCheck, publishWorkflowCheck]
