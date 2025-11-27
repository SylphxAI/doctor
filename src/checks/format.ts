import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const formatModule: CheckModule = defineCheckModule(
	{
		category: 'format',
		label: '✨ Format',
		description: 'Check code formatting and linting',
	},
	[
		{
			name: 'format/biome-check',
			description: 'Run biome check',
			fixable: true,
			// Not in commit stage - lefthook runs biome directly for staging
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('bunx', ['biome', 'check', '.'], ctx.cwd)
				const passed = result.exitCode === 0

				return {
					passed,
					message: passed ? 'biome check passed' : 'biome check failed',
					hint: passed ? undefined : 'Run: bunx biome check --write . (or use --fix)',
					fix: async () => {
						await exec('bunx', ['biome', 'check', '--write', '.'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'format/biome-format',
			description: 'Run biome format',
			fixable: true,
			// Not in commit stage - lefthook runs biome directly for staging
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('bunx', ['biome', 'format', '.'], ctx.cwd)
				const passed = result.exitCode === 0

				return {
					passed,
					message: passed ? 'biome format passed' : 'biome format failed - files need formatting',
					hint: passed ? undefined : 'Run: bunx biome format --write . (or use --fix)',
					fix: async () => {
						await exec('bunx', ['biome', 'format', '--write', '.'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'format/biome-dep',
			description: 'Check if biome is in devDependencies',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const hasBiomeConfig = fileExists(join(ctx.cwd, 'biome.json'))

				// Skip if no biome config
				if (!hasBiomeConfig) {
					return { passed: true, message: 'No biome.json (skipped)', skipped: true }
				}

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasBiome = '@biomejs/biome' in devDeps

				return {
					passed: hasBiome,
					message: hasBiome
						? '@biomejs/biome in devDependencies'
						: '@biomejs/biome missing from devDependencies',
					hint: hasBiome ? undefined : 'Run: bun add -D @biomejs/biome',
					fix: async () => {
						await exec('bun', ['add', '-D', '@biomejs/biome'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'format/no-eslint',
			description: 'Check for legacy linting tools (use biome instead)',
			fixable: true,
			async check(ctx) {
				const { readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				// Banned linting/formatting packages - biome is mandatory
				const banned = [
					'eslint',
					'prettier',
					'@typescript-eslint/parser',
					'@typescript-eslint/eslint-plugin',
					'eslint-config-prettier',
					'eslint-plugin-prettier',
					'eslint-plugin-import',
					'eslint-plugin-react',
					'eslint-plugin-react-hooks',
				]

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const allDeps = {
					...packageJson?.dependencies,
					...packageJson?.devDependencies,
				}

				const found = banned.filter((pkg) => pkg in allDeps)

				if (found.length === 0) {
					return { passed: true, message: 'No legacy linting tools' }
				}

				return {
					passed: false,
					message: `Found legacy linting tools: ${found.join(', ')}`,
					hint: `Use biome instead. Run: bun remove ${found.join(' ')}`,
					fix: async () => {
						await exec('bun', ['remove', ...found], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'format/eslint-config-orphan',
			description: 'Check for orphaned ESLint config (no eslint in deps)',
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
					return { passed: true, message: 'No ESLint config files' }
				}

				// Check if eslint is actually installed
				const deps = {
					...ctx.packageJson?.dependencies,
					...ctx.packageJson?.devDependencies,
				}
				const hasEslint = 'eslint' in deps

				// If eslint is installed, config is expected - skip
				if (hasEslint) {
					return {
						passed: true,
						message: 'ESLint config exists (eslint installed)',
						skipped: true,
					}
				}

				// Orphaned config - eslint not installed but config exists
				return {
					passed: false,
					message: `Orphaned ESLint config: ${found.join(', ')}`,
					hint: 'ESLint is not installed but config exists. Remove config files.',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'format/prettier-config-orphan',
			description: 'Check for orphaned Prettier config (no prettier in deps)',
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
					return { passed: true, message: 'No Prettier config files' }
				}

				// Check if prettier is actually installed
				const deps = {
					...ctx.packageJson?.dependencies,
					...ctx.packageJson?.devDependencies,
				}
				const hasPrettier = 'prettier' in deps

				// If prettier is installed, config is expected - skip
				if (hasPrettier) {
					return {
						passed: true,
						message: 'Prettier config exists (prettier installed)',
						skipped: true,
					}
				}

				// Orphaned config - prettier not installed but config exists
				return {
					passed: false,
					message: `Orphaned Prettier config: ${found.join(', ')}`,
					hint: 'Prettier is not installed but config exists. Remove config files.',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'format/typecheck',
			description: 'Run TypeScript type checking',
			fixable: false,
			hooks: ['precommit'],
			// TODO: unsure if commit or push stage is best for typecheck
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				// Skip if no tsconfig
				if (!fileExists(join(ctx.cwd, 'tsconfig.json'))) {
					return { passed: true, message: 'No tsconfig.json (skipped)', skipped: true }
				}

				const result = await exec('bun', ['--bun', 'tsc', '--noEmit'], ctx.cwd)
				const passed = result.exitCode === 0

				return {
					passed,
					message: passed ? 'Type check passed' : 'Type errors found',
					hint: passed ? undefined : 'Run: bun --bun tsc --noEmit',
				}
			},
		},
	]
)
