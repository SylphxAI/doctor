/**
 * Context helper utilities
 */

import type { CheckContext, PackageJson, ProjectType, WorkspacePackage } from '../types'

/**
 * File extensions that indicate non-code exports (config files)
 */
const CONFIG_EXTENSIONS = ['.json', '.yaml', '.yml', '.toml', '.css', '.scss', '.less']

/**
 * Known shared config package name patterns
 */
const SHARED_CONFIG_PATTERNS = [
	/^@[\w-]+\/(biome-config|eslint-config|prettier-config|tsconfig)$/,
	/^[\w-]+-config$/,
	/^config-[\w-]+$/,
]

/**
 * Detect project type from package.json exports
 */
export function detectProjectType(pkg: PackageJson, hasSourceCode: boolean): ProjectType {
	// Private packages with no exports are typically apps
	if (pkg.private && !pkg.exports) {
		return 'app'
	}

	// Check exports to determine if config-only
	const exports = pkg.exports
	if (!exports) {
		return hasSourceCode ? 'library' : 'unknown'
	}

	// Get all export paths
	const exportPaths: string[] = []

	if (typeof exports === 'string') {
		exportPaths.push(exports)
	} else if (typeof exports === 'object') {
		for (const value of Object.values(exports as Record<string, unknown>)) {
			if (typeof value === 'string') {
				exportPaths.push(value)
			} else if (typeof value === 'object' && value !== null) {
				// Handle conditional exports like { import: "./dist/index.js", types: "./dist/index.d.ts" }
				for (const v of Object.values(value as Record<string, unknown>)) {
					if (typeof v === 'string') {
						exportPaths.push(v)
					}
				}
			}
		}
	}

	if (exportPaths.length === 0) {
		return hasSourceCode ? 'library' : 'unknown'
	}

	// Check if ALL exports are config files (non-code)
	const allConfigFiles = exportPaths.every((p) => CONFIG_EXTENSIONS.some((ext) => p.endsWith(ext)))

	if (allConfigFiles) {
		return 'config'
	}

	return 'library'
}

/**
 * Check if a package name matches shared config patterns
 */
export function isSharedConfigPackage(name: string | undefined): boolean {
	if (!name) return false
	return SHARED_CONFIG_PATTERNS.some((pattern) => pattern.test(name))
}

/**
 * Check if context is a shared config source (monorepo containing config packages)
 */
export function detectIsSharedConfigSource(ctx: {
	packageJson: PackageJson | null
	workspacePackages: WorkspacePackage[]
}): boolean {
	// Check if any workspace package is a shared config
	for (const pkg of ctx.workspacePackages) {
		if (isSharedConfigPackage(pkg.name)) {
			return true
		}
	}

	// Check if root package itself is a shared config
	if (isSharedConfigPackage(ctx.packageJson?.name)) {
		return true
	}

	return false
}

/**
 * Check if context is a monorepo root (has workspaces with packages)
 */
export function isMonorepoRoot(ctx: CheckContext): boolean {
	return ctx.isMonorepo && ctx.workspacePackages.length > 0
}

/**
 * Check if all packages in the monorepo are config-only
 */
export function isConfigOnlyMonorepo(ctx: CheckContext): boolean {
	if (!isMonorepoRoot(ctx)) return false
	return ctx.workspacePackages.every((pkg) => pkg.projectType === 'config')
}

/**
 * Check if the project needs build/test/typecheck scripts
 * Config-only projects don't need these
 */
export function needsBuildScripts(ctx: CheckContext): boolean {
	// Single package - check its type
	if (!isMonorepoRoot(ctx)) {
		return ctx.projectType === 'library' || ctx.projectType === 'app'
	}

	// Monorepo - check if any package needs build
	return ctx.workspacePackages.some(
		(pkg) => pkg.projectType === 'library' || pkg.projectType === 'app'
	)
}

/**
 * Iterate over all workspace packages
 * Returns early if callback returns false
 */
export async function forEachPackage(
	ctx: CheckContext,
	callback: (pkg: WorkspacePackage) => Promise<boolean | undefined> | boolean | undefined
): Promise<void> {
	for (const pkg of ctx.workspacePackages) {
		const result = await callback(pkg)
		if (result === false) break
	}
}

/**
 * Check all packages and collect errors
 */
export async function checkAllPackages<T>(
	ctx: CheckContext,
	check: (pkg: WorkspacePackage) => Promise<T | null> | T | null
): Promise<T[]> {
	const errors: T[] = []
	for (const pkg of ctx.workspacePackages) {
		const result = await check(pkg)
		if (result !== null) {
			errors.push(result)
		}
	}
	return errors
}

/**
 * Get package names set for quick lookup
 */
export function getPackageNames(ctx: CheckContext): Set<string> {
	return new Set(ctx.workspacePackages.map((p) => p.name))
}

/**
 * Get all packages including root (for checks that need to scan everything)
 * Root is represented with relativePath = '.'
 */
export function getAllPackages(ctx: CheckContext): WorkspacePackage[] {
	const packages: WorkspacePackage[] = []

	// Add root package
	if (ctx.packageJson) {
		packages.push({
			name: ctx.packageJson.name ?? 'root',
			path: ctx.cwd,
			relativePath: '.',
			packageJson: ctx.packageJson,
			projectType: ctx.projectType,
		})
	}

	// Add all workspace packages
	packages.push(...ctx.workspacePackages)

	return packages
}

/**
 * Check all packages including root and collect errors
 */
export async function checkAllPackagesWithRoot<T>(
	ctx: CheckContext,
	check: (pkg: WorkspacePackage) => Promise<T | null> | T | null
): Promise<T[]> {
	const errors: T[] = []
	for (const pkg of getAllPackages(ctx)) {
		const result = await check(pkg)
		if (result !== null) {
			errors.push(result)
		}
	}
	return errors
}
