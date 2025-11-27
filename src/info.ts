import type { InfoMessage } from './types'

export const infoMessages: InfoMessage[] = [
	{
		name: 'info/release-hint',
		hooks: ['prepush'],
		message: () => '💡 Release? Check: gh pr list --head bump/release',
	},
]

// Note: getInfoForHook moved to src/hooks.ts
