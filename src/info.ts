import type { InfoMessage } from './types'

export const infoMessages: InfoMessage[] = [
	{
		name: 'info/release-hint',
		hook: 'push',
		message: () => '💡 Release? Check: gh pr list --head bump/release',
	},
]

export function getInfoForHook(hook: InfoMessage['hook']): InfoMessage[] {
	return infoMessages.filter((i) => i.hook === hook)
}
