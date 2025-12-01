import type { CheckContext } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Check if this project is a biome-config source
 */
function isBiomeConfigSource(ctx: CheckContext): boolean {
	// Check if any workspace package is biome-config
	for (const pkg of ctx.workspacePackages) {
		if (pkg.name.includes('biome-config')) return true
	}
	// Check root package name
	if (ctx.packageJson?.name?.includes('biome-config')) return true
	return false
}

/**
 * Check if this project is a tsconfig source
 */
function isTsconfigSource(ctx: CheckContext): boolean {
	// Check if any workspace package is tsconfig
	for (const pkg of ctx.workspacePackages) {
		if (pkg.name.includes('tsconfig')) return true
	}
	// Check root package name
	if (ctx.packageJson?.name?.includes('tsconfig')) return true
	return false
}

export const configModule: CheckModule = defineCheckModule(
	{
		category: 'config',
		label: '⚙️ Config',
		description: 'Check configuration files',
	},
	[
		{
			name: 'config/biome-extends',
			description: 'Check if biome.json extends shared config',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readJson } = await import('../utils/fs')

				const biomePath = join(ctx.cwd, 'biome.json')
				if (!fileExists(biomePath)) {
					return { passed: true, message: 'No biome.json (skipped)', skipped: true }
				}

				// Skip if this IS the biome-config source
				if (isBiomeConfigSource(ctx)) {
					return {
						passed: true,
						message: 'This is the biome-config source (skipped)',
						skipped: true,
					}
				}

				const config = readJson<{ extends?: string[] }>(biomePath)
				if (config?.extends && config.extends.length > 0) {
					return { passed: true, message: 'biome.json extends shared config' }
				}

				return {
					passed: false,
					message: 'biome.json does not extend shared config',
					hint: 'Add "extends": ["@sylphx/biome-config"] to biome.json',
					fix: async () => {
						const newConfig = {
							$schema: 'https://biomejs.dev/schemas/2.0.0/schema.json',
							extends: ['@sylphx/biome-config'],
							...(config as object),
						}
						writeFileSync(biomePath, `${JSON.stringify(newConfig, null, '\t')}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'config/tsconfig-extends',
			description: 'Check if tsconfig.json extends shared config',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readJson } = await import('../utils/fs')

				const tsconfigPath = join(ctx.cwd, 'tsconfig.json')
				if (!fileExists(tsconfigPath)) {
					return { passed: true, message: 'No tsconfig.json (skipped)', skipped: true }
				}

				// Skip if this IS the tsconfig source
				if (isTsconfigSource(ctx)) {
					return {
						passed: true,
						message: 'This is the tsconfig source (skipped)',
						skipped: true,
					}
				}

				const config = readJson<{ extends?: string }>(tsconfigPath)
				if (config?.extends) {
					return { passed: true, message: 'tsconfig.json extends shared config' }
				}

				return {
					passed: false,
					message: 'tsconfig.json does not extend shared config',
					hint: 'Add "extends": "@sylphx/tsconfig" to tsconfig.json',
					fix: async () => {
						const newConfig = {
							extends: '@sylphx/tsconfig',
							...(config as object),
						}
						writeFileSync(tsconfigPath, `${JSON.stringify(newConfig, null, '\t')}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'config/biome-config-dep',
			description: 'Check if @sylphx/biome-config is installed when biome.json extends it',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readJson, readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const biomePath = join(ctx.cwd, 'biome.json')
				if (!fileExists(biomePath)) {
					return { passed: true, message: 'No biome.json (skipped)', skipped: true }
				}

				const biomeConfig = readJson<{ extends?: string[] }>(biomePath)
				if (!biomeConfig?.extends?.includes('@sylphx/biome-config')) {
					return {
						passed: true,
						message: 'biome.json does not extend @sylphx/biome-config (skipped)',
						skipped: true,
					}
				}

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasPackage = '@sylphx/biome-config' in devDeps

				return {
					passed: hasPackage,
					message: hasPackage
						? '@sylphx/biome-config in devDependencies'
						: '@sylphx/biome-config missing from devDependencies',
					hint: hasPackage ? undefined : 'Run: bun add -D @sylphx/biome-config',
					fix: async () => {
						await exec('bun', ['add', '-D', '@sylphx/biome-config'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'config/tsconfig-dep',
			description: 'Check if @sylphx/tsconfig is installed when tsconfig.json extends it',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readFile, readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const tsconfigPath = join(ctx.cwd, 'tsconfig.json')
				if (!fileExists(tsconfigPath)) {
					return { passed: true, message: 'No tsconfig.json (skipped)', skipped: true }
				}

				const content = readFile(tsconfigPath) || ''
				if (!content.includes('@sylphx/tsconfig')) {
					return {
						passed: true,
						message: 'tsconfig.json does not extend @sylphx/tsconfig (skipped)',
						skipped: true,
					}
				}

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasPackage = '@sylphx/tsconfig' in devDeps

				return {
					passed: hasPackage,
					message: hasPackage
						? '@sylphx/tsconfig in devDependencies'
						: '@sylphx/tsconfig missing from devDependencies',
					hint: hasPackage ? undefined : 'Run: bun add -D @sylphx/tsconfig',
					fix: async () => {
						await exec('bun', ['add', '-D', '@sylphx/tsconfig'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'config/no-tsconfig-build',
			description: 'Check for unnecessary tsconfig.build.json (bunup handles this)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const buildConfig = join(ctx.cwd, 'tsconfig.build.json')
				const exists = fileExists(buildConfig)

				return {
					passed: !exists,
					message: exists
						? 'Found tsconfig.build.json - bunup handles build config'
						: 'No tsconfig.build.json (good)',
					hint: exists
						? 'Remove tsconfig.build.json - bunup handles TypeScript compilation'
						: undefined,
					fix: async () => {
						unlinkSync(buildConfig)
					},
				}
			},
		},
	]
)
