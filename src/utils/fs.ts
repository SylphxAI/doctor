import { existsSync, readFileSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { PackageJson } from '../types'

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
