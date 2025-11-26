export type Severity = 'error' | 'warn' | 'off'

export type PresetName = 'init' | 'dev' | 'stable'

export interface CheckResult {
	name: string
	category: string
	passed: boolean
	message: string
	severity: Severity
	fixable: boolean
	fix?: () => Promise<void>
	/** If true, this check was skipped (not applicable to this project) */
	skipped?: boolean
}

export interface CheckContext {
	cwd: string
	packageJson: PackageJson | null
	severity: Severity
	options?: Record<string, unknown>
	/** Whether the project is a monorepo (has workspaces or packages/) */
	isMonorepo: boolean
}

export interface Check {
	name: string
	category: string
	description: string
	fixable: boolean
	run: (ctx: CheckContext) => Promise<CheckResult>
}

export interface PackageJson {
	name?: string
	version?: string
	description?: string
	type?: string
	scripts?: Record<string, string>
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	exports?: unknown
	[key: string]: unknown
}

export interface DoctorConfig {
	preset?: PresetName
	rules?: Partial<Record<string, Severity>>
	options?: Record<string, Record<string, unknown>>
	ignore?: string[]
}

export interface PresetConfig {
	[checkName: string]: Severity
}

export interface CheckReport {
	total: number
	passed: number
	failed: number
	warnings: number
	results: CheckResult[]
}
