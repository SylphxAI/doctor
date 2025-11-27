import type { PackageJson } from '../types'
import { isMonorepoRoot } from '../utils/context'
import { type PackageIssue, formatPackageIssues } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

function checkExports(pkg: PackageJson, location: string): PackageIssue | null {
	const exports = pkg?.exports

	if (!exports) {
		return { location, issue: 'missing exports field' }
	}

	// Check if exports has proper structure
	const mainExport = typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

	if (!mainExport) {
		return { location, issue: 'exports missing "." entry' }
	}

	// Collect ALL missing fields (not just the first one)
	const exportObj = mainExport as Record<string, unknown>
	const missing: string[] = []
	if (!('types' in exportObj)) missing.push('types')
	if (!('import' in exportObj)) missing.push('import')

	if (missing.length > 0) {
		return { location, issue: `exports["."] missing: ${missing.join(', ')}` }
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
					const issues: PackageIssue[] = []

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

					return {
						passed: false,
						message: `${issues.length} package(s) with invalid exports`,
						hint: formatPackageIssues(issues),
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
