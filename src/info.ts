import type { InfoMessage } from './types'

export const infoMessages: InfoMessage[] = [
	{
		name: 'info/bump-release',
		hooks: ['prepush'],
		message:
			() => `📦 Release workflow: Push to main → bump creates Release PR → Merge PR → npm publish
   Check PR: gh pr list --head bump/release`,
	},
	{
		name: 'info/build-reminder',
		hooks: ['prepush'],
		message: () => `⚠️  bump does not build! Ensure build runs via:
   • prepack script in package.json, OR
   • build step in CI workflow`,
	},
]
