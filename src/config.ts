import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createJiti } from 'jiti'
import type { DoctorConfig } from './types'

/**
 * Config file search order (first found wins)
 * - doctor.config.* preferred over sylphx-doctor.config.*
 * - JSON supported for non-TS projects (Rust, etc.)
 */
const CONFIG_FILES = [
	'doctor.config.ts',
	'doctor.config.js',
	'doctor.config.mjs',
	'doctor.config.json',
	// Legacy names (backward compatible)
	'sylphx-doctor.config.ts',
	'sylphx-doctor.config.js',
	'sylphx-doctor.config.mjs',
	'sylphx-doctor.config.json',
]

/**
 * Load JSON config file
 */
function loadJsonConfig(configPath: string): DoctorConfig | null {
	try {
		const content = readFileSync(configPath, 'utf-8')
		return JSON.parse(content) as DoctorConfig
	} catch {
		return null
	}
}

/**
 * Load config from Cargo.toml [package.metadata.doctor] section
 * For Rust projects that don't have package.json
 */
function loadCargoConfig(cwd: string): DoctorConfig | null {
	const cargoPath = join(cwd, 'Cargo.toml')
	if (!existsSync(cargoPath)) return null

	try {
		const content = readFileSync(cargoPath, 'utf-8')

		// Simple TOML parser for [package.metadata.doctor] section
		const metadataMatch = content.match(/\[package\.metadata\.doctor\]([\s\S]*?)(?=\n\[|$)/)
		if (!metadataMatch) return null

		const section = metadataMatch[1]
		if (!section) return null

		const config: DoctorConfig = {}

		// Parse preset
		const presetMatch = section.match(/preset\s*=\s*"([^"]+)"/)
		if (presetMatch?.[1]) {
			config.preset = presetMatch[1] as DoctorConfig['preset']
		}

		// Parse rules section (search in full content since it's a separate TOML section)
		const rulesMatch = content.match(/\[package\.metadata\.doctor\.rules\]([\s\S]*?)(?=\n\[|$)/)
		if (rulesMatch?.[1]) {
			config.rules = {}
			const rulesSection = rulesMatch[1]
			const ruleMatches = rulesSection.matchAll(/"([^"]+)"\s*=\s*"([^"]+)"/g)
			for (const match of ruleMatches) {
				const key = match[1]
				const value = match[2]
				if (key && value) {
					config.rules[key] = value as 'off' | 'info' | 'warn' | 'error'
				}
			}
		}

		return Object.keys(config).length > 0 ? config : null
	} catch {
		return null
	}
}

/**
 * Load config from a directory
 */
async function loadConfigFromDir(cwd: string): Promise<DoctorConfig | null> {
	// Try JS/TS config files first
	for (const configFile of CONFIG_FILES) {
		const configPath = join(cwd, configFile)

		if (existsSync(configPath)) {
			try {
				// JSON config
				if (configFile.endsWith('.json')) {
					const config = loadJsonConfig(configPath)
					if (config) return config
					continue
				}

				// JS/TS config using jiti
				const jiti = createJiti(cwd, {
					interopDefault: true,
				})

				const config = await jiti.import(configPath)
				return (config as { default?: DoctorConfig }).default ?? (config as DoctorConfig)
			} catch (error) {
				console.error(`Error loading config from ${configFile}:`, error)
			}
		}
	}

	// Try Cargo.toml for Rust projects
	const cargoConfig = loadCargoConfig(cwd)
	if (cargoConfig) return cargoConfig

	return null
}

/**
 * Merge two configs (child overrides parent)
 */
function mergeConfigs(parent: DoctorConfig, child: DoctorConfig): DoctorConfig {
	return {
		preset: child.preset ?? parent.preset,
		rules: {
			...parent.rules,
			...child.rules,
		},
		options: {
			...parent.options,
			...child.options,
		},
		ignore: child.ignore ?? parent.ignore,
	}
}

/**
 * Default config when no config file found
 */
const DEFAULT_CONFIG: DoctorConfig = {
	preset: 'dev',
}

/**
 * Load config for a directory
 * Supports per-package config in monorepos
 *
 * @param cwd - Directory to load config from
 * @param rootConfig - Optional root config to inherit from (for per-package config)
 */
export async function loadConfig(cwd: string, rootConfig?: DoctorConfig): Promise<DoctorConfig> {
	const config = await loadConfigFromDir(cwd)

	if (config) {
		// If we have a root config, merge with it
		if (rootConfig) {
			return mergeConfigs(rootConfig, config)
		}
		return config
	}

	// No config found - use root config or default
	return rootConfig ?? DEFAULT_CONFIG
}

/**
 * Load root config only (for runner to pass to packages)
 */
export async function loadRootConfig(cwd: string): Promise<DoctorConfig> {
	const config = await loadConfigFromDir(cwd)
	return config ?? DEFAULT_CONFIG
}

/**
 * Helper to define config with type safety
 */
export function defineConfig(config: DoctorConfig): DoctorConfig {
	return config
}
