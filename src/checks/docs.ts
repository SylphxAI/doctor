import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

export const docsModule: CheckModule = defineCheckModule(
	{
		category: 'docs',
		label: '📖 Docs',
		description: 'Check documentation configuration',
	},
	[
		{
			name: 'docs/vitepress',
			description: 'Check if VitePress is configured when docs/ exists',
			fixable: false,
			async check(ctx) {
				const { join } = await import('node:path')
				const { directoryExists } = await import('../utils/fs')

				// Only check if docs/ folder exists
				const docsDir = join(ctx.cwd, 'docs')
				const hasDocsFolder = await directoryExists(docsDir)

				if (!hasDocsFolder) {
					return {
						passed: true,
						message: 'No docs/ folder (skipped)',
						skipped: true,
					}
				}

				const vitepressDir = join(ctx.cwd, 'docs', '.vitepress')
				const exists = await directoryExists(vitepressDir)

				return {
					passed: exists,
					message: exists ? 'VitePress docs configured' : 'docs/ exists but VitePress not configured',
					hint: exists ? undefined : 'Run: bunx vitepress init docs',
				}
			},
		},

		{
			name: 'docs/vercel-config',
			description: 'Check if vercel.json exists for docs deployment',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { directoryExists, fileExists } = await import('../utils/fs')

				// Only check if vitepress docs exist
				const vitepressDir = join(ctx.cwd, 'docs', '.vitepress')
				const hasVitepress = await directoryExists(vitepressDir)

				if (!hasVitepress) {
					return {
						passed: true,
						message: 'No VitePress docs - vercel.json not required',
					}
				}

				const vercelPath = join(ctx.cwd, 'vercel.json')
				const exists = fileExists(vercelPath)

				return {
					passed: exists,
					message: exists
						? 'vercel.json exists for docs deployment'
						: 'Missing vercel.json for docs deployment',
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
		},
	]
)

// Export for backward compatibility
export const docsChecks: Check[] = docsModule.checks
