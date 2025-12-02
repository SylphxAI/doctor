import { join } from 'node:path'
import { getAllPackages, getPackagesToCheck, isMonorepoRoot, needsCredits } from '../utils/context'
import { formatPackageIssues, type PackageIssue } from '../utils/format'
import { fileExists, readFile } from '../utils/fs'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

// ============================================
// Helper Functions
// ============================================

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
 * Check if project is a library (has exports, not just a CLI or app)
 */
function isLibrary(packageJson: Record<string, unknown> | null | undefined): boolean {
	if (!packageJson) return false
	return !!(packageJson.exports || packageJson.main || packageJson.module)
}

/**
 * Check if project is TypeScript (has typescript dep or tsconfig)
 */
function isTypeScriptProject(
	cwd: string,
	packageJson: Record<string, unknown> | null | undefined
): boolean {
	if (!packageJson) return false
	const deps = {
		...(packageJson.dependencies as Record<string, string> | undefined),
		...(packageJson.devDependencies as Record<string, string> | undefined),
	}
	const hasTypescript = 'typescript' in deps
	const hasTsconfig = fileExists(join(cwd, 'tsconfig.json'))
	return hasTypescript || hasTsconfig
}

/**
 * Check if this is a Rust project
 */
function isRustProject(cwd: string): boolean {
	return fileExists(join(cwd, 'Cargo.toml'))
}

/**
 * Get repo name from package.json repository field
 */
