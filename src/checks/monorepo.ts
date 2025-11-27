import type { CheckModule, CheckReturnValue } from './define'
import { defineCheckModule } from './define'

/** Helper to create a skipped result for non-monorepos */
function skipResult(message = 'Not a monorepo'): CheckReturnValue {
	return {
		passed: true,
		message,
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
			name: 'monorepo/root-private',
			description: 'Check if root package.json has "private": true',
			fixable: true,
			async check(ctx) {
				if (!ctx.isMonorepo) return skipResult()

				const isPrivate = ctx.packageJson?.private === true
				return {
					passed: isPrivate,
					message: isPrivate
						? 'Root package.json has "private": true'
						: 'Root package.json should have "private": true',
					hint: 'Add "private": true to root package.json',
					fix: async () => {
						const { join } = await import('node:path')
						const { writeFileSync } = await import('node:fs')
						const { readPackageJson } = await import('../utils/fs')

						const pkgPath = join(ctx.cwd, 'package.json')
						const pkg = readPackageJson(ctx.cwd) ?? {}
						pkg.private = true
						writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
					},
				}
			},
		},

		{
			name: 'monorepo/packages-readme',
			description: 'Check if all packages in monorepo have README.md',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()
				if (ctx.workspacePackages.length === 0) return skipResult('No workspace packages found')

				const missing: string[] = []
				for (const pkg of ctx.workspacePackages) {
					if (!fileExists(join(pkg.path, 'README.md'))) {
						missing.push(pkg.relativePath)
					}
				}

				return {
					passed: missing.length === 0,
					message:
						missing.length === 0
							? `All ${ctx.workspacePackages.length} packages have README.md`
							: `Missing README.md in: ${missing.join(', ')}`,
				}
			},
		},

		{
			name: 'monorepo/packages-license',
			description: 'Check if root has LICENSE (shared by all packages)',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists } = await import('../utils/fs')

				if (!ctx.isMonorepo) return skipResult()

				// Root LICENSE is enough for all packages
				const hasRootLicense = fileExists(join(ctx.cwd, 'LICENSE'))
				return {
					passed: hasRootLicense,
					message: hasRootLicense
						? `Root LICENSE exists (${ctx.workspacePackages.length} packages inherit)`
						: 'Missing root LICENSE file',
					hint: hasRootLicense ? undefined : 'Create a LICENSE file in the root directory',
				}
			},
		},

		{
			name: 'monorepo/workspace-protocol',
			description: 'Check if internal dependencies use workspace: protocol',
			fixable: false,
			async check(ctx) {
				if (!ctx.isMonorepo) return skipResult()
				if (ctx.workspacePackages.length === 0) return skipResult('No workspace packages found')

				const packageNames = new Set(ctx.workspacePackages.map((p) => p.name))
				const issues: string[] = []

				for (const pkg of ctx.workspacePackages) {
					const allDeps = {
						...pkg.packageJson.dependencies,
						...pkg.packageJson.devDependencies,
					}

					for (const [depName, version] of Object.entries(allDeps)) {
						if (packageNames.has(depName) && !version?.startsWith('workspace:')) {
							issues.push(`${pkg.relativePath}: ${depName}@${version}`)
						}
					}
				}

				return {
					passed: issues.length === 0,
					message:
						issues.length === 0
							? 'All internal dependencies use workspace: protocol'
							: `Should use workspace: for: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
					hint: 'Use "workspace:*" for internal package dependencies',
				}
			},
		},

		{
			name: 'monorepo/workspace-star',
			description: 'Check if internal dependencies use workspace:* (not workspace:^)',
			fixable: false,
			async check(ctx) {
				if (!ctx.isMonorepo) return skipResult()
				if (ctx.workspacePackages.length === 0) return skipResult('No workspace packages found')

				const packageNames = new Set(ctx.workspacePackages.map((p) => p.name))
				const issues: string[] = []

				for (const pkg of ctx.workspacePackages) {
					const allDeps = {
						...pkg.packageJson.dependencies,
						...pkg.packageJson.devDependencies,
					}

					for (const [depName, version] of Object.entries(allDeps)) {
						// Only check internal packages that use workspace: but not workspace:*
						if (
							packageNames.has(depName) &&
							version?.startsWith('workspace:') &&
							version !== 'workspace:*'
						) {
							issues.push(`${pkg.relativePath}: ${depName}@${version}`)
						}
					}
				}

				return {
					passed: issues.length === 0,
					message:
						issues.length === 0
							? 'All internal dependencies use workspace:*'
							: `Should use workspace:* for: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}`,
					hint: 'Use "workspace:*" instead of "workspace:^" for consistent co-releases',
				}
			},
		},

		{
			name: 'monorepo/consistent-versions',
			description: 'Check if external dependencies have consistent versions',
			fixable: false,
			async check(ctx) {
				if (!ctx.isMonorepo) return skipResult()
				if (ctx.workspacePackages.length === 0) return skipResult('No workspace packages found')

				const packageNames = new Set(ctx.workspacePackages.map((p) => p.name))
				const depVersions = new Map<string, Map<string, string[]>>() // dep -> version -> packages

				for (const pkg of ctx.workspacePackages) {
					const allDeps = {
						...pkg.packageJson.dependencies,
						...pkg.packageJson.devDependencies,
					}

					for (const [depName, version] of Object.entries(allDeps)) {
						// Skip internal packages
						if (packageNames.has(depName) || !version) continue

						let versions = depVersions.get(depName)
						if (!versions) {
							versions = new Map()
							depVersions.set(depName, versions)
						}
						let pkgList = versions.get(version)
						if (!pkgList) {
							pkgList = []
							versions.set(version, pkgList)
						}
						pkgList.push(pkg.relativePath)
					}
				}

				// Find inconsistent versions
				const inconsistent: string[] = []
				for (const [depName, versions] of depVersions) {
					if (versions.size > 1) {
						const versionList = [...versions.keys()].join(', ')
						inconsistent.push(`${depName} (${versionList})`)
					}
				}

				return {
					passed: inconsistent.length === 0,
					message:
						inconsistent.length === 0
							? 'All external dependencies have consistent versions'
							: `Inconsistent versions: ${inconsistent.slice(0, 3).join(', ')}${inconsistent.length > 3 ? ` (+${inconsistent.length - 3} more)` : ''}`,
					hint: 'Use the same version for shared dependencies across packages',
				}
			},
		},

		{
			name: 'monorepo/turbo-tasks',
			description: 'Check if turbo.json has standard tasks',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readJson } = await import('../utils/fs')
				const { writeFileSync } = await import('node:fs')

				if (!ctx.isMonorepo) return skipResult()

				const configPath = join(ctx.cwd, 'turbo.json')
				if (!fileExists(configPath)) {
					return {
						passed: false,
						message: 'Missing turbo.json for monorepo',
						hint: 'Run: bunx turbo init',
					}
				}

				const config = readJson<{ tasks?: Record<string, unknown> }>(configPath)
				const requiredTasks = ['build', 'lint', 'test']
				const missingTasks = requiredTasks.filter((task) => !config?.tasks?.[task])

				if (missingTasks.length === 0) {
					return { passed: true, message: 'turbo.json has standard tasks' }
				}

				return {
					passed: false,
					message: `turbo.json missing tasks: ${missingTasks.join(', ')}`,
					hint: `Add tasks to turbo.json: ${missingTasks.join(', ')}`,
					fix: async () => {
						const currentConfig = readJson<Record<string, unknown>>(configPath) ?? {}
						currentConfig.$schema = 'https://turbo.build/schema.json'
						currentConfig.tasks = {
							build: { dependsOn: ['^build'], outputs: ['dist/**'] },
							lint: { dependsOn: ['^lint'] },
							test: { dependsOn: ['^build'] },
							typecheck: { dependsOn: ['^typecheck'] },
							...(currentConfig.tasks as Record<string, unknown>),
						}
						writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
					},
				}
			},
		},

		{
			name: 'monorepo/turbo-dep',
			description: 'Check if turbo is in devDependencies',
			fixable: true,
			async check(ctx) {
				const { readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				if (!ctx.isMonorepo) return skipResult()

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasTurbo = 'turbo' in devDeps

				return {
					passed: hasTurbo,
					message: hasTurbo ? 'turbo in devDependencies' : 'turbo missing from devDependencies',
					hint: hasTurbo ? undefined : 'Run: bun add -D turbo',
					fix: async () => {
						await exec('bun', ['add', '-D', 'turbo'], ctx.cwd)
					},
				}
			},
		},
	]
)
