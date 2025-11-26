import type { Check } from '../types'
import type { CheckModule } from './define'
import { createJsonConfigCheck, defineCheckModule } from './define'

export const configModule: CheckModule = defineCheckModule(
	{
		category: 'config',
		label: '⚙️ Config',
		description: 'Check configuration files',
	},
	[
		createJsonConfigCheck({
			name: 'config/biome-extends',
			fileName: 'biome.json',
			validate: (config) => {
				const c = config as { extends?: string[] }
				if (!c?.extends || c.extends.length === 0) {
					return 'biome.json does not extend shared config'
				}
				return null
			},
			fix: (config) => ({
				$schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
				extends: ['@sylphx/biome-config'],
				...(config as object),
			}),
			hint: 'Add "extends": ["@sylphx/biome-config"] to biome.json',
			skipIfMissing: true,
		}),

		createJsonConfigCheck({
			name: 'config/tsconfig-extends',
			fileName: 'tsconfig.json',
			validate: (config) => {
				const c = config as { extends?: string }
				if (!c?.extends) {
					return 'tsconfig.json does not extend shared config'
				}
				return null
			},
			fix: (config) => ({
				extends: '@sylphx/tsconfig',
				...(config as object),
			}),
			hint: 'Add "extends": "@sylphx/tsconfig" to tsconfig.json',
			skipIfMissing: true,
		}),

		{
			name: 'config/turbo-pipeline',
			description: 'Check if turbo.json has standard pipeline',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readJson } = await import('../utils/fs')
				const { writeFileSync } = await import('node:fs')

				const configPath = join(ctx.cwd, 'turbo.json')

				if (!fileExists(configPath)) {
					if (!ctx.isMonorepo) {
						return { passed: true, message: 'No turbo.json', skipped: true }
					}
					return {
						passed: false,
						message: 'turbo.json does not exist',
						hint: 'Run: bunx turbo init',
					}
				}

				const config = readJson<{ tasks?: Record<string, unknown> }>(configPath)
				const requiredTasks = ['build', 'lint', 'test']
				const missingTasks = requiredTasks.filter((task) => !config?.tasks?.[task])

				if (missingTasks.length === 0) {
					return { passed: true, message: 'turbo.json has standard pipeline' }
				}

				return {
					passed: false,
					message: `turbo.json missing tasks: ${missingTasks.join(', ')}`,
					hint: `Add tasks to turbo.json: ${missingTasks.map((t) => `"${t}": {}`).join(', ')}`,
					fix: async () => {
						const currentConfig = readJson<Record<string, unknown>>(configPath) ?? {}
						currentConfig.$schema = 'https://turbo.build/schema.json'
						currentConfig.tasks = {
							build: { dependsOn: ['^build'], outputs: ['dist/**'] },
							lint: { dependsOn: ['^lint'] },
							test: { dependsOn: ['^build'] },
							typecheck: { dependsOn: ['^typecheck'] },
							...(currentConfig.tasks as Record<string, unknown>),
						}
						writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const configChecks: Check[] = configModule.checks
