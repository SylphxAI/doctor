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
				const { fileExists } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const hasBiomeConfig = fileExists(join(ctx.cwd, 'biome.json'))

				// Skip if no biome config
				if (!hasBiomeConfig) {
					return { passed: true, message: 'No biome.json (skipped)', skipped: true }
				}

				const devDeps = ctx.packageJson?.devDependencies ?? {}
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
				const { exec } = await import('../utils/exec')

				// Banned linting/formatting packages
				const banned = [
					'eslint',
					'prettier',
					'@typescript-eslint/parser',
					'@typescript-eslint/eslint-plugin',
					'eslint-config-prettier',
					'eslint-plugin-prettier',
				]

				const allDeps = {
					...ctx.packageJson?.dependencies,
					...ctx.packageJson?.devDependencies,
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
			name: 'format/no-eslint-config',
			description: 'Check that ESLint config does not exist (use biome)',
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
					return { passed: true, message: 'No ESLint config files (good)' }
				}

				return {
					passed: false,
					message: `Found ESLint config: ${found.join(', ')}`,
					hint: 'Remove ESLint config and use biome',
					fix: async () => {
						for (const f of found) {
							unlinkSync(join(ctx.cwd, f))
						}
					},
				}
			},
		},

		{
			name: 'format/no-prettier-config',
			description: 'Check that Prettier config does not exist (use biome)',
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
					return { passed: true, message: 'No Prettier config files (good)' }
				}

				return {
					passed: false,
					message: `Found Prettier config: ${found.join(', ')}`,
					hint: 'Remove Prettier config and use biome',
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
