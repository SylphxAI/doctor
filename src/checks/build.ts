import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const buildModule: CheckModule = defineCheckModule(
	{
		category: 'build',
		label: '🔨 Build',
		description: 'Check build configuration',
	},
	[
		// Note: bunup config check removed - bunup works fine with defaults

		{
			name: 'build/exports-valid',
			description: 'Check if package.json exports are properly configured',
			fixable: false,
			async check(ctx) {
				const pkg = ctx.packageJson
				const exports = pkg?.exports

				if (!exports) {
					return {
						passed: false,
						message: 'package.json missing exports field',
					}
				}

				// Check if exports has proper structure
				const mainExport =
					typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

				if (!mainExport) {
					return {
						passed: false,
						message: 'package.json exports missing "." entry',
					}
				}

				const exportObj = mainExport as Record<string, unknown>
				const hasTypes = 'types' in exportObj
				const hasImport = 'import' in exportObj

				if (!hasTypes || !hasImport) {
					return {
						passed: false,
						message: `package.json exports["."] missing ${!hasTypes ? 'types' : 'import'}`,
					}
				}

				return {
					passed: true,
					message: 'package.json exports properly configured',
				}
			},
		},
	]
)

// Export for backward compatibility
export const buildChecks: Check[] = buildModule.checks
