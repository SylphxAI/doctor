#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import consola from 'consola'
import pc from 'picocolors'
import { version } from '../package.json'
import { loadConfig } from './config'
import { getGuardsForHook } from './guards'
import { getInfoForHook } from './info'
import { formatPreCommitReport, formatReport } from './reporter'
import { checkUpgradeReadiness, runChecks } from './runner'
import type { PresetName } from './types'

const checkCommand = defineCommand({
	meta: {
		name: 'check',
		description: 'Full project audit (all checks)',
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
		'dry-run': {
			type: 'boolean',
			description: 'Preview what would be fixed without making changes',
			default: false,
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const config = await loadConfig(cwd)
		const preset = (args.preset as PresetName) ?? config.preset ?? 'dev'

		if (!['init', 'dev', 'stable'].includes(preset)) {
			consola.error(`Invalid preset: ${preset}. Use: init, dev, or stable`)
			process.exit(1)
		}

		const report = await runChecks({
			cwd,
			fix: args.fix && !args['dry-run'],
			preset,
			config,
		})

		console.log(formatReport(report, preset))

		// Check upgrade readiness when all checks pass
		if (report.failed === 0 && report.warnings === 0) {
			const upgrade = await checkUpgradeReadiness({ cwd, preset, config })

			if (upgrade.nextPreset) {
				if (upgrade.ready) {
					console.log(
						pc.bold(pc.green(`🎉 Ready to upgrade to ${pc.cyan(upgrade.nextPreset)} preset!`))
					)
					console.log(pc.dim(`   Run: ${pc.cyan('doctor upgrade')} or update your config manually`))
					console.log()
				} else if (upgrade.nextScore >= 80) {
					console.log(
						pc.yellow(
							`💡 ${upgrade.blockers} issue(s) away from ${pc.cyan(upgrade.nextPreset)} preset (${upgrade.nextScore}% ready)`
						)
					)
					console.log(
						pc.dim(`   Run: ${pc.cyan(`doctor upgrade --target ${upgrade.nextPreset}`)} to preview`)
					)
					console.log()
				}
			}
		}

		process.exit(report.failed > 0 ? 1 : 0)
	},
})

const commitCommand = defineCommand({
	meta: {
		name: 'commit',
		description: 'Pre-commit hook: format + typecheck',
	},
	args: {
		fix: {
			type: 'boolean',
			description: 'Automatically fix fixable issues',
			default: false,
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const config = await loadConfig(cwd)
		const preset = config.preset ?? 'dev'

		const report = await runChecks({
			cwd,
			fix: args.fix,
			preset,
			config,
			stage: 'commit',
			preCommit: true,
		})

		console.log(formatPreCommitReport(report))
		process.exit(report.failed > 0 ? 1 : 0)
	},
})

const pushCommand = defineCommand({
	meta: {
		name: 'push',
		description: 'Pre-push hook: test + info',
	},
	async run() {
		const cwd = process.cwd()
		const config = await loadConfig(cwd)
		const preset = config.preset ?? 'dev'

		const report = await runChecks({
			cwd,
			preset,
			config,
			stage: 'push',
		})

		console.log(formatPreCommitReport(report))

		// Show info messages
		const infoMessages = getInfoForHook('push')
		for (const info of infoMessages) {
			console.log(pc.dim(info.message()))
		}

		process.exit(report.failed > 0 ? 1 : 0)
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

		// 2. Create lefthook.yml
		const lefthookPath = join(cwd, 'lefthook.yml')
		const lefthookContent = `pre-commit:
  commands:
    doctor:
      run: doctor commit --fix

pre-push:
  commands:
    doctor:
      run: doctor push
`
		if (!existsSync(lefthookPath)) {
			writeFileSync(lefthookPath, lefthookContent, 'utf-8')
			consola.success('Created lefthook.yml')
		} else {
			const existing = readFileSync(lefthookPath, 'utf-8')
			if (!existing.includes('doctor')) {
				consola.warn('lefthook.yml exists, please add doctor commands manually:')
				console.log(pc.dim(lefthookContent))
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
				pkg.scripts.doctor = 'doctor'
				modified = true
			}
			if (!pkg.scripts['doctor:fix']) {
				pkg.scripts['doctor:fix'] = 'doctor --fix'
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
  ${pc.cyan('doctor')}          Full project audit
  ${pc.cyan('doctor commit')}   Pre-commit (format + typecheck)
  ${pc.cyan('doctor push')}     Pre-push (test + info)
  ${pc.cyan('doctor --fix')}    Auto-fix issues

Git hooks will run automatically on commit/push.`,
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

const prepublishCommand = defineCommand({
	meta: {
		name: 'prepublish',
		description: 'Guard against direct npm publish (use in prepublishOnly script)',
	},
	async run() {
		const guards = getGuardsForHook('prepublish')

		for (const guard of guards) {
			const result = await guard.run()
			if (!result.passed) {
				console.log()
				console.log(pc.red(`❌ ${guard.description}`))
				console.log()
				console.log(result.message)
				console.log()
				process.exit(1)
			}
		}

		// All guards passed
		process.exit(0)
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
		commit: commitCommand,
		push: pushCommand,
		init: initCommand,
		upgrade: upgradeCommand,
		prepublish: prepublishCommand,
	},
})

runMain(main)
