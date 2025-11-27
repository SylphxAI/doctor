import { getAllPackages, isMonorepoRoot } from '../utils/context'
import { type PackageIssue, formatPackageIssues } from '../utils/format'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Generate credits section markdown (dynamic - any @sylphx/* package)
 */
export function generateCreditsSection(packages: string[]): string {
	const lines: string[] = []

	lines.push('## 🛠️ Powered by Sylphx')
	lines.push('')
	lines.push('This project is built with [@sylphx](https://github.com/SylphxAI) open-source tools:')
	lines.push('')

	for (const pkg of packages) {
		// Extract repo name from package (e.g., @sylphx/doctor -> doctor)
		const repoName = pkg.replace('@sylphx/', '')
		const repoUrl = `https://github.com/SylphxAI/${repoName}`
		lines.push(`- [${pkg}](${repoUrl})`)
	}

	lines.push('')
	lines.push('---')
	lines.push('')
	lines.push('_Made with ❤️ by [Sylphx](https://github.com/SylphxAI)_')

	return lines.join('\n')
}

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
			name: 'credits/readme-sylphx',
			description: 'Check if README has credits for @sylphx packages used',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync, readFileSync } = await import('node:fs')
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
						const hasSylphxCredits =
							content.includes('Powered by Sylphx') ||
							content.includes('@sylphx') ||
							content.includes('SylphxAI')

						if (!hasSylphxCredits) {
							issues.push({
								location: pkg.relativePath,
								issue: `uses ${pkgSylphx.length} @sylphx package(s) but no credits`,
							})
						}
					}

					if (issues.length === 0) {
						return {
							passed: true,
							message: 'All packages have @sylphx credits in README',
						}
					}

					return {
						passed: false,
						message: `${issues.length} package(s) missing @sylphx credits in README`,
						hint: formatPackageIssues(issues),
						fix: async () => {
							for (const pkg of allPackages) {
								const pkgSylphx = detectSylphxPackages(pkg.packageJson)
								if (pkgSylphx.length === 0) continue

								const readmePath = join(pkg.path, 'README.md')
								if (!fileExists(readmePath)) continue

								const content = readFileSync(readmePath, 'utf-8')
								const hasSylphxCredits =
									content.includes('Powered by Sylphx') ||
									content.includes('@sylphx') ||
									content.includes('SylphxAI')

								if (!hasSylphxCredits) {
									const credits = generateCreditsSection(pkgSylphx)
									writeFileSync(readmePath, `${content}\n\n${credits}\n`, 'utf-8')
								}
							}
						},
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
				const hasSylphxCredits =
					content.includes('Powered by Sylphx') ||
					content.includes('@sylphx') ||
					content.includes('SylphxAI')

				if (hasSylphxCredits) {
					return {
						passed: true,
						message: `README has @sylphx credits (${sylphxPackages.length} package(s) used)`,
					}
				}

				return {
					passed: false,
					message: `README missing @sylphx credits (${sylphxPackages.length} package(s) used)`,
					hint: `Add "Powered by Sylphx" section to README.md`,
					fix: async () => {
						const currentContent = readFileSync(readmePath, 'utf-8')
						const credits = generateCreditsSection(sylphxPackages)
						writeFileSync(readmePath, `${currentContent}\n\n${credits}\n`, 'utf-8')
					},
				}
			},
		},
	]
)
