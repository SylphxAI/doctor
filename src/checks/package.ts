import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { readPackageJson } from '../utils/fs'

function createPackageFieldCheck(name: string, field: string, description: string): Check {
	return {
		name,
		category: 'pkg',
		description,
		fixable: false,
		async run(ctx: CheckContext): Promise<CheckResult> {
			const pkg = ctx.packageJson
			const hasField = pkg && field in pkg && pkg[field]

			return {
				name,
				category: 'pkg',
				passed: !!hasField,
				message: hasField ? `package.json has "${field}"` : `package.json missing "${field}"`,
				severity: ctx.severity,
				fixable: false,
			}
		},
	}
}

function createScriptCheck(name: string, scriptName: string, defaultScript: string): Check {
	return {
		name,
		category: 'pkg',
		description: `Check if "${scriptName}" script exists`,
		fixable: true,
		async run(ctx: CheckContext): Promise<CheckResult> {
			const pkg = ctx.packageJson
			const hasScript = pkg?.scripts?.[scriptName]

			return {
				name,
				category: 'pkg',
				passed: !!hasScript,
				message: hasScript
					? `Has "${scriptName}" script`
					: `Missing "${scriptName}" script in package.json`,
				severity: ctx.severity,
				fixable: true,
				fix: async () => {
					const pkgPath = join(ctx.cwd, 'package.json')
					const currentPkg = readPackageJson(ctx.cwd) ?? {}
					currentPkg.scripts = currentPkg.scripts ?? {}
					currentPkg.scripts[scriptName] = defaultScript
					writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
				},
			}
		},
	}
}

export const pkgNameCheck = createPackageFieldCheck(
	'pkg/name',
	'name',
	'Check if package.json has name'
)

export const pkgDescriptionCheck = createPackageFieldCheck(
	'pkg/description',
	'description',
	'Check if package.json has description'
)

export const pkgTypeModuleCheck: Check = {
	name: 'pkg/type-module',
	category: 'pkg',
	description: 'Check if package.json has "type": "module"',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const pkg = ctx.packageJson
		const isModule = pkg?.type === 'module'

		return {
			name: 'pkg/type-module',
			category: 'pkg',
			passed: isModule,
			message: isModule
				? 'package.json has "type": "module"'
				: 'package.json missing "type": "module"',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				const pkgPath = join(ctx.cwd, 'package.json')
				const currentPkg = readPackageJson(ctx.cwd) ?? {}
				currentPkg.type = 'module'
				writeFileSync(pkgPath, `${JSON.stringify(currentPkg, null, 2)}\n`, 'utf-8')
			},
		}
	},
}

export const pkgExportsCheck = createPackageFieldCheck(
	'pkg/exports',
	'exports',
	'Check if package.json has exports'
)

export const scriptsLintCheck = createScriptCheck('pkg/scripts-lint', 'lint', 'biome check .')
export const scriptsFormatCheck = createScriptCheck(
	'pkg/scripts-format',
	'format',
	'biome format --write .'
)
export const scriptsBuildCheck = createScriptCheck('pkg/scripts-build', 'build', 'bunup')
export const scriptsTestCheck = createScriptCheck('pkg/scripts-test', 'test', 'bun test')
export const scriptsBenchCheck = createScriptCheck('pkg/scripts-bench', 'bench', 'bun bench')
export const scriptsCoverageCheck = createScriptCheck(
	'pkg/scripts-coverage',
	'test:coverage',
	'bun test --coverage'
)

export const packageChecks: Check[] = [
	pkgNameCheck,
	pkgDescriptionCheck,
	pkgTypeModuleCheck,
	pkgExportsCheck,
	scriptsLintCheck,
	scriptsFormatCheck,
	scriptsBuildCheck,
	scriptsTestCheck,
	scriptsBenchCheck,
	scriptsCoverageCheck,
]
