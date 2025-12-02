import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const runtimeModule: CheckModule = defineCheckModule(
	{
		category: 'runtime',
		label: '⚡ Runtime',
		description: 'Check runtime configuration (Bun)',
	},
	[
		{
			name: 'runtime/bun-lock',
			description: 'Check if bun lockfile exists (using Bun)',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')

				// Check for both bun.lock (newer) and bun.lockb (older)
				const hasNewLock = fileExists(join(ctx.cwd, 'bun.lock'))
				const hasOldLock = fileExists(join(ctx.cwd, 'bun.lockb'))
				const exists = hasNewLock || hasOldLock

				return {
					passed: exists,
					message: exists
						? `Using Bun (${hasNewLock ? 'bun.lock' : 'bun.lockb'} exists)`
						: 'Missing bun lockfile - run "bun install"',
				}
			},
		},

		{
			name: 'runtime/no-npm-lock',
			description: 'Check that package-lock.json does not exist',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const lockPath = join(ctx.cwd, 'package-lock.json')
				const exists = fileExists(lockPath)

				return {
					passed: !exists,
					message: exists
						? 'Found package-lock.json - should use Bun instead'
						: 'No package-lock.json (good)',
					fix: async () => {
						unlinkSync(lockPath)
					},
				}
			},
		},

		{
			name: 'runtime/no-yarn-lock',
			description: 'Check that yarn.lock does not exist',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const lockPath = join(ctx.cwd, 'yarn.lock')
				const exists = fileExists(lockPath)

				return {
					passed: !exists,
					message: exists ? 'Found yarn.lock - should use Bun instead' : 'No yarn.lock (good)',
					fix: async () => {
						unlinkSync(lockPath)
					},
				}
			},
		},

		{
			name: 'runtime/no-pnpm-lock',
			description: 'Check that pnpm-lock.yaml does not exist',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { unlinkSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				const lockPath = join(ctx.cwd, 'pnpm-lock.yaml')
				const exists = fileExists(lockPath)

				return {
					passed: !exists,
					message: exists
						? 'Found pnpm-lock.yaml - should use Bun instead'
						: 'No pnpm-lock.yaml (good)',
					fix: async () => {
						unlinkSync(lockPath)
					},
				}
			},
		},

		{
			name: 'runtime/no-ts-node',
			description: 'Check for legacy TS execution tools (use bun instead)',
			fixable: true,
			async check(ctx) {
				const { checkBannedDeps } = await import('../utils/context')
				const { exec } = await import('../utils/exec')

				const banned = ['ts-node', 'tsx', 'ts-node-dev']
				const { found, issues } = checkBannedDeps(ctx, banned)

				if (found.length === 0) {
					return { passed: true, message: 'No legacy TS execution tools' }
				}

				const message =
					issues.length === 1
						? `Found legacy TS tools: ${found.join(', ')}`
						: `Found legacy TS tools in ${issues.length} package(s): ${found.join(', ')}`

				return {
					passed: false,
					message,
					hint: `Use bun instead (bun runs TS natively). Run: bun remove ${found.join(' ')}`,
					fix: async () => {
						await exec('bun', ['remove', ...found], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'runtime/no-other-pkg-managers',
			description: 'Check for other package managers in dependencies (use bun instead)',
			fixable: true,
			async check(ctx) {
				const { checkBannedDeps } = await import('../utils/context')
				const { exec } = await import('../utils/exec')

				const banned = ['npm', 'yarn', 'pnpm']
				const { found, issues } = checkBannedDeps(ctx, banned)

				if (found.length === 0) {
					return { passed: true, message: 'No other package managers in dependencies' }
				}

				const message =
					issues.length === 1
						? `Found other package managers: ${found.join(', ')}`
						: `Found other package managers in ${issues.length} package(s): ${found.join(', ')}`

				return {
					passed: false,
					message,
					hint: `Use bun instead. Run: bun remove ${found.join(' ')}`,
					fix: async () => {
						await exec('bun', ['remove', ...found], ctx.cwd)
					},
				}
			},
		},
	]
)
