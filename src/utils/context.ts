/**
 * Context helper utilities
 */

import type { CheckContext, Ecosystem, PackageJson, ProjectType, WorkspacePackage } from '../types'

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
 * Patterns that indicate an example/demo package
 */
const EXAMPLE_PATH_PATTERNS = [
	/^examples?\//i,
	/\/examples?\//i,
	/^demos?\//i,
	/\/demos?\//i,
	/[-_]example$/i,
	/[-_]demo$/i,
]

/**
 * Check if a path indicates an example/demo package
 */
export function isExamplePath(relativePath: string): boolean {
	return EXAMPLE_PATH_PATTERNS.some((pattern) => pattern.test(relativePath))
}

/**
 * Detect ecosystem from directory contents
 */
export function detectEcosystem(dir: string, fileExists: (path: string) => boolean): Ecosystem {
	const { join } = require('node:path') as typeof import('node:path')

	if (fileExists(join(dir, 'package.json'))) return 'typescript'
	if (fileExists(join(dir, 'Cargo.toml'))) return 'rust'
	if (fileExists(join(dir, 'go.mod'))) return 'go'
	if (fileExists(join(dir, 'pyproject.toml')) || fileExists(join(dir, 'setup.py'))) return 'python'

	return 'unknown'
}

/**
 * Check if a package is TypeScript/JavaScript ecosystem
 */
export function isTypeScriptPackage(pkg: WorkspacePackage): boolean {
	return pkg.ecosystem === 'typescript'
}

/**
 * Detect project type from package.json exports and path
 */
export function detectProjectType(
	pkg: PackageJson,
	hasSourceCode: boolean,
	relativePath?: string
): ProjectType {
	// Check if this is an example based on path
	if (relativePath && isExamplePath(relativePath)) {
		return 'example'
	}
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
 * Config-only and example projects don't need these
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
 * Check if a package needs credits section
 * Config and example packages don't need credits
 */
export function needsCredits(pkg: WorkspacePackage): boolean {
	return pkg.projectType === 'library' || pkg.projectType === 'app'
}

/**
 * Check if a package needs tests
 * Config and example packages don't need tests
 */
export function needsTests(pkg: WorkspacePackage): boolean {
	return pkg.projectType === 'library' || pkg.projectType === 'app'
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
			ecosystem: 'typescript',
		})
	}

	// Add all workspace packages
	packages.push(...ctx.workspacePackages)

	return packages
}

export interface GetPackagesOptions {
	/** Include private packages (default: true) */
	includePrivate?: boolean
	/** Include root package for monorepo (default: false) */
	includeRoot?: boolean
	/** Only TypeScript packages (default: false) */
	typescript?: boolean
	/** Custom filter */
	filter?: (pkg: WorkspacePackage) => boolean
}

/**
 * Get packages to check - unified helper for monorepo and single package
 *
 * For single package: returns [root] as WorkspacePackage
 * For monorepo: returns workspacePackages (optionally with root)
 *
 * This eliminates the need for if/else in every check:
 * ```typescript
 * // Before (repetitive)
 * if (isMonorepoRoot(ctx)) {
 *   for (const pkg of ctx.workspacePackages) { ... }
 * } else {
 *   // check ctx.packageJson
 * }
 *
 * // After (unified)
 * for (const pkg of getPackagesToCheck(ctx)) { ... }
 * ```
 */
export function getPackagesToCheck(
	ctx: CheckContext,
	options: GetPackagesOptions = {}
): WorkspacePackage[] {
	const { includePrivate = true, includeRoot = false, typescript = false, filter } = options

	let packages: WorkspacePackage[]

	if (isMonorepoRoot(ctx)) {
		// Monorepo: start with workspace packages
		packages = [...ctx.workspacePackages]

		// Optionally include root
		if (includeRoot && ctx.packageJson) {
			packages.unshift({
				name: ctx.packageJson.name ?? 'root',
				path: ctx.cwd,
				relativePath: '.',
				packageJson: ctx.packageJson,
				projectType: ctx.projectType,
				ecosystem: 'typescript',
			})
		}
	} else {
		// Single package: treat root as a "package"
		if (!ctx.packageJson) return []

		packages = [
			{
				name: ctx.packageJson.name ?? 'root',
				path: ctx.cwd,
				relativePath: '.',
				packageJson: ctx.packageJson,
				projectType: ctx.projectType,
				ecosystem: 'typescript',
			},
		]
	}

	// Apply filters
	if (!includePrivate) {
		packages = packages.filter((pkg) => !pkg.packageJson?.private)
	}

	if (typescript) {
		packages = packages.filter(isTypeScriptPackage)
	}

	if (filter) {
		packages = packages.filter(filter)
	}

	return packages
}

/**
 * Get public packages only (non-private) - common use case
 */
export function getPublicPackages(ctx: CheckContext): WorkspacePackage[] {
	return getPackagesToCheck(ctx, { includePrivate: false })
}

/**
 * Check for banned dependencies across all packages
 * Returns list of found banned deps with their locations
 */
export function checkBannedDeps(
	ctx: CheckContext,
	bannedDeps: string[],
	options: GetPackagesOptions = {}
): { found: string[]; issues: Array<{ location: string; deps: string[] }> } {
	const packages = getPackagesToCheck(ctx, options)
	const allFound: string[] = []
	const issues: Array<{ location: string; deps: string[] }> = []

	for (const pkg of packages) {
		const allDeps = {
			...pkg.packageJson?.dependencies,
			...pkg.packageJson?.devDependencies,
		}
		const found = bannedDeps.filter((dep) => dep in allDeps)
		if (found.length > 0) {
			allFound.push(...found)
			issues.push({ location: pkg.relativePath, deps: found })
		}
	}

	return { found: [...new Set(allFound)], issues }
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
