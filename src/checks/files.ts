import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check, CheckContext, CheckResult } from '../types'
import { fileExists } from '../utils/fs'

function createFileCheck(
	name: string,
	fileName: string,
	fixable: boolean,
	fixContent?: string,
	hint?: string
): Check {
	return {
		name,
		category: 'files',
		description: `Check if ${fileName} exists`,
		fixable,
		async run(ctx: CheckContext): Promise<CheckResult> {
			const filePath = join(ctx.cwd, fileName)
			const exists = fileExists(filePath)

			return {
				name,
				category: 'files',
				passed: exists,
				message: exists ? `${fileName} exists` : `Missing ${fileName}`,
				severity: ctx.severity,
				fixable,
				hint: exists ? undefined : hint ?? (fixable ? `Run with --fix to create ${fileName}` : `Create ${fileName} manually`),
				fix:
					fixable && fixContent
						? async () => {
								writeFileSync(filePath, fixContent, 'utf-8')
							}
						: undefined,
			}
		},
	}
}

export const readmeCheck: Check = createFileCheck('files/readme', 'README.md', false)

export const licenseCheck: Check = createFileCheck(
	'files/license',
	'LICENSE',
	true,
	`MIT License

Copyright (c) ${new Date().getFullYear()} SylphxAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
)

export const progressCheck: Check = createFileCheck(
	'files/progress',
	'progress.md',
	true,
	`# Progress

## Current Status

🚧 In Development

## Completed

- [ ] Initial setup

## In Progress

- [ ] Core features

## Planned

- [ ] Documentation
- [ ] Tests
`
)

export const biomeConfigCheck: Check = createFileCheck(
	'files/biome-config',
	'biome.json',
	true,
	JSON.stringify(
		{
			$schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
			extends: ['@sylphx/biome-config'],
		},
		null,
		2
	)
)

export const turboConfigCheck: Check = {
	name: 'files/turbo-config',
	category: 'files',
	description: 'Check if turbo.json exists (monorepo only)',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const filePath = join(ctx.cwd, 'turbo.json')
		const exists = fileExists(filePath)

		// Smart detection:
		// - If turbo.json exists -> validate it (even for single repos using turbo for caching)
		// - If not exists + monorepo -> require it
		// - If not exists + single repo -> skip
		if (!exists && !ctx.isMonorepo) {
			return {
				name: 'files/turbo-config',
				category: 'files',
				passed: true,
				message: 'Not a monorepo, turbo.json not required',
				severity: ctx.severity,
				fixable: false,
				skipped: true,
			}
		}

		return {
			name: 'files/turbo-config',
			category: 'files',
			passed: exists,
			message: exists ? 'turbo.json exists' : 'Missing turbo.json (monorepo)',
			severity: ctx.severity,
			fixable: true,
			hint: exists ? undefined : 'Run: bunx turbo init',
			fix: async () => {
				const defaultConfig = {
					$schema: 'https://turbo.build/schema.json',
					tasks: {
						build: {
							dependsOn: ['^build'],
							outputs: ['dist/**'],
						},
						lint: {
							dependsOn: ['^lint'],
						},
						test: {
							dependsOn: ['^build'],
						},
						typecheck: {
							dependsOn: ['^typecheck'],
						},
					},
				}
				writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf-8')
			},
		}
	},
}

export const gitignoreCheck: Check = {
	name: 'files/gitignore',
	category: 'files',
	description: 'Check if .gitignore exists',
	fixable: true,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const filePath = join(ctx.cwd, '.gitignore')
		const exists = fileExists(filePath)

		return {
			name: 'files/gitignore',
			category: 'files',
			passed: exists,
			message: exists ? '.gitignore exists' : 'Missing .gitignore',
			severity: ctx.severity,
			fixable: true,
			hint: exists ? undefined : 'Run with --fix or create .gitignore manually',
			fix: async () => {
				const content = `# Dependencies
node_modules/

# Build outputs
dist/
.turbo/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
`
				writeFileSync(filePath, content, 'utf-8')
			},
		}
	},
}

export const changelogCheck: Check = {
	name: 'files/changelog',
	category: 'files',
	description: 'Check if CHANGELOG.md exists',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const filePath = join(ctx.cwd, 'CHANGELOG.md')
		const exists = fileExists(filePath)

		return {
			name: 'files/changelog',
			category: 'files',
			passed: exists,
			message: exists
				? 'CHANGELOG.md exists'
				: 'Missing CHANGELOG.md (auto-generated on release)',
			severity: ctx.severity,
			fixable: false,
			hint: exists ? undefined : 'CHANGELOG.md will be created automatically when you make your first release',
		}
	},
}

export const fileChecks: Check[] = [
	readmeCheck,
	licenseCheck,
	gitignoreCheck,
	changelogCheck,
	progressCheck,
	biomeConfigCheck,
	turboConfigCheck,
]
