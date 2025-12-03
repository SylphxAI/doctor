import { describe, expect, test } from 'bun:test'
import type { CheckContext, WorkspacePackage } from '../types'
import {
	getAllPackages,
	getPackageNames,
	isFrameworkBinding,
	isMonorepoRoot,
	isReExportPackage,
	needsTests,
} from './context'

// Mock context for testing
function createMockContext(overrides: Partial<CheckContext> = {}): CheckContext {
	return {
		cwd: '/tmp/test',
		packageJson: { name: 'root-pkg', version: '1.0.0' },
		severity: 'error',
		isMonorepo: false,
		workspacePackages: [],
		workspacePatterns: [],
		projectType: 'library',
		isSharedConfigSource: false,
		...overrides,
	}
}

function createWorkspacePackage(
	name: string,
	relativePath: string,
	overrides: Partial<WorkspacePackage> = {}
): WorkspacePackage {
	return {
		name,
		path: `/tmp/test/${relativePath}`,
		relativePath,
		packageJson: { name, version: '1.0.0' },
		projectType: 'library',
		ecosystem: 'typescript',
		...overrides,
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

describe('isFrameworkBinding', () => {
	test('detects -react suffix', () => {
		const pkg = createWorkspacePackage('rapid-signal-react', 'packages/rapid-signal-react')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('detects -vue suffix', () => {
		const pkg = createWorkspacePackage('rapid-signal-vue', 'packages/rapid-signal-vue')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('detects -preact suffix', () => {
		const pkg = createWorkspacePackage('rapid-signal-preact', 'packages/rapid-signal-preact')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('detects -svelte suffix', () => {
		const pkg = createWorkspacePackage('my-lib-svelte', 'packages/my-lib-svelte')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('detects react- prefix', () => {
		const pkg = createWorkspacePackage('react-query', 'packages/react-query')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('handles scoped packages', () => {
		const pkg = createWorkspacePackage('@scope/lib-react', 'packages/lib-react')
		expect(isFrameworkBinding(pkg)).toBe(true)
	})

	test('returns false for core packages', () => {
		const pkg = createWorkspacePackage('rapid-signal-core', 'packages/rapid-signal-core')
		expect(isFrameworkBinding(pkg)).toBe(false)
	})

	test('returns false for regular library', () => {
		const pkg = createWorkspacePackage('my-awesome-lib', 'packages/my-awesome-lib')
		expect(isFrameworkBinding(pkg)).toBe(false)
	})
})

describe('isReExportPackage', () => {
	test('detects package with -core dependency', () => {
		const pkg = createWorkspacePackage('rapid-signal', 'packages/rapid-signal', {
			packageJson: {
				name: 'rapid-signal',
				version: '1.0.0',
				dependencies: {
					'rapid-signal-core': 'workspace:*',
				},
			},
		})
		expect(isReExportPackage(pkg)).toBe(true)
	})

	test('detects scoped package with -core dependency', () => {
		const pkg = createWorkspacePackage('@scope/my-lib', 'packages/my-lib', {
			packageJson: {
				name: '@scope/my-lib',
				version: '1.0.0',
				dependencies: {
					'@scope/my-lib-core': 'workspace:*',
				},
			},
		})
		expect(isReExportPackage(pkg)).toBe(true)
	})

	test('detects -core in peerDependencies', () => {
		const pkg = createWorkspacePackage('rapid-router', 'packages/rapid-router', {
			packageJson: {
				name: 'rapid-router',
				version: '1.0.0',
				peerDependencies: {
					'rapid-router-core': '^1.0.0',
				},
			},
		})
		expect(isReExportPackage(pkg)).toBe(true)
	})

	test('returns false for core package itself', () => {
		const pkg = createWorkspacePackage('rapid-signal-core', 'packages/rapid-signal-core', {
			packageJson: {
				name: 'rapid-signal-core',
				version: '1.0.0',
				dependencies: {},
			},
		})
		expect(isReExportPackage(pkg)).toBe(false)
	})

	test('returns false for regular library', () => {
		const pkg = createWorkspacePackage('lodash', 'packages/lodash', {
			packageJson: {
				name: 'lodash',
				version: '1.0.0',
				dependencies: {
					typescript: '^5.0.0',
				},
			},
		})
		expect(isReExportPackage(pkg)).toBe(false)
	})
})

describe('needsTests', () => {
	test('returns true for regular library', () => {
		const pkg = createWorkspacePackage('my-lib', 'packages/my-lib')
		expect(needsTests(pkg)).toBe(true)
	})

	test('returns true for app', () => {
		const pkg = createWorkspacePackage('my-app', 'apps/my-app', {
			projectType: 'app',
		})
		expect(needsTests(pkg)).toBe(true)
	})

	test('returns false for config package', () => {
		const pkg = createWorkspacePackage('biome-config', 'packages/biome-config', {
			projectType: 'config',
		})
		expect(needsTests(pkg)).toBe(false)
	})

	test('returns false for example package', () => {
		const pkg = createWorkspacePackage('example-app', 'examples/app', {
			projectType: 'example',
		})
		expect(needsTests(pkg)).toBe(false)
	})

	test('returns false for framework binding', () => {
		const pkg = createWorkspacePackage('my-lib-react', 'packages/my-lib-react')
		expect(needsTests(pkg)).toBe(false)
	})

	test('returns false for re-export package', () => {
		const pkg = createWorkspacePackage('rapid-signal', 'packages/rapid-signal', {
			packageJson: {
				name: 'rapid-signal',
				version: '1.0.0',
				dependencies: {
					'rapid-signal-core': 'workspace:*',
				},
			},
		})
		expect(needsTests(pkg)).toBe(false)
	})

	test('returns true for core package', () => {
		const pkg = createWorkspacePackage('rapid-signal-core', 'packages/rapid-signal-core', {
			packageJson: {
				name: 'rapid-signal-core',
				version: '1.0.0',
				dependencies: {},
			},
		})
		expect(needsTests(pkg)).toBe(true)
	})
})
