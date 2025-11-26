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
		const { existsSync, writeFileSync, readFileSync } = await import('node:fs')
		const { join } = await import('node:path')

		consola.start('Initializing sylphx-doctor...')

		// Create config file
		const configPath = join(cwd, 'sylphx-doctor.config.ts')
		if (!existsSync(configPath)) {
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
			writeFileSync(configPath, configContent, 'utf-8')
			consola.success('Created sylphx-doctor.config.ts')
		} else {
			consola.info('sylphx-doctor.config.ts already exists')
		}

		// Setup lefthook for pre-commit
		const lefthookPath = join(cwd, 'lefthook.yml')
		const lefthookContent = `pre-commit:
  parallel: true
  commands:
    doctor:
      run: bunx sylphx-doctor check --pre-commit
    lint:
      glob: "*.{ts,tsx,js,jsx}"
      run: bun run lint
    format:
      glob: "*.{ts,tsx,js,jsx}"
      run: bun run format
`
		if (!existsSync(lefthookPath)) {
			writeFileSync(lefthookPath, lefthookContent, 'utf-8')
			consola.success('Created lefthook.yml with sylphx-doctor pre-commit hook')
		} else {
			// Check if sylphx-doctor is already in lefthook
			const existing = readFileSync(lefthookPath, 'utf-8')
			if (!existing.includes('sylphx-doctor')) {
				consola.warn('lefthook.yml exists but does not include sylphx-doctor')
				consola.info('Add this to your lefthook.yml pre-commit commands:')
				console.log(
					pc.dim(`    doctor:
      run: bunx sylphx-doctor check --pre-commit`)
				)
			} else {
				consola.info('lefthook.yml already configured with sylphx-doctor')
			}
		}

		// Check if lefthook is installed
		const pkgPath = join(cwd, 'package.json')
		if (existsSync(pkgPath)) {
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
			const hasLefthook = pkg.devDependencies?.lefthook || pkg.dependencies?.lefthook
			if (!hasLefthook) {
				consola.info(`Install lefthook: ${pc.cyan('bun add -D lefthook')}`)
			}
		}

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
