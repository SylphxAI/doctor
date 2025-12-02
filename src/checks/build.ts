import type { WorkspacePackage } from '../types'
import { getPackagesToCheck } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Legacy bundler dependencies that bunup can replace
 */
const LEGACY_BUNDLER_DEPS = [
	'esbuild',
	'tsup',
	'rollup',
	'webpack',
	'parcel',
	'@rollup/plugin-node-resolve',
	'@rollup/plugin-commonjs',
	'rollup-plugin-dts',
	'unbuild',
	'pkgroll',
]

/**
 * CJS indicators in package.json
 */
function checkCjsIndicators(pkg: WorkspacePackage): PackageIssue | null {
	const issues: string[] = []
	const pkgJson = pkg.packageJson

	if (!pkgJson) return null

	// Check main field pointing to .cjs
	const main = pkgJson.main as string | undefined
	if (main?.endsWith('.cjs')) {
		issues.push(`main points to .cjs (${main})`)
	}

	// Check exports for require conditions
	const exports = pkgJson.exports as Record<string, unknown> | undefined
	if (exports && typeof exports === 'object') {
		for (const [key, value] of Object.entries(exports)) {
			if (typeof value === 'object' && value !== null) {
				const exportEntry = value as Record<string, unknown>
				if ('require' in exportEntry) {
					issues.push(`exports["${key}"] has require condition`)
				}
			}
		}
	}

	if (issues.length > 0) {
		return { location: pkg.relativePath, issue: issues.join(', ') }
	}

	return null
}

/**
 * File extensions that don't require types/import conditions
 */
const NON_JS_EXTENSIONS = ['.json', '.yaml', '.yml', '.toml', '.css', '.scss', '.less']

function checkExports(pkg: WorkspacePackage): PackageIssue | null {
	const exports = pkg.packageJson?.exports

	if (!exports) {
		return { location: pkg.relativePath, issue: 'missing exports field' }
	}

	const mainExport = typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

	if (!mainExport) {
		return { location: pkg.relativePath, issue: 'exports missing "." entry' }
	}

	// String export (e.g., "./biome.json") - valid for config packages
	if (typeof mainExport === 'string') {
		const isNonJsFile = NON_JS_EXTENSIONS.some((ext) => mainExport.endsWith(ext))
		if (isNonJsFile) return null
		return {
			location: pkg.relativePath,
			issue: 'exports["."] should use object format with types/import conditions',
		}
	}

	// Object export - check for required conditions
	const exportObj = mainExport as Record<string, unknown>
	const missing: string[] = []
	if (!('types' in exportObj)) missing.push('types')
	if (!('import' in exportObj)) missing.push('import')

	if (missing.length > 0) {
		return { location: pkg.relativePath, issue: `exports["."] missing: ${missing.join(', ')}` }
	}

	return null
}

/**
 * Check for legacy bundlers in a package
 */
function checkLegacyBundlers(pkg: WorkspacePackage): PackageIssue | null {
	const allDeps = {
		...pkg.packageJson?.dependencies,
		...pkg.packageJson?.devDependencies,
	}
	const legacyDeps = LEGACY_BUNDLER_DEPS.filter((dep) => dep in allDeps)

	const buildScript = pkg.packageJson?.scripts?.build ?? ''
	const usesBunBuild = buildScript.includes('bun build') && !buildScript.includes('bunup')

	const issues: string[] = []
	if (legacyDeps.length > 0) {
		issues.push(`legacy deps: ${legacyDeps.join(', ')}`)
	}
	if (usesBunBuild) {
		issues.push('"bun build" in build script')
	}

	if (issues.length > 0) {
		return { location: pkg.relativePath, issue: issues.join('; ') }
	}

	return null
}

