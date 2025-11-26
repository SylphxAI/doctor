import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { fileExists, readJson } from '../utils/fs'

export const biomeExtendsCheck: Check = {
	name: 'config/biome-extends',
	category: 'config',
	description: 'Check if biome.json extends shared config',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const configPath = join(ctx.cwd, 'biome.json')

		if (!fileExists(configPath)) {
			return {
				name: 'config/biome-extends',
				category: 'config',
				passed: false,
				message: 'biome.json does not exist',
				severity: ctx.severity,
				fixable: true,
				hint: 'Run: bun add -D @sylphx/biome-config && echo \'{"extends":["@sylphx/biome-config"]}\' > biome.json',
				fix: async () => {
					const config = {
						$schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
						extends: ['@sylphx/biome-config'],
					}
					writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
				},
			}
		}

		const config = readJson<{ extends?: string[] }>(configPath)
		const hasExtends = config?.extends && config.extends.length > 0

		return {
			name: 'config/biome-extends',
			category: 'config',
			passed: !!hasExtends,
			message: hasExtends
				? `biome.json extends: ${config.extends?.join(', ')}`
				: 'biome.json does not extend shared config',
			severity: ctx.severity,
			fixable: true,
			hint: hasExtends ? undefined : 'Add "extends": ["@sylphx/biome-config"] to biome.json',
			fix: async () => {
				const currentConfig = readJson<Record<string, unknown>>(configPath) ?? {}
				currentConfig.$schema = 'https://biomejs.dev/schemas/1.9.4/schema.json'
				currentConfig.extends = ['@sylphx/biome-config']
				writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
			},
		}
	},
}

export const tsconfigExtendsCheck: Check = {
	name: 'config/tsconfig-extends',
	category: 'config',
	description: 'Check if tsconfig.json extends shared config',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const configPath = join(ctx.cwd, 'tsconfig.json')

		if (!fileExists(configPath)) {
			return {
				name: 'config/tsconfig-extends',
				category: 'config',
				passed: false,
				message: 'tsconfig.json does not exist',
				severity: ctx.severity,
				fixable: false,
				hint: 'Run: bun add -D @sylphx/tsconfig && echo \'{"extends":"@sylphx/tsconfig"}\' > tsconfig.json',
			}
		}

		const config = readJson<{ extends?: string }>(configPath)
		const hasExtends = !!config?.extends

		return {
			name: 'config/tsconfig-extends',
			category: 'config',
			passed: hasExtends,
			message: hasExtends
				? `tsconfig.json extends: ${config.extends}`
				: 'tsconfig.json does not extend shared config',
			severity: ctx.severity,
			fixable: true,
			hint: hasExtends ? undefined : 'Add "extends": "@sylphx/tsconfig" to tsconfig.json',
			fix: async () => {
				const currentConfig = readJson<Record<string, unknown>>(configPath) ?? {}
				currentConfig.extends = '@sylphx/tsconfig'
				writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
			},
		}
	},
}

export const turboPipelineCheck: Check = {
	name: 'config/turbo-pipeline',
	category: 'config',
	description: 'Check if turbo.json has standard pipeline',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const configPath = join(ctx.cwd, 'turbo.json')

		// Smart detection: only check if turbo.json exists
		if (!fileExists(configPath)) {
			// Skip if not a monorepo
			if (!ctx.isMonorepo) {
				return {
					name: 'config/turbo-pipeline',
					category: 'config',
					passed: true,
					message: 'No turbo.json',
					severity: ctx.severity,
					fixable: false,
					skipped: true,
				}
			}
			return {
				name: 'config/turbo-pipeline',
				category: 'config',
				passed: false,
				message: 'turbo.json does not exist',
				severity: ctx.severity,
				fixable: false,
				hint: 'Run: bunx turbo init',
			}
		}

		const config = readJson<{ tasks?: Record<string, unknown> }>(configPath)
		const hasTasks = !!(config?.tasks && Object.keys(config.tasks).length > 0)

		// Check for essential tasks
		const requiredTasks = ['build', 'lint', 'test']
		const missingTasks = requiredTasks.filter((task) => !config?.tasks?.[task])

		const passed: boolean = hasTasks && missingTasks.length === 0

		return {
			name: 'config/turbo-pipeline',
			category: 'config',
			passed,
			message: passed
				? 'turbo.json has standard pipeline'
				: `turbo.json missing tasks: ${missingTasks.join(', ')}`,
			severity: ctx.severity,
			fixable: true,
			hint: passed ? undefined : `Add tasks to turbo.json: ${missingTasks.map((t) => `"${t}": {}`).join(', ')}`,
			fix: async () => {
				const currentConfig = readJson<Record<string, unknown>>(configPath) ?? {}
				currentConfig.$schema = 'https://turbo.build/schema.json'
				currentConfig.tasks = {
					build: { dependsOn: ['^build'], outputs: ['dist/**'] },
					lint: { dependsOn: ['^lint'] },
					test: { dependsOn: ['^build'] },
					typecheck: { dependsOn: ['^typecheck'] },
					...(currentConfig.tasks as Record<string, unknown>),
				}
				writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8')
			},
		}
	},
}

export const configChecks: Check[] = [biomeExtendsCheck, tsconfigExtendsCheck, turboPipelineCheck]
