#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import consola from 'consola'
import pc from 'picocolors'
import { version } from '../package.json'
import { loadConfig } from './config'
import { formatPreCommitReport, formatReport } from './reporter'
import { getExitCode, runChecks } from './runner'
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
		'dry-run': {
			type: 'boolean',
			description: 'Preview what would be fixed without making changes',
			default: false,
		},
	},
	async run({ args }) {
		const cwd = process.cwd()
		const preCommit = args['pre-commit']

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
			preCommit,
			preset,
			config,
		})

		// Output report
		if (preCommit) {
			console.log(formatPreCommitReport(report))
		} else {
			console.log(formatReport(report, preset))
		}

		// Exit with appropriate code
		const exitCode = getExitCode(report, preCommit)
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

		consola.start('Initializing sylphx-doctor...')

		// Create config file
		const configContent = `import { defineConfig } from 'sylphx-doctor'

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
		const { writeFileSync } = await import('node:fs')
		const { join } = await import('node:path')

		writeFileSync(join(cwd, 'sylphx-doctor.config.ts'), configContent, 'utf-8')
		consola.success('Created sylphx-doctor.config.ts')

		// Run fix if requested
		if (args.fix) {
			consola.start('Running fix...')

			const report = await runChecks({
				cwd,
				fix: true,
				preset,
			})

			console.log(formatReport(report, preset))
		} else {
			consola.info(`Run ${pc.cyan('bunx sylphx-doctor check')} to check your project`)
			consola.info(`Run ${pc.cyan('bunx sylphx-doctor check --fix')} to auto-fix issues`)
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
