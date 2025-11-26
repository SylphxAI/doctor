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
			description: 'Check if "lint" script uses biome or turbo',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson, fileExists } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.lint
				// For monorepo root with turbo: turbo lint is preferred
				// For monorepo root without turbo: biome check . is fine
				// For packages: biome check is expected
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				const hasTurbo = fileExists(join(ctx.cwd, 'turbo.json'))

				const validLint = isMonorepoRoot
					? hasTurbo
						? script?.includes('turbo')
						: script?.includes('biome')
					: script?.includes('biome')

				const defaultScript = isMonorepoRoot && hasTurbo ? 'turbo lint' : 'biome check .'

				if (!script) {
					return {
						passed: false,
						message: 'Missing "lint" script in package.json',
						hint: `Add "lint": "${defaultScript}" to package.json scripts`,
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.lint = defaultScript
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: validLint,
					message: validLint
						? `lint script: "${script}"`
						: `lint script uses "${script}" (expected "${defaultScript}")`,
					hint: validLint ? undefined : `Use "${defaultScript}"`,
				}
			},
		},

		{
			name: 'pkg/scripts-format',
			description: 'Check if "format" script uses biome',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.format
				const usesBiome = script?.includes('biome')

				if (!script) {
					return {
						passed: false,
						message: 'Missing "format" script in package.json',
						hint: 'Add "format": "biome format --write ." to package.json scripts',
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.format = 'biome format --write .'
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: usesBiome,
					message: usesBiome
						? `format script: "${script}"`
						: `format script uses "${script}" (expected biome)`,
					hint: usesBiome ? undefined : 'Use "biome format --write ."',
				}
			},
		},

		{
			name: 'pkg/scripts-build',
			description: 'Check if "build" script uses bunup or turbo',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson, fileExists } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.build
				// For monorepo root with turbo: turbo build is preferred
				// For packages: bunup, tsc, bun build
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				const hasTurbo = fileExists(join(ctx.cwd, 'turbo.json'))

				const validBuild = isMonorepoRoot
					? hasTurbo
						? script?.includes('turbo')
						: script?.includes('bunup') || script?.includes('tsc') || script?.includes('bun build')
					: script?.includes('bunup') || script?.includes('tsc') || script?.includes('bun build')

				const defaultScript = isMonorepoRoot && hasTurbo ? 'turbo build' : 'bunup'

				if (!script) {
					return {
						passed: false,
						message: 'Missing "build" script in package.json',
						hint: `Add "build": "${defaultScript}" to package.json scripts`,
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.build = defaultScript
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: validBuild,
					message: validBuild
						? `build script: "${script}"`
						: `build script uses "${script}" (expected "${defaultScript}")`,
					hint: validBuild ? undefined : `Use "${defaultScript}"`,
				}
			},
		},

		{
			name: 'pkg/scripts-test',
			description: 'Check if "test" script uses bun test or turbo',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson, fileExists } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.test
				// For monorepo root: turbo test is preferred (runs all packages)
				// For packages: bun test is expected
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				const hasTurbo = fileExists(join(ctx.cwd, 'turbo.json'))

				// Monorepo root with turbo should use turbo test
				// Monorepo root without turbo can use bun test
				// Individual packages should use bun test
				const validTest = isMonorepoRoot
					? hasTurbo
						? script?.includes('turbo')
						: script?.startsWith('bun test')
					: script?.startsWith('bun test')

				const defaultScript = isMonorepoRoot && hasTurbo ? 'turbo test' : 'bun test'

				if (!script) {
					return {
						passed: false,
						message: 'Missing "test" script in package.json',
						hint: `Add "test": "${defaultScript}" to package.json scripts`,
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.test = defaultScript
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: validTest,
					message: validTest
						? `test script: "${script}"`
						: `test script uses "${script}" (expected "${defaultScript}")`,
					hint: validTest ? undefined : `Use "${defaultScript}"`,
				}
			},
		},

		{
			name: 'pkg/scripts-bench',
			description: 'Check if "bench" script uses bun bench',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.bench
				const usesBunBench = script?.startsWith('bun bench')

				if (!script) {
					return {
						passed: false,
						message: 'Missing "bench" script in package.json',
						hint: 'Add "bench": "bun bench" to package.json scripts',
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.bench = 'bun bench'
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: usesBunBench,
					message: usesBunBench
						? `bench script: "${script}"`
						: `bench script uses "${script}" (expected "bun bench")`,
					hint: usesBunBench ? undefined : 'Use "bun bench"',
				}
			},
		},

		{
			name: 'pkg/scripts-coverage',
			description: 'Check if "test:coverage" script uses bun test --coverage',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.['test:coverage']
				// Must use "bun test --coverage" directly, NOT "bun run test --coverage"
				const usesBunTestCoverage = script?.includes('bun test') && script?.includes('--coverage')

				// For monorepo root, test:coverage is less common (turbo doesn't aggregate coverage well)
				// Skip this check for monorepo root
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				if (isMonorepoRoot) {
					return {
						passed: true,
						message: 'Skipped for monorepo root (coverage is per-package)',
						skipped: true,
					}
				}

				if (!script) {
					return {
						passed: false,
						message: 'Missing "test:coverage" script in package.json',
						hint: 'Add "test:coverage": "bun test --coverage" to package.json scripts',
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts['test:coverage'] = 'bun test --coverage'
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				return {
					passed: usesBunTestCoverage,
					message: usesBunTestCoverage
						? `test:coverage script: "${script}"`
						: `test:coverage script uses "${script}" (expected "bun test --coverage")`,
					hint: usesBunTestCoverage
						? undefined
						: 'Use "bun test --coverage" (not "bun run test --coverage")',
				}
			},
		},
	]
)

// Export for backward compatibility
export const packageChecks: Check[] = packageModule.checks
