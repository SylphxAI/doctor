import { getAllPackages, isMonorepoRoot } from '../utils/context'
import { type PackageIssue, formatPackageIssues } from '../utils/format'
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

				// For monorepo, check all packages
				if (isMonorepoRoot(ctx)) {
					const allPackages = getAllPackages(ctx)
					const issues: PackageIssue[] = []
					let totalTests = 0

					for (const pkg of allPackages) {
						const testFiles = await findFiles(pkg.path, /\.(test|spec)\.(ts|tsx|js|jsx)$/)
						if (testFiles.length === 0) {
							issues.push({ location: pkg.relativePath, issue: 'no test files' })
						} else {
							totalTests += testFiles.length
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `Found ${totalTests} test file(s) across ${allPackages.length} package(s)`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) have no tests (${totalTests} tests in others)`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package
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
			hooks: ['prepush'],
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
				const isRoot = isMonorepoRoot(ctx)
				const testCmd = isRoot ? 'turbo' : 'bun'
				const testArgs = isRoot ? ['test'] : ['test']

				const result = await exec(testCmd, testArgs, ctx.cwd)
				const passed = result.exitCode === 0

				const hintCmd = isRoot ? 'turbo test' : 'bun test'

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
				const isRoot = isMonorepoRoot(ctx)
				const testCmd = isRoot ? 'turbo' : 'bun'
				const testArgs = isRoot ? ['test', '--', '--coverage'] : ['test', '--coverage']

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

				// For monorepo, check all packages that have bench script
				if (isMonorepoRoot(ctx)) {
					const allPackages = getAllPackages(ctx)
					const issues: PackageIssue[] = []
					let packagesWithBench = 0
					let totalBenchFiles = 0

					for (const pkg of allPackages) {
						const hasBenchScript = pkg.packageJson.scripts?.bench
						if (!hasBenchScript) continue

						packagesWithBench++
						const benchFiles = await findFiles(pkg.path, /\.bench\.(ts|tsx|js|jsx)$/)
						if (benchFiles.length === 0) {
							issues.push({
								location: pkg.relativePath,
								issue: 'has bench script but no .bench.ts files',
							})
						} else {
							totalBenchFiles += benchFiles.length
						}
					}

					if (packagesWithBench === 0) {
						return {
							passed: true,
							message: 'No packages have bench script defined (skipped)',
							skipped: true,
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `Found ${totalBenchFiles} benchmark file(s) across ${packagesWithBench} package(s)`,
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing benchmark files`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package
				const hasBenchScript = ctx.packageJson?.scripts?.bench

				if (!hasBenchScript) {
					return {
						passed: true,
						message: 'No bench script defined (skipped)',
						skipped: true,
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

		{
			name: 'test/no-legacy-frameworks',
			description: 'Check for legacy test frameworks (use bun test instead)',
			fixable: true,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const banned = ['jest', 'vitest', 'mocha', 'chai', 'ts-jest', '@types/jest']

				const allDeps = {
					...ctx.packageJson?.dependencies,
					...ctx.packageJson?.devDependencies,
				}

				const found = banned.filter((pkg) => pkg in allDeps)

				if (found.length === 0) {
					return { passed: true, message: 'No legacy test frameworks' }
				}

				return {
					passed: false,
					message: `Found legacy test frameworks: ${found.join(', ')}`,
					hint: `Use bun test instead. Run: bun remove ${found.join(' ')}`,
					fix: async () => {
						await exec('bun', ['remove', ...found], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'test/no-jest-config',
			description: 'Check that Jest config does not exist (use bun test)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const jestFiles = ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.cjs']
				const found = jestFiles.filter((f) => fileExists(join(ctx.cwd, f)))

				// Also check package.json for jest config
				const pkg = ctx.packageJson as Record<string, unknown> | null
				const hasJestInPkg = pkg && 'jest' in pkg

				if (found.length === 0 && !hasJestInPkg) {
					return { passed: true, message: 'No Jest config (good)' }
				}

				const issues = [...found]
				if (hasJestInPkg) issues.push('package.json#jest')

				return {
					passed: false,
					message: `Found Jest config: ${issues.join(', ')}`,
					hint: 'Remove Jest config and use bun test',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},
	]
)
