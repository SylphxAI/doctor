import type { CheckModule } from './define'
import { defineCheckModule } from './define'

const defaultLefthookConfig = `# Managed by @sylphx/doctor
# https://github.com/evilmartians/lefthook

pre-commit:
  commands:
    doctor:
      run: bunx @sylphx/doctor precommit --fix

pre-push:
  commands:
    doctor:
      run: bunx @sylphx/doctor prepush
`

export const hooksModule: CheckModule = defineCheckModule(
	{
		category: 'hooks',
		label: '🪝 Hooks',
		description: 'Check Git hooks configuration',
	},
	[
		{
			name: 'hooks/pre-commit',
			description: 'Check if pre-commit hook is configured',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists } = await import('../utils/fs')

				// Check for lefthook
				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const hasLefthook = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				// Check for husky
				const huskyDir = join(ctx.cwd, '.husky')
				const hasHusky = fileExists(join(huskyDir, 'pre-commit'))

				// Check for simple-git-hooks in package.json
				const pkg = ctx.packageJson
				const hasSimpleGitHooks = !!pkg?.['simple-git-hooks']

				const hasPreCommit = hasLefthook || hasHusky || hasSimpleGitHooks

				return {
					passed: hasPreCommit,
					message: hasPreCommit
						? `Pre-commit hook configured (${hasLefthook ? 'lefthook' : hasHusky ? 'husky' : 'simple-git-hooks'})`
						: 'No pre-commit hook configured',
					fix: async () => {
						// Default to lefthook
						writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8')
					},
				}
			},
		},

		// Split into separate checks so users can granularly override
		// e.g., `rules: { 'hooks/lefthook-pre-push': 'off' }` to skip pre-push check
		{
			name: 'hooks/lefthook-pre-commit',
			description: 'Check if lefthook has pre-commit hook',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				if (!exists) {
					return {
						passed: false,
						message: 'Missing lefthook.yml',
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasPreCommit = content.includes('pre-commit')

				return {
					passed: hasPreCommit,
					message: hasPreCommit
						? 'lefthook has pre-commit hook'
						: 'lefthook missing pre-commit hook',
					hint: hasPreCommit ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},

		{
			name: 'hooks/lefthook-pre-push',
			description: 'Check if lefthook has pre-push hook',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				if (!exists) {
					return {
						passed: false,
						message: 'Missing lefthook.yml',
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasPrePush = content.includes('pre-push')

				return {
					passed: hasPrePush,
					message: hasPrePush ? 'lefthook has pre-push hook' : 'lefthook missing pre-push hook',
					hint: hasPrePush ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},

		{
			name: 'hooks/lefthook-doctor',
			description: 'Check if lefthook runs @sylphx/doctor',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { writeFileSync } = await import('node:fs')
				const { fileExists, readFile } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				if (!exists) {
					return {
						passed: false,
						message: 'Missing lefthook.yml',
						fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
					}
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const hasDoctor = content.includes('@sylphx/doctor') || content.includes('sylphx-doctor')

				return {
					passed: hasDoctor,
					message: hasDoctor ? 'lefthook runs @sylphx/doctor' : 'lefthook missing @sylphx/doctor',
					hint: hasDoctor ? undefined : 'Run --fix to update lefthook.yml',
					fix: async () => writeFileSync(lefthookPath, defaultLefthookConfig, 'utf-8'),
				}
			},
		},

		{
			name: 'hooks/lefthook-installed',
			description: 'Check if lefthook is installed and git hooks are set up',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { execSync } = await import('node:child_process')
				const { fileExists, readFile } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const hasConfig = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				// Skip if no lefthook config
				if (!hasConfig) {
					return {
						passed: true,
						message: 'No lefthook config (skipped)',
						skipped: true,
					}
				}

				// Check if git hooks are installed by looking at .git/hooks/pre-commit
				const gitHookPath = join(ctx.cwd, '.git', 'hooks', 'pre-commit')
				const hookExists = fileExists(gitHookPath)

				if (!hookExists) {
					return {
						passed: false,
						message: 'Git hooks not installed',
						hint: 'Run: lefthook install',
						fix: async () => {
							execSync('bunx lefthook install', { cwd: ctx.cwd, stdio: 'ignore' })
						},
					}
				}

				// Check if hook contains lefthook (not just a sample file)
				const hookContent = readFile(gitHookPath) || ''
				const isLefthook = hookContent.includes('lefthook')

				if (!isLefthook) {
					return {
						passed: false,
						message: 'Git hooks not using lefthook',
						hint: 'Run: lefthook install',
						fix: async () => {
							execSync('bunx lefthook install', { cwd: ctx.cwd, stdio: 'ignore' })
						},
					}
				}

				return {
					passed: true,
					message: 'lefthook installed and git hooks set up',
				}
			},
		},

		{
			name: 'hooks/lefthook-dep',
			description: 'Check if lefthook is in devDependencies',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const hasConfig = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				// Skip if no lefthook config
				if (!hasConfig) {
					return { passed: true, message: 'No lefthook config (skipped)', skipped: true }
				}

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasLefthook = 'lefthook' in devDeps

				return {
					passed: hasLefthook,
					message: hasLefthook
						? 'lefthook in devDependencies'
						: 'lefthook missing from devDependencies',
					hint: hasLefthook ? undefined : 'Run: bun add -D lefthook',
					fix: async () => {
						await exec('bun', ['add', '-D', 'lefthook'], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'hooks/no-husky',
			description: 'Check for legacy git hook tools (use lefthook instead)',
			fixable: true,
			async check(ctx) {
				const { readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const banned = ['husky', 'simple-git-hooks', 'lint-staged']

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const allDeps = {
					...packageJson?.dependencies,
					...packageJson?.devDependencies,
				}

				const found = banned.filter((pkg) => pkg in allDeps)

				if (found.length === 0) {
					return { passed: true, message: 'No legacy git hook tools' }
				}

				return {
					passed: false,
					message: `Found legacy git hook tools: ${found.join(', ')}`,
					hint: `Use lefthook instead. Run: bun remove ${found.join(' ')}`,
					fix: async () => {
						await exec('bun', ['remove', ...found], ctx.cwd)
					},
				}
			},
		},

		{
			name: 'hooks/lefthook-prepare',
			description: 'Check if prepare script is CI-safe for lefthook',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readPackageJson, writePackageJson } = await import('../utils/fs')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const hasConfig = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				// Skip if no lefthook config
				if (!hasConfig) {
					return { passed: true, message: 'No lefthook config (skipped)', skipped: true }
				}

				const pkg = readPackageJson(ctx.cwd)
				const prepare = pkg?.scripts?.prepare

				// No prepare script is fine
				if (!prepare) {
					return { passed: true, message: 'No prepare script (ok)' }
				}

				// Check if prepare uses bare "lefthook" command (will fail in CI)
				// Good: "node_modules/.bin/lefthook install || true"
				// Bad: "lefthook install"
				const isBare = /^lefthook\s/.test(prepare) || /\s&&\s*lefthook\s/.test(prepare)

				if (isBare) {
					return {
						passed: false,
						message: 'prepare script uses bare "lefthook" (fails in CI)',
						hint: 'Change to: "node_modules/.bin/lefthook install || true"',
						fix: async () => {
							const updated = prepare.replace(
								/\blefthook\s+install\b/g,
								'node_modules/.bin/lefthook install || true'
							)
							if (pkg?.scripts) {
								pkg.scripts.prepare = updated
								writePackageJson(ctx.cwd, pkg)
							}
						},
					}
				}

				return { passed: true, message: 'prepare script is CI-safe' }
			},
		},

		{
			name: 'hooks/doctor-dep',
			description: 'Check if @sylphx/doctor is in devDependencies when lefthook uses it',
			fixable: true,
			async check(ctx) {
				const { join } = await import('node:path')
				const { fileExists, readFile, readPackageJson } = await import('../utils/fs')
				const { exec } = await import('../utils/exec')

				const lefthookPath = join(ctx.cwd, 'lefthook.yml')
				const lefthookYamlPath = join(ctx.cwd, 'lefthook.yaml')
				const exists = fileExists(lefthookPath) || fileExists(lefthookYamlPath)

				// Skip if no lefthook config
				if (!exists) {
					return { passed: true, message: 'No lefthook config (skipped)', skipped: true }
				}

				const content = readFile(lefthookPath) || readFile(lefthookYamlPath) || ''
				const usesDoctor = content.includes('@sylphx/doctor') || content.includes('sylphx-doctor')

				// Skip if lefthook doesn't use doctor
				if (!usesDoctor) {
					return {
						passed: true,
						message: 'lefthook does not use @sylphx/doctor (skipped)',
						skipped: true,
					}
				}

				// Read fresh from disk to handle post-fix verification
				const packageJson = readPackageJson(ctx.cwd)
				const devDeps = packageJson?.devDependencies ?? {}
				const hasDoctor = '@sylphx/doctor' in devDeps

				return {
					passed: hasDoctor,
					message: hasDoctor
						? '@sylphx/doctor in devDependencies'
						: '@sylphx/doctor missing from devDependencies',
					hint: hasDoctor ? undefined : 'Run: bun add -D @sylphx/doctor',
					fix: async () => {
						await exec('bun', ['add', '-D', '@sylphx/doctor'], ctx.cwd)
					},
				}
			},
		},
	]
)
