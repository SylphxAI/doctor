import type { Check, CheckContext, CheckResult } from '../types'
import { exec } from '../utils/exec'

export const biomeCheckCheck: Check = {
	name: 'format/biome-check',
	category: 'format',
	description: 'Run biome check',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const result = await exec('bunx', ['biome', 'check', '.'], ctx.cwd)
		const passed = result.exitCode === 0

		return {
			name: 'format/biome-check',
			category: 'format',
			passed,
			message: passed ? 'biome check passed' : 'biome check failed',
			severity: ctx.severity,
			fixable: true,
			hint: passed ? undefined : 'Run: bunx biome check --write . (or use --fix)',
			fix: async () => {
				await exec('bunx', ['biome', 'check', '--write', '.'], ctx.cwd)
			},
		}
	},
}

export const biomeFormatCheck: Check = {
	name: 'format/biome-format',
	category: 'format',
	description: 'Run biome format',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const result = await exec('bunx', ['biome', 'format', '.'], ctx.cwd)
		const passed = result.exitCode === 0

		return {
			name: 'format/biome-format',
			category: 'format',
			passed,
			message: passed ? 'biome format passed' : 'biome format failed - files need formatting',
			severity: ctx.severity,
			fixable: true,
			hint: passed ? undefined : 'Run: bunx biome format --write . (or use --fix)',
			fix: async () => {
				await exec('bunx', ['biome', 'format', '--write', '.'], ctx.cwd)
			},
		}
	},
}

export const formatChecks: Check[] = [biomeCheckCheck, biomeFormatCheck]
