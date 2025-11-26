import type { Check, CheckContext } from '../types'
import type { CheckModule, CheckReturnValue } from './define'
import { defineCheckModule } from './define'

interface PackageJson {
	name?: string
	description?: string
	workspaces?: string[]
	type?: string
	exports?: unknown
	scripts?: Record<string, string>
}

async function getPackageDirs(cwd: string): Promise<string[]> {
	const { join } = await import('node:path')
	const { directoryExists, fileExists } = await import('../utils/fs')

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
function skipResult(): CheckReturnValue {
	return {
		passed: true,
		message: 'Not a monorepo',
		skipped: true,
	}
}

export const monorepoModule: CheckModule = defineCheckModule(
	{
		category: 'monorepo',
		label: '🏗️ Monorepo',
		description: 'Check monorepo configuration',
		enabled: (ctx) => ctx.isMonorepo,
	},
	[
		{
			name: 'monorepo/packages-readme',
			description: 'Check if all packages in monorepo have README.md',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					if (!fileExists(join(pkgDir, 'README.md'))) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have README.md`
							: `Missing README.md in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-license',
			description: 'Check if all packages in monorepo have LICENSE',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				// Root LICENSE is enough for all packages
				if (fileExists(join(ctx.cwd, 'LICENSE'))) {
					return {
						passed: true,
						message: `Root LICENSE exists (${packageDirs.length} packages inherit)`,
					}
				}

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					if (!fileExists(join(pkgDir, 'LICENSE'))) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have LICENSE`
							: `Missing LICENSE in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-description',
			description: 'Check if all packages have description',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (!pkg.description) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have description`
							: `Missing description in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-type-module',
			description: 'Check if all packages have "type": "module"',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (pkg.type !== 'module') {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have "type": "module"`
							: `Missing "type": "module" in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-exports',
			description: 'Check if all packages have exports',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (!pkg.exports) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have exports`
							: `Missing exports in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-build',
			description: 'Check if all packages have "build" script',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (!pkg.scripts?.build) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have "build" script`
							: `Missing "build" script in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-test',
			description: 'Check if all packages have "test" script',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (!pkg.scripts?.test) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have "test" script`
							: `Missing "test" script in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-bench',
			description: 'Check if all packages have "bench" script',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { readJson } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				const packageDirs = await getPackageDirs(ctx.cwd)
				if (packageDirs.length === 0) return skipResult()

				const missing: string[] = []
				for (const pkgDir of packageDirs) {
					const pkg = readJson<PackageJson>(join(pkgDir, 'package.json'))
					if (!pkg?.name) continue
					if (!pkg.scripts?.bench) {
						missing.push(pkgDir.replace(`${ctx.cwd}/`, ''))
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${packageDirs.length} packages have "bench" script`
							: `Missing "bench" script in: ${missing.join(', ')}`,
				}
			},
		},
	]
)

// Export for backward compatibility
export const monorepoChecks: Check[] = monorepoModule.checks
