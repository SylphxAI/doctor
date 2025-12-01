import type { Check } from '../types'
import { brandingModule } from './branding'
// Import all check modules (new modular format)
import { buildModule } from './build'
import { ciModule } from './ci'
import { configModule } from './config'
import type { CheckModule } from './define'
import { depsModule } from './deps'
import { docsModule } from './docs'
import { filesModule } from './files'
import { formatModule } from './format'
import { githubModule } from './github'
import { hooksModule } from './hooks'
import { monorepoModule } from './monorepo'
import { packageModule } from './package'
import { releaseModule } from './release'
import { runtimeModule } from './runtime'
import { rustModule } from './rust'
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
	docsModule,
	hooksModule,
	githubModule,
	monorepoModule,
	releaseModule,
	brandingModule,
	rustModule,
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
	docsModule,
	hooksModule,
	githubModule,
	monorepoModule,
	releaseModule,
	brandingModule,
	rustModule,
}

export type {
	CheckModule,
	CheckResultData,
	CheckReturnValue,
	DefineCheckOptions,
	FileCheckOptions,
	JsonConfigCheckOptions,
} from './define'
// Re-export define helpers for external use
export {
	createCommandCheck,
	createFileCheck,
	createJsonConfigCheck,
	defineCheck,
	defineCheckModule,
} from './define'
