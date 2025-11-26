import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const formatModule: CheckModule = defineCheckModule(
	{
		category: 'format',
		label: '✨ Format',
		description: 'Check code formatting and linting',
	},
	[
		{
			name: 'format/biome-check',
			description: 'Run biome check',
			fixable: true,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('bunx', ['biome', 'check', '.'], ctx.cwd)
				const passed = result.exitCode === 0

				return {
					passed,
					message: passed ? 'biome check passed' : 'biome check failed',
					hint: passed ? undefined : 'Run: bunx biome check --write . (or use --fix)',
					fix: async () => {
						await exec('bunx', ['biome', 'check', '--write', '.'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'format/biome-format',
			description: 'Run biome format',
			fixable: true,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('bunx', ['biome', 'format', '.'], ctx.cwd)
				const passed = result.exitCode === 0

				return {
					passed,
					message: passed ? 'biome format passed' : 'biome format failed - files need formatting',
					hint: passed ? undefined : 'Run: bunx biome format --write . (or use --fix)',
					fix: async () => {
						await exec('bunx', ['biome', 'format', '--write', '.'], ctx.cwd)
					},
				}
			},
		},
	]
)
