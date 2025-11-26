import type { Check } from '../types'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

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
	]
)

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

// Export for backward compatibility
export const releaseChecks: Check[] = releaseModule.checks
