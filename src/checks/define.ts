import type { Check, CheckContext, CheckResult, Severity } from '../types'

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
 * Define a single check with less boilerplate
 */
export function defineCheck(options: DefineCheckOptions): Check {
	const { name, category, description, fixable = false, check } = options

	return {
		name,
		category: category ?? name.split('/')[0] ?? 'unknown',
		description,
		fixable,
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
	} = options

	return {
		name,
		description: `Check if ${fileName} exists`,
		fixable,
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
				hint: hint ?? (fixable ? `Run with --fix to create ${fileName}` : `Create ${fileName} manually`),
				fix: fixable && content
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
}

export function createJsonConfigCheck(options: JsonConfigCheckOptions): Omit<DefineCheckOptions, 'category'> {
	const { name, fileName, validate, fix, hint, skipIfMissing = false } = options

	return {
		name,
		description: `Check ${fileName} configuration`,
		fixable: !!fix,
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

export function createCommandCheck(options: CommandCheckOptions): Omit<DefineCheckOptions, 'category'> {
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