function getRepoName(packageJson: Record<string, unknown> | null | undefined): string | null {
	if (!packageJson?.repository) return null
	const repo = packageJson.repository
	if (typeof repo === 'string') {
		const match = repo.match(/(?:github:)?([^/]+\/[^/]+)$/)
		return match?.[1] ?? null
	}
	if (typeof repo === 'object' && 'url' in repo) {
		const url = (repo as { url: string }).url
		const match = url.match(/github\.com\/([^/]+\/[^/.]+)/)
		return match?.[1] ?? null
	}
	return null
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================
// Header & Footer Templates
// ============================================

const HEADER_HINT = `Add at top of README:

<div align="center">

# 🔥 your-package-name

> A short description of what this does

[![npm](https://img.shields.io/npm/v/your-package)](https://www.npmjs.com/package/your-package)
[![downloads](https://img.shields.io/npm/dm/your-package)](https://www.npmjs.com/package/your-package)
[![stars](https://img.shields.io/github/stars/SylphxAI/your-repo)](https://github.com/SylphxAI/your-repo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---`

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

const PACKAGE_LINKS_HINT = `Add to README:

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@sylphx/package-name](./packages/package-name) | [![npm](https://img.shields.io/npm/v/@sylphx/package-name)](https://www.npmjs.com/package/@sylphx/package-name) | Package description |`

// ============================================
// Patterns
// ============================================

/** Header format: <div align="center"> # emoji name > tagline </div> --- */
const HEADER_PATTERN = /<div align="center">\s*#\s+\S+\s+.+\s+>\s+.+\s+<\/div>\s+---/s

/** Footer format: --- ## Star History ... ## Powered by Sylphx ... --- <div>Sylphx</div> */
const FOOTER_PATTERN =
	/---\s+## Star History[\s\S]*?star-history[\s\S]*?## Powered by Sylphx[\s\S]*?@sylphx[\s\S]*?---\s+<div align="center">\s*<sub>[\s\S]*?Sylphx[\s\S]*?<\/sub>\s*<\/div>\s*$/

/** Badge patterns */
const BADGE_PATTERNS = {
	// Version badges by ecosystem
	npm: /img\.shields\.io\/npm\/v\/|npmjs\.com\/package\//i,
	cratesio: /img\.shields\.io\/crates\/v\/|crates\.io\/crates\//i,
	pypi: /img\.shields\.io\/pypi\/v\/|pypi\.org\/project\//i,

	// Download badges by ecosystem
	npmDownloads: /img\.shields\.io\/npm\/d[mwt]\/|npm.*downloads/i,
	cratesDownloads: /img\.shields\.io\/crates\/d\/|crates.*downloads/i,

	// Common badges
	license: /img\.shields\.io\/badge\/[Ll]icense|img\.shields\.io\/github\/license/i,
	ci: /github\.com\/[^/]+\/[^/]+\/actions\/workflows\/[^/]+\/badge\.svg|img\.shields\.io\/github\/actions\/workflow\/status/i,
	coverage: /codecov\.io|coveralls\.io|img\.shields\.io\/codecov|img\.shields\.io\/coveralls/i,
	typescript: /img\.shields\.io\/badge\/[Tt]ype[Ss]cript|img\.shields\.io\/badge\/types/i,
	stars: /img\.shields\.io\/github\/stars/i,
}

export const brandingModule: CheckModule = defineCheckModule(
	{
		category: 'branding',
		label: '✨ Branding',
		description: 'Ensure consistent Sylphx branding across READMEs',
	},
	[
		// ============================================
		// Format Checks
		// ============================================
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

		// ============================================
		// Badge Checks
		// ============================================
		{
			name: 'version-badge',
			description: 'README has version badge (npm/crates.io based on ecosystem)',
			fixable: false,
			check(ctx) {
				// Skip for monorepo root (no single version)
				if (isMonorepoRoot(ctx)) {
					return {
						passed: true,
						message: 'Monorepo root (skipped)',
						skipped: true,
					}
				}

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

				if (isRustProject(ctx.cwd)) {
					if (BADGE_PATTERNS.cratesio.test(content)) {
						return { passed: true, message: 'README has crates.io badge' }
					}
					return {
						passed: false,
						message: 'README missing crates.io version badge',
						hint: `Add badge:\n[![crates.io](https://img.shields.io/crates/v/${pkgName})](https://crates.io/crates/${pkgName})`,
					}
				}

				if (BADGE_PATTERNS.npm.test(content)) {
					return { passed: true, message: 'README has npm version badge' }
				}

				return {
					passed: false,
					message: 'README missing npm version badge',
					hint: `Add badge:\n[![npm](https://img.shields.io/npm/v/${pkgName})](https://www.npmjs.com/package/${pkgName})`,
				}
			},
		},

		{
			name: 'downloads-badge',
			description: 'README has downloads badge (npm/crates.io)',
			fixable: false,
			check(ctx) {
				// Skip for monorepo root
				if (isMonorepoRoot(ctx)) {
					return {
						passed: true,
						message: 'Monorepo root (skipped)',
						skipped: true,
					}
				}

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

				if (isRustProject(ctx.cwd)) {
					if (BADGE_PATTERNS.cratesDownloads.test(content)) {
						return { passed: true, message: 'README has crates.io downloads badge' }
					}
					return {
						passed: false,
						message: 'README missing downloads badge',
						hint: `Add badge:\n[![downloads](https://img.shields.io/crates/d/${pkgName})](https://crates.io/crates/${pkgName})`,
					}
				}

				if (BADGE_PATTERNS.npmDownloads.test(content)) {
					return { passed: true, message: 'README has npm downloads badge' }
				}

				return {
					passed: false,
					message: 'README missing downloads badge',
					hint: `Add badge:\n[![downloads](https://img.shields.io/npm/dm/${pkgName})](https://www.npmjs.com/package/${pkgName})`,
				}
			},
		},

		{
			name: 'stars-badge',
			description: 'README has GitHub stars badge',
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

				if (BADGE_PATTERNS.stars.test(content)) {
					return { passed: true, message: 'README has stars badge' }
				}

				const repoName = getRepoName(ctx.packageJson) ?? 'SylphxAI/your-repo'

				return {
					passed: false,
					message: 'README missing GitHub stars badge',
					hint: `Add badge:\n[![stars](https://img.shields.io/github/stars/${repoName})](https://github.com/${repoName})`,
				}
			},
		},

		{
			name: 'license-badge',
			description: 'README has license badge',
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

				if (BADGE_PATTERNS.license.test(content)) {
					return { passed: true, message: 'README has license badge' }
				}

				return {
					passed: false,
					message: 'README missing license badge',
					hint: 'Add badge:\n[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)',
				}
			},
		},

		{
			name: 'ci-badge',
			description: 'README has CI status badge (if has workflow)',
			fixable: false,
			check(ctx) {
				// For packages in monorepo, check root .github/workflows
				let workflowDir = join(ctx.cwd, '.github', 'workflows')
				if (!fileExists(workflowDir) && ctx.workspaceRoot) {
					workflowDir = join(ctx.workspaceRoot, '.github', 'workflows')
				}

				if (!fileExists(workflowDir)) {
					return {
						passed: true,
						message: 'No CI workflow (skipped)',
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

				if (BADGE_PATTERNS.ci.test(content)) {
					return { passed: true, message: 'README has CI badge' }
				}

				const repoName = getRepoName(ctx.packageJson) ?? 'SylphxAI/your-repo'

				return {
					passed: false,
					message: 'README missing CI status badge',
					hint: `Add badge:\n[![CI](https://github.com/${repoName}/actions/workflows/ci.yml/badge.svg)](https://github.com/${repoName}/actions/workflows/ci.yml)`,
				}
			},
		},

		{
			name: 'coverage-badge',
			description: 'README has coverage badge (for libraries)',
			fixable: false,
			check(ctx) {
				// Skip for monorepo root (no aggregate coverage)
				if (isMonorepoRoot(ctx)) {
					return {
						passed: true,
						message: 'Monorepo root (skipped)',
						skipped: true,
					}
				}

				// Skip if not a library
				if (!isLibrary(ctx.packageJson)) {
					return {
						passed: true,
						message: 'Not a library (skipped)',
						skipped: true,
					}
				}

				// Skip if private
				if (ctx.packageJson?.private === true) {
					return {
						passed: true,
						message: 'Private package (skipped)',
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

				if (BADGE_PATTERNS.coverage.test(content)) {
					return { passed: true, message: 'README has coverage badge' }
				}

				const repoName = getRepoName(ctx.packageJson) ?? 'SylphxAI/your-repo'

				return {
					passed: false,
					message: 'README missing coverage badge',
					hint: `Add badge:\n[![codecov](https://codecov.io/gh/${repoName}/branch/main/graph/badge.svg)](https://codecov.io/gh/${repoName})`,
				}
			},
		},

		{
			name: 'typescript-badge',
			description: 'README has TypeScript badge (for TS libraries)',
			fixable: false,
			check(ctx) {
				// Skip for monorepo root
				if (isMonorepoRoot(ctx)) {
					return {
						passed: true,
						message: 'Monorepo root (skipped)',
						skipped: true,
					}
				}

				// Skip if not TypeScript
				if (!isTypeScriptProject(ctx.cwd, ctx.packageJson)) {
					return {
						passed: true,
						message: 'Not a TypeScript project (skipped)',
						skipped: true,
					}
				}

				// Skip if not a library
				if (!isLibrary(ctx.packageJson)) {
					return {
						passed: true,
						message: 'Not a library (skipped)',
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

				if (BADGE_PATTERNS.typescript.test(content)) {
					return { passed: true, message: 'README has TypeScript badge' }
				}

				return {
					passed: false,
					message: 'README missing TypeScript badge',
					hint: 'Add badge:\n[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)',
				}
			},
		},

		// ============================================
		// Content Checks
		// ============================================
		{
			name: 'package-links',
			description: 'Monorepo root README has package links with version badges',
			fixable: false,
			check(ctx) {
				// Only for monorepo root
				if (!isMonorepoRoot(ctx)) {
					return {
						passed: true,
						message: 'Not a monorepo root (skipped)',
						skipped: true,
					}
				}

				const readmePath = join(ctx.cwd, 'README.md')
				if (!fileExists(readmePath)) {
					return {
						passed: false,
						message: 'No README.md found',
						hint: 'Create README.md first',
					}
				}

				const content = readFile(readmePath) ?? ''

				// Get all publishable packages
				const packages = getAllPackages(ctx).filter(
					(pkg) => pkg.packageJson?.name && pkg.packageJson.private !== true
				)

				if (packages.length === 0) {
					return {
						passed: true,
						message: 'No publishable packages (skipped)',
						skipped: true,
					}
				}

				// Check for ## Packages section
				if (!content.includes('## Packages')) {
					return {
						passed: false,
						message: 'README missing "## Packages" section',
						hint: PACKAGE_LINKS_HINT,
					}
				}

				// Check each package has a link and version badge
				const missing: string[] = []
				for (const pkg of packages) {
					const pkgName = pkg.packageJson?.name as string
					const hasLink = content.includes(pkgName)
					const hasBadge =
						new RegExp(`shields\\.io/npm/v/${escapeRegex(pkgName)}`).test(content) ||
						new RegExp(`shields\\.io/crates/v/${escapeRegex(pkgName)}`).test(content)

					if (!hasLink || !hasBadge) {
						missing.push(pkgName)
					}
				}

				if (missing.length === 0) {
					return {
						passed: true,
						message: `README has links for all ${packages.length} packages`,
					}
				}

				const hint = missing
					.map((name) => {
						const pkgPath = packages.find((p) => p.packageJson?.name === name)?.path
						const isRust = pkgPath ? isRustProject(pkgPath) : false
						const badgeUrl = isRust
							? `https://img.shields.io/crates/v/${name}`
							: `https://img.shields.io/npm/v/${name}`
						const pkgUrl = isRust
							? `https://crates.io/crates/${name}`
							: `https://www.npmjs.com/package/${name}`
						return `| [${name}](./packages/${name.replace('@sylphx/', '')}) | [![version](${badgeUrl})](${pkgUrl}) | Description |`
					})
					.join('\n')

				return {
					passed: false,
					message: `README missing ${missing.length} package link(s)`,
					hint: `Add to "## Packages" table:\n${hint}`,
				}
			},
		},

		{
			name: 'packages',
			description: 'README mentions all @sylphx packages used',
			fixable: false,
			check(ctx) {
				// Get packages that need credits check
				const packages = getPackagesToCheck(ctx, { filter: needsCredits })
				if (packages.length === 0) {
					return { passed: true, message: 'No packages to check', skipped: true }
				}

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
						message:
							packages.length === 1
								? 'README mentions all @sylphx packages'
								: 'All packages mention their @sylphx dependencies',
					}
				}

				return {
					passed: false,
					message: `${issues.length} package(s) missing @sylphx mentions`,
					hint: formatPackageIssues(issues),
				}
			},
		},
	]
)
