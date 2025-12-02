import { join } from 'node:path'
import { checkModules } from './checks'
import { loadConfig, loadRootConfig } from './config'
import { getNextPreset, getSeverity } from './presets'
import type {
	Check,
	CheckContext,
	CheckReport,
	CheckResult,
	DoctorConfig,
	Ecosystem,
	HookName,
	PresetName,
	WorkspacePackage,
} from './types'
import { detectIsSharedConfigSource, detectProjectType } from './utils/context'
import {
	discoverWorkspacePackages,
	fileExists,
	findWorkspaceRoot,
	getWorkspacePatterns,
	hasSourceCode,
	isMonorepo,
	readPackageJson,
} from './utils/fs'

/**
 * Check if project has the specified ecosystem
 */
function hasEcosystem(cwd: string, ecosystem: Ecosystem): boolean {
	switch (ecosystem) {
		case 'typescript':
			return fileExists(join(cwd, 'package.json'))
		case 'rust':
			return fileExists(join(cwd, 'Cargo.toml'))
		case 'go':
			return fileExists(join(cwd, 'go.mod'))
		case 'python':
			return fileExists(join(cwd, 'pyproject.toml')) || fileExists(join(cwd, 'setup.py'))
		default:
			return true
	}
}

export interface RunOptions {
	cwd: string
	fix?: boolean
	preCommit?: boolean
	preset?: PresetName
	config?: DoctorConfig
	/** Filter checks by hook. If not specified, runs all checks. */
	hook?: HookName
}

/**
 * Load per-package configs for workspace packages
 * Each package inherits from root config and can override
 */
async function loadPackageConfigs(
	packages: WorkspacePackage[],
	rootConfig: DoctorConfig
): Promise<WorkspacePackage[]> {
	return Promise.all(
		packages.map(async (pkg) => {
			const pkgConfig = await loadConfig(pkg.path, rootConfig)
			return { ...pkg, config: pkgConfig }
		})
	)
}

export async function runChecks(options: RunOptions): Promise<CheckReport> {
	const { cwd, fix = false, preCommit = false, hook } = options

	// Load root config first
	const rootConfig = options.config ?? (await loadRootConfig(cwd))
	const config = rootConfig
	const preset = options.preset ?? config.preset ?? 'dev'

	// Load package.json
	const packageJson = readPackageJson(cwd)

	// Detect if monorepo and discover packages once
	const monorepo = await isMonorepo(cwd)
	const discoveredPackages = monorepo ? discoverWorkspacePackages(cwd) : []
	// Load per-package configs (each inherits from root)
	const workspacePackages = monorepo ? await loadPackageConfigs(discoveredPackages, rootConfig) : []
	const workspacePatterns = monorepo ? getWorkspacePatterns(cwd) : []
	const workspaceRoot = findWorkspaceRoot(cwd)

	// Detect project type for root
	const projectType = packageJson ? detectProjectType(packageJson, hasSourceCode(cwd)) : 'unknown'

	// Check if this is a shared config source (contains config packages)
	const isSharedConfigSource = detectIsSharedConfigSource({
		packageJson,
		workspacePackages,
	})

	// Filter checks based on module ecosystem/enabled and severity
	const checksToRun: { check: Check; ctx: CheckContext }[] = []

	for (const module of checkModules) {
		// Check module ecosystem filter
		if (module.ecosystem && !hasEcosystem(cwd, module.ecosystem)) {
			continue // Skip entire module if ecosystem doesn't match
		}

		// Check module custom enabled function
		if (module.enabled) {
			const baseCtx: CheckContext = {
				cwd,
				packageJson,
				severity: 'error', // placeholder
				isMonorepo: monorepo,
				workspacePackages,
				workspacePatterns,
				workspaceRoot,
				projectType,
				isSharedConfigSource,
			}
			const enabled = await module.enabled(baseCtx)
			if (!enabled) continue // Skip entire module if disabled
		}

		// Process checks in this module
		for (const check of module.checks) {
			// Filter by hook if specified (otherwise run all checks)
			// If check has hooks defined, it must include the specified hook
			// If check has no hooks (empty/undefined), it runs on all hooks
			if (hook && check.hooks && check.hooks.length > 0 && !check.hooks.includes(hook)) continue

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
				projectType,
				isSharedConfigSource,
			}

			checksToRun.push({ check, ctx })
		}
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

// Re-export from presets for backwards compatibility
export { getNextPreset } from './presets'

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
