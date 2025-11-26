import type { Check } from '../types'
import { buildChecks } from './build'
import { ciChecks } from './ci'
import { configChecks } from './config'
import { docsChecks } from './docs'
import { fileChecks } from './files'
import { formatChecks } from './format'
import { githubChecks } from './github'
import { hooksChecks } from './hooks'
import { monorepoChecks } from './monorepo'
import { packageChecks } from './package'
import { runtimeChecks } from './runtime'
import { testChecks } from './test'

export const allChecks: Check[] = [
	...fileChecks,
	...configChecks,
	...packageChecks,
	...testChecks,
	...formatChecks,
	...buildChecks,
	...runtimeChecks,
	...docsChecks,
	...ciChecks,
	...hooksChecks,
	...githubChecks,
	...monorepoChecks,
]

export const checksByName: Map<string, Check> = new Map(
	allChecks.map((check) => [check.name, check])
)

export function getCheck(name: string): Check | undefined {
	return checksByName.get(name)
}

export {
	buildChecks,
	ciChecks,
	configChecks,
	docsChecks,
	fileChecks,
	formatChecks,
	githubChecks,
	hooksChecks,
	monorepoChecks,
	packageChecks,
	runtimeChecks,
	testChecks,
}
