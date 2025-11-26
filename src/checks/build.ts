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
		{
			name: 'build/bunup-config',
			description: 'Check if build.config.ts exists for bunup',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				// Skip for monorepo root - turbo handles build orchestration
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				if (isMonorepoRoot) {
					return {
						passed: true,
						message: 'Skipped for monorepo root (turbo orchestrates builds)',
						skipped: true,
					}
				}

				const configPath = join(ctx.cwd, 'build.config.ts')
				const exists = fileExists(configPath)

				return {
					passed: exists,
					message: exists ? 'build.config.ts exists' : 'Missing build.config.ts for bunup',
					fix: async () => {
						const defaultConfig = `import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm'],
  clean: true,
})
`
						writeFileSync(configPath, defaultConfig, 'utf-8')
					},
				}
			},
		},

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
