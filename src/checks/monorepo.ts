import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { directoryExists, fileExists, readJson } from '../utils/fs'

interface PackageJson {
	name?: string
	description?: string
	workspaces?: string[]
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

export const packagesReadmeCheck: Check = {
	name: 'monorepo/packages-readme',
	category: 'monorepo',
	description: 'Check if all packages in monorepo have README.md',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const packageDirs = await getPackageDirs(ctx.cwd)

		if (packageDirs.length === 0) {
			return {
				name: 'monorepo/packages-readme',
				category: 'monorepo',
				passed: true,
				message: 'No packages found (not a monorepo or no packages)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const missingReadme: string[] = []

		for (const pkgDir of packageDirs) {
			const readmePath = join(pkgDir, 'README.md')
			if (!fileExists(readmePath)) {
				// Get relative path for cleaner output
				const relativePath = pkgDir.replace(`${ctx.cwd}/`, '')
				missingReadme.push(relativePath)
			}
		}

		const passed = missingReadme.length === 0

		return {
			name: 'monorepo/packages-readme',
			category: 'monorepo',
			passed,
			message: passed
				? `All ${packageDirs.length} packages have README.md`
				: `Missing README.md in: ${missingReadme.join(', ')}`,
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
		const packageDirs = await getPackageDirs(ctx.cwd)

		if (packageDirs.length === 0) {
			return {
				name: 'monorepo/packages-license',
				category: 'monorepo',
				passed: true,
				message: 'No packages found (not a monorepo or no packages)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		// Check if root has LICENSE (packages can inherit)
		const rootHasLicense = fileExists(join(ctx.cwd, 'LICENSE'))

		if (rootHasLicense) {
			return {
				name: 'monorepo/packages-license',
				category: 'monorepo',
				passed: true,
				message: `Root LICENSE exists (${packageDirs.length} packages inherit)`,
				severity: ctx.severity,
				fixable: false,
			}
		}

		const missingLicense: string[] = []

		for (const pkgDir of packageDirs) {
			const licensePath = join(pkgDir, 'LICENSE')
			if (!fileExists(licensePath)) {
				const relativePath = pkgDir.replace(`${ctx.cwd}/`, '')
				missingLicense.push(relativePath)
			}
		}

		const passed = missingLicense.length === 0

		return {
			name: 'monorepo/packages-license',
			category: 'monorepo',
			passed,
			message: passed
				? `All ${packageDirs.length} packages have LICENSE`
				: `Missing LICENSE in: ${missingLicense.join(', ')}`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const packagesDescriptionCheck: Check = {
	name: 'monorepo/packages-description',
	category: 'monorepo',
	description: 'Check if all packages have description in package.json',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const packageDirs = await getPackageDirs(ctx.cwd)

		if (packageDirs.length === 0) {
			return {
				name: 'monorepo/packages-description',
				category: 'monorepo',
				passed: true,
				message: 'No packages found',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const missingDesc: string[] = []

		for (const pkgDir of packageDirs) {
			const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
			if (!pkg?.name) continue // Skip if no name (not a valid package)

			if (!pkg.description) {
				const relativePath = pkgDir.replace(`${ctx.cwd}/`, '')
				missingDesc.push(relativePath)
			}
		}

		const passed = missingDesc.length === 0

		return {
			name: 'monorepo/packages-description',
			category: 'monorepo',
			passed,
			message: passed
				? `All ${packageDirs.length} packages have description`
				: `Missing description in: ${missingDesc.join(', ')}`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const monorepoChecks: Check[] = [
	packagesReadmeCheck,
	packagesLicenseCheck,
	packagesDescriptionCheck,
]
