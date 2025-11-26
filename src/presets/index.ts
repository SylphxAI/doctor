import type { PresetConfig, PresetName } from '../types'

const initPreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'warn',
	'files/gitignore': 'error',
	'files/changelog': 'off',
	'files/progress': 'warn',
	'files/biome-config': 'error',
	'files/turbo-config': 'warn',

	// Config
	'config/biome-extends': 'warn',
	'config/tsconfig-extends': 'warn',

	// Package.json
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

	// Testing
	'test/has-tests': 'off',
	'test/passes': 'off',
	'test/coverage-threshold': 'off',
	'bench/has-files': 'off',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/exports-valid': 'off',

	// Runtime
	'runtime/bun-lock': 'error',
	'runtime/no-npm-lock': 'error',
	'runtime/no-yarn-lock': 'error',

	// Docs
	'docs/vitepress': 'off',
	'docs/vercel-config': 'off',

	// CI/CD
	'ci/has-workflow': 'warn',
	'ci/publish-workflow': 'off',

	// Hooks
	'hooks/pre-commit': 'error',
	'hooks/lefthook-config': 'error',

	// GitHub
	'github/description': 'warn',
	'github/website': 'off',
	'github/topics': 'off',

	// Monorepo
	'monorepo/packages-readme': 'off',
	'monorepo/packages-license': 'off',
	'monorepo/packages-description': 'off',
	'monorepo/packages-type-module': 'off',
	'monorepo/packages-exports': 'off',
	'monorepo/packages-build': 'off',
	'monorepo/packages-test': 'off',
	'monorepo/packages-bench': 'off',

	// Release (enforce automated workflow)
	'release/no-manual-version': 'error',
	'release/no-release-commit': 'error',
}

const devPreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'error',
	'files/gitignore': 'error',
	'files/changelog': 'warn',
	'files/progress': 'error',
	'files/biome-config': 'error',
	'files/turbo-config': 'error',

	// Config
	'config/biome-extends': 'error',
	'config/tsconfig-extends': 'error',

	// Package.json
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/repository': 'warn',
	'pkg/keywords': 'warn',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'error',
	'pkg/scripts-test': 'warn',
	'pkg/scripts-typecheck': 'error',
	'pkg/scripts-bench': 'off',
	'pkg/scripts-coverage': 'off',
	'pkg/exports': 'warn',

	// Dependencies
	'deps/outdated': 'warn',
	'deps/security': 'warn',

	// Testing
	'test/has-tests': 'warn',
	'test/passes': 'error',
	'test/coverage-threshold': 'off',
	'bench/has-files': 'off',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/exports-valid': 'warn',

	// Runtime
	'runtime/bun-lock': 'error',
	'runtime/no-npm-lock': 'error',
	'runtime/no-yarn-lock': 'error',

	// Docs
	'docs/vitepress': 'off',
	'docs/vercel-config': 'off',

	// CI/CD
	'ci/has-workflow': 'error',
	'ci/publish-workflow': 'warn',

	// Hooks
	'hooks/pre-commit': 'error',
	'hooks/lefthook-config': 'error',

	// GitHub
	'github/description': 'error',
	'github/website': 'warn',
	'github/topics': 'warn',

	// Monorepo
	'monorepo/root-private': 'error',
	'monorepo/workspace-protocol': 'warn',
	'monorepo/consistent-versions': 'warn',
	'monorepo/turbo-tasks': 'error',
	'monorepo/packages-readme': 'warn',
	'monorepo/packages-license': 'warn',

	// Release (enforce automated workflow)
	'release/no-manual-version': 'error',
	'release/no-release-commit': 'error',
}

const stablePreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'error',
	'files/gitignore': 'error',
	'files/changelog': 'error',
	'files/progress': 'error',
	'files/biome-config': 'error',
	'files/turbo-config': 'error',

	// Config
	'config/biome-extends': 'error',
	'config/tsconfig-extends': 'error',

	// Package.json
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/repository': 'error',
	'pkg/keywords': 'error',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'error',
	'pkg/scripts-test': 'error',
	'pkg/scripts-typecheck': 'error',
	'pkg/scripts-bench': 'warn',
	'pkg/scripts-coverage': 'error',
	'pkg/exports': 'error',

	// Dependencies
	'deps/outdated': 'error',
	'deps/security': 'error',

	// Testing
	'test/has-tests': 'error',
	'test/passes': 'error',
	'test/coverage-threshold': 'error',
	'bench/has-files': 'warn',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/exports-valid': 'error',

	// Runtime
	'runtime/bun-lock': 'error',
	'runtime/no-npm-lock': 'error',
	'runtime/no-yarn-lock': 'error',

	// Docs
	'docs/vitepress': 'warn',
	'docs/vercel-config': 'warn',

	// CI/CD
	'ci/has-workflow': 'error',
	'ci/publish-workflow': 'error',

	// Hooks
	'hooks/pre-commit': 'error',
	'hooks/lefthook-config': 'error',

	// GitHub
	'github/description': 'error',
	'github/website': 'error',
	'github/topics': 'error',

	// Monorepo
	'monorepo/root-private': 'error',
	'monorepo/workspace-protocol': 'error',
	'monorepo/consistent-versions': 'error',
	'monorepo/turbo-tasks': 'error',
	'monorepo/packages-readme': 'error',
	'monorepo/packages-license': 'error',

	// Release (enforce automated workflow)
	'release/no-manual-version': 'error',
	'release/no-release-commit': 'error',
}

export const presets: Record<PresetName, PresetConfig> = {
	init: initPreset,
	dev: devPreset,
	stable: stablePreset,
}

export function getPreset(name: PresetName): PresetConfig {
	return presets[name]
}

export function getSeverity(
	checkName: string,
	preset: PresetName,
	overrides?: Partial<Record<string, Severity>>
): Severity {
	const presetConfig = getPreset(preset)
	const severity = overrides?.[checkName] ?? presetConfig[checkName] ?? 'off'
	return severity as Severity
}

type Severity = import('../types').Severity
