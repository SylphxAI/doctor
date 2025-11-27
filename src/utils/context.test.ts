import { describe, expect, test } from 'bun:test'
import type { CheckContext, WorkspacePackage } from '../types'
import { getAllPackages, getPackageNames, isMonorepoRoot } from './context'

// Mock context for testing
function createMockContext(overrides: Partial<CheckContext> = {}): CheckContext {
	return {
		cwd: '/tmp/test',
		packageJson: { name: 'root-pkg', version: '1.0.0' },
		severity: 'error',
		isMonorepo: false,
		workspacePackages: [],
		workspacePatterns: [],
		...overrides,
	}
}

function createWorkspacePackage(name: string, relativePath: string): WorkspacePackage {
	return {
		name,
		path: `/tmp/test/${relativePath}`,
		relativePath,
		packageJson: { name, version: '1.0.0' },
	}
}

describe('isMonorepoRoot', () => {
	test('returns false for non-monorepo', () => {
		const ctx = createMockContext({ isMonorepo: false })
		expect(isMonorepoRoot(ctx)).toBe(false)
	})

	test('returns false for monorepo without packages', () => {
		const ctx = createMockContext({ isMonorepo: true, workspacePackages: [] })
		expect(isMonorepoRoot(ctx)).toBe(false)
	})

	test('returns true for monorepo with packages', () => {
		const ctx = createMockContext({
			isMonorepo: true,
			workspacePackages: [createWorkspacePackage('pkg-a', 'packages/a')],
		})
		expect(isMonorepoRoot(ctx)).toBe(true)
	})
})

describe('getPackageNames', () => {
	test('returns empty set for no packages', () => {
		const ctx = createMockContext()
		const names = getPackageNames(ctx)
		expect(names.size).toBe(0)
	})

	test('returns all package names', () => {
		const ctx = createMockContext({
			workspacePackages: [
				createWorkspacePackage('pkg-a', 'packages/a'),
				createWorkspacePackage('pkg-b', 'packages/b'),
				createWorkspacePackage('pkg-c', 'packages/c'),
			],
		})
		const names = getPackageNames(ctx)
		expect(names.size).toBe(3)
		expect(names.has('pkg-a')).toBe(true)
		expect(names.has('pkg-b')).toBe(true)
		expect(names.has('pkg-c')).toBe(true)
	})
})

describe('getAllPackages', () => {
	test('includes root package', () => {
		const ctx = createMockContext({
			packageJson: { name: 'root', version: '1.0.0' },
		})
		const packages = getAllPackages(ctx)
		expect(packages).toHaveLength(1)
		expect(packages[0]?.name).toBe('root')
		expect(packages[0]?.relativePath).toBe('.')
	})

	test('includes root and workspace packages', () => {
		const ctx = createMockContext({
			packageJson: { name: 'root', version: '1.0.0' },
			workspacePackages: [createWorkspacePackage('pkg-a', 'packages/a'), createWorkspacePackage('pkg-b', 'packages/b')],
		})
		const packages = getAllPackages(ctx)
		expect(packages).toHaveLength(3)
		expect(packages[0]?.name).toBe('root')
		expect(packages[1]?.name).toBe('pkg-a')
		expect(packages[2]?.name).toBe('pkg-b')
	})

	test('returns empty array if no packageJson', () => {
		const ctx = createMockContext({ packageJson: null })
		const packages = getAllPackages(ctx)
		expect(packages).toHaveLength(0)
	})

	test('uses "root" as name if packageJson has no name', () => {
		const ctx = createMockContext({
			packageJson: { version: '1.0.0' }, // no name
		})
		const packages = getAllPackages(ctx)
		expect(packages[0]?.name).toBe('root')
	})
})
