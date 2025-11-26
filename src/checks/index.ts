import type { Check } from '../types'
import type { CheckModule } from './define'

// Import all check modules (new modular format)
import { buildModule } from './build'
import { ciModule } from './ci'
import { cleanupModule } from './cleanup'
import { configModule } from './config'
import { depsModule } from './deps'
import { docsModule } from './docs'
import { filesModule } from './files'
import { formatModule } from './format'
import { githubModule } from './github'
import { hooksModule } from './hooks'
import { monorepoModule } from './monorepo'
import { packageModule } from './package'
import { runtimeModule } from './runtime'
import { testModule } from './test'

/**
 * All check modules
 */
export const checkModules: CheckModule[] = [
	filesModule,
	configModule,
	ciModule,
	packageModule,
	depsModule,
	testModule,
	formatModule,
	buildModule,
	runtimeModule,
	cleanupModule,
	docsModule,
	hooksModule,
	githubModule,
	monorepoModule,
]

/**
 * All checks (combined from all modules)
 */
export const allChecks: Check[] = checkModules.flatMap((m) => m.checks)

/**
 * Checks indexed by name
 */
export const checksByName: Map<string, Check> = new Map(
	allChecks.map((check) => [check.name, check])
)

/**
 * Get a check by name
 */
export function getCheck(name: string): Check | undefined {
	return checksByName.get(name)
}

/**
 * Get checks by category
 */
export function getChecksByCategory(category: string): Check[] {
	return allChecks.filter((check) => check.category === category)
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
	return [...new Set(allChecks.map((check) => check.category))]
}

// Re-export all modules
export {
	filesModule,
	configModule,
	ciModule,
	packageModule,
	depsModule,
	testModule,
	formatModule,
	buildModule,
	runtimeModule,
	cleanupModule,
	docsModule,
	hooksModule,
	githubModule,
	monorepoModule,
}

// Re-export legacy check arrays for backward compatibility
export { buildChecks } from './build'
export { ciChecks } from './ci'
export { cleanupChecks } from './cleanup'
export { configChecks } from './config'
export { depsChecks } from './deps'
export { docsChecks } from './docs'
export { formatChecks } from './format'
export { githubChecks } from './github'
export { hooksChecks } from './hooks'
export { monorepoChecks } from './monorepo'
export { packageChecks } from './package'
export { runtimeChecks } from './runtime'
export { testChecks } from './test'

// Backward compatibility aliases
export const fileChecks: Check[] = filesModule.checks
// Note: fileChecks is different from filesModule.checks name for backward compat

// Re-export define helpers for external use
export {
	defineCheck,
	defineCheckModule,
	createFileCheck,
	createJsonConfigCheck,
	createCommandCheck,
} from './define'
export type {
	CheckModule,
	DefineCheckOptions,
	FileCheckOptions,
	JsonConfigCheckOptions,
	CheckResultData,
	CheckReturnValue,
} from './define'
