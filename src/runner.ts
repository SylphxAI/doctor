import { allChecks } from './checks'
import { loadConfig } from './config'
import { getSeverity } from './presets'
import type {
	Check,
	CheckContext,
	CheckReport,
	CheckResult,
	CheckStage,
	DoctorConfig,
	PresetName,
} from './types'
import {
	discoverWorkspacePackages,
	findWorkspaceRoot,
	getWorkspacePatterns,
	isMonorepo,
	readPackageJson,
} from './utils/fs'

export interface RunOptions {
	cwd: string
	fix?: boolean
	preCommit?: boolean
	preset?: PresetName
	config?: DoctorConfig
	/** Filter checks by stage. If not specified, runs all checks. */
	stage?: CheckStage
}

export async function runChecks(options: RunOptions): Promise<CheckReport> {
	const { cwd, fix = false, preCommit = false, stage } = options

	// Load config
	const config = options.config ?? (await loadConfig(cwd))
	const preset = options.preset ?? config.preset ?? 'dev'

	// Load package.json
	const packageJson = readPackageJson(cwd)

	// Detect if monorepo and discover packages once
	const monorepo = await isMonorepo(cwd)
	const workspacePackages = monorepo ? discoverWorkspacePackages(cwd) : []
	const workspacePatterns = monorepo ? getWorkspacePatterns(cwd) : []
	const workspaceRoot = findWorkspaceRoot(cwd)

	// Filter checks based on severity
	const checksToRun: { check: Check; ctx: CheckContext }[] = []

	for (const check of allChecks) {
		// Filter by stage if specified (otherwise run all checks)
		if (stage && !check.stages.includes(stage)) continue

		const severity = getSeverity(check.name, preset, config.rules)

		// Skip if severity is 'off'
		if (severity === 'off') continue

		// In pre-commit mode, skip warnings
		if (preCommit && severity === 'warn') continue

		const ctx: CheckContext = {
			cwd,
			packageJson,
			severity,
			options: config.options?.[check.name],
			isMonorepo: monorepo,
			workspacePackages,
			workspacePatterns,
			workspaceRoot,
		}

		checksToRun.push({ check, ctx })
	}

	// Run all checks in parallel
	const results = await Promise.all(
		checksToRun.map(async ({ check, ctx }) => {
			const result = await check.run(ctx)
			return { check, ctx, result }
		})
	)

	// Process results and apply fixes sequentially (fixes may have side effects)
	let passed = 0
	let failed = 0
	let warnings = 0
	const finalResults: CheckResult[] = []

	for (const { check, ctx, result } of results) {
		if (result.passed) {
			passed++
			finalResults.push(result)
			continue
		}

		// Info severity doesn't count against score (just informational)
		if (result.severity === 'info') {
			passed++
			finalResults.push(result)
			continue
		}

		// Count as warning or error
		if (result.severity === 'warn') {
			warnings++
		} else {
			failed++
		}

		// Try to fix if requested and fixable
		if (fix && result.fixable && result.fix) {
			try {
				await result.fix()
				// Re-run check to verify fix worked
				const recheck = await check.run(ctx)
				if (recheck.passed) {
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

		finalResults.push(result)
	}

	return {
		total: finalResults.length,
		passed,
		failed,
		warnings,
		results: finalResults,
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
