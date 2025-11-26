/**
 * Shared formatting utilities for check hints and messages
 */

export interface PackageIssue {
	/** Package location (e.g., "root", "packages/foo") */
	location: string
	/** Issue description */
	issue: string
}

/**
 * Format a list of package issues for display
 * Each issue is shown on a separate line
 */
export function formatPackageIssues(issues: PackageIssue[], maxShow = 5): string {
	const lines = issues.slice(0, maxShow).map((i) => `${i.location}: ${i.issue}`)
	if (issues.length > maxShow) {
		lines.push(`(+${issues.length - maxShow} more)`)
	}
	return lines.join('\n')
}

/**
 * Format a list of items grouped by location
 * e.g., { "root": ["eslint", "prettier"], "packages/foo": ["jest"] }
 */
export function formatGroupedIssues(
	groups: Map<string, string[]> | Record<string, string[]>,
	maxShow = 5
): string {
	const entries = groups instanceof Map ? [...groups.entries()] : Object.entries(groups)
	const lines = entries
		.slice(0, maxShow)
		.map(([location, items]) => `${location}: ${items.join(', ')}`)
	if (entries.length > maxShow) {
		lines.push(`(+${entries.length - maxShow} more)`)
	}
	return lines.join('\n')
}

/**
 * Format a simple list of items
 */
export function formatList(items: string[], maxShow = 5): string {
	const display = items.slice(0, maxShow)
	if (items.length > maxShow) {
		display.push(`(+${items.length - maxShow} more)`)
	}
	return display.join('\n')
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
	return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Format count with pluralized noun
 * e.g., formatCount(3, "package") => "3 packages"
 */
export function formatCount(count: number, singular: string, plural?: string): string {
	return `${count} ${pluralize(count, singular, plural)}`
}
