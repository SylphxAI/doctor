import type { Check } from '../types'
import type { CheckModule } from './define'
import { createFileCheck, defineCheckModule } from './define'

export const filesModule: CheckModule = defineCheckModule(
	{
		category: 'files',
		label: '📁 Files',
		description: 'Check for required project files',
	},
	[
		createFileCheck({
			name: 'files/readme',
			fileName: 'README.md',
			fixable: false,
			hint: 'Create a README.md to document your project',
		}),

		createFileCheck({
			name: 'files/license',
			fileName: 'LICENSE',
			fixable: true,
			fixContent: () => `MIT License

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
`,
		}),

		createFileCheck({
			name: 'files/gitignore',
			fileName: '.gitignore',
			fixable: true,
			fixContent: `# Dependencies
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
`,
		}),

		createFileCheck({
			name: 'files/changelog',
			fileName: 'CHANGELOG.md',
			fixable: false,
			hint: 'CHANGELOG.md will be created automatically when you make your first release',
			missingMessage: 'Missing CHANGELOG.md (auto-generated on release)',
			severity: 'info',
		}),

		createFileCheck({
			name: 'files/progress',
			fileName: 'progress.md',
			fixable: true,
			fixContent: `# Progress

## Current Status

🚧 In Development

## Completed

- [ ] Initial setup

## In Progress

- [ ] Core features

## Planned

- [ ] Documentation
- [ ] Tests
`,
		}),

		createFileCheck({
			name: 'files/biome-config',
			fileName: 'biome.json',
			fixable: true,
			fixContent: JSON.stringify(
				{
					$schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
					extends: ['@sylphx/biome-config'],
				},
				null,
				2
			),
			hint: 'Run: bun add -D @sylphx/biome-config',
		}),

		createFileCheck({
			name: 'files/turbo-config',
			fileName: 'turbo.json',
			fixable: true,
			condition: (ctx) => ctx.isMonorepo,
			fixContent: JSON.stringify(
				{
					$schema: 'https://turbo.build/schema.json',
					tasks: {
						build: { dependsOn: ['^build'], outputs: ['dist/**'] },
						lint: { dependsOn: ['^lint'] },
						test: { dependsOn: ['^build'] },
						typecheck: { dependsOn: ['^typecheck'] },
					},
				},
				null,
				2
			),
			hint: 'Run: bunx turbo init',
			missingMessage: 'Missing turbo.json (monorepo)',
		}),
	]
)

// Export for backward compatibility
export const fileChecks: Check[] = filesModule.checks
