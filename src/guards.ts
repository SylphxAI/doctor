import type { Guard } from './types'

export const guards: Guard[] = [
	{
		name: 'guard/ci-env',
		hook: 'prepublish',
		description: 'Block direct npm publish outside CI',
		async run() {
			const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

			if (isCI) {
				return {
					passed: true,
					message: 'Running in CI environment',
				}
			}

			return {
				passed: false,
				message: `Direct npm publish blocked. Use the release workflow instead.

To release:
  1. Push changes to trigger CI
  2. CI will create/update a release PR
  3. Merge the PR to publish

Or set CI=true to bypass (not recommended)`,
			}
		},
	},
]

export function getGuardsForHook(hook: Guard['hook']): Guard[] {
	return guards.filter((g) => g.hook === hook)
}
