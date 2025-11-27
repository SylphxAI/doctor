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

pre-push:
  commands:
    doctor:
      run: bunx @sylphx/doctor check --pre-push
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
				const hasPrePush = content.includes('pre-push')
				const hasDoctor = content.includes('@sylphx/doctor') || content.includes('sylphx-doctor')

				// Must have both pre-commit and pre-push with doctor
				const isComplete = hasPreCommit && hasPrePush && hasDoctor

				// Collect ALL missing components (not just the first one)
				const missing: string[] = []
				if (!hasPreCommit) missing.push('pre-commit')
				if (!hasPrePush) missing.push('pre-push')
				if (!hasDoctor) missing.push('@sylphx/doctor')

				const message = isComplete
					? 'lefthook.yml configured with pre-commit + pre-push'
					: `lefthook.yml missing: ${missing.join(', ')}`

				return {
					passed: isComplete,
					message,
					hint: isComplete ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => {
						writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
					},
				}
			},
		},
	]
)
