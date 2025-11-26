import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

interface OutdatedPackage {
	name: string
	current: string
	latest: string
	type: 'dependencies' | 'devDependencies'
}

/**
 * Parse bun outdated output
 * Format: | Package | Current | Update | Latest |
 */
function parseOutdatedOutput(output: string): OutdatedPackage[] {
	const packages: OutdatedPackage[] = []
	const lines = output.trim().split('\n')

	for (const line of lines) {
		// Skip non-data lines
		if (!line.includes('|') || line.includes('---') || line.includes('Package')) continue

		// Parse table row: | name (dev) | current | update | latest |
		const parts = line
			.split('|')
			.map((p) => p.trim())
			.filter(Boolean)
		if (parts.length >= 4) {
			let name = parts[0] ?? ''
			const current = parts[1] ?? ''
			const latest = parts[3] ?? ''

			// Check if dev dependency
			const isDev = name.includes('(dev)')
			name = name.replace(/\s*\(dev\)\s*/, '').trim()

			if (name && current && latest && current !== latest) {
				packages.push({
					name,
					current,
					latest,
					type: isDev ? 'devDependencies' : 'dependencies',
				})
			}
		}
	}

	return packages
}

export const depsModule: CheckModule = defineCheckModule(
	{
		category: 'deps',
		label: '📚 Dependencies',
		description: 'Check project dependencies',
	},
	[
		{
			name: 'deps/outdated',
			description: 'Check for outdated dependencies',
			fixable: true,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('bun', ['outdated'], ctx.cwd)

				// bun outdated returns exit code 0 even with outdated packages
				// We need to parse the output
				const outdated = parseOutdatedOutput(result.stdout)

				if (outdated.length === 0) {
					return {
						passed: true,
						message: 'All dependencies are up to date',
					}
				}

				// Separate major updates (breaking) from minor/patch
				const majorUpdates = outdated.filter((pkg) => {
					const currentMajor = pkg.current.split('.')[0]?.replace(/[^\d]/g, '')
					const latestMajor = pkg.latest.split('.')[0]?.replace(/[^\d]/g, '')
					return currentMajor !== latestMajor
				})

				const minorUpdates = outdated.filter((pkg) => !majorUpdates.includes(pkg))

				// Build hints
				const minorHint =
					minorUpdates.length > 0
						? `bun update ${minorUpdates.map((p) => p.name).join(' ')}`
						: undefined

				const majorHint =
					majorUpdates.length > 0
						? `Major updates available: ${majorUpdates.map((p) => `${p.name}@${p.latest}`).join(', ')}`
						: undefined

				// If only major updates, show as info (not blocking)
				if (minorUpdates.length === 0 && majorUpdates.length > 0) {
					return {
						passed: false,
						message: `${majorUpdates.length} major update(s) available`,
						severity: 'info',
						hint: majorHint,
					}
				}

				// Minor updates exist - show as warning/error based on preset
				let message = `${minorUpdates.length} outdated package(s)`
				if (majorUpdates.length > 0) {
					message += ` + ${majorUpdates.length} major`
				}

				return {
					passed: false,
					message,
					hint: minorHint,
					fix: async () => {
						// Only update minor/patch by default (safer)
						if (minorUpdates.length > 0) {
							await exec('bun', ['update', ...minorUpdates.map((p) => p.name)], ctx.cwd)
						}
					},
				}
			},
		},

		{
			name: 'deps/security',
			description: 'Check for security vulnerabilities',
			fixable: false,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				// bun doesn't have audit yet, use npm audit
				const result = await exec('npm', ['audit', '--json'], ctx.cwd)

				try {
					const audit = JSON.parse(result.stdout)
					const vulnerabilities = audit.metadata?.vulnerabilities ?? {}
					const total =
						(vulnerabilities.critical ?? 0) +
						(vulnerabilities.high ?? 0) +
						(vulnerabilities.moderate ?? 0) +
						(vulnerabilities.low ?? 0)

					if (total === 0) {
						return {
							passed: true,
							message: 'No known vulnerabilities',
						}
					}

					const critical = vulnerabilities.critical ?? 0
					const high = vulnerabilities.high ?? 0

					let message = `${total} vulnerabilities found`
					if (critical > 0) message += ` (${critical} critical)`
					else if (high > 0) message += ` (${high} high)`

					return {
						passed: false,
						message,
						severity: critical > 0 || high > 0 ? 'error' : 'warn',
						hint: 'Run: npm audit fix (or npm audit for details)',
					}
				} catch {
					// npm audit failed or not available
					return {
						passed: true,
						message: 'Security audit skipped (npm audit unavailable)',
						skipped: true,
					}
				}
			},
		},

		{
			name: 'deps/banned',
			description: 'Check for packages that should not be installed',
			fixable: true,
			async check(ctx) {
				const { getAllPackages } = await import('../utils/context')

				// Banned packages with their alternatives
				const bannedPackages: Record<string, string> = {
					// Linting/Formatting - use biome
					eslint: 'biome',
					prettier: 'biome',
					'@typescript-eslint/parser': 'biome',
					'@typescript-eslint/eslint-plugin': 'biome',
					'eslint-config-prettier': 'biome',
					'eslint-plugin-prettier': 'biome',

					// Build tools - use bunup
					esbuild: 'bunup',
					tsup: 'bunup',
					rollup: 'bunup',
					webpack: 'bunup',
					parcel: 'bunup',
					'@rollup/plugin-node-resolve': 'bunup',
					'@rollup/plugin-commonjs': 'bunup',
					'rollup-plugin-dts': 'bunup',

					// Testing - use bun test
					jest: 'bun test',
					vitest: 'bun test',
					mocha: 'bun test',
					chai: 'bun test',
					'ts-jest': 'bun test',
					'@types/jest': 'bun test',

					// Git hooks - use lefthook
					husky: 'lefthook',
					'simple-git-hooks': 'lefthook',
					'lint-staged': 'lefthook',

					// TypeScript execution - use bun
					'ts-node': 'bun',
					tsx: 'bun',
					'ts-node-dev': 'bun --watch',

					// Package managers - use bun
					npm: 'bun (remove npm)',
					yarn: 'bun (remove yarn)',
					pnpm: 'bun (remove pnpm)',
				}

				const allPackages = getAllPackages(ctx)
				const found: { name: string; alternative: string; location: string; path: string }[] = []

				// Check all packages (root + workspaces)
				for (const pkg of allPackages) {
					const allDeps = {
						...pkg.packageJson.dependencies,
						...pkg.packageJson.devDependencies,
					}
					for (const [banned, alternative] of Object.entries(bannedPackages)) {
						if (banned in allDeps) {
							found.push({ name: banned, alternative, location: pkg.relativePath, path: pkg.path })
						}
					}
				}

				if (found.length === 0) {
					const message =
						allPackages.length > 1
							? `No banned packages (checked ${allPackages.length} packages)`
							: 'No banned packages found'
					return { passed: true, message }
				}

				// Group by location for display and fix
				const byLocation = new Map<string, { names: string[]; path: string }>()
				for (const f of found) {
					const entry = byLocation.get(f.location) ?? { names: [], path: f.path }
					entry.names.push(f.name)
					byLocation.set(f.location, entry)
				}

				// Build hint showing which packages have which banned deps - one per line
				const lines: string[] = []
				for (const [location, { names }] of byLocation) {
					lines.push(`${location}: ${names.join(', ')}`)
				}
				const maxShow = 5
				const displayLines = lines.slice(0, maxShow)
				if (lines.length > maxShow) {
					displayLines.push(`(+${lines.length - maxShow} more)`)
				}

				return {
					passed: false,
					message: `Found ${found.length} banned package(s) in ${byLocation.size} package(s)`,
					hint: displayLines.join('\n'),
					fix: async () => {
						const { exec } = await import('../utils/exec')
						for (const [, { names, path }] of byLocation) {
							await exec('bun', ['remove', ...names], path)
						}
					},
				}
			},
		},
	]
)

// Export for backward compatibility
export const depsChecks: Check[] = depsModule.checks
