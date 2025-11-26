import { unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { fileExists } from '../utils/fs'

export const bunLockCheck: Check = {
	name: 'runtime/bun-lock',
	category: 'runtime',
	description: 'Check if bun lockfile exists (using Bun)',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		// Check for both bun.lock (newer) and bun.lockb (older)
		const hasNewLock = fileExists(join(ctx.cwd, 'bun.lock'))
		const hasOldLock = fileExists(join(ctx.cwd, 'bun.lockb'))
		const exists = hasNewLock || hasOldLock

		return {
			name: 'runtime/bun-lock',
			category: 'runtime',
			passed: exists,
			message: exists
				? `Using Bun (${hasNewLock ? 'bun.lock' : 'bun.lockb'} exists)`
				: 'Missing bun lockfile - run "bun install"',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const noNpmLockCheck: Check = {
	name: 'runtime/no-npm-lock',
	category: 'runtime',
	description: 'Check that package-lock.json does not exist',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const lockPath = join(ctx.cwd, 'package-lock.json')
		const exists = fileExists(lockPath)

		return {
			name: 'runtime/no-npm-lock',
			category: 'runtime',
			passed: !exists,
			message: exists
				? 'Found package-lock.json - should use Bun instead'
				: 'No package-lock.json (good)',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				unlinkSync(lockPath)
			},
		}
	},
}

export const noYarnLockCheck: Check = {
	name: 'runtime/no-yarn-lock',
	category: 'runtime',
	description: 'Check that yarn.lock does not exist',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const lockPath = join(ctx.cwd, 'yarn.lock')
		const exists = fileExists(lockPath)

		return {
			name: 'runtime/no-yarn-lock',
			category: 'runtime',
			passed: !exists,
			message: exists ? 'Found yarn.lock - should use Bun instead' : 'No yarn.lock (good)',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				unlinkSync(lockPath)
			},
		}
	},
}

export const runtimeChecks: Check[] = [bunLockCheck, noNpmLockCheck, noYarnLockCheck]
