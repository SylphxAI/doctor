import type { Check, CheckContext, CheckResult } from '../types'
import { exec } from '../utils/exec'

async function getGitHubRepoInfo(
	cwd: string
): Promise<{ description: string; url: string; topics: string[] } | null> {
	// Try to get repo info using gh CLI
	const result = await exec(
		'gh',
		['repo', 'view', '--json', 'description,url,repositoryTopics'],
		cwd
	)

	if (result.exitCode !== 0) {
		return null
	}

	try {
		const data = JSON.parse(result.stdout)
		return {
			description: data.description || '',
			url: data.url || '',
			topics: (data.repositoryTopics || []).map((t: { name: string }) => t.name),
		}
	} catch {
		return null
	}
}

export const githubDescriptionCheck: Check = {
	name: 'github/description',
	category: 'github',
	description: 'Check if GitHub repo has description',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const info = await getGitHubRepoInfo(ctx.cwd)

		if (!info) {
			return {
				name: 'github/description',
				category: 'github',
				passed: true,
				message: 'Could not fetch GitHub repo info (skipped)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const hasDescription = info.description.length > 0

		return {
			name: 'github/description',
			category: 'github',
			passed: hasDescription,
			message: hasDescription
				? `GitHub description: "${info.description.slice(0, 50)}${info.description.length > 50 ? '...' : ''}"`
				: 'GitHub repo missing description',
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const githubWebsiteCheck: Check = {
	name: 'github/website',
	category: 'github',
	description: 'Check if GitHub repo has website URL',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const result = await exec('gh', ['repo', 'view', '--json', 'homepageUrl'], ctx.cwd)

		if (result.exitCode !== 0) {
			return {
				name: 'github/website',
				category: 'github',
				passed: true,
				message: 'Could not fetch GitHub repo info (skipped)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		try {
			const data = JSON.parse(result.stdout)
			const hasUrl = data.homepageUrl && data.homepageUrl.length > 0

			return {
				name: 'github/website',
				category: 'github',
				passed: hasUrl,
				message: hasUrl ? `GitHub website: ${data.homepageUrl}` : 'GitHub repo missing website URL',
				severity: ctx.severity,
				fixable: false,
			}
		} catch {
			return {
				name: 'github/website',
				category: 'github',
				passed: true,
				message: 'Could not parse GitHub repo info (skipped)',
				severity: ctx.severity,
				fixable: false,
			}
		}
	},
}

export const githubTopicsCheck: Check = {
	name: 'github/topics',
	category: 'github',
	description: 'Check if GitHub repo has topics',
	fixable: false,
	async run(ctx: CheckContext): Promise<CheckResult> {
		const minTopics = (ctx.options?.min as number) ?? 3
		const info = await getGitHubRepoInfo(ctx.cwd)

		if (!info) {
			return {
				name: 'github/topics',
				category: 'github',
				passed: true,
				message: 'Could not fetch GitHub repo info (skipped)',
				severity: ctx.severity,
				fixable: false,
			}
		}

		const hasEnoughTopics = info.topics.length >= minTopics

		return {
			name: 'github/topics',
			category: 'github',
			passed: hasEnoughTopics,
			message: hasEnoughTopics
				? `GitHub topics (${info.topics.length}): ${info.topics.join(', ')}`
				: `GitHub repo has ${info.topics.length} topics (need at least ${minTopics})`,
			severity: ctx.severity,
			fixable: false,
		}
	},
}

export const githubChecks: Check[] = [githubDescriptionCheck, githubWebsiteCheck, githubTopicsCheck]
