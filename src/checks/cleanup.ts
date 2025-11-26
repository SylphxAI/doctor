import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/** Packages that should not be used (we use Bun ecosystem) */
const DEPRECATED_PACKAGES = [
	// Build tools (use bunup)
	'tsup',
	'esbuild',
	'rollup',
	'webpack',
	'parcel',
	'vite',
	// Test runners (use bun test)
	'vitest',
	'jest',
	'mocha',
	'ava',
	// TypeScript runners (use bun)
	'ts-node',
	'tsx',
	// Linters/formatters (use biome)
	'eslint',
	'prettier',
	// Changesets (use bump)
	'@changesets/cli',
	'@changesets/changelog-github',
	// Package managers
	'pnpm',
	'yarn',
]

export const cleanupModule: CheckModule = defineCheckModule(
	{
		category: 'cleanup',
		label: '🧹 Cleanup',
		description: 'Check for deprecated or unnecessary files/dependencies',
	},
	[
		{
			name: 'cleanup/no-changeset',
			description: 'Check that .changeset folder does not exist (use @sylphx/bump)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { rmSync } = await import('node:fs')
				const { directoryExists } = await import('../utils/fs')

				const changesetPath = join(ctx.cwd, '.changeset')
				const exists = await directoryExists(changesetPath)

				return {
					passed: !exists,
					message: exists
						? 'Found .changeset folder - use @sylphx/bump instead of changesets'
						: 'No .changeset folder (good)',
					hint: exists ? 'Remove .changeset folder and use @sylphx/bump for versioning' : undefined,
					fix: async () => {
						rmSync(changesetPath, { recursive: true, force: true })
					},
				}
			},
		},

		{
			name: 'cleanup/no-deprecated-deps',
			description: 'Check for deprecated/unnecessary dependencies',
			fixable: true,
			async check(ctx) {
				const pkg = ctx.packageJson
				if (!pkg) {
					return {
						passed: true,
						message: 'No package.json found',
						skipped: true,
					}
				}

				const allDeps = {
					...((pkg.dependencies as Record<string, string>) ?? {}),
					...((pkg.devDependencies as Record<string, string>) ?? {}),
				}

				const found = DEPRECATED_PACKAGES.filter((dep) => dep in allDeps)

				if (found.length === 0) {
					return {
						passed: true,
						message: 'No deprecated dependencies found',
					}
				}

				return {
					passed: false,
					message: `Found deprecated dependencies: ${found.join(', ')}`,
					hint: `Remove with: bun remove ${found.join(' ')}`,
					fix: async () => {
						const { execSync } = await import('node:child_process')
						execSync(`bun remove ${found.join(' ')}`, {
							cwd: ctx.cwd,
							stdio: 'pipe',
						})
					},
				}
			},
		},

		{
			name: 'cleanup/no-eslint-config',
			description: 'Check that ESLint config does not exist (use Biome)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const eslintFiles = [
					'.eslintrc',
					'.eslintrc.js',
					'.eslintrc.cjs',
					'.eslintrc.json',
					'.eslintrc.yml',
					'.eslintrc.yaml',
					'eslint.config.js',
					'eslint.config.mjs',
					'.eslintignore',
				]

				const found = eslintFiles.filter((f) => fileExists(join(ctx.cwd, f)))

				if (found.length === 0) {
					return {
						passed: true,
						message: 'No ESLint config files (good)',
					}
				}

				return {
					passed: false,
					message: `Found ESLint config: ${found.join(', ')} - use Biome instead`,
					hint: 'Remove ESLint config and use Biome for linting/formatting',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'cleanup/no-prettier-config',
			description: 'Check that Prettier config does not exist (use Biome)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const prettierFiles = [
					'.prettierrc',
					'.prettierrc.js',
					'.prettierrc.cjs',
					'.prettierrc.json',
					'.prettierrc.yml',
					'.prettierrc.yaml',
					'prettier.config.js',
					'prettier.config.mjs',
					'.prettierignore',
				]

				const found = prettierFiles.filter((f) => fileExists(join(ctx.cwd, f)))

				if (found.length === 0) {
					return {
						passed: true,
						message: 'No Prettier config files (good)',
					}
				}

				return {
					passed: false,
					message: `Found Prettier config: ${found.join(', ')} - use Biome instead`,
					hint: 'Remove Prettier config and use Biome for formatting',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'cleanup/no-jest-config',
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
					return {
						passed: true,
						message: 'No Jest config (good)',
					}
				}

				const issues = [...found]
				if (hasJestInPkg) issues.push('package.json#jest')

				return {
					passed: false,
					message: `Found Jest config: ${issues.join(', ')} - use bun test instead`,
					hint: 'Remove Jest config and use bun test',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'cleanup/no-tsconfig-build',
			description: 'Check for unnecessary tsconfig.build.json (bunup handles this)',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const buildConfig = join(ctx.cwd, 'tsconfig.build.json')
				const exists = fileExists(buildConfig)

				return {
					passed: !exists,
					message: exists
						? 'Found tsconfig.build.json - bunup handles build config'
						: 'No tsconfig.build.json (good)',
					hint: exists ? 'Remove tsconfig.build.json - bunup handles TypeScript compilation' : undefined,
					fix: async () => {
						unlinkSync(buildConfig)
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const cleanupChecks: Check[] = cleanupModule.checks
