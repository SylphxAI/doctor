import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { basename, dirname, join, parse, relative } from 'node:path'
import type { Ecosystem, PackageJson, WorkspacePackage } from '../types'
import { detectEcosystem, detectProjectType } from './context'

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

/**
 * Read package name from Cargo.toml
 */
function readCargoName(dir: string): string | null {
	const content = readFile(join(dir, 'Cargo.toml'))
	if (!content) return null

	// Simple TOML parsing for name field
	const match = content.match(/^\s*name\s*=\s*"([^"]+)"/m)
	return match?.[1] ?? null
}

/**
 * Read module name from go.mod
 */
function readGoModName(dir: string): string | null {
	const content = readFile(join(dir, 'go.mod'))
	if (!content) return null

	// Parse module line
	const match = content.match(/^module\s+(\S+)/m)
	if (!match?.[1]) return null

	// Return last part of module path
	const parts = match[1].split('/')
	return parts[parts.length - 1] ?? null
}

/**
 * Read package name from pyproject.toml
 */
function readPyProjectName(dir: string): string | null {
	const content = readFile(join(dir, 'pyproject.toml'))
	if (!content) return null

	// Simple TOML parsing for name field in [project] or [tool.poetry]
	const match = content.match(/^\s*name\s*=\s*"([^"]+)"/m)
	return match?.[1] ?? null
}

/**
 * Get package name based on ecosystem
 */
function getPackageName(dir: string, ecosystem: Ecosystem): string | null {
	switch (ecosystem) {
		case 'typescript':
			return readPackageJson(dir)?.name ?? null
		case 'rust':
			return readCargoName(dir)
		case 'go':
			return readGoModName(dir)
		case 'python':
			return readPyProjectName(dir)
		default:
			return null
	}
}

export function writePackageJson(cwd: string, pkg: PackageJson): void {
	writeFileSync(join(cwd, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
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
 * Check if a directory has TypeScript/JavaScript source code
 * Looks for src/ directory or .ts/.js files in root
 */
export function hasSourceCode(dir: string): boolean {
	// Check for src/ directory
	const srcDir = join(dir, 'src')
	if (existsSync(srcDir)) {
		try {
			const entries = readdirSync(srcDir)
			const hasCode = entries.some(
				(e) => e.endsWith('.ts') || e.endsWith('.tsx') || e.endsWith('.js') || e.endsWith('.jsx')
			)
			if (hasCode) return true
		} catch {
			// Ignore
		}
	}

	// Check for .ts/.js files in root
	try {
		const entries = readdirSync(dir)
		return entries.some(
			(e) =>
				(e.endsWith('.ts') || e.endsWith('.tsx') || e.endsWith('.js') || e.endsWith('.jsx')) &&
				!e.endsWith('.config.ts') &&
				!e.endsWith('.config.js')
		)
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
 * Create a WorkspacePackage from a directory
 * Handles multiple ecosystems (TypeScript, Rust, Go, Python)
 */
function createWorkspacePackage(dir: string, cwd: string): WorkspacePackage | null {
	const relPath = relative(cwd, dir)
	const ecosystem = detectEcosystem(dir, fileExists)

	// Get package name based on ecosystem
	const name = getPackageName(dir, ecosystem) ?? basename(dir)

	// For TypeScript, we need package.json
	const pkgJson = ecosystem === 'typescript' ? readPackageJson(dir) : null

	// Determine project type (only meaningful for TypeScript)
	const projectType =
		ecosystem === 'typescript' && pkgJson
			? detectProjectType(pkgJson, hasSourceCode(dir), relPath)
			: 'unknown'

	return {
		name,
		path: dir,
		relativePath: relPath,
		packageJson: pkgJson,
		projectType,
		ecosystem,
	}
}

/**
 * Check if a directory is a valid package (has manifest file)
 */
function isPackageDir(dir: string): boolean {
	return (
		fileExists(join(dir, 'package.json')) ||
		fileExists(join(dir, 'Cargo.toml')) ||
		fileExists(join(dir, 'go.mod')) ||
		fileExists(join(dir, 'pyproject.toml')) ||
		fileExists(join(dir, 'setup.py'))
	)
}

/**
 * Discover all workspace packages in a monorepo
 * Uses workspaces field from package.json, falls back to common directories
 * Supports polyglot monorepos (TypeScript, Rust, Go, Python)
 */
export function discoverWorkspacePackages(cwd: string): WorkspacePackage[] {
	const packages: WorkspacePackage[] = []
	const seen = new Set<string>()

	// First, try workspaces field (for TypeScript packages)
	const workspacePatterns = getWorkspacePatterns(cwd)

	if (workspacePatterns.length > 0) {
		for (const pattern of workspacePatterns) {
			const dirs = expandWorkspacePattern(cwd, pattern)
			for (const dir of dirs) {
				if (seen.has(dir)) continue
				seen.add(dir)

				const pkg = createWorkspacePackage(dir, cwd)
				if (pkg) packages.push(pkg)
			}
		}
	}

	// Also check common directories for all ecosystems
	const commonDirs = ['packages', 'apps', 'libs', 'services', 'tools', 'crates', 'go', 'python']
	for (const dir of commonDirs) {
		const dirPath = join(cwd, dir)
		try {
			const entries = readdirSync(dirPath, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isDirectory() && !entry.name.startsWith('.')) {
					const pkgPath = join(dirPath, entry.name)
					if (seen.has(pkgPath)) continue

					// Only add if it's a valid package directory
					if (!isPackageDir(pkgPath)) continue
					seen.add(pkgPath)

					const pkg = createWorkspacePackage(pkgPath, cwd)
					if (pkg) packages.push(pkg)
				}
			}
		} catch {
			// Directory doesn't exist
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
