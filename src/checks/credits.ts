import { getAllPackages, isMonorepoRoot } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Detect any @sylphx/* packages used in a package (dynamic)
 */
function detectSylphxPackages(packageJson: Record<string, unknown> | null | undefined): string[] {
	if (!packageJson) return []

	const allDeps = {
		...(packageJson.dependencies as Record<string, string> | undefined),
		...(packageJson.devDependencies as Record<string, string> | undefined),
	}

	// Detect any package starting with @sylphx/
	return Object.keys(allDeps)
		.filter((pkg) => pkg.startsWith('@sylphx/'))
		.sort()
}

export const creditsModule: CheckModule = defineCheckModule(
	{
		category: 'credits',
		label: '✨ Credits',
		description: 'Check for @sylphx credits in README',
	},
	[
		{
			name: 'credits/has-section',
			description: 'Check if README has a "Powered by Sylphx" credits section',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readFile } = await import('../utils/fs')

				// Detect @sylphx packages used
				const sylphxPackages = detectSylphxPackages(ctx.packageJson)

				// Skip if no @sylphx packages used
				if (sylphxPackages.length === 0) {
					return {
						passed: true,
						message: 'No @sylphx packages used (skipped)',
						skipped: true,
					}
				}

				// For monorepo, check all packages
				if (isMonorepoRoot(ctx)) {
					const allPackages = getAllPackages(ctx)
					const issues: PackageIssue[] = []

					for (const pkg of allPackages) {
						const pkgSylphx = detectSylphxPackages(pkg.packageJson)
						if (pkgSylphx.length === 0) continue

						const readmePath = join(pkg.path, 'README.md')
						if (!fileExists(readmePath)) {
							issues.push({ location: pkg.relativePath, issue: 'no README.md' })
							continue
						}

						const content = readFile(readmePath) || ''
						const hasCreditsSection = content.includes('Powered by Sylphx')

						if (!hasCreditsSection) {
							issues.push({
								location: pkg.relativePath,
								issue: 'missing "Powered by Sylphx" section',
							})
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: 'All packages have credits section in README',
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing credits section`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package
				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: false,
						message: 'No README.md found',
						hint: 'Create a README.md file first',
					}
				}

				const content = readFile(readmePath) || ''
				const hasCreditsSection = content.includes('Powered by Sylphx')

				if (hasCreditsSection) {
					return {
						passed: true,
						message: 'README has "Powered by Sylphx" section',
					}
				}

				return {
					passed: false,
					message: 'README missing "Powered by Sylphx" section',
					hint: 'Add a credits section to README.md with "## Powered by Sylphx" header',
				}
			},
		},

		{
			name: 'credits/mentions-packages',
			description: 'Check if README credits section mentions all @sylphx packages used',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readFile } = await import('../utils/fs')

				// Detect @sylphx packages used
				const sylphxPackages = detectSylphxPackages(ctx.packageJson)

				// Skip if no @sylphx packages used
				if (sylphxPackages.length === 0) {
					return {
						passed: true,
						message: 'No @sylphx packages used (skipped)',
						skipped: true,
					}
				}

				// For monorepo, check all packages
				if (isMonorepoRoot(ctx)) {
					const allPackages = getAllPackages(ctx)
					const issues: PackageIssue[] = []

					for (const pkg of allPackages) {
						const pkgSylphx = detectSylphxPackages(pkg.packageJson)
						if (pkgSylphx.length === 0) continue

						const readmePath = join(pkg.path, 'README.md')
						if (!fileExists(readmePath)) continue

						const content = readFile(readmePath) || ''
						const missingPkgs = pkgSylphx.filter((p) => !content.includes(p))

						if (missingPkgs.length > 0) {
							issues.push({
								location: pkg.relativePath,
								issue: `missing: ${missingPkgs.join(', ')}`,
							})
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: 'All packages mention their @sylphx dependencies',
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing @sylphx package mentions`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package
				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: true,
						message: 'No README.md (skipped)',
						skipped: true,
					}
				}

				const content = readFile(readmePath) || ''
				const missingPkgs = sylphxPackages.filter((p) => !content.includes(p))

				if (missingPkgs.length === 0) {
					return {
						passed: true,
						message: `README mentions all ${sylphxPackages.length} @sylphx package(s)`,
					}
				}

				return {
					passed: false,
					message: `README missing ${missingPkgs.length} @sylphx package mention(s)`,
					hint: `Add to credits: ${missingPkgs.join(', ')}`,
				}
			},
		},
	]
)
