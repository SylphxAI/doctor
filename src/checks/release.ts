import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Check if commit message matches release patterns
 */
function isReleaseCommit(msg: string): boolean {
	const releasePatterns = [
		/^chore\(release\)/i,
		/^chore:\s*release/i,
		/^release:/i,
		/^release\(/i,
		/bump.*version/i,
		/^v?\d+\.\d+\.\d+$/,
	]

	return releasePatterns.some((pattern) => pattern.test(msg))
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

				// Check if there are uncommitted changes to package.json version
				const diffResult = await exec('git', ['diff', '--cached', 'package.json'], ctx.cwd)

				if (diffResult.exitCode !== 0) {
					return {
						passed: true,
						message: 'No staged package.json changes',
					}
				}

				const diff = diffResult.stdout

				// Check if version line is being changed
				const versionChangePattern = /^\+\s*"version":\s*"/m
				const hasVersionChange = versionChangePattern.test(diff)

				if (!hasVersionChange) {
					return {
						passed: true,
						message: 'No manual version changes detected',
					}
				}

				// Check if this is from CI (env var check)
				const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

				if (isCI) {
					return {
						passed: true,
						message: 'Version change allowed (CI environment)',
					}
				}

				return {
					passed: false,
					message: 'Manual version change detected in package.json',
					hint: 'Version changes should only be done by automated release workflow. Revert with: git checkout package.json',
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
						const isCI =
							process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

						if (isCI) {
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
					const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

					if (isCI) {
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
							scripts.prepublishOnly =
								'[ "$CI" = \'true\' ] || [ "$GITHUB_ACTIONS" = \'true\' ] || (echo \'❌ Direct npm publish is blocked. Use automated release workflow.\' && exit 1)'

							await writeFile(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
						},
					}
				}

				// Check if prepublishOnly has CI check
				const hasCICheck =
					prepublishOnly.includes('$CI') ||
					prepublishOnly.includes('GITHUB_ACTIONS') ||
					prepublishOnly.includes('CI=')

				if (!hasCICheck) {
					return {
						passed: false,
						message: 'prepublishOnly script does not check for CI environment',
						hint: 'prepublishOnly should block publishing unless in CI',
					}
				}

				return {
					passed: true,
					message: 'prepublishOnly blocks direct npm publish',
				}
			},
		},
	]
)

// Export for backward compatibility
export const releaseChecks: Check[] = releaseModule.checks
