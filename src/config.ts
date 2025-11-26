import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createJiti } from 'jiti'
import type { DoctorConfig } from './types'

const CONFIG_FILES = [
	'sylphx-doctor.config.ts',
	'sylphx-doctor.config.js',
	'sylphx-doctor.config.mjs',
	'doctor.config.ts',
	'doctor.config.js',
]

export async function loadConfig(cwd: string): Promise<DoctorConfig> {
	for (const configFile of CONFIG_FILES) {
		const configPath = join(cwd, configFile)

		if (existsSync(configPath)) {
			try {
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

	// Return default config if no config file found
	return {
		preset: 'dev',
	}
}

export function defineConfig(config: DoctorConfig): DoctorConfig {
	return config
}
