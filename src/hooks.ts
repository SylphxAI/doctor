import pc from 'picocolors'
import { formatPreCommitReport } from './reporter'
import { runChecks } from './runner'
import type { CheckReport, DoctorConfig, Guard, HookName, InfoMessage, PresetName } from './types'

// ============================================
// HOOK FILTERING FUNCTIONS
// ============================================

/**
 * Get guards that run on a specific hook
 */
export function getGuardsForHook(guards: Guard[], hook: HookName): Guard[] {
	return guards.filter((g) => g.hooks.includes(hook))
}

/**
 * Get info messages that show on a specific hook
 */
export function getInfoForHook(info: InfoMessage[], hook: HookName): InfoMessage[] {
	return info.filter((i) => i.hooks.includes(hook))
}

// ============================================
// HOOK RUNNER OPTIONS
// ============================================

export interface RunHookOptions {
	cwd: string
	preset: PresetName
	config: DoctorConfig
	fix?: boolean
	/** Guards to check */
	guards: Guard[]
	/** Info messages to show */
	info: InfoMessage[]
}

export interface RunHookResult {
	/** Whether all guards and checks passed */
	success: boolean
	/** Check report (if checks were run) */
	report?: CheckReport
	/** Guard that failed (if any) */
	failedGuard?: Guard
	/** Guard failure message */
	guardMessage?: string
}

// ============================================
// GENERIC HOOK RUNNER
// ============================================

/**
 * Run a complete hook lifecycle:
 * 1. Run guards (fail fast if any fail)
 * 2. Run checks for this hook
 * 3. Show info messages
 * 4. Return result
 */
export async function runHook(hook: HookName, options: RunHookOptions): Promise<RunHookResult> {
	const { cwd, preset, config, fix = false, guards, info } = options

	// 1. Run guards for this hook (fail fast)
	const hookGuards = getGuardsForHook(guards, hook)
	for (const guard of hookGuards) {
		const result = await guard.run()
		if (!result.passed) {
			return {
				success: false,
				failedGuard: guard,
				guardMessage: result.message,
			}
		}
	}

	// 2. Run checks for this hook
	const report = await runChecks({
		cwd,
		fix,
		preset,
		config,
		hook,
		preCommit: hook === 'precommit',
	})

	// 3. Print report
	console.log(formatPreCommitReport(report))

	// 4. Show info messages for this hook
	const hookInfo = getInfoForHook(info, hook)
	for (const i of hookInfo) {
		console.log(pc.dim(i.message()))
	}

	return {
		success: report.failed === 0,
		report,
	}
}

/**
 * Print guard failure message and exit
 */
export function printGuardFailure(guard: Guard, message: string): void {
	console.log()
	console.log(pc.red(`❌ ${guard.description}`))
	console.log()
	console.log(message)
	console.log()
}
