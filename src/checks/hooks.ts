import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { fileExists, readFile } from '../utils/fs'

export const preCommitCheck: Check = {
	name: 'hooks/pre-commit',
	category: 'hooks',
	description: 'Check if pre-commit hook is configured',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		// Check for lefthook
		const lefthookPath = join(ctx.cwd, 'lefthook.yml')
		const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
		const hasLefthook = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

		// Check for husky
		const huskyDir = join(ctx.cwd, '.husky')
		const hasHusky = fileExists(join(huskyDir, 'pre-commit'))

		// Check for simple-git-hooks in package.json
		const pkg = ctx.packageJson
		const hasSimpleGitHooks = !!pkg?.['simple-git-hooks']

		const hasPreCommit = hasLefthook || hasHusky || hasSimpleGitHooks

		return {
			name: 'hooks/pre-commit',
			category: 'hooks',
			passed: hasPreCommit,
			message: hasPreCommit
				? `Pre-commit hook configured (${hasLefthook ? 'lefthook' : hasHusky ? 'husky' : 'simple-git-hooks'})`
				: 'No pre-commit hook configured',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				// Default to lefthook
				writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
			},
		}
	},
}

export const lefthookConfigCheck: Check = {
	name: 'hooks/lefthook-config',
	category: 'hooks',
	description: 'Check if lefthook.yml exists and is properly configured',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const lefthookPath = join(ctx.cwd, 'lefthook.yml')
		const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')

		const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

		if (!exists) {
			return {
				name: 'hooks/lefthook-config',
				category: 'hooks',
				passed: false,
				message: 'Missing lefthook.yml',
				severity: ctx.severity,
				fixable: true,
				fix: async () => {
					writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
				},
			}
		}

		const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
		const hasPreCommit = content.includes('pre-commit')
		const hasDoctor = content.includes('sylphx-doctor')

		return {
			name: 'hooks/lefthook-config',
			category: 'hooks',
			passed: hasPreCommit,
			message: hasPreCommit
				? hasDoctor
					? 'lefthook.yml configured with sylphx-doctor'
					: 'lefthook.yml configured (consider adding sylphx-doctor)'
				: 'lefthook.yml missing pre-commit hook',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
			},
		}
	},
}

const defaultLefthookConfig = `# Managed by sylphx-doctor
# https://github.com/evilmartians/lefthook

pre-commit:
  parallel: true
  commands:
    format:
      glob: "*.{js,ts,jsx,tsx,json,md}"
      run: bunx biome format --write {staged_files}
      stage_fixed: true

    lint:
      glob: "*.{js,ts,jsx,tsx}"
      run: bunx biome check {staged_files}

    doctor:
      run: bunx sylphx-doctor check --pre-commit
`

export const hooksChecks: Check[] = [preCommitCheck, lefthookConfigCheck]
