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

export const publishWorkflowCheck: Check = {
	name: 'ci/publish-workflow',
	category: 'ci',
	description: 'Check if using shared publish workflow',
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
				message: 'Missing release workflow',
				severity: ctx.severity,
				fixable: true,
				fix: async () => {
					mkdirSync(workflowDir, { recursive: true })
					writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
				},
			}
		}

		// Check if it uses the shared workflow (simplified check)
		const content = readFile(releasePath) || readFile(releaseYamlPath) || ''
		const usesShared =
			content.includes('SylphxAI/') || content.includes('changesets') || content.includes('bunup')

		return {
			name: 'ci/publish-workflow',
			category: 'ci',
			passed: usesShared,
			message: usesShared
				? 'Using proper release workflow'
				: 'Release workflow may not be using shared workflow',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				writeFileSync(releasePath, defaultReleaseWorkflow, 'utf-8')
			},
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

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: bunx changeset publish
          version: bunx changeset version
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
`

export const ciChecks: Check[] = [hasWorkflowCheck, publishWorkflowCheck]
