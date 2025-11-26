import type { Check, CheckContext, CheckResult } from '../types'
import { exec } from '../utils/exec'

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
		const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
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

export const outdatedDepsCheck: Check = {
	name: 'deps/outdated',
	category: 'deps',
	description: 'Check for outdated dependencies',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const result = await exec('bun', ['outdated'], ctx.cwd)

		// bun outdated returns exit code 0 even with outdated packages
		// We need to parse the output
		const outdated = parseOutdatedOutput(result.stdout)

		if (outdated.length === 0) {
			return {
				name: 'deps/outdated',
				category: 'deps',
				passed: true,
				message: 'All dependencies are up to date',
				severity: ctx.severity,
				fixable: false,
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
		const minorHint = minorUpdates.length > 0
			? `bun update ${minorUpdates.map((p) => p.name).join(' ')}`
			: undefined

		const majorHint = majorUpdates.length > 0
			? `Major updates available: ${majorUpdates.map((p) => `${p.name}@${p.latest}`).join(', ')}`
			: undefined

		// If only major updates, show as info (not blocking)
		if (minorUpdates.length === 0 && majorUpdates.length > 0) {
			return {
				name: 'deps/outdated',
				category: 'deps',
				passed: false,
				message: `${majorUpdates.length} major update(s) available`,
				severity: 'info',
				fixable: false,
				hint: majorHint,
			}
		}

		// Minor updates exist - show as warning/error based on preset
		let message = `${minorUpdates.length} outdated package(s)`
		if (majorUpdates.length > 0) {
			message += ` + ${majorUpdates.length} major`
		}

		return {
			name: 'deps/outdated',
			category: 'deps',
			passed: false,
			message,
			severity: ctx.severity,
			fixable: true,
			hint: minorHint,
			fix: async () => {
				// Only update minor/patch by default (safer)
				if (minorUpdates.length > 0) {
					await exec('bun', ['update', ...minorUpdates.map((p) => p.name)], ctx.cwd)
				}
			},
		}
	},
}

export const securityAuditCheck: Check = {
	name: 'deps/security',
	category: 'deps',
	description: 'Check for security vulnerabilities',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
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
					name: 'deps/security',
					category: 'deps',
					passed: true,
					message: 'No known vulnerabilities',
					severity: ctx.severity,
					fixable: false,
				}
			}

			const critical = vulnerabilities.critical ?? 0
			const high = vulnerabilities.high ?? 0

			let message = `${total} vulnerabilities found`
			if (critical > 0) message += ` (${critical} critical)`
			else if (high > 0) message += ` (${high} high)`

			return {
				name: 'deps/security',
				category: 'deps',
				passed: false,
				message,
				severity: critical > 0 || high > 0 ? 'error' : 'warn',
				fixable: false,
				hint: 'Run: npm audit fix (or npm audit for details)',
			}
		} catch {
			// npm audit failed or not available
			return {
				name: 'deps/security',
				category: 'deps',
				passed: true,
				message: 'Security audit skipped (npm audit unavailable)',
				severity: ctx.severity,
				fixable: false,
				skipped: true,
			}
		}
	},
}

export const depsChecks: Check[] = [outdatedDepsCheck, securityAuditCheck]
