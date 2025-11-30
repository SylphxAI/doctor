import type { CheckContext, PackageJson } from '../types'
import { isMonorepoRoot } from '../utils/context'
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
 * Check if project uses any legacy bundlers (deps or build script)
 */
function usesLegacyBundlers(ctx: CheckContext): { deps: string[]; usesBunBuild: boolean } {
	const allDeps = {
		...ctx.packageJson?.dependencies,
		...ctx.packageJson?.devDependencies,
	}
	const deps = LEGACY_BUNDLER_DEPS.filter((pkg) => pkg in allDeps)

	// Check if build script uses "bun build" (not bunup)
	const buildScript = ctx.packageJson?.scripts?.build ?? ''
	const usesBunBuild = buildScript.includes('bun build') && !buildScript.includes('bunup')

	return { deps, usesBunBuild }
}

/**
 * CJS indicators in package.json
 */
function checkCjsIndicators(pkg: PackageJson, location: string): PackageIssue | null {
	const issues: string[] = []

	// Check main field pointing to .cjs
	const main = pkg.main as string | undefined
	if (main?.endsWith('.cjs')) {
		issues.push(`main points to .cjs (${main})`)
	}

	// Check exports for require conditions
	const exports = pkg.exports as Record<string, unknown> | undefined
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
		return { location, issue: issues.join(', ') }
	}

	return null
}

function checkExports(pkg: PackageJson, location: string): PackageIssue | null {
	const exports = pkg?.exports

	if (!exports) {
		return { location, issue: 'missing exports field' }
	}

	// Check if exports has proper structure
	const mainExport = typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

	if (!mainExport) {
		return { location, issue: 'exports missing "." entry' }
	}

	// Collect ALL missing fields (not just the first one)
	const exportObj = mainExport as Record<string, unknown>
	const missing: string[] = []
	if (!('types' in exportObj)) missing.push('types')
	if (!('import' in exportObj)) missing.push('import')

	if (missing.length > 0) {
		return { location, issue: `exports["."] missing: ${missing.join(', ')}` }
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
		// Note: bunup config check removed - bunup works fine with defaults

		{
			name: 'build/esm-only',
			description: 'Check that package only builds ESM (no CJS)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile, readPackageJson } = await import('../utils/fs')

				// For monorepo root, check all workspace packages
				if (isMonorepoRoot(ctx)) {
					const issues: PackageIssue[] = []
					const packagesToFix: Array<{ path: string; pkg: PackageJson }> = []

					for (const pkg of ctx.workspacePackages) {
						// Skip private packages
						if (pkg.packageJson.private) continue

						const issue = checkCjsIndicators(pkg.packageJson, pkg.relativePath)
						if (issue) {
							issues.push(issue)
							packagesToFix.push({ path: pkg.path, pkg: pkg.packageJson })
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
							message: 'All packages are ESM-only',
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) have CJS indicators`,
						hint: formatPackageIssues(issues),
						fix: async () => {
							for (const { path } of packagesToFix) {
								const pkgPath = join(path, 'package.json')
								const currentPkg = readPackageJson(path) ?? {}

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
				}

				// Single package - check root
				if (!ctx.packageJson) {
					return { passed: true, message: 'No package.json (skipped)', skipped: true }
				}

				const issues: string[] = []

				// Check package.json for CJS indicators
				const cjsIssue = checkCjsIndicators(ctx.packageJson, 'root')
				if (cjsIssue) {
					issues.push(cjsIssue.issue)
				}

				// Check build.config.ts for cjs format
				const buildConfigPath = join(ctx.cwd, 'build.config.ts')
				if (fileExists(buildConfigPath)) {
					const content = readFile(buildConfigPath) ?? ''
					if (content.includes("'cjs'") || content.includes('"cjs"')) {
						issues.push('build.config.ts format includes cjs')
					}
				}

				if (issues.length === 0) {
					return {
						passed: true,
						message: 'Package is ESM-only (no CJS)',
					}
				}

				return {
					passed: false,
					message: `CJS indicators found: ${issues.join(', ')}`,
					hint: 'Remove CJS from exports and build config. Modern Node.js supports ESM.',
					fix: async () => {
						const pkgPath = join(ctx.cwd, 'package.json')
						const currentPkg = readPackageJson(ctx.cwd) ?? {}

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
					},
				}
			},
		},

		{
			name: 'build/exports-valid',
			description: 'Check if package.json exports are properly configured',
			fixable: false,
			async check(ctx) {
				// Skip for monorepo root - exports are per-package
				if (isMonorepoRoot(ctx)) {
					// Check all workspace packages instead
					const issues: PackageIssue[] = []

					for (const pkg of ctx.workspacePackages) {
						// Skip private packages
						if (pkg.packageJson.private) continue

						const issue = checkExports(pkg.packageJson, pkg.relativePath)
						if (issue) {
							issues.push(issue)
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${ctx.workspacePackages.length} packages have valid exports`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) with invalid exports`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package - check root
				if (!ctx.packageJson) {
					return {
						passed: false,
						message: 'No package.json found',
					}
				}
				const issue = checkExports(ctx.packageJson, 'root')
				if (issue) {
					return {
						passed: false,
						message: `package.json ${issue.issue}`,
					}
				}

				return {
					passed: true,
					message: 'package.json exports properly configured',
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

				// Skip if build doesn't use bunup
				if (!usesBunup) {
					return { passed: true, message: 'Build does not use bunup (skipped)', skipped: true }
				}

				// Read fresh from disk to handle post-fix verification
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

				// Check for legacy bundlers (deps and build script)
				const { deps, usesBunBuild } = usesLegacyBundlers(ctx)

				// No legacy bundlers = nothing to check, skip silently
				if (deps.length === 0 && !usesBunBuild) {
					return { passed: true, message: 'No legacy bundlers', skipped: true }
				}

				// Build error message
				const issues: string[] = []
				if (deps.length > 0) {
					issues.push(`legacy deps: ${deps.join(', ')}`)
				}
				if (usesBunBuild) {
					issues.push('"bun build" in build script')
				}

				// Found legacy bundlers - must migrate to bunup
				return {
					passed: false,
					message: `Using legacy bundlers: ${issues.join('; ')}`,
					hint:
						deps.length > 0
							? `Use bunup instead. Run: bun remove ${deps.join(' ')} && bun add -D bunup`
							: 'Use bunup instead. Replace "bun build" with "bunup" in build script',
					fix:
						deps.length > 0
							? async () => {
									await exec('bun', ['remove', ...deps], ctx.cwd)
									await exec('bun', ['add', '-D', 'bunup'], ctx.cwd)
								}
							: undefined, // Can't auto-fix build script change
				}
			},
		},
	]
)
