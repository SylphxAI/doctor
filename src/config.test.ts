import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, loadRootConfig } from './config'

const TMP_DIR = join(import.meta.dir, '../.test-config')

beforeEach(() => {
	mkdirSync(TMP_DIR, { recursive: true })
})

afterEach(() => {
	rmSync(TMP_DIR, { recursive: true, force: true })
})

describe('loadConfig', () => {
	test('returns default config when no config file exists', async () => {
		const config = await loadConfig(TMP_DIR)
		expect(config).toEqual({ preset: 'dev' })
	})

	test('loads JSON config', async () => {
		writeFileSync(
			join(TMP_DIR, 'doctor.config.json'),
			JSON.stringify({
				preset: 'stable',
				rules: { 'test/coverage': 'off' },
			})
		)

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('stable')
		expect(config.rules?.['test/coverage']).toBe('off')
	})

	test('prefers doctor.config.* over sylphx-doctor.config.*', async () => {
		// Create legacy config
		writeFileSync(join(TMP_DIR, 'sylphx-doctor.config.json'), JSON.stringify({ preset: 'init' }))

		// Create new config
		writeFileSync(join(TMP_DIR, 'doctor.config.json'), JSON.stringify({ preset: 'stable' }))

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('stable')
	})

	test('loads legacy sylphx-doctor.config.json', async () => {
		writeFileSync(join(TMP_DIR, 'sylphx-doctor.config.json'), JSON.stringify({ preset: 'init' }))

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('init')
	})
})

describe('loadConfig with rootConfig', () => {
	test('merges child config with root config', async () => {
		const rootConfig = {
			preset: 'dev' as const,
			rules: { 'test/coverage': 'error' as const, 'docs/readme': 'warn' as const },
		}

		// Child overrides one rule
		writeFileSync(join(TMP_DIR, 'doctor.config.json'), JSON.stringify({ rules: { 'test/coverage': 'off' } }))

		const config = await loadConfig(TMP_DIR, rootConfig)

		// Preset inherited from root
		expect(config.preset).toBe('dev')
		// Overridden rule
		expect(config.rules?.['test/coverage']).toBe('off')
		// Inherited rule
		expect(config.rules?.['docs/readme']).toBe('warn')
	})

	test('child preset overrides root preset', async () => {
		const rootConfig = { preset: 'dev' as const }

		writeFileSync(join(TMP_DIR, 'doctor.config.json'), JSON.stringify({ preset: 'stable' }))

		const config = await loadConfig(TMP_DIR, rootConfig)
		expect(config.preset).toBe('stable')
	})

	test('uses root config when child has no config', async () => {
		const rootConfig = {
			preset: 'stable' as const,
			rules: { 'test/coverage': 'error' as const },
		}

		const config = await loadConfig(TMP_DIR, rootConfig)

		expect(config.preset).toBe('stable')
		expect(config.rules?.['test/coverage']).toBe('error')
	})
})

describe('loadRootConfig', () => {
	test('returns default config when no config exists', async () => {
		const config = await loadRootConfig(TMP_DIR)
		expect(config).toEqual({ preset: 'dev' })
	})

	test('loads config from directory', async () => {
		writeFileSync(join(TMP_DIR, 'doctor.config.json'), JSON.stringify({ preset: 'init' }))

		const config = await loadRootConfig(TMP_DIR)
		expect(config.preset).toBe('init')
	})
})

describe('Cargo.toml config', () => {
	test('loads config from Cargo.toml metadata', async () => {
		writeFileSync(
			join(TMP_DIR, 'Cargo.toml'),
			`[package]
name = "test-crate"
version = "0.1.0"

[package.metadata.doctor]
preset = "stable"
`
		)

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('stable')
	})

	test('loads rules from Cargo.toml metadata', async () => {
		writeFileSync(
			join(TMP_DIR, 'Cargo.toml'),
			`[package]
name = "test-crate"
version = "0.1.0"

[package.metadata.doctor]
preset = "dev"

[package.metadata.doctor.rules]
"rust/deny" = "off"
"rust/clippy" = "warn"
`
		)

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('dev')
		expect(config.rules?.['rust/deny']).toBe('off')
		expect(config.rules?.['rust/clippy']).toBe('warn')
	})

	test('prefers JSON config over Cargo.toml', async () => {
		// Create Cargo.toml config
		writeFileSync(
			join(TMP_DIR, 'Cargo.toml'),
			`[package]
name = "test-crate"

[package.metadata.doctor]
preset = "init"
`
		)

		// Create JSON config (should take priority)
		writeFileSync(join(TMP_DIR, 'doctor.config.json'), JSON.stringify({ preset: 'stable' }))

		const config = await loadConfig(TMP_DIR)
		expect(config.preset).toBe('stable')
	})
})
