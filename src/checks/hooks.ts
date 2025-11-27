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

		// Split into separate checks so users can granularly override
		// e.g., `rules: { 'hooks/lefthook-pre-push': 'off' }` to skip pre-push check
		{
			name: 'hooks/lefthook-pre-commit',
			description: 'Check if lefthook has pre-commit hook',
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
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasPreCommit = content.includes('pre-commit')

				return {
					passed: hasPreCommit,
					message: hasPreCommit
						? 'lefthook has pre-commit hook'
						: 'lefthook missing pre-commit hook',
					hint: hasPreCommit ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},

		{
			name: 'hooks/lefthook-pre-push',
			description: 'Check if lefthook has pre-push hook',
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
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasPrePush = content.includes('pre-push')

				return {
					passed: hasPrePush,
					message: hasPrePush ? 'lefthook has pre-push hook' : 'lefthook missing pre-push hook',
					hint: hasPrePush ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},

		{
			name: 'hooks/lefthook-doctor',
			description: 'Check if lefthook runs @sylphx/doctor',
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
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasDoctor = content.includes('@sylphx/doctor') || content.includes('sylphx-doctor')

				return {
					passed: hasDoctor,
					message: hasDoctor ? 'lefthook runs @sylphx/doctor' : 'lefthook missing @sylphx/doctor',
					hint: hasDoctor ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},
	]
)
