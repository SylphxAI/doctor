import pc from 'picocolors'
import { version } from '../package.json'
import type { CheckReport, CheckResult, PresetName } from './types'

function getIcon(result: CheckResult): string {
	if (result.passed) return pc.green('✓')
	switch (result.severity) {
		case 'error':
			return pc.red('✗')
		case 'warn':
			return pc.yellow('⚠')
		case 'info':
			return pc.blue('ℹ')
		default:
			return pc.dim('○')
	}
}

function getMessageColor(result: CheckResult): (text: string) => string {
	if (result.passed) return pc.dim
	switch (result.severity) {
		case 'error':
			return pc.red
		case 'warn':
			return pc.yellow
		case 'info':
			return pc.blue
		default:
			return pc.dim
	}
}

export function formatResult(result: CheckResult): string {
	const icon = getIcon(result)
	const fixable = !result.passed && result.fixable ? pc.dim(' (fixable)') : ''
	const colorFn = getMessageColor(result)
	const message = colorFn(result.message)

	// Add hint on new line if present and check failed
	const hint = !result.passed && result.hint ? `\n      ${pc.dim('→')} ${pc.cyan(result.hint)}` : ''

	return `  ${icon} ${message}${fixable}${hint}`
}

// Category labels and order
const categoryLabels: Record<string, string> = {
	files: '📁 Files',
	config: '⚙️  Config',
	pkg: '📦 Package.json',
	deps: '📦 Dependencies',
	test: '🧪 Testing',
	format: '🎨 Formatting',
	build: '🔨 Build',
	runtime: '🏃 Runtime',
	docs: '📚 Documentation',
	ci: '🔄 CI/CD',
	hooks: '🪝 Git Hooks',
	github: '🐙 GitHub',
	monorepo: '📦 Monorepo',
	release: '🚀 Release',
}

interface IssueSummary {
	category: string
	errors: number
	warnings: number
	infos: number
	fixable: number
	results: CheckResult[]
}

function getIssueSummaries(report: CheckReport): IssueSummary[] {
	const byCategory = new Map<string, IssueSummary>()

	for (const result of report.results) {
		if (result.skipped || result.passed) continue

		if (!byCategory.has(result.category)) {
			byCategory.set(result.category, {
				category: result.category,
				errors: 0,
				warnings: 0,
				infos: 0,
				fixable: 0,
				results: [],
			})
		}

		const summary = byCategory.get(result.category)
		if (!summary) continue

		summary.results.push(result)

		if (result.severity === 'error') summary.errors++
		else if (result.severity === 'warn') summary.warnings++
		else if (result.severity === 'info') summary.infos++

		if (result.fixable) summary.fixable++
	}

	// Sort by severity (errors first, then warnings, then info)
	return Array.from(byCategory.values()).sort((a, b) => {
		if (a.errors !== b.errors) return b.errors - a.errors
		if (a.warnings !== b.warnings) return b.warnings - a.warnings
		return b.infos - a.infos
	})
}

