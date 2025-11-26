import { allChecks } from './checks'
import { loadConfig } from './config'
import { getSeverity } from './presets'
import type { CheckContext, CheckReport, CheckResult, DoctorConfig, PresetName } from './types'
import { isMonorepo, readPackageJson } from './utils/fs'

export interface RunOptions {
	cwd: string
	fix?: boolean
	preCommit?: boolean
	preset?: PresetName
	config?: DoctorConfig
}

export async function runChecks(options: RunOptions): Promise<CheckReport> {
	const { cwd, fix = false, preCommit = false } = options

	// Load config
	const config = options.config ?? (await loadConfig(cwd))
	const preset = options.preset ?? config.preset ?? 'dev'

	// Load package.json
	const packageJson = readPackageJson(cwd)

	// Detect if monorepo
	const monorepo = await isMonorepo(cwd)

	const results: CheckResult[] = []
	let passed = 0
	let failed = 0
	let warnings = 0

	for (const check of allChecks) {
		// Get severity for this check based on preset and overrides
		const severity = getSeverity(check.name, preset, config.rules)

		// Skip if severity is 'off'
		if (severity === 'off') {
			continue
		}

		// In pre-commit mode, skip warnings
		if (preCommit && severity === 'warn') {
			continue
		}

		// Create context for this check
		const ctx: CheckContext = {
			cwd,
			packageJson,
			severity,
			options: config.options?.[check.name],
			isMonorepo: monorepo,
		}

		// Run the check
		const result = await check.run(ctx)
		results.push(result)

		if (result.passed) {
			passed++
		} else {
			// Count as warning or error
			if (result.severity === 'warn') {
				warnings++
			} else {
				failed++
			}

			// Try to fix if requested and fixable (both warnings and errors)
			if (fix && result.fixable && result.fix) {
				try {
					await result.fix()
					// Re-run check to verify fix worked
					const recheck = await check.run(ctx)
					if (recheck.passed) {
						// Update result
						result.passed = true
						result.message = `${result.message} (fixed)`
						passed++
						if (result.severity === 'warn') {
							warnings--
						} else {
							failed--
						}
					}
				} catch (error) {
					result.message = `${result.message} (fix failed: ${error})`
				}
			}
		}
	}

	return {
		total: results.length,
		passed,
		failed,
		warnings,
		results,
	}
}

export function getExitCode(report: CheckReport, preCommit: boolean): number {
	// In pre-commit mode, only errors matter
	if (preCommit) {
		return report.failed > 0 ? 1 : 0
	}

	// Otherwise, errors cause exit code 1
	return report.failed > 0 ? 1 : 0
}

/**
 * Get the next preset level
 */
export function getNextPreset(current: PresetName): PresetName | null {
	const levels: PresetName[] = ['init', 'dev', 'stable']
	const index = levels.indexOf(current)
	if (index >= levels.length - 1) return null
	return levels[index + 1] as PresetName
}

/**
 * Check if user is ready to upgrade to next preset
 * Returns upgrade readiness info
 */
export async function checkUpgradeReadiness(options: RunOptions): Promise<{
	ready: boolean
	nextPreset: PresetName | null
	currentScore: number
	nextScore: number
	blockers: number
}> {
	const { cwd } = options
	const config = options.config ?? (await loadConfig(cwd))
	const currentPreset = options.preset ?? config.preset ?? 'dev'

	const nextPreset = getNextPreset(currentPreset)

	if (!nextPreset) {
		return {
			ready: false,
			nextPreset: null,
			currentScore: 100,
			nextScore: 100,
			blockers: 0,
		}
	}

	// Run checks with next preset (silent, no fix)
	const nextReport = await runChecks({
		cwd,
		preset: nextPreset,
		config,
	})

	const nextScore =
		nextReport.total > 0 ? Math.round((nextReport.passed / nextReport.total) * 100) : 100
	const blockers = nextReport.failed + nextReport.warnings

	return {
		ready: blockers === 0,
		nextPreset,
		currentScore: 100, // Already passed current
		nextScore,
		blockers,
	}
}
