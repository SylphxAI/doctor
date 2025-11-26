/**
 * Context helper utilities
 */

import type { CheckContext, WorkspacePackage } from '../types'

/**
 * Check if context is a monorepo root (has workspaces with packages)
 */
export function isMonorepoRoot(ctx: CheckContext): boolean {
	return ctx.isMonorepo && ctx.workspacePackages.length > 0
}

/**
 * Iterate over all workspace packages
 * Returns early if callback returns false
 */
export async function forEachPackage(
	ctx: CheckContext,
	callback: (pkg: WorkspacePackage) => Promise<boolean | void> | boolean | void
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
 * Root is represented with relativePath = 'root'
 */
export function getAllPackages(ctx: CheckContext): WorkspacePackage[] {
	const packages: WorkspacePackage[] = []

	// Add root package
	if (ctx.packageJson) {
		packages.push({
			name: ctx.packageJson.name ?? 'root',
			path: ctx.cwd,
			relativePath: 'root',
			packageJson: ctx.packageJson,
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
