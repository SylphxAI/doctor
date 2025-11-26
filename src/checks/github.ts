import type { CheckModule } from './define'
import { defineCheckModule } from './define'

async function getGitHubRepoInfo(
	cwd: string
): Promise<{ description: string; url: string; topics: string[] } | null> {
	const { exec } = await import('../utils/exec')

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

export const githubModule: CheckModule = defineCheckModule(
	{
		category: 'github',
		label: '🐙 GitHub',
		description: 'Check GitHub repository settings',
	},
	[
		{
			name: 'github/description',
			description: 'Check if GitHub repo has description',
			fixable: false,
			async check(ctx) {
				const info = await getGitHubRepoInfo(ctx.cwd)

				if (!info) {
					return {
						passed: true,
						message: 'Could not fetch GitHub repo info (skipped)',
						skipped: true,
					}
				}

				const hasDescription = info.description.length > 0

				return {
					passed: hasDescription,
					message: hasDescription
						? `GitHub description: "${info.description.slice(0, 50)}${info.description.length > 50 ? '...' : ''}"`
						: 'GitHub repo missing description',
				}
			},
		},

		{
			name: 'github/website',
			description: 'Check if GitHub repo has website URL',
			fixable: false,
			async check(ctx) {
				const { exec } = await import('../utils/exec')

				const result = await exec('gh', ['repo', 'view', '--json', 'homepageUrl'], ctx.cwd)

				if (result.exitCode !== 0) {
					return {
						passed: true,
						message: 'Could not fetch GitHub repo info (skipped)',
						skipped: true,
					}
				}

				try {
					const data = JSON.parse(result.stdout)
					const hasUrl = data.homepageUrl && data.homepageUrl.length > 0

					return {
						passed: hasUrl,
						message: hasUrl
							? `GitHub website: ${data.homepageUrl}`
							: 'GitHub repo missing website URL',
					}
				} catch {
					return {
						passed: true,
						message: 'Could not parse GitHub repo info (skipped)',
						skipped: true,
					}
				}
			},
		},

		{
			name: 'github/topics',
			description: 'Check if GitHub repo has topics',
			fixable: false,
			async check(ctx) {
				const minTopics = (ctx.options?.min as number) ?? 3
				const info = await getGitHubRepoInfo(ctx.cwd)

				if (!info) {
					return {
						passed: true,
						message: 'Could not fetch GitHub repo info (skipped)',
						skipped: true,
					}
				}

				const hasEnoughTopics = info.topics.length >= minTopics

				return {
					passed: hasEnoughTopics,
					message: hasEnoughTopics
						? `GitHub topics (${info.topics.length}): ${info.topics.join(', ')}`
						: `GitHub repo has ${info.topics.length} topics (need at least ${minTopics})`,
				}
			},
		},
	]
)
