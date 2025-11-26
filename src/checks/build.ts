import type { Check, PackageJson } from '../types'
import { isMonorepoRoot } from '../utils/context'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

interface ExportsIssue {
	location: string
	issue: string
}

function checkExports(pkg: PackageJson, location: string): ExportsIssue | null {
	const exports = pkg?.exports

	if (!exports) {
		return { location, issue: 'missing exports field' }
	}

	// Check if exports has proper structure
	const mainExport = typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

	if (!mainExport) {
		return { location, issue: 'exports missing "." entry' }
	}

	const exportObj = mainExport as Record<string, unknown>
	const hasTypes = 'types' in exportObj
	const hasImport = 'import' in exportObj

	if (!hasTypes) {
		return { location, issue: 'exports["."] missing types' }
	}
	if (!hasImport) {
		return { location, issue: 'exports["."] missing import' }
	}

	return null
}

export const buildModule: CheckModule = defineCheckModule(
	{
		category: 'build',
		label: '🔨 Build',
		description: 'Check build configuration',
	},
	[
		// Note: bunup config check removed - bunup works fine with defaults

		{
			name: 'build/exports-valid',
			description: 'Check if package.json exports are properly configured',
			fixable: false,
			async check(ctx) {
				// Skip for monorepo root - exports are per-package
				if (isMonorepoRoot(ctx)) {
					// Check all workspace packages instead
					const issues: ExportsIssue[] = []

					for (const pkg of ctx.workspacePackages) {
						// Skip private packages
						if (pkg.packageJson.private) continue

						const issue = checkExports(pkg.packageJson, pkg.relativePath)
						if (issue) {
							issues.push(issue)
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: `All ${ctx.workspacePackages.length} packages have valid exports`,
						}
					}

					const hint = issues
						.slice(0, 3)
						.map((i) => `${i.location}: ${i.issue}`)
						.join(', ')
					const moreCount = issues.length > 3 ? ` (+${issues.length - 3} more)` : ''

					return {
						passed: false,
						message: `${issues.length} package(s) with invalid exports`,
						hint: `${hint}${moreCount}`,
					}
				}

				// Single package - check root
				if (!ctx.packageJson) {
					return {
						passed: false,
						message: 'No package.json found',
					}
				}
				const issue = checkExports(ctx.packageJson, 'root')
				if (issue) {
					return {
						passed: false,
						message: `package.json ${issue.issue}`,
					}
				}

				return {
					passed: true,
					message: 'package.json exports properly configured',
				}
			},
		},
	]
)

// Export for backward compatibility
export const buildChecks: Check[] = buildModule.checks
