import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

const defaultLefthookConfig = `# Managed by @sylphx/doctor
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
      run: bunx @sylphx/doctor check --pre-commit
`

export const hooksModule: CheckModule = defineCheckModule(
	{
		category: 'hooks',
		label: '🪝 Hooks',
		description: 'Check Git hooks configuration',
	},
	[
		{
			name: 'hooks/pre-commit',
			description: 'Check if pre-commit hook is configured',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

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
					passed: hasPreCommit,
					message: hasPreCommit
						? `Pre-commit hook configured (${hasLefthook ? 'lefthook' : hasHusky ? 'husky' : 'simple-git-hooks'})`
						: 'No pre-commit hook configured',
					fix: async () => {
						// Default to lefthook
						writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
					},
				}
			},
		},

		{
			name: 'hooks/lefthook-config',
			description: 'Check if lefthook.yml exists and is properly configured',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')

				const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				if (!exists) {
					return {
						passed: false,
						message: 'Missing lefthook.yml',
						fix: async () => {
							writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
						},
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasPreCommit = content.includes('pre-commit')
				const hasDoctor = content.includes('@sylphx/doctor') || content.includes('sylphx-doctor')

				return {
					passed: hasPreCommit,
					message: hasPreCommit
						? hasDoctor
							? 'lefthook.yml configured with @sylphx/doctor'
							: 'lefthook.yml configured (consider adding @sylphx/doctor)'
						: 'lefthook.yml missing pre-commit hook',
					fix: async () => {
						writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const hooksChecks: Check[] = hooksModule.checks
