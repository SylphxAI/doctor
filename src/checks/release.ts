import { isCI } from '../utils/env'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Check if commit message matches release pattern
 * Aligned with @sylphx/bump action detection
 */
function isReleaseCommit(msg: string): boolean {
	return msg.includes('chore(release):')
}

export const releaseModule: CheckModule = defineCheckModule(
	{
		category: 'release',
		label: '🚀 Release',
		description: 'Enforce automated release workflow',
	},
	[
		{
			name: 'release/no-manual-version',
			description: 'Prevent manual version changes in package.json',
			fixable: false,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				if (isCI()) {
					return {
						passed: true,
						message: 'Version change allowed (CI environment)',
					}
				}

				// Check all staged package.json files (root + packages/*)
				const diffResult = await exec(
					'git',
					['diff', '--cached', '--name-only', '--', '**/package.json'],
					ctx.cwd
				)

				if (diffResult.exitCode !== 0 || !diffResult.stdout.trim()) {
					return {
						passed: true,
						message: 'No staged package.json changes',
					}
				}

				const changedFiles = diffResult.stdout.trim().split('\n').filter(Boolean)

				// Check each changed package.json for version changes
				for (const file of changedFiles) {
					const fileDiff = await exec('git', ['diff', '--cached', file], ctx.cwd)

					const versionChangePattern = /^\+\s*"version":\s*"/m
					if (versionChangePattern.test(fileDiff.stdout)) {
						return {
							passed: false,
							message: `Manual version change detected in ${file}`,
							hint: `Version changes should only be done by automated release workflow. Revert with: git checkout ${file}`,
						}
					}
				}

				return {
					passed: true,
					message: 'No manual version changes detected',
				}
			},
		},

		{
			name: 'release/no-release-commit',
			description: 'Block manual release commit messages',
			fixable: false,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				// Get the commit message being created (for pre-commit hook)
				// Check COMMIT_EDITMSG if it exists
				const { join } = await import('node:path')
				const { fileExists, readFile } = await import('../utils/fs')

				const gitDir = join(ctx.cwd, '.git')
				const commitMsgFile = join(gitDir, 'COMMIT_EDITMSG')

				// If no commit message file, this isn't a commit operation
				if (!fileExists(commitMsgFile)) {
					// Also check staged commit message via git
					const result = await exec(
						'git',
						['log', '-1', '--format=%s', '--no-walk', 'HEAD'],
						ctx.cwd
					)

					if (result.exitCode !== 0) {
						return {
							passed: true,
							message: 'No commit to check',
						}
					}

					const lastCommitMsg = result.stdout.trim()

					// Check if last commit is a release commit (for pre-push)
					if (isReleaseCommit(lastCommitMsg)) {
						if (isCI()) {
							return {
								passed: true,
								message: 'Release commit allowed (CI environment)',
							}
						}

						return {
							passed: false,
							message: `Manual release commit detected: "${lastCommitMsg}"`,
							hint: 'Release commits should only be created by automated workflow. Use: git reset HEAD~1',
						}
					}

					return {
						passed: true,
						message: 'No release commit pattern detected',
					}
				}

				const commitMsg = readFile(commitMsgFile)?.trim() ?? ''

				if (!commitMsg) {
					return {
						passed: true,
						message: 'Empty commit message',
					}
				}

				// Check for release commit patterns
				if (isReleaseCommit(commitMsg)) {
					if (isCI()) {
						return {
							passed: true,
							message: 'Release commit allowed (CI environment)',
						}
					}

					return {
						passed: false,
						message: `Manual release commit blocked: "${commitMsg}"`,
						hint: 'Release commits (chore(release), chore: release, etc.) are reserved for automated workflow',
					}
				}

				return {
					passed: true,
					message: 'Commit message is not a release pattern',
				}
			},
		},

		{
			name: 'release/no-direct-publish',
			description: 'Check if prepublishOnly blocks direct npm publish',
			fixable: true,
			async check(ctx) {
				const pkg = ctx.packageJson
				const prepublishOnly = pkg?.scripts?.prepublishOnly as string | undefined

				if (!prepublishOnly) {
					return {
						passed: false,
						message: 'Missing prepublishOnly script to block direct npm publish',
						hint: 'Add prepublishOnly script that checks for CI environment',
						fix: async () => {
							const { join } = await import('node:path')
							const { readJson } = await import('../utils/fs')
							const { writeFile } = await import('node:fs/promises')

							const pkgPath = join(ctx.cwd, 'package.json')
							const pkgJson = readJson(pkgPath) as Record<string, unknown>

							if (!pkgJson.scripts) {
								pkgJson.scripts = {}
							}

							const scripts = pkgJson.scripts as Record<string, string>
							scripts.prepublishOnly = 'bunx @sylphx/doctor prepublish'

							await writeFile(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
						},
					}
				}

				// Check if prepublishOnly uses doctor prepublish or has CI check
				const usesDoctorPrepublish =
					prepublishOnly.includes('doctor prepublish') ||
					prepublishOnly.includes('cli.ts prepublish') || // bun src/cli.ts prepublish
					prepublishOnly.includes('cli.js prepublish') // node dist/cli.js prepublish
				const hasCICheck =
					prepublishOnly.includes('$CI') ||
					prepublishOnly.includes('GITHUB_ACTIONS') ||
					prepublishOnly.includes('CI=')

				if (!usesDoctorPrepublish && !hasCICheck) {
					return {
						passed: false,
						message: 'prepublishOnly script does not block direct publish',
						hint: 'Use: "prepublishOnly": "bunx @sylphx/doctor prepublish"',
					}
				}

				return {
					passed: true,
					message: 'prepublishOnly blocks direct npm publish',
				}
			},
		},

		{
			name: 'release/bump-dep',
			description: 'Check if @sylphx/bump is in devDependencies when using release workflow',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readFile } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				// Check if using shared release workflow
				const releaseWorkflowPath = join(ctx.cwd, '.github', 'workflows', 'release.yml')
				const releaseWorkflowYamlPath = join(ctx.cwd, '.github', 'workflows', 'release.yaml')
				const exists = fileExists(releaseWorkflowPath) || fileExists(releaseWorkflowYamlPath)

				if (!exists) {
					return { passed: true, message: 'No release workflow (skipped)', skipped: true }
				}

				const content = readFile(releaseWorkflowPath) || readFile(releaseWorkflowYamlPath) || ''
				const usesSharedWorkflow =
					content.includes('SylphxAI/.github') ||
					content.includes('@sylphx/bump') ||
					content.includes('sylphx/bump')

				if (!usesSharedWorkflow) {
					return {
						passed: true,
						message: 'Not using @sylphx/bump workflow (skipped)',
						skipped: true,
					}
				}

				const devDeps = ctx.packageJson?.devDependencies ?? {}
				const hasBump = '@sylphx/bump' in devDeps

				return {
					passed: hasBump,
					message: hasBump
						? '@sylphx/bump in devDependencies'
						: '@sylphx/bump missing from devDependencies',
					hint: hasBump
						? undefined
						: 'Recommended for local version preview. Run: bun add -D @sylphx/bump',
					fix: async () => {
						await exec('bun', ['add', '-D', '@sylphx/bump'], ctx.cwd)
					},
				}
			},
		},
	]
)
