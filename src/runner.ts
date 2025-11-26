import { allChecks } from './checks'
import { loadConfig } from './config'
import { getSeverity } from './presets'
import type { CheckContext, CheckReport, CheckResult, DoctorConfig, PresetName } from './types'
import { readPackageJson } from './utils/fs'

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
		}

		// Run the check
		const result = await check.run(ctx)
		results.push(result)

		if (result.passed) {
			passed++
		} else if (result.severity === 'warn') {
			warnings++
		} else {
			failed++

			// Try to fix if requested and fixable
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
						failed--
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
