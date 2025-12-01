export type Severity = 'error' | 'warn' | 'info' | 'off'

/**
 * Project types for intelligent check filtering
 * - 'config': Config-only packages (export JSON/YAML files, no TS/JS source)
 * - 'library': Regular packages with TS/JS code exports
 * - 'app': Applications (private, typically no exports)
 * - 'example': Example/demo packages (in examples/ directory, no tests/credits needed)
 * - 'unknown': Could not determine type
 */
export type ProjectType = 'config' | 'library' | 'app' | 'example' | 'unknown'

/**
 * All hook stages in the project lifecycle
 * - 'precommit': Before committing code (format, typecheck, lint)
 * - 'prepush': Before pushing to remote (test, validation)
 * - 'prepublish': Before publishing to npm (security guards)
 */
export type HookName = 'precommit' | 'prepush' | 'prepublish'

export interface Guard {
	name: string
	/** Which hooks this guard runs on */
	hooks: HookName[]
	/** Description */
	description: string
	/** Run the guard, return { passed, message } */
	run: () => Promise<{ passed: boolean; message: string }>
}

export interface InfoMessage {
	name: string
	/** Which hooks this info shows on */
	hooks: HookName[]
	/** Get the message to display */
	message: () => string
}

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
	/** Hint on how to fix the issue (shown when check fails) */
	hint?: string
}

/** Info about a package in a monorepo */
export interface WorkspacePackage {
	/** Package name from package.json */
	name: string
	/** Absolute path to package directory */
	path: string
	/** Relative path from root (e.g., "packages/foo") */
	relativePath: string
	/** Package.json contents */
	packageJson: PackageJson
	/** Detected project type */
	projectType: ProjectType
}

export interface CheckContext {
	cwd: string
	packageJson: PackageJson | null
	severity: Severity
	options?: Record<string, unknown>
	/** Whether the project is a monorepo (has workspaces or packages/) */
	isMonorepo: boolean
	/** List of workspace packages (only for monorepos) */
	workspacePackages: WorkspacePackage[]
	/** Workspace patterns from package.json (e.g., ["packages/*"]) */
	workspacePatterns: string[]
	/** Root directory of the workspace (if running from within a workspace package) */
	workspaceRoot?: string
	/** Detected project type for root package */
	projectType: ProjectType
	/** Whether this project IS a shared config source (e.g., @sylphx/biome-config) */
	isSharedConfigSource: boolean
}

export interface Check {
	name: string
	category: string
	description: string
	fixable: boolean
	/** Which hooks this check runs on. Empty = runs on all hooks. */
	hooks?: HookName[]
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
