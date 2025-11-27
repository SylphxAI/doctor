import type { CheckContext, PackageJson } from '../types'
import { isMonorepoRoot } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Detect if project is a native module (Rust/C++ bindings)
 * Native modules use napi-rs, node-pre-gyp, or similar - not standard JS bundlers
 */
function isNativeModule(ctx: CheckContext): boolean {
	const deps = {
		...ctx.packageJson?.dependencies,
		...ctx.packageJson?.devDependencies,
	}

	// Native module indicators
	const nativeIndicators = [
		'@napi-rs/cli',
		'napi',
		'node-pre-gyp',
		'node-gyp',
		'prebuild',
		'prebuildify',
		'@aspect-build/rules_js', // Bazel native
	]

	for (const indicator of nativeIndicators) {
		if (indicator in deps) return true
	}

	// Check build script for napi
	const buildScript = ctx.packageJson?.scripts?.build ?? ''
	if (buildScript.includes('napi build')) return true

	return false
}

/**
 * Legacy bundlers that bunup can replace
 */
const LEGACY_BUNDLERS = [
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
 * Check if project uses any legacy bundlers
 */
function usesLegacyBundlers(ctx: CheckContext): string[] {
	const deps = {
		...ctx.packageJson?.dependencies,
		...ctx.packageJson?.devDependencies,
	}
	return LEGACY_BUNDLERS.filter((pkg) => pkg in deps)
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
			description: 'Suggest bunup for projects using other JS/TS bundlers',
			fixable: false,
			async check(ctx) {
				// Skip native modules - they use specialized build tools (napi, node-gyp, etc)
				if (isNativeModule(ctx)) {
					return {
						passed: true,
						message: 'Native module detected (skipped)',
						skipped: true,
					}
				}

				// Check for legacy bundlers
				const legacyBundlers = usesLegacyBundlers(ctx)

				if (legacyBundlers.length === 0) {
					return { passed: true, message: 'No legacy bundlers detected' }
				}

				// This is a suggestion, not an error - use 'warn' severity
				return {
					passed: false,
					message: `Using legacy bundlers: ${legacyBundlers.join(', ')}`,
					hint: 'Consider migrating to bunup for simpler config and faster builds. See: https://github.com/AminDevs/bunup',
					severity: 'warn',
				}
			},
		},
	]
)
