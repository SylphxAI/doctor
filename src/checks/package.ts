import type { CheckContext, WorkspacePackage } from '../types'
import { isMonorepoRoot, isTypeScriptPackage, needsBuildScripts } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/** Get public TypeScript packages only (non-private, has package.json) */
function getPublicPackages(ctx: CheckContext): WorkspacePackage[] {
	return ctx.workspacePackages.filter(
		(pkg) => isTypeScriptPackage(pkg) && !pkg.packageJson?.private
	)
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
				const hasRepo = !!ctx.packageJson?.repository
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
				// For monorepo root, check all public workspace packages
				if (isMonorepoRoot(ctx)) {
					const publicPackages = getPublicPackages(ctx)
					if (publicPackages.length === 0) {
						return {
							passed: true,
							message: 'No public packages to check',
							skipped: true,
						}
					}

					const issues: PackageIssue[] = []
					for (const pkg of publicPackages) {
						const keywords = pkg.packageJson?.keywords as string[] | undefined
						const hasKeywords = !!(keywords && Array.isArray(keywords) && keywords.length > 0)
						if (!hasKeywords) {
							issues.push({ location: pkg.relativePath, issue: 'missing keywords' })
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${publicPackages.length} public package(s) have keywords`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing keywords`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package - check root
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
				const { getAllPackages } = await import('../utils/context')

				// For monorepo, check all TypeScript packages including root
				if (isMonorepoRoot(ctx)) {
					const allPackages = getAllPackages(ctx).filter(isTypeScriptPackage)
					if (allPackages.length === 0) {
						return {
							passed: true,
							message: 'No TypeScript packages to check',
							skipped: true,
						}
					}

					const issues: PackageIssue[] = []

					for (const pkg of allPackages) {
						if (pkg.packageJson?.type !== 'module') {
							issues.push({ location: pkg.relativePath, issue: 'missing type: module' })
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${allPackages.length} package(s) have "type": "module"`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing "type": "module"`,
						hint: formatPackageIssues(issues),
						fix: async () => {
							for (const pkg of allPackages) {
								if (pkg.packageJson?.type !== 'module') {
									const pkgPath = join(pkg.path, 'package.json')
									const currentPkg = readPackageJson(pkg.path) ?? {}
									currentPkg.type = 'module'
									writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
								}
							}
						},
					}
				}

				// Single package - check root
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
				// For monorepo root, check all public workspace packages
				if (isMonorepoRoot(ctx)) {
					const publicPackages = getPublicPackages(ctx)
					if (publicPackages.length === 0) {
						return {
							passed: true,
							message: 'No public packages to check',
							skipped: true,
						}
					}

					const issues: PackageIssue[] = []
					for (const pkg of publicPackages) {
						const hasExports =
							pkg.packageJson && 'exports' in pkg.packageJson && pkg.packageJson.exports
						if (!hasExports) {
							issues.push({ location: pkg.relativePath, issue: 'missing exports' })
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${publicPackages.length} public package(s) have exports`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing exports`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package - check root
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
			description: 'Check if "lint" script uses biome',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				const script = ctx.packageJson?.scripts?.lint
				// Always use biome directly (even in monorepo root)
				// - Biome is extremely fast (Rust), no caching needed
				// - Runs from root and checks all files recursively
				// - Simpler than turbo, same result
				const defaultScript = 'biome check .'

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

				const usesBiome = script.includes('biome')

				return {
					passed: usesBiome,
					message: usesBiome
						? `lint script: "${script}"`
						: `lint script should use biome (found "${script}")`,
					hint: usesBiome ? undefined : `Use "${defaultScript}"`,
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
				// Always use biome directly (even in monorepo root)
				// - Biome is extremely fast (Rust), no caching needed
				// - Runs from root and formats all files recursively
				const defaultScript = 'biome format --write .'

				if (!script) {
					return {
						passed: false,
						message: 'Missing "format" script in package.json',
						hint: `Add "format": "${defaultScript}" to package.json scripts`,
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.format = defaultScript
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				const usesBiome = script.includes('biome')

				return {
					passed: usesBiome,
					message: usesBiome
						? `format script: "${script}"`
						: `format script should use biome (found "${script}")`,
					hint: usesBiome ? undefined : `Use "${defaultScript}"`,
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
				const { readPackageJson } = await import('../utils/fs')

				// Skip for config-only projects (no build needed)
				if (!needsBuildScripts(ctx)) {
					return {
						passed: true,
						message: 'Config-only project (no build needed)',
						skipped: true,
					}
				}

				const script = ctx.packageJson?.scripts?.build
				// Monorepo root: use turbo for orchestration + caching
				// - Build is slow, caching provides real benefit
				// - Each package has its own build config
				// Packages: bunup (or tsc, bun build)
				const isRoot = isMonorepoRoot(ctx)
				const defaultScript = isRoot ? 'turbo build' : 'bunup'

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

				const validBuild = isRoot
					? script.includes('turbo')
					: script.includes('bunup') || script.includes('tsc') || script.includes('bun build')

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
				const { readPackageJson } = await import('../utils/fs')

				// Skip for config-only projects (no tests needed)
				if (!needsBuildScripts(ctx)) {
					return {
						passed: true,
						message: 'Config-only project (no tests needed)',
						skipped: true,
					}
				}

				const script = ctx.packageJson?.scripts?.test
				// Monorepo root: MUST use turbo (not just for caching)
				// - Each package needs its own tsconfig context (e.g., JSX settings)
				// - `bun test` from root ignores per-package tsconfig
				// - `turbo test` runs `bun test` in each package directory
				// Packages: bun test directly
				const isRoot = isMonorepoRoot(ctx)
				const defaultScript = isRoot ? 'turbo test' : 'bun test'

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

				const validTest = isRoot ? script.includes('turbo') : script.startsWith('bun test')

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
			name: 'pkg/scripts-typecheck',
			description: 'Check if "typecheck" script uses tsc',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson } = await import('../utils/fs')

				// Skip for config-only projects (no typecheck needed)
				if (!needsBuildScripts(ctx)) {
					return {
						passed: true,
						message: 'Config-only project (no typecheck needed)',
						skipped: true,
					}
				}

				const script = ctx.packageJson?.scripts?.typecheck
				// Monorepo root: MUST use turbo (same reason as test)
				// - Each package has its own tsconfig
				// - `tsc --noEmit` from root only checks root scope
				// - `turbo typecheck` runs tsc in each package directory
				// Packages: tsc --noEmit directly
				const isRoot = isMonorepoRoot(ctx)
				const defaultScript = isRoot ? 'turbo typecheck' : 'tsc --noEmit'

				if (!script) {
					return {
						passed: false,
						message: 'Missing "typecheck" script in package.json',
						hint: `Add "typecheck": "${defaultScript}" to package.json scripts`,
						fix: async () => {
							const pkgPath = join(ctx.cwd, 'package.json')
							const currentPkg = readPackageJson(ctx.cwd) ?? {}
							currentPkg.scripts = currentPkg.scripts ?? {}
							currentPkg.scripts.typecheck = defaultScript
							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						},
					}
				}

				const validTypecheck = isRoot ? script.includes('turbo') : script.includes('tsc')

				return {
					passed: validTypecheck,
					message: validTypecheck
						? `typecheck script: "${script}"`
						: `typecheck script uses "${script}" (expected "${defaultScript}")`,
					hint: validTypecheck ? undefined : `Use "${defaultScript}"`,
				}
			},
		},

		{
			name: 'pkg/scripts-bench',
			description: 'Check if "bench" script uses bun bench (when bench files exist)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { readPackageJson, findFiles } = await import('../utils/fs')

				// Skip if no benchmark files exist
				const benchFiles = await findFiles(ctx.cwd, /\.bench\.(ts|tsx|js|jsx)$/)
				if (benchFiles.length === 0) {
					return {
						passed: true,
						message: 'No benchmark files (skipped)',
						skipped: true,
					}
				}

				const script = ctx.packageJson?.scripts?.bench

				if (!script) {
					return {
						passed: false,
						message: 'Missing "bench" script (but .bench.ts files exist)',
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

				const usesBunBench = script.startsWith('bun bench')

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

				// For monorepo root, check all TypeScript workspace packages
				if (isMonorepoRoot(ctx)) {
					const tsPackages = ctx.workspacePackages.filter(isTypeScriptPackage)
					if (tsPackages.length === 0) {
						return {
							passed: true,
							message: 'No TypeScript packages to check',
							skipped: true,
						}
					}

					const issues: PackageIssue[] = []
					const packagesToFix: WorkspacePackage[] = []

					for (const pkg of tsPackages) {
						const script = pkg.packageJson?.scripts?.['test:coverage']
						const usesBunTestCoverage =
							script?.includes('bun test') && script?.includes('--coverage')

						if (!script) {
							issues.push({ location: pkg.relativePath, issue: 'missing test:coverage script' })
							packagesToFix.push(pkg)
						} else if (!usesBunTestCoverage) {
							issues.push({
								location: pkg.relativePath,
								issue: `invalid script: "${script}"`,
							})
							packagesToFix.push(pkg)
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${tsPackages.length} package(s) have valid test:coverage script`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) with invalid test:coverage script`,
						hint: formatPackageIssues(issues),
						fix: async () => {
							for (const pkg of packagesToFix) {
								const pkgPath = join(pkg.path, 'package.json')
								const currentPkg = readPackageJson(pkg.path) ?? {}
								currentPkg.scripts = currentPkg.scripts ?? {}
								currentPkg.scripts['test:coverage'] = 'bun test --coverage'
								writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
							}
						},
					}
				}

				// Single package - check root
				const script = ctx.packageJson?.scripts?.['test:coverage']

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

				const usesBunTestCoverage = script.includes('bun test') && script.includes('--coverage')

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