export const buildModule: CheckModule = defineCheckModule(
	{
		category: 'build',
		label: '🔨 Build',
		description: 'Check build configuration',
	},
	[
		{
			name: 'build/esm-only',
			description: 'Check that package only builds ESM (no CJS)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile, readPackageJson } = await import('../utils/fs')

				const packages = getPackagesToCheck(ctx, { includePrivate: false, typescript: true })
				if (packages.length === 0) {
					return { passed: true, message: 'No packages to check', skipped: true }
				}

				const issues: PackageIssue[] = []
				const packagesToFix: WorkspacePackage[] = []

				for (const pkg of packages) {
					const issue = checkCjsIndicators(pkg)
					if (issue) {
						issues.push(issue)
						packagesToFix.push(pkg)
					}
				}

				// Also check build.config.ts at root for cjs format
				const buildConfigPath = join(ctx.cwd, 'build.config.ts')
				if (fileExists(buildConfigPath)) {
					const content = readFile(buildConfigPath) ?? ''
					if (content.includes("'cjs'") || content.includes('"cjs"')) {
						issues.push({ location: 'build.config.ts', issue: 'format includes cjs' })
					}
				}

				if (issues.length === 0) {
					return {
						passed: true,
						message:
							packages.length === 1 ? 'Package is ESM-only (no CJS)' : 'All packages are ESM-only',
					}
				}

				return {
					passed: false,
					message: `${issues.length} issue(s) with CJS indicators`,
					hint: formatPackageIssues(issues),
					fix: async () => {
						for (const pkg of packagesToFix) {
							const pkgPath = join(pkg.path, 'package.json')
							const currentPkg = readPackageJson(pkg.path) ?? {}

							// Remove main if it points to .cjs
							if ((currentPkg.main as string)?.endsWith('.cjs')) {
								delete currentPkg.main
							}

							// Remove require from exports
							const exports = currentPkg.exports as Record<string, unknown> | undefined
							if (exports && typeof exports === 'object') {
								for (const value of Object.values(exports)) {
									if (typeof value === 'object' && value !== null) {
										delete (value as Record<string, unknown>).require
									}
								}
							}

							writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
						}
					},
				}
			},
		},

		{
			name: 'build/exports-valid',
			description: 'Check if package.json exports are properly configured',
			fixable: false,
			async check(ctx) {
				const packages = getPackagesToCheck(ctx, { includePrivate: false, typescript: true })
				if (packages.length === 0) {
					return { passed: true, message: 'No packages to check', skipped: true }
				}

				const issues: PackageIssue[] = []

				for (const pkg of packages) {
					const issue = checkExports(pkg)
					if (issue) {
						issues.push(issue)
					}
				}

				if (issues.length === 0) {
					return {
						passed: true,
						message:
							packages.length === 1
								? 'package.json exports properly configured'
								: `All ${packages.length} packages have valid exports`,
					}
				}

				return {
					passed: false,
					message: `${issues.length} package(s) with invalid exports`,
					hint: formatPackageIssues(issues),
				}
			},
		},

		{
			name: 'build/bunup-dep',
			description: 'Check if bunup is in devDependencies when build uses it',
			fixable: true,
			async check(ctx) {
				const { readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const buildScript = ctx.packageJson?.scripts?.build ?? ''
				const usesBunup = buildScript.includes('bunup')

				if (!usesBunup) {
					return { passed: true, message: 'Build does not use bunup (skipped)', skipped: true }
				}

				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasBunup = 'bunup' in devDeps

				return {
					passed: hasBunup,
					message: hasBunup ? 'bunup in devDependencies' : 'bunup missing from devDependencies',
					hint: hasBunup ? undefined : 'Run: bun add -D bunup',
					fix: async () => {
						await exec('bun', ['add', '-D', 'bunup'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'build/suggest-bunup',
			description: 'Check for legacy bundlers (use bunup instead)',
			fixable: true,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				// Check all packages including root
				const packages = getPackagesToCheck(ctx, { includeRoot: true, typescript: true })
				if (packages.length === 0) {
					return { passed: true, message: 'No packages to check', skipped: true }
				}

				const issues: PackageIssue[] = []
				const allDepsToRemove: string[] = []

				for (const pkg of packages) {
					const issue = checkLegacyBundlers(pkg)
					if (issue) {
						issues.push(issue)
						// Collect deps to remove
						const allDeps = {
							...pkg.packageJson?.dependencies,
							...pkg.packageJson?.devDependencies,
						}
						const legacyDeps = LEGACY_BUNDLER_DEPS.filter((dep) => dep in allDeps)
						allDepsToRemove.push(...legacyDeps)
					}
				}

				if (issues.length === 0) {
					return { passed: true, message: 'No legacy bundlers', skipped: true }
				}

				const uniqueDeps = [...new Set(allDepsToRemove)]

				return {
					passed: false,
					message: `${issues.length} package(s) using legacy bundlers`,
					hint: formatPackageIssues(issues),
					fix:
						uniqueDeps.length > 0
							? async () => {
									await exec('bun', ['remove', ...uniqueDeps], ctx.cwd)
									await exec('bun', ['add', '-D', 'bunup'], ctx.cwd)
								}
							: undefined,
				}
			},
		},
	]
)
