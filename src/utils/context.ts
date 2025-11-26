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
