/**
 * Environment utilities
 */

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
	return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
}

/**
 * Check if running in GitHub Actions
 */
export function isGitHubActions(): boolean {
	return process.env.GITHUB_ACTIONS === 'true'
}
