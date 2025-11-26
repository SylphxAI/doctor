import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { fileExists } from '../utils/fs'

export const bunupConfigCheck: Check = {
	name: 'build/bunup-config',
	category: 'build',
	description: 'Check if build.config.ts exists for bunup',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const configPath = join(ctx.cwd, 'build.config.ts')
		const exists = fileExists(configPath)

		return {
			name: 'build/bunup-config',
			category: 'build',
			passed: exists,
			message: exists ? 'build.config.ts exists' : 'Missing build.config.ts for bunup',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				const defaultConfig = `import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm'],
  clean: true,
})
`
				writeFileSync(configPath, defaultConfig, 'utf-8')
			},
		}
	},
}

export const exportsValidCheck: Check = {
	name: 'build/exports-valid',
	category: 'build',
	description: 'Check if package.json exports are properly configured',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const pkg = ctx.packageJson
		const exports = pkg?.exports

		if (!exports) {
			return {
				name: 'build/exports-valid',
				category: 'build',
				passed: false,
				message: 'package.json missing exports field',
				severity: ctx.severity,
				fixable: false,
			}
		}

		// Check if exports has proper structure
		const mainExport =
			typeof exports === 'object' ? (exports as Record<string, unknown>)['.'] : null

		if (!mainExport) {
			return {
				name: 'build/exports-valid',
				category: 'build',
				passed: false,
				message: 'package.json exports missing "." entry',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const exportObj = mainExport as Record<string, unknown>
		const hasTypes = 'types' in exportObj
		const hasImport = 'import' in exportObj

		if (!hasTypes || !hasImport) {
			return {
				name: 'build/exports-valid',
				category: 'build',
				passed: false,
				message: `package.json exports["."] missing ${!hasTypes ? 'types' : 'import'}`,
				severity: ctx.severity,
				fixable: false,
			}
		}

		return {
			name: 'build/exports-valid',
			category: 'build',
			passed: true,
			message: 'package.json exports properly configured',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const buildChecks: Check[] = [bunupConfigCheck, exportsValidCheck]
