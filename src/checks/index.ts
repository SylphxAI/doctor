import type { Check } from '../types'
import type { CheckModule } from './define'

// Import all check modules
import { buildChecks } from './build'
import { ciModule } from './ci'
import { configModule } from './config'
import { depsChecks } from './deps'
import { docsChecks } from './docs'
import { filesModule } from './files'
import { formatChecks } from './format'
import { githubChecks } from './github'
import { hooksChecks } from './hooks'
import { monorepoChecks } from './monorepo'
import { packageChecks } from './package'
import { runtimeChecks } from './runtime'
import { testChecks } from './test'

/**
 * All check modules (new modular format)
 */
export const checkModules: CheckModule[] = [
	filesModule,
	configModule,
	ciModule,
]

/**
 * Legacy check arrays (for backward compatibility during migration)
 */
const legacyChecks: Check[] = [
	...packageChecks,
	...depsChecks,
	...testChecks,
	...formatChecks,
	...buildChecks,
	...runtimeChecks,
	...docsChecks,
	...hooksChecks,
	...githubChecks,
	...monorepoChecks,
]

/**
 * All checks (combined from modules + legacy)
 */
export const allChecks: Check[] = [
	...checkModules.flatMap((m) => m.checks),
	...legacyChecks,
]

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

// Re-export modules
export { filesModule, configModule, ciModule }

// Re-export legacy for backward compatibility
export {
	buildChecks,
	depsChecks,
	docsChecks,
	formatChecks,
	githubChecks,
	hooksChecks,
	monorepoChecks,
	packageChecks,
	runtimeChecks,
	testChecks,
}

// Backward compatibility aliases
export const fileChecks: Check[] = filesModule.checks
export const configChecks: Check[] = configModule.checks
export const ciChecks: Check[] = ciModule.checks

// Re-export define helpers for external use
export {
	defineCheck,
	defineCheckModule,
	createFileCheck,
	createJsonConfigCheck,
	createCommandCheck,
} from './define'
export type { CheckModule, DefineCheckOptions, FileCheckOptions, JsonConfigCheckOptions } from './define'
