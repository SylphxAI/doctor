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
			name: 'config/biome-config-dep',
			description: 'Check if @sylphx/biome-config is installed when biome.json extends it',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readJson } = await import('../utils/fs')
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

				const devDeps = ctx.packageJson?.devDependencies ?? {}
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
				const { fileExists, readFile } = await import('../utils/fs')
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

				const devDeps = ctx.packageJson?.devDependencies ?? {}
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
	]
)
