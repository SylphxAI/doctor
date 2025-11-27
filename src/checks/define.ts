import type { Check, CheckContext, CheckResult, CheckStage, Severity } from '../types'
import type { PackageIssue } from '../utils/format'

/**
 * Check module definition
 */
export interface CheckModule {
	/** Category ID (e.g., 'files', 'config') */
	category: string
	/** Display label (e.g., '📁 Files') */
	label: string
	/** Module description */
	description: string
	/** Checks in this module */
	checks: Check[]
	/** Optional: Only enable module if this returns true */
	enabled?: (ctx: CheckContext) => boolean | Promise<boolean>
}

/**
 * Check definition options
 */
export interface DefineCheckOptions {
	/** Check name (e.g., 'files/readme') */
	name: string
	/** Category (auto-filled if using defineCheckModule) */
	category?: string
	/** Description */
	description: string
	/** Is this check fixable? */
	fixable?: boolean
	/** Which stages this check runs on (default: ['check']) */
	stages?: CheckStage[]
	/** The check function */
	check: (ctx: CheckContext) => Promise<CheckResultData> | CheckResultData
}

/**
 * Simplified check result (name/category auto-filled)
 */
export interface CheckResultData {
	passed: boolean
	message: string
	severity?: Severity
	hint?: string
	skipped?: boolean
	fix?: () => Promise<void>
}

/**
 * Alias for CheckResultData (more descriptive name)
 */
export type CheckReturnValue = CheckResultData

/**
 * Define a single check with less boilerplate
 */
export function defineCheck(options: DefineCheckOptions): Check {
	const { name, category, description, fixable = false, stages = [], check } = options

	return {
		name,
		category: category ?? name.split('/')[0] ?? 'unknown',
		description,
		fixable,
		stages,
		async run(ctx: CheckContext): Promise<CheckResult> {
			const result = await check(ctx)

			return {
				name,
				category: category ?? name.split('/')[0] ?? 'unknown',
				passed: result.passed,
				message: result.message,
				severity: result.severity ?? ctx.severity,
				fixable: fixable && !!result.fix,
				hint: result.hint,
				skipped: result.skipped,
				fix: result.fix,
			}
		},
	}
}

/**
 * Define a check module with multiple checks
 */
export function defineCheckModule(
	meta: Omit<CheckModule, 'checks'>,
	checks: Array<Omit<DefineCheckOptions, 'category'>>
): CheckModule {
	return {
		...meta,
		checks: checks.map((check) =>
			defineCheck({
				...check,
				category: meta.category,
			})
		),
	}
}

/**
 * File existence check helper
 */
export interface FileCheckOptions {
	name: string
	fileName: string
	fixable?: boolean
	fixContent?: string | (() => string)
	hint?: string
	/** Only check if condition is met */
	condition?: (ctx: CheckContext) => boolean
	/** Custom message when file exists */
	existsMessage?: string
	/** Custom message when file missing */
	missingMessage?: string
	/** Severity when check fails (default: uses ctx.severity) */
	severity?: Severity
	/** Which stages this check runs on (default: ['check']) */
	stages?: CheckStage[]
}

export function createFileCheck(options: FileCheckOptions): Omit<DefineCheckOptions, 'category'> {
	const {
		name,
		fileName,
		fixable = false,
		fixContent,
		hint,
		condition,
		existsMessage,
		missingMessage,
		severity,
		stages,
	} = options

	return {
		name,
		description: `Check if ${fileName} exists`,
		fixable,
		stages,
		async check(ctx) {
			// Skip if condition not met
			if (condition && !condition(ctx)) {
				return {
					passed: true,
					message: `${fileName} check skipped`,
					skipped: true,
				}
			}

			const { join } = await import('node:path')
			const { fileExists } = await import('../utils/fs')
			const filePath = join(ctx.cwd, fileName)
			const exists = fileExists(filePath)

			if (exists) {
				return {
					passed: true,
					message: existsMessage ?? `${fileName} exists`,
				}
			}

			const content = typeof fixContent === 'function' ? fixContent() : fixContent

			return {
				passed: false,
				message: missingMessage ?? `Missing ${fileName}`,
				hint:
					hint ??
					(fixable ? `Run with --fix to create ${fileName}` : `Create ${fileName} manually`),
				severity,
				fix:
					fixable && content
						? async () => {
								const { writeFileSync } = await import('node:fs')
								writeFileSync(filePath, content, 'utf-8')
							}
						: undefined,
			}
		},
	}
}

/**
 * JSON config check helper
 */
export interface JsonConfigCheckOptions {
	name: string
	fileName: string
	/** Validate the config, return error message or null if valid */
	validate: (config: unknown, ctx: CheckContext) => string | null
	/** Fix function */
	fix?: (currentConfig: unknown, ctx: CheckContext) => unknown
	hint?: string
	/** Skip if file doesn't exist */
	skipIfMissing?: boolean
	/** Which stages this check runs on (default: ['check']) */
	stages?: CheckStage[]
}

