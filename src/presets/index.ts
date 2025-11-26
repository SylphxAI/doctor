import type { PresetConfig, PresetName } from '../types'

const initPreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'warn',
	'files/progress': 'off',
	'files/biome-config': 'error',
	'files/turbo-config': 'warn',

	// Config
	'config/biome-extends': 'warn',
	'config/tsconfig-extends': 'warn',
	'config/turbo-pipeline': 'off',

	// Package.json
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'warn',
	'pkg/scripts-test': 'off',
	'pkg/scripts-bench': 'off',
	'pkg/scripts-coverage': 'off',
	'pkg/exports': 'off',

	// Testing
	'test/has-tests': 'off',
	'test/passes': 'off',
	'test/coverage-threshold': 'off',
	'bench/has-files': 'off',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/bunup-config': 'off',
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
}

const devPreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'error',
	'files/progress': 'warn',
	'files/biome-config': 'error',
	'files/turbo-config': 'error',

	// Config
	'config/biome-extends': 'error',
	'config/tsconfig-extends': 'error',
	'config/turbo-pipeline': 'warn',

	// Package.json
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'error',
	'pkg/scripts-test': 'warn',
	'pkg/scripts-bench': 'off',
	'pkg/scripts-coverage': 'off',
	'pkg/exports': 'warn',

	// Testing
	'test/has-tests': 'warn',
	'test/passes': 'error',
	'test/coverage-threshold': 'off',
	'bench/has-files': 'off',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/bunup-config': 'error',
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
}

const stablePreset: PresetConfig = {
	// Files
	'files/readme': 'error',
	'files/license': 'error',
	'files/progress': 'error',
	'files/biome-config': 'error',
	'files/turbo-config': 'error',

	// Config
	'config/biome-extends': 'error',
	'config/tsconfig-extends': 'error',
	'config/turbo-pipeline': 'error',

	// Package.json
	'pkg/name': 'error',
	'pkg/description': 'error',
	'pkg/type-module': 'error',
	'pkg/scripts-lint': 'error',
	'pkg/scripts-format': 'error',
	'pkg/scripts-build': 'error',
	'pkg/scripts-test': 'error',
	'pkg/scripts-bench': 'warn',
	'pkg/scripts-coverage': 'error',
	'pkg/exports': 'error',

	// Testing
	'test/has-tests': 'error',
	'test/passes': 'error',
	'test/coverage-threshold': 'error',
	'bench/has-files': 'warn',

	// Formatting
	'format/biome-check': 'error',
	'format/biome-format': 'error',

	// Build
	'build/bunup-config': 'error',
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