export function formatReport(report: CheckReport, preset: PresetName): string {
	const lines: string[] = []

	// Header
	lines.push('')
	lines.push(`${pc.bold('🩺 doctor')} ${pc.dim(`v${version}`)}`)
	lines.push(pc.dim(`   Preset: ${preset}`))
	lines.push('')

	// Group results by category
	const byCategory = new Map<string, CheckResult[]>()

	for (const result of report.results) {
		const category = result.category
		if (!byCategory.has(category)) {
			byCategory.set(category, [])
		}
		byCategory.get(category)?.push(result)
	}

	// Print results by category
	for (const [category, results] of byCategory) {
		// Skip categories where ALL results are skipped (not applicable)
		const allSkipped = results.every((r) => r.skipped)
		if (allSkipped) {
			continue
		}

		const label = categoryLabels[category] ?? category
		lines.push(pc.bold(label))

		for (const result of results) {
			// Don't show individual skipped results
			if (result.skipped) {
				continue
			}
			lines.push(formatResult(result))
		}

		lines.push('')
	}

	// Summary section
	lines.push(pc.bold('━'.repeat(50)))

	const score = report.total > 0 ? Math.round((report.passed / report.total) * 100) : 0
	const scoreColor = score >= 90 ? pc.green : score >= 70 ? pc.yellow : pc.red

	lines.push(
		`Score: ${scoreColor(`${report.passed}/${report.total}`)} (${scoreColor(`${score}%`)})`
	)

	// Count by severity
	const errors = report.results.filter((r) => !r.passed && r.severity === 'error').length
	const warnings = report.results.filter((r) => !r.passed && r.severity === 'warn').length
	const infos = report.results.filter((r) => !r.passed && r.severity === 'info').length
	const fixable = report.results.filter((r) => !r.passed && r.fixable).length

	if (errors > 0 || warnings > 0 || infos > 0) {
		const parts: string[] = []
		if (errors > 0) parts.push(pc.red(`${errors} errors`))
		if (warnings > 0) parts.push(pc.yellow(`${warnings} warnings`))
		if (infos > 0) parts.push(pc.blue(`${infos} info`))
		lines.push(parts.join(', '))
	}

	lines.push('')

	// Quick actions section
	if (errors > 0 || warnings > 0 || fixable > 0) {
		lines.push(pc.bold('📋 Quick Actions'))
		lines.push('')

		if (fixable > 0) {
			lines.push(`  ${pc.cyan('bunx @sylphx/doctor check --fix')}`)
			lines.push(pc.dim(`    Auto-fix ${fixable} issue(s)`))
			lines.push('')
		}

		// Get issue summaries sorted by severity
		const summaries = getIssueSummaries(report)

		for (const summary of summaries) {
			const label = categoryLabels[summary.category] ?? summary.category
			const counts: string[] = []
			if (summary.errors > 0) counts.push(pc.red(`${summary.errors} errors`))
			if (summary.warnings > 0) counts.push(pc.yellow(`${summary.warnings} warnings`))

			if (counts.length > 0) {
				lines.push(`  ${label}: ${counts.join(', ')}`)

				// Show specific commands for each category
				for (const result of summary.results) {
					if (result.hint) {
						lines.push(pc.dim(`    → ${result.hint}`))
					}
				}
				lines.push('')
			}
		}
	}

	return lines.join('\n')
}

export function formatPreCommitReport(report: CheckReport): string {
	const lines: string[] = []

	// Only show failures in pre-commit mode
	const failures = report.results.filter((r) => !r.passed && r.severity === 'error')

	if (failures.length === 0) {
		lines.push(pc.green('✓ All checks passed'))
		return lines.join('\n')
	}

	lines.push(pc.red(`✗ ${failures.length} check(s) failed:`))
	lines.push('')

	for (const result of failures) {
		lines.push(formatResult(result))
	}

	lines.push('')

	const fixable = failures.filter((r) => r.fixable).length
	if (fixable > 0) {
		lines.push(pc.cyan(`Run "bunx @sylphx/doctor check --fix" to fix ${fixable} issue(s)`))
	}

	return lines.join('\n')
}

/**
 * Format a compact summary for CI/quick view
 */
export function formatCompactReport(report: CheckReport): string {
	const lines: string[] = []

	const errors = report.results.filter((r) => !r.passed && r.severity === 'error')
	const warnings = report.results.filter((r) => !r.passed && r.severity === 'warn')
	const fixable = report.results.filter((r) => !r.passed && r.fixable).length

	if (errors.length === 0 && warnings.length === 0) {
		lines.push(pc.green('✓ All checks passed'))
		return lines.join('\n')
	}

	// Group by category and show counts
	const summaries = getIssueSummaries(report)

	for (const summary of summaries) {
		const label = categoryLabels[summary.category] ?? summary.category
		const icon = summary.errors > 0 ? pc.red('✗') : pc.yellow('⚠')
		const count = summary.errors + summary.warnings

		lines.push(`${icon} ${label}: ${count} issue(s)`)
	}

	lines.push('')

	if (fixable > 0) {
		lines.push(pc.cyan(`Run "bunx @sylphx/doctor check --fix" to auto-fix ${fixable} issue(s)`))
	}

	return lines.join('\n')
}
