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

		// Note: turbo-pipeline check removed - use monorepo/turbo-tasks instead
	]
)

// Export for backward compatibility
export const configChecks: Check[] = configModule.checks