export function createJsonConfigCheck(
	options: JsonConfigCheckOptions
): Omit<DefineCheckOptions, 'category'> {
	const { name, fileName, validate, fix, hint, skipIfMissing = false, stages } = options

	return {
		name,
		description: `Check ${fileName} configuration`,
		fixable: !!fix,
		stages,
		async check(ctx) {
			const { join } = await import('node:path')
			const { fileExists, readJson } = await import('../utils/fs')
			const filePath = join(ctx.cwd, fileName)

			if (!fileExists(filePath)) {
				if (skipIfMissing) {
					return {
						passed: true,
						message: `${fileName} not found (skipped)`,
						skipped: true,
					}
				}
				return {
					passed: false,
					message: `${fileName} does not exist`,
					hint: `Create ${fileName}`,
				}
			}

			const config = readJson(filePath)
			const error = validate(config, ctx)

			if (!error) {
				return {
					passed: true,
					message: `${fileName} configuration valid`,
				}
			}

			return {
				passed: false,
				message: error,
				hint,
				fix: fix
					? async () => {
							const { writeFileSync } = await import('node:fs')
							const newConfig = fix(config, ctx)
							writeFileSync(filePath, JSON.stringify(newConfig, null, 2), 'utf-8')
						}
					: undefined,
			}
		},
	}
}

/**
 * Command existence check helper
 */
export interface CommandCheckOptions {
	name: string
	command: string
	args?: string[]
	/** Expected exit code (default: 0) */
	expectedExitCode?: number
	hint?: string
}

export function createCommandCheck(
	options: CommandCheckOptions
): Omit<DefineCheckOptions, 'category'> {
	const { name, command, args = [], expectedExitCode = 0, hint } = options

	return {
		name,
		description: `Check if ${command} succeeds`,
		fixable: false,
		async check(ctx) {
			const { exec } = await import('../utils/exec')

			try {
				const result = await exec(command, args, ctx.cwd)
				const passed = result.exitCode === expectedExitCode

				return {
					passed,
					message: passed ? `${command} check passed` : `${command} failed`,
					hint: passed ? undefined : hint,
				}
			} catch {
				return {
					passed: false,
					message: `${command} not found or failed`,
					hint,
				}
			}
		},
	}
}

/**
 * Monorepo-aware check helper
 * Automatically checks all packages when in monorepo root
 */
export interface MonorepoCheckOptions<T> {
	name: string
	description: string
	fixable?: boolean
	/** Which stages this check runs on (default: ['check']) */
	stages?: CheckStage[]
	/** Check a single package, return issue or null if passed */
	checkPackage: (
		pkg: import('../types').WorkspacePackage,
		ctx: CheckContext
	) => Promise<T | null> | T | null
	/** Format the issue for display */
	formatIssue: (issue: T, pkg: import('../types').WorkspacePackage) => string
	/** Optional: filter which packages to check (default: all) */
	filterPackages?: (
		packages: import('../types').WorkspacePackage[],
		ctx: CheckContext
	) => import('../types').WorkspacePackage[]
	/** Optional: fix function for a single package */
	fixPackage?: (
		pkg: import('../types').WorkspacePackage,
		issue: T,
		ctx: CheckContext
	) => Promise<void>
	/** Success message when all packages pass */
	successMessage?: (count: number) => string
	/** Failure message */
	failureMessage?: (issueCount: number, totalCount: number) => string
}

export function createMonorepoCheck<T>(
	options: MonorepoCheckOptions<T>
): Omit<DefineCheckOptions, 'category'> {
	const {
		name,
		description,
		fixable = false,
		stages,
		checkPackage,
		formatIssue,
		filterPackages,
		fixPackage,
		successMessage = (count) => `All ${count} package(s) passed`,
		failureMessage = (issues, total) => `${issues}/${total} package(s) have issues`,
	} = options

	return {
		name,
		description,
		fixable: fixable && !!fixPackage,
		stages,
		async check(ctx) {
			const { getAllPackages, isMonorepoRoot } = await import('../utils/context')
			const { formatPackageIssues } = await import('../utils/format')

			// Get packages to check
			const allPackages = isMonorepoRoot(ctx) ? getAllPackages(ctx) : []

			// For single package, just check root
			if (allPackages.length === 0 && ctx.packageJson) {
				const rootPkg: import('../types').WorkspacePackage = {
					name: ctx.packageJson.name ?? 'root',
					path: ctx.cwd,
					relativePath: '.',
					packageJson: ctx.packageJson,
				}
				const issue = await checkPackage(rootPkg, ctx)
				if (!issue) {
					return { passed: true, message: 'Check passed' }
				}
				return {
					passed: false,
					message: formatIssue(issue, rootPkg),
					fix: fixPackage ? async () => fixPackage(rootPkg, issue, ctx) : undefined,
				}
			}

			// Filter packages if needed
			const packages = filterPackages ? filterPackages(allPackages, ctx) : allPackages

			if (packages.length === 0) {
				return { passed: true, message: 'No packages to check', skipped: true }
			}

			// Check all packages
			const issues: Array<{ pkg: import('../types').WorkspacePackage; issue: T }> = []
			for (const pkg of packages) {
				const issue = await checkPackage(pkg, ctx)
				if (issue) {
					issues.push({ pkg, issue })
				}
			}

			if (issues.length === 0) {
				return { passed: true, message: successMessage(packages.length) }
			}

			// Format issues
			const packageIssues: PackageIssue[] = issues.map(({ pkg, issue }) => ({
				location: pkg.relativePath,
				issue: formatIssue(issue, pkg),
			}))

			return {
				passed: false,
				message: failureMessage(issues.length, packages.length),
				hint: formatPackageIssues(packageIssues),
				fix: fixPackage
					? async () => {
							for (const { pkg, issue } of issues) {
								await fixPackage(pkg, issue, ctx)
							}
						}
					: undefined,
			}
		},
	}
}
