import { join } from 'node:path'
import { getAllPackages, isMonorepoRoot, needsCredits } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import { fileExists, readFile } from '../utils/fs'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

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
 * Header template hint
 */
const HEADER_HINT = `Add at top of README:

<div align="center">

# 🔥 your-package-name

> A short description of what this does

[![npm](https://img.shields.io/npm/v/your-package)](https://www.npmjs.com/package/your-package)

</div>

---`

/**
 * Footer template hint
 */
const FOOTER_HINT = `Add at end of README:

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/your-repo&type=Date)](https://star-history.com/#SylphxAI/your-repo&Date)

## Powered by Sylphx

- [@sylphx/package](https://github.com/SylphxAI/repo)

---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>`

/**
 * Header format pattern (structure only, not content)
 * Matches: <div align="center"> ... # emoji name ... > tagline ... </div> ... ---
 */
const HEADER_PATTERN = /<div align="center">\s*#\s+\S+\s+.+\s+>\s+.+\s+<\/div>\s+---/s

/**
 * Footer format pattern (structure only)
 * Matches: --- ... ## Star History ... star-history ... ## Powered by Sylphx ... @sylphx ... --- ... <div align="center"> ... Sylphx ... </div>
 */
const FOOTER_PATTERN =
	/---\s+## Star History[\s\S]*?star-history[\s\S]*?## Powered by Sylphx[\s\S]*?@sylphx[\s\S]*?---\s+<div align="center">\s*<sub>[\s\S]*?Sylphx[\s\S]*?<\/sub>\s*<\/div>\s*$/

/**
 * npm badge pattern
 */
const NPM_BADGE_PATTERN = /shields\.io\/npm|npmjs\.com\/package|badge.*npm/i

export const brandingModule: CheckModule = defineCheckModule(
	{
		category: 'branding',
		label: '✨ Branding',
		description: 'Ensure consistent Sylphx branding across READMEs',
	},
	[
		{
			name: 'header',
			description: 'README has centered header with emoji title and tagline',
			fixable: false,
			check(ctx) {
				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: false,
						message: 'No README.md found',
						hint: 'Create README.md first',
					}
				}

				const content = readFile(readmePath) ?? ''

				if (HEADER_PATTERN.test(content)) {
					return {
						passed: true,
						message: 'README has proper header format',
					}
				}

				return {
					passed: false,
					message: 'README header format incorrect',
					hint: HEADER_HINT,
				}
			},
		},

		{
			name: 'footer',
			description: 'README has footer with Star History, Powered by Sylphx, and tagline',
			fixable: false,
			check(ctx) {
				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: true,
						message: 'No README.md (skipped)',
						skipped: true,
					}
				}

				const content = readFile(readmePath) ?? ''

				if (FOOTER_PATTERN.test(content)) {
					return {
						passed: true,
						message: 'README has proper footer format',
					}
				}

				return {
					passed: false,
					message: 'README footer format incorrect',
					hint: FOOTER_HINT,
				}
			},
		},

		{
			name: 'npm-badge',
			description: 'README has npm version badge (for publishable packages)',
			fixable: false,
			check(ctx) {
				// Skip if not a publishable package
				if (!ctx.packageJson?.name || ctx.packageJson.private === true) {
					return {
						passed: true,
						message: 'Not a publishable package (skipped)',
						skipped: true,
					}
				}

				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: true,
						message: 'No README.md (skipped)',
						skipped: true,
					}
				}

				const content = readFile(readmePath) ?? ''
				const pkgName = ctx.packageJson.name as string

				if (NPM_BADGE_PATTERN.test(content)) {
					return {
						passed: true,
						message: 'README has npm badge',
					}
				}

				return {
					passed: false,
					message: 'README missing npm badge',
					hint: `Add badge:\n[![npm](https://img.shields.io/npm/v/${pkgName})](https://www.npmjs.com/package/${pkgName})`,
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
					hint: `Add to "Powered by Sylphx" section: ${missing.join(', ')}`,
				}
			},
		},
	]
)
