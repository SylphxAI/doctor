import type { Check } from '../types'
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
					message: exists ? 'Found pnpm-lock.yaml - should use Bun instead' : 'No pnpm-lock.yaml (good)',
					fix: async () => {
						unlinkSync(lockPath)
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const runtimeChecks: Check[] = runtimeModule.checks
