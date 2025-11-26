import type { Check, CheckContext } from '../types'
import type { CheckModule, CheckReturnValue } from './define'
import { defineCheckModule } from './define'

/** Helper to skip a check for monorepo root (should be checked per-package) */
function skipForMonorepoRoot(
	ctx: CheckContext,
	message = 'Skipped for monorepo root'
): CheckReturnValue | null {
	if (ctx.isMonorepo && ctx.workspacePackages.length > 0) {
		return {
			passed: true,
			message,
			skipped: true,
		}
	}
	return null
}

export const packageModule: CheckModule = defineCheckModule(
	{
		category: 'pkg',
		label: '📦 Package',
		description: 'Check package.json configuration',
	},
	[
		{
			name: 'pkg/name',
			description: 'Check if package.json has name',
			fixable: false,
			async check(ctx) {
				const hasField = ctx.packageJson && 'name' in ctx.packageJson && ctx.packageJson.name
				return {
					passed: !!hasField,
					message: hasField ? 'package.json has "name"' : 'package.json missing "name"',
					hint: hasField ? undefined : 'Add "name" field to package.json',
				}
			},
		},

		{
			name: 'pkg/description',
			description: 'Check if package.json has description',
			fixable: false,
			async check(ctx) {
				const hasField =
					ctx.packageJson && 'description' in ctx.packageJson && ctx.packageJson.description
				return {
					passed: !!hasField,
					message: hasField
						? 'package.json has "description"'
						: 'package.json missing "description"',
					hint: hasField ? undefined : 'Add "description" field to package.json',
				}
			},
		},

		{
			name: 'pkg/repository',
			description: 'Check if package.json has repository field',
			fixable: false,
			async check(ctx) {
				const pkg = ctx.packageJson as Record<string, unknown> | null
				const hasRepo = !!(pkg?.repository || pkg?.repository)
				return {
					passed: hasRepo,
					message: hasRepo ? 'package.json has "repository"' : 'package.json missing "repository"',
					hint: hasRepo
						? undefined
						: 'Add "repository": { "type": "git", "url": "https://github.com/..." }',
				}
			},
		},

		{
			name: 'pkg/keywords',
			description: 'Check if package.json has keywords',
			fixable: false,
			async check(ctx) {
				// Skip for monorepo root - keywords are for published packages
				const skip = skipForMonorepoRoot(
					ctx,
					'Skipped for monorepo root (check workspace packages)'
				)
				if (skip) return skip

				const pkg = ctx.packageJson as Record<string, unknown> | null
				const keywords = pkg?.keywords as string[] | undefined
				const hasKeywords = !!(keywords && Array.isArray(keywords) && keywords.length > 0)
				return {
					passed: hasKeywords,
					message: hasKeywords
						? `package.json has ${keywords?.length} keywords`
						: 'package.json missing "keywords"',
					hint: hasKeywords
						? undefined
						: 'Add "keywords": ["keyword1", "keyword2"] for npm discoverability',
				}
			},
		},

		{
			name: 'pkg/type-module',
			description: 'Check if package.json has "type": "module"',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const pkg = ctx.packageJson
				const isModule = pkg?.type === 'module'

				return {
					passed: isModule,
					message: isModule
						? 'package.json has "type": "module"'
						: 'package.json missing "type": "module"',
					hint: isModule ? undefined : 'Add "type": "module" to package.json for ESM support',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.type = 'module'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/exports',
			description: 'Check if package.json has exports',
			fixable: false,
			async check(ctx) {
				// Skip for monorepo root - exports are per-package
				const skip = skipForMonorepoRoot(
					ctx,
					'Skipped for monorepo root (check workspace packages)'
				)
				if (skip) return skip

				const hasField = ctx.packageJson && 'exports' in ctx.packageJson && ctx.packageJson.exports
				return {
					passed: !!hasField,
					message: hasField ? 'package.json has "exports"' : 'package.json missing "exports"',
					hint: hasField ? undefined : 'Add "exports" field to package.json',
				}
			},
		},

		{
			name: 'pkg/scripts-lint',
			description: 'Check if "lint" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.lint
				return {
					passed: !!hasScript,
					message: hasScript ? 'Has "lint" script' : 'Missing "lint" script in package.json',
					hint: hasScript ? undefined : 'Add to package.json scripts: "lint": "biome check ."',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts.lint = 'biome check .'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/scripts-format',
			description: 'Check if "format" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.format
				return {
					passed: !!hasScript,
					message: hasScript ? 'Has "format" script' : 'Missing "format" script in package.json',
					hint: hasScript
						? undefined
						: 'Add to package.json scripts: "format": "biome format --write ."',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts.format = 'biome format --write .'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/scripts-build',
			description: 'Check if "build" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.build
				return {
					passed: !!hasScript,
					message: hasScript ? 'Has "build" script' : 'Missing "build" script in package.json',
					hint: hasScript ? undefined : 'Add to package.json scripts: "build": "bunup"',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts.build = 'bunup'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/scripts-test',
			description: 'Check if "test" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.test
				return {
					passed: !!hasScript,
					message: hasScript ? 'Has "test" script' : 'Missing "test" script in package.json',
					// Use "bun run test" instead of "bun test" so per-package bunfig.toml configs are respected
					hint: hasScript ? undefined : 'Add to package.json scripts: "test": "bun run test"',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts.test = 'bun run test'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/scripts-bench',
			description: 'Check if "bench" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.bench
				return {
					passed: !!hasScript,
					message: hasScript ? 'Has "bench" script' : 'Missing "bench" script in package.json',
					hint: hasScript ? undefined : 'Add to package.json scripts: "bench": "bun bench"',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts.bench = 'bun bench'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'pkg/scripts-coverage',
			description: 'Check if "test:coverage" script exists',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const hasScript = ctx.packageJson?.scripts?.['test:coverage']
				return {
					passed: !!hasScript,
					message: hasScript
						? 'Has "test:coverage" script'
						: 'Missing "test:coverage" script in package.json',
					// Use "bun run test" instead of "bun test" so per-package bunfig.toml configs are respected
					hint: hasScript
						? undefined
						: 'Add to package.json scripts: "test:coverage": "bun run test --coverage"',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}
						currentPkg.scripts = currentPkg.scripts ?? {}
						currentPkg.scripts['test:coverage'] = 'bun run test --coverage'
						writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const packageChecks: Check[] = packageModule.checks
