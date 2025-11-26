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
