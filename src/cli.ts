#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import consola from 'consola'
import pc from 'picocolors'
import { version } from '../package.json'
import { loadConfig } from './config'
import { formatPreCommitReport, formatReport } from './reporter'
import { checkUpgradeReadiness, getExitCode, runChecks } from './runner'
import type { PresetName } from './types'

const checkCommand = defineCommand({
	meta: {
		name: 'check',
		description: 'Check project against standards',
	},
	args: {
		fix: {
			type: 'boolean',
			description: 'Automatically fix fixable issues',
			default: false,
		},
		preset: {
			type: 'string',
			description: 'Preset to use (init, dev, stable)',
		},
		'pre-commit': {
			type: 'boolean',
			description: 'Run in pre-commit mode (only errors, no warnings)',
			default: false,
		},
		'pre-push': {
			type: 'boolean',
			description: 'Run in pre-push mode (with release hint)',
			default: false,
		},
		'dry-run': {
			type: 'boolean',
			description: 'Preview what would be fixed without making changes',
			default: false,
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const preCommit = args['pre-commit']
		const prePush = args['pre-push']

		// Load config to get preset
		const config = await loadConfig(cwd)
		const preset = (args.preset as PresetName) ?? config.preset ?? 'dev'

		if (!['init', 'dev', 'stable'].includes(preset)) {
			consola.error(`Invalid preset: ${preset}. Use: init, dev, or stable`)
			process.exit(1)
		}

		const report = await runChecks({
			cwd,
			fix: args.fix && !args['dry-run'],
			preCommit: preCommit || prePush, // Both modes skip warnings
			preset,
			config,
		})

		// Output report
		if (preCommit || prePush) {
			console.log(formatPreCommitReport(report))

			// Show release hint in pre-push mode
			if (prePush && report.failed === 0) {
				console.log('')
				console.log(pc.dim('💡 Release? Check: gh pr list --head bump/release'))
			}
		} else {
			console.log(formatReport(report, preset))

			// Check upgrade readiness when all checks pass
			if (report.failed === 0 && report.warnings === 0) {
				const upgrade = await checkUpgradeReadiness({
					cwd,
					preset,
					config,
				})

				if (upgrade.nextPreset) {
					if (upgrade.ready) {
						// Ready to upgrade!
						console.log(
							pc.bold(pc.green(`🎉 Ready to upgrade to ${pc.cyan(upgrade.nextPreset)} preset!`))
						)
						console.log(
							pc.dim(`   Run: ${pc.cyan('doctor upgrade')} or update your config manually`)
						)
						console.log()
					} else if (upgrade.nextScore >= 80) {
						// Close to ready
						console.log(
							pc.yellow(
								`💡 ${upgrade.blockers} issue(s) away from ${pc.cyan(upgrade.nextPreset)} preset (${upgrade.nextScore}% ready)`
							)
						)
						console.log(
							pc.dim(
								`   Run: ${pc.cyan(`doctor upgrade --target ${upgrade.nextPreset}`)} to preview`
							)
						)
						console.log()
					}
				}
			}
		}

		// Exit with appropriate code
		const exitCode = getExitCode(report, preCommit || prePush)
		process.exit(exitCode)
	},
})

const initCommand = defineCommand({
	meta: {
		name: 'init',
		description: 'Initialize sylphx-doctor in current project',
	},
	args: {
		preset: {
			type: 'string',
			description: 'Initial preset (init, dev, stable)',
			default: 'init',
		},
		fix: {
			type: 'boolean',
			description: 'Also run fix after init',
			default: false,
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const preset = args.preset as PresetName
		const { existsSync, writeFileSync, readFileSync } = await import('node:fs')
		const { join } = await import('node:path')
		const { execSync } = await import('node:child_process')

		console.log()
		consola.start('Initializing @sylphx/doctor...')
		console.log()

		// 1. Create config file
		const configPath = join(cwd, 'sylphx-doctor.config.ts')
		if (!existsSync(configPath)) {
			const configContent = `import { defineConfig } from '@sylphx/doctor'

export default defineConfig({
  preset: '${preset}',

  // Override specific rules if needed
  // rules: {
  //   'docs/vitepress': 'off',
  // },

  // Configure rule options
  // options: {
  //   'test/coverage-threshold': { min: 60 },
  // },
})
`
			writeFileSync(configPath, configContent, 'utf-8')
			consola.success('Created sylphx-doctor.config.ts')
		} else {
			consola.info('sylphx-doctor.config.ts already exists')
		}

		// 2. Create lefthook.yml (only doctor check - it handles lint/format internally)
		const lefthookPath = join(cwd, 'lefthook.yml')
		const lefthookContent = `pre-commit:
  commands:
    doctor:
      run: bun run doctor:check
`
		if (!existsSync(lefthookPath)) {
			writeFileSync(lefthookPath, lefthookContent, 'utf-8')
			consola.success('Created lefthook.yml')
		} else {
			const existing = readFileSync(lefthookPath, 'utf-8')
			if (!existing.includes('doctor')) {
				// Append doctor command to existing lefthook
				consola.warn('lefthook.yml exists, please add doctor command manually:')
				console.log(
					pc.dim(`    doctor:
      run: bun run doctor:check`)
				)
			} else {
				consola.info('lefthook.yml already configured')
			}
		}

		// 3. Update package.json with scripts
		const pkgPath = join(cwd, 'package.json')
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
			let modified = false

			// Add doctor scripts
			pkg.scripts = pkg.scripts || {}
			if (!pkg.scripts.doctor) {
				pkg.scripts.doctor = 'doctor check'
				modified = true
			}
			if (!pkg.scripts['doctor:check']) {
				pkg.scripts['doctor:check'] = 'doctor check --pre-commit'
				modified = true
			}
			if (!pkg.scripts['doctor:fix']) {
				pkg.scripts['doctor:fix'] = 'doctor check --fix'
				modified = true
			}

			if (modified) {
				writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`, 'utf-8')
				consola.success('Added doctor scripts to package.json')
			} else {
				consola.info('Doctor scripts already in package.json')
			}
		}

		// 4. Install dependencies
		consola.start('Installing dependencies...')
		try {
			execSync('bun add -D @sylphx/doctor lefthook', {
				cwd,
				stdio: 'pipe',
			})
			consola.success('Installed @sylphx/doctor and lefthook')
		} catch {
			consola.warn('Failed to install dependencies, run manually:')
			console.log(pc.dim('  bun add -D @sylphx/doctor lefthook'))
		}

		// 5. Setup git hooks (if .git exists)
		const gitDir = join(cwd, '.git')
		if (existsSync(gitDir)) {
			try {
				execSync('bunx lefthook install', {
					cwd,
					stdio: 'pipe',
				})
				consola.success('Git hooks installed')
			} catch {
				consola.warn('Failed to install git hooks, run manually:')
				console.log(pc.dim('  bunx lefthook install'))
			}
		} else {
			consola.info('No .git directory, skipping git hooks setup')
			consola.info('After git init, run: bunx lefthook install')
		}

		console.log()

		// 6. Run fix if requested
		if (args.fix) {
			consola.start('Running doctor fix...')
			console.log()

			const report = await runChecks({
				cwd,
				fix: true,
				preset,
			})

			console.log(formatReport(report, preset))
		} else {
			consola.box({
				title: 'Setup Complete!',
				message: `Preset: ${pc.cyan(preset)}

Commands:
  ${pc.cyan('bun run doctor')}      Check project
  ${pc.cyan('bun run doctor:fix')}  Auto-fix issues

Pre-commit hook will run automatically on each commit.`,
			})
		}
	},
})

const upgradeCommand = defineCommand({
	meta: {
		name: 'upgrade',
		description: 'Preview upgrade to next preset level',
	},
	args: {
		target: {
			type: 'string',
			description: 'Target preset (dev, stable)',
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const config = await loadConfig(cwd)
		const currentPreset = config.preset ?? 'dev'

		// Determine target preset
		let targetPreset: PresetName
		if (args.target) {
			targetPreset = args.target as PresetName
		} else {
			// Auto determine next level
			const levels: PresetName[] = ['init', 'dev', 'stable']
			const currentIndex = levels.indexOf(currentPreset)
			if (currentIndex >= levels.length - 1) {
				consola.info(`Already at highest preset level: ${currentPreset}`)
				return
			}
			targetPreset = levels[currentIndex + 1] as PresetName
		}

		consola.start(`Checking upgrade from ${pc.cyan(currentPreset)} → ${pc.green(targetPreset)}`)

		// Run checks with target preset
		const report = await runChecks({
			cwd,
			preset: targetPreset,
			config,
		})

		console.log(formatReport(report, targetPreset))

		if (report.failed === 0 && report.warnings === 0) {
			consola.success(`Ready to upgrade to ${targetPreset}!`)
			consola.info(`Update your config: preset: '${targetPreset}'`)
		} else {
			consola.warn(`${report.failed + report.warnings} issue(s) need to be resolved before upgrade`)
		}
	},
})

const main = defineCommand({
	meta: {
		name: 'sylphx-doctor',
		version,
		description: 'CLI tool to check and enforce project standards',
	},
	subCommands: {
		check: checkCommand,
		init: initCommand,
		upgrade: upgradeCommand,
	},
})

runMain(main)
