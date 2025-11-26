/**
 * Utility exports
 */

// Environment utilities
export { isCI, isGitHubActions } from './env'

// Context utilities
export {
	isMonorepoRoot,
	forEachPackage,
	checkAllPackages,
	getPackageNames,
} from './context'

// Filesystem utilities
export {
	fileExists,
	readJson,
	readPackageJson,
	readFile,
	findFiles,
	directoryExists,
	getWorkspacePatterns,
	discoverWorkspacePackages,
	isMonorepo,
	findWorkspaceRoot,
} from './fs'

// Exec utilities
export { exec, type ExecResult } from './exec'

// Format utilities
export {
	formatPackageIssues,
	formatGroupedIssues,
	formatList,
	pluralize,
	formatCount,
	type PackageIssue,
} from './format'
