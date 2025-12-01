import { describe, expect, test } from 'bun:test'
import type { CheckContext } from '../types'
import { defineCheck, defineCheckModule } from './define'

// Mock context for testing
function createMockContext(overrides: Partial<CheckContext> = {}): CheckContext {
	return {
		cwd: '/tmp/test',
		packageJson: { name: 'test-pkg', version: '1.0.0' },
		severity: 'error',
		isMonorepo: false,
		workspacePackages: [],
		workspacePatterns: [],
		projectType: 'library',
		isSharedConfigSource: false,
		...overrides,
	}
}

describe('defineCheck', () => {
	test('creates a check with correct name and category', async () => {
		const check = defineCheck({
			name: 'test/example',
			description: 'Example check',
			check: () => ({ passed: true, message: 'OK' }),
		})

		expect(check.name).toBe('test/example')
		expect(check.category).toBe('test')
		expect(check.description).toBe('Example check')
		expect(check.fixable).toBe(false)
	})

	test('runs check and returns result', async () => {
		const check = defineCheck({
			name: 'test/passing',
			description: 'Always passes',
			check: () => ({ passed: true, message: 'All good' }),
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.passed).toBe(true)
		expect(result.message).toBe('All good')
		expect(result.name).toBe('test/passing')
		expect(result.category).toBe('test')
	})

	test('inherits severity from context', async () => {
		const check = defineCheck({
			name: 'test/severity',
			description: 'Test severity',
			check: () => ({ passed: false, message: 'Failed' }),
		})

		const ctx = createMockContext({ severity: 'warn' })
		const result = await check.run(ctx)

		expect(result.severity).toBe('warn')
	})

	test('allows overriding severity in result', async () => {
		const check = defineCheck({
			name: 'test/override',
			description: 'Override severity',
			check: () => ({ passed: false, message: 'Failed', severity: 'info' }),
		})

		const ctx = createMockContext({ severity: 'error' })
		const result = await check.run(ctx)

		expect(result.severity).toBe('info')
	})

	test('marks as fixable when fix function provided', async () => {
		const check = defineCheck({
			name: 'test/fixable',
			description: 'Fixable check',
			fixable: true,
			check: () => ({
				passed: false,
				message: 'Needs fix',
				fix: async () => {
					/* fix something */
				},
			}),
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.fixable).toBe(true)
		expect(result.fix).toBeDefined()
	})

	test('not fixable without fix function', async () => {
		const check = defineCheck({
			name: 'test/no-fix',
			description: 'No fix provided',
			fixable: true,
			check: () => ({ passed: false, message: 'Needs manual fix' }),
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.fixable).toBe(false)
	})

	test('supports async check function', async () => {
		const check = defineCheck({
			name: 'test/async',
			description: 'Async check',
			check: async () => {
				await new Promise((resolve) => setTimeout(resolve, 1))
				return { passed: true, message: 'Async done' }
			},
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.passed).toBe(true)
		expect(result.message).toBe('Async done')
	})

	test('includes hint in result', async () => {
		const check = defineCheck({
			name: 'test/hint',
			description: 'Check with hint',
			check: () => ({
				passed: false,
				message: 'Failed',
				hint: 'Try this fix',
			}),
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.hint).toBe('Try this fix')
	})

	test('marks as skipped when appropriate', async () => {
		const check = defineCheck({
			name: 'test/skip',
			description: 'Skippable check',
			check: () => ({
				passed: true,
				message: 'Not applicable',
				skipped: true,
			}),
		})

		const ctx = createMockContext()
		const result = await check.run(ctx)

		expect(result.skipped).toBe(true)
	})
})

describe('defineCheckModule', () => {
	test('creates module with correct metadata', () => {
		const module = defineCheckModule(
			{
				category: 'test',
				label: '🧪 Test',
				description: 'Test module',
			},
			[
				{
					name: 'test/one',
					description: 'First check',
					check: () => ({ passed: true, message: 'OK' }),
				},
				{
					name: 'test/two',
					description: 'Second check',
					check: () => ({ passed: true, message: 'OK' }),
				},
			]
		)

		expect(module.category).toBe('test')
		expect(module.label).toBe('🧪 Test')
		expect(module.description).toBe('Test module')
		expect(module.checks).toHaveLength(2)
	})

	test('assigns category to all checks', () => {
		const module = defineCheckModule(
			{
				category: 'mycat',
				label: 'My Category',
				description: 'Test',
			},
			[
				{
					name: 'mycat/check1',
					description: 'Check 1',
					check: () => ({ passed: true, message: 'OK' }),
				},
			]
		)

		expect(module.checks[0]?.category).toBe('mycat')
	})

	test('checks run correctly through module', async () => {
		const module = defineCheckModule(
			{
				category: 'run',
				label: 'Run Test',
				description: 'Test running',
			},
			[
				{
					name: 'run/test',
					description: 'Running test',
					check: (ctx) => ({
						passed: ctx.packageJson?.name === 'test-pkg',
						message: `Package: ${ctx.packageJson?.name}`,
					}),
				},
			]
		)

		const ctx = createMockContext()
		const result = await module.checks[0]?.run(ctx)

		expect(result?.passed).toBe(true)
		expect(result?.message).toBe('Package: test-pkg')
	})
})
