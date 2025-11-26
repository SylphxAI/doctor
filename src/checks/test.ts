import type { Check, CheckContext, CheckResult } from '../types'
import { exec } from '../utils/exec'
import { findFiles } from '../utils/fs'

export const hasTestsCheck: Check = {
	name: 'test/has-tests',
	category: 'test',
	description: 'Check if test files exist',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
		const hasTests = testFiles.length > 0

		return {
			name: 'test/has-tests',
			category: 'test',
			passed: hasTests,
			message: hasTests ? `Found ${testFiles.length} test file(s)` : 'No test files found',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const testPassesCheck: Check = {
	name: 'test/passes',
	category: 'test',
	description: 'Check if tests pass',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		// First check if there are any test files
		const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
		if (testFiles.length === 0) {
			return {
				name: 'test/passes',
				category: 'test',
				passed: true,
				message: 'No tests to run',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const result = await exec('bun', ['test'], ctx.cwd)
		const passed = result.exitCode === 0

		return {
			name: 'test/passes',
			category: 'test',
			passed,
			message: passed ? 'All tests passed' : 'Tests failed',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const coverageThresholdCheck: Check = {
	name: 'test/coverage-threshold',
	category: 'test',
	description: 'Check if test coverage meets threshold',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const threshold = (ctx.options?.min as number) ?? 80

		// First check if there are any test files
		const testFiles = await findFiles(ctx.cwd, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
		if (testFiles.length === 0) {
			return {
				name: 'test/coverage-threshold',
				category: 'test',
				passed: false,
				message: `No tests - coverage is 0% (threshold: ${threshold}%)`,
				severity: ctx.severity,
				fixable: false,
			}
		}

		const result = await exec('bun', ['test', '--coverage'], ctx.cwd)

		// Parse coverage from output (simplified - actual implementation would parse properly)
		const coverageMatch = result.stdout.match(/(\d+(?:\.\d+)?)\s*%/)
		const coverage = coverageMatch?.[1] ? Number.parseFloat(coverageMatch[1]) : 0
		const passed = coverage >= threshold

		return {
			name: 'test/coverage-threshold',
			category: 'test',
			passed,
			message: passed
				? `Coverage ${coverage}% meets threshold (${threshold}%)`
				: `Coverage ${coverage}% below threshold (${threshold}%)`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const benchHasFilesCheck: Check = {
	name: 'bench/has-files',
	category: 'test',
	description: 'Check if benchmark files exist when bench script is defined',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const hasBenchScript = ctx.packageJson?.scripts?.bench

		if (!hasBenchScript) {
			return {
				name: 'bench/has-files',
				category: 'test',
				passed: true,
				message: 'No bench script defined (skipped)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const benchFiles = await findFiles(ctx.cwd, /\.bench\.(ts|tsx|js|jsx)$/)
		const hasFiles = benchFiles.length > 0

		return {
			name: 'bench/has-files',
			category: 'test',
			passed: hasFiles,
			message: hasFiles
				? `Found ${benchFiles.length} benchmark file(s)`
				: 'No benchmark files found (but bench script exists)',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const testChecks: Check[] = [
	hasTestsCheck,
	testPassesCheck,
	coverageThresholdCheck,
	benchHasFilesCheck,
]
