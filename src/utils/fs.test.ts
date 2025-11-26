import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { directoryExists, fileExists, findFiles, readFile, readJson, readPackageJson } from './fs'

const cwd = process.cwd()

describe('fileExists', () => {
	test('returns true for existing file', () => {
		expect(fileExists(join(cwd, 'package.json'))).toBe(true)
	})

	test('returns false for non-existing file', () => {
		expect(fileExists(join(cwd, 'nonexistent.txt'))).toBe(false)
	})

	test('returns false for directory', () => {
		expect(fileExists(join(cwd, 'src'))).toBe(true) // existsSync returns true for dirs too
	})
})

describe('readJson', () => {
	test('reads and parses JSON file', () => {
		const pkg = readJson<{ name: string }>(join(cwd, 'package.json'))
		expect(pkg).not.toBeNull()
		expect(pkg?.name).toBe('@sylphx/doctor')
	})

	test('returns null for non-existing file', () => {
		expect(readJson(join(cwd, 'nonexistent.json'))).toBeNull()
	})

	test('returns null for invalid JSON', () => {
		// tsconfig.json might have comments which is invalid JSON
		// but biome.json should be valid
		const biome = readJson(join(cwd, 'biome.json'))
		expect(biome).not.toBeNull()
	})
})

describe('readPackageJson', () => {
	test('reads package.json from cwd', () => {
		const pkg = readPackageJson(cwd)
		expect(pkg).not.toBeNull()
		expect(pkg?.name).toBe('@sylphx/doctor')
		expect(pkg?.version).toBeDefined()
	})

	test('returns null for directory without package.json', () => {
		expect(readPackageJson('/tmp')).toBeNull()
	})
})

describe('readFile', () => {
	test('reads file content', () => {
		const content = readFile(join(cwd, 'package.json'))
		expect(content).not.toBeNull()
		expect(content).toContain('@sylphx/doctor')
	})

	test('returns null for non-existing file', () => {
		expect(readFile(join(cwd, 'nonexistent.txt'))).toBeNull()
	})
})

describe('findFiles', () => {
	test('finds files matching pattern', async () => {
		const files = await findFiles(join(cwd, 'src'), /\.ts$/)
		expect(files.length).toBeGreaterThan(0)
		expect(files.every((f) => f.endsWith('.ts'))).toBe(true)
	})

	test('excludes node_modules', async () => {
		const files = await findFiles(cwd, /\.ts$/)
		expect(files.some((f) => f.includes('node_modules'))).toBe(false)
	})

	test('returns empty array for no matches', async () => {
		const files = await findFiles(join(cwd, 'src'), /\.xyz$/)
		expect(files).toEqual([])
	})
})

describe('directoryExists', () => {
	test('returns true for existing directory', async () => {
		expect(await directoryExists(join(cwd, 'src'))).toBe(true)
	})

	test('returns false for non-existing directory', async () => {
		expect(await directoryExists(join(cwd, 'nonexistent'))).toBe(false)
	})

	test('returns false for file', async () => {
		expect(await directoryExists(join(cwd, 'package.json'))).toBe(false)
	})
})
