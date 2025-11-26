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
			description: 'Check if build.config.ts exists when using bunup',
			fixable: true,
			async check(ctx) {
				const { join, dirname } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const buildScript = ctx.packageJson?.scripts?.build ?? ''

				// Only check if build script uses bunup
				if (!buildScript.includes('bunup')) {
					return {
						passed: true,
						message: 'Build script does not use bunup (skipped)',
						skipped: true,
					}
				}

				const localConfig = join(ctx.cwd, 'build.config.ts')
				const localConfigJs = join(ctx.cwd, 'build.config.js')
				const bunupConfig = join(ctx.cwd, 'bunup.config.ts')
				const bunupConfigJs = join(ctx.cwd, 'bunup.config.js')

				// Check local config (build.config.ts or bunup.config.ts)
				const hasLocalConfig =
					fileExists(localConfig) ||
					fileExists(localConfigJs) ||
					fileExists(bunupConfig) ||
					fileExists(bunupConfigJs)

				if (hasLocalConfig) {
					return {
						passed: true,
						message: 'bunup config exists',
					}
				}

				// If in workspace, check root for config (workspace mode)
				if (ctx.workspaceRoot && ctx.workspaceRoot !== ctx.cwd) {
					const rootConfig = join(ctx.workspaceRoot, 'bunup.config.ts')
					const rootConfigJs = join(ctx.workspaceRoot, 'bunup.config.js')
					const rootBuildConfig = join(ctx.workspaceRoot, 'build.config.ts')

					if (fileExists(rootConfig) || fileExists(rootConfigJs) || fileExists(rootBuildConfig)) {
						return {
							passed: true,
							message: 'Using workspace root bunup config',
						}
					}
				}

				return {
					passed: false,
					message: 'Missing bunup config (build.config.ts or bunup.config.ts)',
					fix: async () => {
						const defaultConfig = `import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm'],
  clean: true,
})
`
						writeFileSync(bunupConfig, defaultConfig, 'utf-8')
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
