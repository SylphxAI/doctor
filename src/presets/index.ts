import type { PresetConfig, PresetName, Severity } from '../types'

/**
 * Base preset - all checks with their default severity
 * Most lenient, suitable for new projects
 */
const basePreset: PresetConfig = {
	// Files - essential project files
	'files/readme': 'error',
	'files/license': 'warn',
	'files/gitignore': 'error',
	'files/changelog': 'off',
	'files/progress': 'warn',
	'files/biome-config': 'error',
	'files/turbo-config': 'warn',

	// Config - configuration validation
	'config/biome-extends': 'warn',
	'config/tsconfig-extends': 'warn',

	// Package.json - metadata and scripts
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/repository': 'off',
	'pkg/keywords': 'off',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'warn',
	'pkg/scripts-test': 'off',
	'pkg/scripts-typecheck': 'warn',
	'pkg/scripts-bench': 'off',
	'pkg/scripts-coverage': 'off',
	'pkg/exports': 'off',

	// Dependencies
	'deps/outdated': 'off',
	'deps/security': 'off',
	'deps/required': 'error',

	// Testing
	'test/has-tests': 'off',
	'test/passes': 'off',
	'test/coverage-threshold': 'off',
	'test/no-legacy-frameworks': 'error',
	'bench/has-files': 'off',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',
	'format/biome-dep': 'error',
	'format/no-eslint': 'error',

	// Build
	'build/exports-valid': 'off',
	'build/bunup-dep': 'error',
	'build/no-legacy-bundlers': 'error',

	// Runtime
	'runtime/bun-lock': 'error',
	'runtime/no-npm-lock': 'error',
	'runtime/no-yarn-lock': 'error',
	'runtime/no-pnpm-lock': 'error',
	'runtime/no-ts-node': 'error',
	'runtime/no-other-pkg-managers': 'error',

	// Docs
	'docs/vitepress': 'off',
	'docs/vercel-config': 'off',

	// CI/CD
	'ci/has-workflow': 'warn',
	'ci/publish-workflow': 'off',

	// Hooks (split into granular checks for user override flexibility)
	'hooks/pre-commit': 'error',
	'hooks/lefthook-pre-commit': 'error',
	'hooks/lefthook-pre-push': 'error',
	'hooks/lefthook-doctor': 'error',
	'hooks/lefthook-installed': 'error',
	'hooks/lefthook-dep': 'error',
	'hooks/no-husky': 'error',

	// GitHub
	'github/description': 'warn',
	'github/website': 'off',
	'github/topics': 'off',

	// Monorepo
	'monorepo/root-private': 'off',
	'monorepo/workspace-protocol': 'off',
	'monorepo/consistent-versions': 'off',
	'monorepo/turbo-tasks': 'off',
	'monorepo/turbo-dep': 'error',
	'monorepo/packages-readme': 'off',
	'monorepo/packages-license': 'off',

	// Release (always enforced)
	'release/no-manual-version': 'error',
	'release/no-release-commit': 'error',
	'release/no-direct-publish': 'error',
}

/**
 * Create a preset by extending a base with overrides
 */
function extendPreset(base: PresetConfig, overrides: Partial<PresetConfig>): PresetConfig {
	return { ...base, ...overrides } as PresetConfig
}

/**
 * Init preset - for new projects just getting started
 * Based on basePreset with minimal requirements
 */
const initPreset: PresetConfig = basePreset

/**
 * Dev preset - for active development
 * Stricter than init, enables more checks
 */
const devPreset: PresetConfig = extendPreset(basePreset, {
	// Files - stricter
	'files/license': 'error',
	'files/changelog': 'warn',
	'files/progress': 'error',
	'files/turbo-config': 'error',

	// Config - require shared configs
	'config/biome-extends': 'error',
	'config/tsconfig-extends': 'error',

	// Package.json - more complete metadata
	'pkg/repository': 'warn',
	'pkg/keywords': 'warn',
	'pkg/scripts-build': 'error',
	'pkg/scripts-test': 'warn',
	'pkg/scripts-typecheck': 'error',
	'pkg/exports': 'warn',

	// Dependencies - monitor health
	'deps/outdated': 'warn',
	'deps/security': 'warn',

	// Testing - require tests
	'test/has-tests': 'warn',
	'test/passes': 'error',

	// Build
	'build/exports-valid': 'warn',

	// CI/CD - require automation
	'ci/has-workflow': 'error',
	'ci/publish-workflow': 'warn',

	// GitHub - better discoverability
	'github/description': 'error',
	'github/website': 'warn',
	'github/topics': 'warn',

	// Monorepo - proper structure
	'monorepo/root-private': 'error',
	'monorepo/workspace-protocol': 'warn',
	'monorepo/consistent-versions': 'warn',
	'monorepo/turbo-tasks': 'error',
	'monorepo/packages-readme': 'warn',
	'monorepo/packages-license': 'warn',
})

/**
 * Stable preset - for production-ready projects
 * Strictest level, all best practices enforced
 */
const stablePreset: PresetConfig = extendPreset(devPreset, {
	// Files - all required
	'files/changelog': 'error',

	// Package.json - complete metadata
	'pkg/repository': 'error',
	'pkg/keywords': 'error',
	'pkg/scripts-test': 'error',
	'pkg/scripts-bench': 'warn',
	'pkg/scripts-coverage': 'error',
	'pkg/exports': 'error',

	// Dependencies - strict
	'deps/outdated': 'error',
	'deps/security': 'error',

	// Testing - comprehensive
	'test/has-tests': 'error',
	'test/coverage-threshold': 'error',
	'bench/has-files': 'warn',

	// Build
	'build/exports-valid': 'error',

	// Docs - require documentation
	'docs/vitepress': 'warn',
	'docs/vercel-config': 'warn',

	// CI/CD
	'ci/publish-workflow': 'error',

	// GitHub - complete presence
	'github/website': 'error',
	'github/topics': 'error',

	// Monorepo - strict consistency
	'monorepo/workspace-protocol': 'error',
	'monorepo/consistent-versions': 'error',
	'monorepo/packages-readme': 'error',
	'monorepo/packages-license': 'error',
})

/**
 * All presets
 */
export const presets: Record<PresetName, PresetConfig> = {
	init: initPreset,
	dev: devPreset,
	stable: stablePreset,
}

/**
 * Get a preset by name
 */
export function getPreset(name: PresetName): PresetConfig {
	return presets[name]
}

/**
 * Get severity for a check, with optional overrides
 */
export function getSeverity(
	checkName: string,
	preset: PresetName,
	overrides?: Partial<Record<string, Severity>>
): Severity {
	const presetConfig = getPreset(preset)
	return (overrides?.[checkName] ?? presetConfig[checkName] ?? 'off') as Severity
}

/**
 * Get the next preset level (for upgrade suggestions)
 */
export function getNextPreset(current: PresetName): PresetName | null {
	const levels: PresetName[] = ['init', 'dev', 'stable']
	const index = levels.indexOf(current)
	if (index >= levels.length - 1) return null
	return levels[index + 1] as PresetName
}
