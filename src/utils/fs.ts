import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import type { PackageJson, WorkspacePackage } from '../types'

export function fileExists(path: string): boolean {
	return existsSync(path)
}

export function readJson<T>(path: string): T | null {
	try {
		const content = readFileSync(path, 'utf-8')
		return JSON.parse(content) as T
	} catch {
		return null
	}
}

export function readPackageJson(cwd: string): PackageJson | null {
	return readJson<PackageJson>(join(cwd, 'package.json'))
}

export function readFile(path: string): string | null {
	try {
		return readFileSync(path, 'utf-8')
	} catch {
		return null
	}
}

export async function findFiles(dir: string, pattern: RegExp): Promise<string[]> {
	const results: string[] = []

	async function walk(currentDir: string): Promise<void> {
		const entries = await readdir(currentDir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name)

			if (entry.isDirectory()) {
				if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
					await walk(fullPath)
				}
			} else if (pattern.test(entry.name)) {
				results.push(fullPath)
			}
		}
	}

	await walk(dir)
	return results
}

export async function directoryExists(path: string): Promise<boolean> {
	try {
		const stats = await stat(path)
		return stats.isDirectory()
	} catch {
		return false
	}
}

/**
 * Expand a workspace glob pattern to actual directories
 * Supports patterns like "packages/*", "apps/*", etc.
 */
function expandWorkspacePattern(cwd: string, pattern: string): string[] {
	const results: string[] = []

	// Handle simple glob patterns like "packages/*"
	if (pattern.endsWith('/*')) {
		const baseDir = join(cwd, pattern.slice(0, -2))
		try {
			const entries = readdirSync(baseDir, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isDirectory() && !entry.name.startsWith('.')) {
					const pkgPath = join(baseDir, entry.name)
					if (fileExists(join(pkgPath, 'package.json'))) {
						results.push(pkgPath)
					}
				}
			}
		} catch {
			// Directory doesn't exist
		}
	} else if (!pattern.includes('*')) {
		// Direct path like "packages/core"
		const pkgPath = join(cwd, pattern)
		if (fileExists(join(pkgPath, 'package.json'))) {
			results.push(pkgPath)
		}
	}

	return results
}

/**
 * Get workspace patterns from package.json
 */
export function getWorkspacePatterns(cwd: string): string[] {
	const pkg = readPackageJson(cwd)
	if (pkg?.workspaces && Array.isArray(pkg.workspaces)) {
		return pkg.workspaces
	}
	return []
}

/**
 * Discover all workspace packages in a monorepo
 * Uses workspaces field from package.json, falls back to common directories
 */
export function discoverWorkspacePackages(cwd: string): WorkspacePackage[] {
	const packages: WorkspacePackage[] = []
	const seen = new Set<string>()

	// First, try workspaces field
	const workspacePatterns = getWorkspacePatterns(cwd)

	if (workspacePatterns.length > 0) {
		for (const pattern of workspacePatterns) {
			const dirs = expandWorkspacePattern(cwd, pattern)
			for (const dir of dirs) {
				if (seen.has(dir)) continue
				seen.add(dir)

				const pkgJson = readPackageJson(dir)
				if (pkgJson?.name) {
					packages.push({
						name: pkgJson.name,
						path: dir,
						relativePath: relative(cwd, dir),
						packageJson: pkgJson,
					})
				}
			}
		}
	} else {
		// Fallback: check common directories
		const commonDirs = ['packages', 'apps', 'libs', 'services', 'tools']
		for (const dir of commonDirs) {
			const dirPath = join(cwd, dir)
			try {
				const entries = readdirSync(dirPath, { withFileTypes: true })
				for (const entry of entries) {
					if (entry.isDirectory() && !entry.name.startsWith('.')) {
						const pkgPath = join(dirPath, entry.name)
						if (seen.has(pkgPath)) continue
						seen.add(pkgPath)

						const pkgJson = readPackageJson(pkgPath)
						if (pkgJson?.name) {
							packages.push({
								name: pkgJson.name,
								path: pkgPath,
								relativePath: relative(cwd, pkgPath),
								packageJson: pkgJson,
							})
						}
					}
				}
			} catch {
				// Directory doesn't exist
			}
		}
	}

	return packages
}

/**
 * Detect if project is a monorepo
 * Checks for:
 * 1. workspaces field in package.json
 * 2. packages/, apps/, libs/, services/, tools/ directories with package.json
 */
export async function isMonorepo(cwd: string): Promise<boolean> {
	// Check for workspaces in package.json
	const pkg = readPackageJson(cwd)
	if (pkg?.workspaces && Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0) {
		return true
	}

	// Check for common monorepo directories
	const commonDirs = ['packages', 'apps', 'libs', 'services', 'tools']
	for (const dir of commonDirs) {
		const dirPath = join(cwd, dir)
		if (await directoryExists(dirPath)) {
			// Check if any subdirectory has a package.json
			try {
				const entries = await readdir(dirPath, { withFileTypes: true })
				for (const entry of entries) {
					if (entry.isDirectory() && !entry.name.startsWith('.')) {
						if (fileExists(join(dirPath, entry.name, 'package.json'))) {
							return true
						}
					}
				}
			} catch {
				// Continue checking other directories
			}
		}
	}

	return false
}

/**
 * Find the workspace root by traversing up the directory tree
 * Returns the root directory if found, or undefined if not in a workspace
 */
export function findWorkspaceRoot(cwd: string): string | undefined {
	const { dirname, parse } = require('node:path') as typeof import('node:path')

	let current = cwd
	const root = parse(cwd).root

	while (current !== root) {
		const pkg = readPackageJson(current)

		// Found workspace root if has workspaces field
		if (pkg?.workspaces && Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0) {
			return current
		}

		// Move up one directory
		const parent = dirname(current)
		if (parent === current) break
		current = parent
	}

	return undefined
}
