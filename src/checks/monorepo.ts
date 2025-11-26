import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { directoryExists, fileExists, readJson } from '../utils/fs'

interface PackageJson {
	name?: string
	description?: string
	workspaces?: string[]
	type?: string
	exports?: unknown
	scripts?: Record<string, string>
}

async function getPackageDirs(cwd: string): Promise<string[]> {
	const packageDirs: string[] = []

	// Check for common monorepo package directories
	const commonDirs = ['packages', 'apps', 'libs', 'services', 'tools']

	for (const dir of commonDirs) {
		const dirPath = join(cwd, dir)
		if (await directoryExists(dirPath)) {
			// Read subdirectories
			const { readdir } = await import('node:fs/promises')
			try {
				const entries = await readdir(dirPath, { withFileTypes: true })
				for (const entry of entries) {
					if (entry.isDirectory() && !entry.name.startsWith('.')) {
						const pkgJsonPath = join(dirPath, entry.name, 'package.json')
						if (fileExists(pkgJsonPath)) {
							packageDirs.push(join(dirPath, entry.name))
						}
					}
				}
			} catch {
				// Directory doesn't exist or can't be read
			}
		}
	}

	return packageDirs
}

/** Helper to create a skipped result for non-monorepos */
function skipResult(name: string, ctx: CheckContext): CheckResult {
	return {
		name,
		category: 'monorepo',
		passed: true,
		message: 'Not a monorepo',
		severity: ctx.severity,
		fixable: false,
		skipped: true,
	}
}

export const packagesReadmeCheck: Check = {
	name: 'monorepo/packages-readme',
	category: 'monorepo',
	description: 'Check if all packages in monorepo have README.md',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		if (!ctx.isMonorepo) return skipResult('monorepo/packages-readme', ctx)

		const packageDirs = await getPackageDirs(ctx.cwd)
		if (packageDirs.length === 0) return skipResult('monorepo/packages-readme', ctx)

		const missing: string[] = []
		for (const pkgDir of packageDirs) {
			if (!fileExists(join(pkgDir, 'README.md'))) {
				missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
			}
		}

		return {
			name: 'monorepo/packages-readme',
			category: 'monorepo',
			passed: missing.length === 0,
			message:
				missing.length === 0
					? `All ${packageDirs.length} packages have README.md`
					: `Missing README.md in: ${missing.join(', ')}`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const packagesLicenseCheck: Check = {
	name: 'monorepo/packages-license',
	category: 'monorepo',
	description: 'Check if all packages in monorepo have LICENSE',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		if (!ctx.isMonorepo) return skipResult('monorepo/packages-license', ctx)

		const packageDirs = await getPackageDirs(ctx.cwd)
		if (packageDirs.length === 0) return skipResult('monorepo/packages-license', ctx)

		// Root LICENSE is enough for all packages
		if (fileExists(join(ctx.cwd, 'LICENSE'))) {
			return {
				name: 'monorepo/packages-license',
				category: 'monorepo',
				passed: true,
				message: `Root LICENSE exists (${packageDirs.length} packages inherit)`,
				severity: ctx.severity,
				fixable: false,
			}
		}

		const missing: string[] = []
		for (const pkgDir of packageDirs) {
			if (!fileExists(join(pkgDir, 'LICENSE'))) {
				missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
			}
		}

		return {
			name: 'monorepo/packages-license',
			category: 'monorepo',
			passed: missing.length === 0,
			message:
				missing.length === 0
					? `All ${packageDirs.length} packages have LICENSE`
					: `Missing LICENSE in: ${missing.join(', ')}`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

function createPackageFieldCheck(
	name: string,
	fieldName: string,
	checker: (pkg: PackageJson) => boolean,
	successMsg: (count: number) => string,
	failMsg: (missing: string[]) => string
): Check {
	return {
		name,
		category: 'monorepo',
		description: `Check if all packages have ${fieldName}`,
		fixable: false,
		async run(ctx: CheckContext): Promise<CheckResult> {
			if (!ctx.isMonorepo) return skipResult(name, ctx)

			const packageDirs = await getPackageDirs(ctx.cwd)
			if (packageDirs.length === 0) return skipResult(name, ctx)

			const missing: string[] = []
			for (const pkgDir of packageDirs) {
				const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
				if (!pkg?.name) continue
				if (!checker(pkg)) {
					missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
				}
			}

			return {
				name,
				category: 'monorepo',
				passed: missing.length === 0,
				message: missing.length === 0 ? successMsg(packageDirs.length) : failMsg(missing),
				severity: ctx.severity,
				fixable: false,
			}
		},
	}
}

export const packagesDescriptionCheck: Check = createPackageFieldCheck(
	'monorepo/packages-description',
	'description',
	(pkg) => !!pkg.description,
	(count) => `All ${count} packages have description`,
	(missing) => `Missing description in: ${missing.join(', ')}`
)

export const packagesTypeModuleCheck: Check = createPackageFieldCheck(
	'monorepo/packages-type-module',
	'"type": "module"',
	(pkg) => pkg.type === 'module',
	(count) => `All ${count} packages have "type": "module"`,
	(missing) => `Missing "type": "module" in: ${missing.join(', ')}`
)

export const packagesExportsCheck: Check = createPackageFieldCheck(
	'monorepo/packages-exports',
	'exports',
	(pkg) => !!pkg.exports,
	(count) => `All ${count} packages have exports`,
	(missing) => `Missing exports in: ${missing.join(', ')}`
)

function createPackagesScriptCheck(name: string, scriptName: string): Check {
	return createPackageFieldCheck(
		name,
		`"${scriptName}" script`,
		(pkg) => !!pkg.scripts?.[scriptName],
		(count) => `All ${count} packages have "${scriptName}" script`,
		(missing) => `Missing "${scriptName}" script in: ${missing.join(', ')}`
	)
}

export const packagesBuildCheck: Check = createPackagesScriptCheck(
	'monorepo/packages-build',
	'build'
)

export const packagesTestCheck: Check = createPackagesScriptCheck('monorepo/packages-test', 'test')

export const packagesBenchCheck: Check = createPackagesScriptCheck(
	'monorepo/packages-bench',
	'bench'
)

export const monorepoChecks: Check[] = [
	packagesReadmeCheck,
	packagesLicenseCheck,
	packagesDescriptionCheck,
	packagesTypeModuleCheck,
	packagesExportsCheck,
	packagesBuildCheck,
	packagesTestCheck,
	packagesBenchCheck,
]
