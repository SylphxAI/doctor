import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const testModule: CheckModule = defineCheckModule(
	{
		category: 'test',
		label: '🧪 Tests',
		description: 'Check test configuration and execution',
	},
	[
		{
			name: 'test/has-tests',
			description: 'Check if test files exist',
			fixable: false,
			async check(ctx) {
				const { findFiles } = await import('../utils/fs')

				const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
				const hasTests = testFiles.length > 0

				return {
					passed: hasTests,
					message: hasTests ? `Found ${testFiles.length} test file(s)` : 'No test files found',
					hint: hasTests ? undefined : 'Create test files with .test.ts or .spec.ts extension',
				}
			},
		},

		{
			name: 'test/passes',
			description: 'Check if tests pass',
			fixable: false,
			async check(ctx) {
				const { findFiles } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				// First check if there are any test files
				const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
				if (testFiles.length === 0) {
					return {
						passed: true,
						message: 'No tests to run',
					}
				}

				// Monorepo root uses turbo test, packages use bun test
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				const testCmd = isMonorepoRoot ? 'turbo' : 'bun'
				const testArgs = isMonorepoRoot ? ['test'] : ['test']

				const result = await exec(testCmd, testArgs, ctx.cwd)
				const passed = result.exitCode === 0

				const hintCmd = isMonorepoRoot ? 'turbo test' : 'bun test'

				return {
					passed,
					message: passed ? 'All tests passed' : 'Tests failed',
					hint: passed ? undefined : `Run "${hintCmd}" to see failing tests`,
				}
			},
		},

		{
			name: 'test/coverage-threshold',
			description: 'Check if test coverage meets threshold',
			fixable: false,
			async check(ctx) {
				const { findFiles } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const threshold = (ctx.options?.min as number) ?? 80

				// First check if there are any test files
				const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
				if (testFiles.length === 0) {
					return {
						passed: false,
						message: `No tests - coverage is 0% (threshold: ${threshold}%)`,
						hint: 'Create test files with .test.ts or .spec.ts extension',
					}
				}

				// Monorepo root uses turbo test, packages use bun test
				const isMonorepoRoot = ctx.isMonorepo && ctx.workspacePackages.length > 0
				const testCmd = isMonorepoRoot ? 'turbo' : 'bun'
				const testArgs = isMonorepoRoot ? ['test', '--', '--coverage'] : ['test', '--coverage']

				const result = await exec(testCmd, testArgs, ctx.cwd)

				// Parse coverage from output (simplified - actual implementation would parse properly)
				const coverageMatch = result.stdout.match(/(\d+(?:\.\d+)?)\s*%/)
				const coverage = coverageMatch?.[1] ? Number.parseFloat(coverageMatch[1]) : 0
				const passed = coverage >= threshold

				return {
					passed,
					message: passed
						? `Coverage ${coverage}% meets threshold (${threshold}%)`
						: `Coverage ${coverage}% below threshold (${threshold}%)`,
					hint: passed ? undefined : 'Add more tests to increase coverage',
				}
			},
		},

		{
			name: 'bench/has-files',
			description: 'Check if benchmark files exist when bench script is defined',
			fixable: false,
			async check(ctx) {
				const { findFiles } = await import('../utils/fs')

				const hasBenchScript = ctx.packageJson?.scripts?.bench

				if (!hasBenchScript) {
					return {
						passed: true,
						message: 'No bench script defined (skipped)',
					}
				}

				const benchFiles = await findFiles(ctx.cwd, /\.bench\.(ts|tsx|js|jsx)$/)
				const hasFiles = benchFiles.length > 0

				return {
					passed: hasFiles,
					message: hasFiles
						? `Found ${benchFiles.length} benchmark file(s)`
						: 'No benchmark files found (but bench script exists)',
					hint: hasFiles ? undefined : 'Create benchmark files with .bench.ts extension',
				}
			},
		},
	]
)

// Export for backward compatibility
export const testChecks: Check[] = testModule.checks
