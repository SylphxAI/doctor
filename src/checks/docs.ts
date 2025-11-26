import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { directoryExists, fileExists } from '../utils/fs'

export const vitepressCheck: Check = {
	name: 'docs/vitepress',
	category: 'docs',
	description: 'Check if VitePress docs exist',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const vitepressDir = join(ctx.cwd, 'docs', '.vitepress')
		const exists = await directoryExists(vitepressDir)

		return {
			name: 'docs/vitepress',
			category: 'docs',
			passed: exists,
			message: exists ? 'VitePress docs exist' : 'Missing VitePress docs (docs/.vitepress/)',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const vercelConfigCheck: Check = {
	name: 'docs/vercel-config',
	category: 'docs',
	description: 'Check if vercel.json exists for docs deployment',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		// Only check if vitepress docs exist
		const vitepressDir = join(ctx.cwd, 'docs', '.vitepress')
		const hasVitepress = await directoryExists(vitepressDir)

		if (!hasVitepress) {
			return {
				name: 'docs/vercel-config',
				category: 'docs',
				passed: true,
				message: 'No VitePress docs - vercel.json not required',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const vercelPath = join(ctx.cwd, 'vercel.json')
		const exists = fileExists(vercelPath)

		return {
			name: 'docs/vercel-config',
			category: 'docs',
			passed: exists,
			message: exists
				? 'vercel.json exists for docs deployment'
				: 'Missing vercel.json for docs deployment',
			severity: ctx.severity,
			fixable: true,
			fix: async () => {
				const config = {
					buildCommand: 'bun run docs:build',
					outputDirectory: 'docs/.vitepress/dist',
					framework: 'vitepress',
				}
				writeFileSync(vercelPath, JSON.stringify(config, null, 2), 'utf-8')
			},
		}
	},
}

export const docsChecks: Check[] = [vitepressCheck, vercelConfigCheck]
