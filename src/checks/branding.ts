import { join } from 'node:path'
import { getAllPackages, isMonorepoRoot, needsCredits } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import { fileExists, readFile } from '../utils/fs'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

const SECTION_HEADER = 'Powered by Sylphx'

/**
 * Detect @sylphx/* packages in dependencies
 */
function detectSylphxPackages(packageJson: Record<string, unknown> | null | undefined): string[] {
	if (!packageJson) return []

	const allDeps = {
		...(packageJson.dependencies as Record<string, string> | undefined),
		...(packageJson.devDependencies as Record<string, string> | undefined),
	}

	return Object.keys(allDeps)
		.filter((pkg) => pkg.startsWith('@sylphx/'))
		.sort()
}

/**
 * Generate template for Sylphx credits section
 */
function generateTemplate(packages: string[]): string {
	const lines = ['## Powered by Sylphx', '']
	for (const pkg of packages) {
		const name = pkg.replace('@sylphx/', '')
		lines.push(`- [${pkg}](https://github.com/SylphxAI/${name})`)
	}
	return lines.join('\n')
}

export const brandingModule: CheckModule = defineCheckModule(
	{
		category: 'branding',
		label: '✨ Branding',
		description: 'Ensure Sylphx ecosystem cross-promotion',
	},
	[
		{
			name: 'section',
			description: 'README has "Powered by Sylphx" section',
			fixable: false,
			check(ctx) {
				const sylphxPackages = detectSylphxPackages(ctx.packageJson)

				// Skip if no @sylphx packages used
				if (sylphxPackages.length === 0) {
					return {
						passed: true,
						message: 'No @sylphx packages used (skipped)',
						skipped: true,
					}
				}

				// Monorepo: check all packages
				if (isMonorepoRoot(ctx)) {
					const packages = getAllPackages(ctx).filter(needsCredits)
					const issues: PackageIssue[] = []

					for (const pkg of packages) {
						const pkgSylphx = detectSylphxPackages(pkg.packageJson)
						if (pkgSylphx.length === 0) continue

						const readmePath = join(pkg.path, 'README.md')
						if (!fileExists(readmePath)) {
							issues.push({ location: pkg.relativePath, issue: 'no README.md' })
							continue
						}

						const content = readFile(readmePath) ?? ''
						if (!content.includes(SECTION_HEADER)) {
							issues.push({
								location: pkg.relativePath,
								issue: `missing "${SECTION_HEADER}" section`,
							})
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: 'All packages have Sylphx branding section',
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing branding section`,
						hint: formatPackageIssues(issues),
					}
				}

				// Single package
				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: false,
						message: 'No README.md found',
						hint: 'Create README.md first',
					}
				}

				const content = readFile(readmePath) ?? ''
				if (content.includes(SECTION_HEADER)) {
					return {
						passed: true,
						message: `README has "${SECTION_HEADER}" section`,
					}
				}

				return {
					passed: false,
					message: `README missing "${SECTION_HEADER}" section`,
					hint: `Add to README:\n\n${generateTemplate(sylphxPackages)}`,
				}
			},
		},

		{
			name: 'packages',
			description: 'README mentions all @sylphx packages used',
			fixable: false,
			check(ctx) {
				const sylphxPackages = detectSylphxPackages(ctx.packageJson)

				// Skip if no @sylphx packages used
				if (sylphxPackages.length === 0) {
					return {
						passed: true,
						message: 'No @sylphx packages used (skipped)',
						skipped: true,
					}
				}

				// Monorepo: check all packages
				if (isMonorepoRoot(ctx)) {
					const packages = getAllPackages(ctx).filter(needsCredits)
					const issues: PackageIssue[] = []

					for (const pkg of packages) {
						const pkgSylphx = detectSylphxPackages(pkg.packageJson)
						if (pkgSylphx.length === 0) continue

						const readmePath = join(pkg.path, 'README.md')
						if (!fileExists(readmePath)) continue

						const content = readFile(readmePath) ?? ''
						const missing = pkgSylphx.filter((p) => !content.includes(p))

						if (missing.length > 0) {
							issues.push({
								location: pkg.relativePath,
								issue: `missing: ${missing.join(', ')}`,
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
						message: `${issues.length} package(s) missing @sylphx mentions`,
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

				const content = readFile(readmePath) ?? ''
				const missing = sylphxPackages.filter((p) => !content.includes(p))

				if (missing.length === 0) {
					return {
						passed: true,
						message: `README mentions all ${sylphxPackages.length} @sylphx package(s)`,
					}
				}

				return {
					passed: false,
					message: `README missing ${missing.length} @sylphx package(s)`,
					hint: `Add to "${SECTION_HEADER}" section: ${missing.join(', ')}`,
				}
			},
		},
	]
)
