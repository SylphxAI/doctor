import pc from 'picocolors'
import type { CheckReport, CheckResult, PresetName } from './types'

export function formatResult(result: CheckResult): string {
	const icon = result.passed
		? pc.green('✓')
		: result.severity === 'warn'
			? pc.yellow('⚠')
			: pc.red('✗')

	const fixable = !result.passed && result.fixable ? pc.dim(' (fixable)') : ''

	const message = result.passed
		? pc.dim(result.message)
		: result.severity === 'warn'
			? pc.yellow(result.message)
			: pc.red(result.message)

	return `  ${icon} ${message}${fixable}`
}

export function formatReport(report: CheckReport, preset: PresetName): string {
	const lines: string[] = []

	// Header
	lines.push('')
	lines.push(pc.bold('🩺 sylphx-doctor check'))
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

	// Category labels
	const categoryLabels: Record<string, string> = {
		files: '📁 Files',
		config: '⚙️  Config',
		pkg: '📦 Package.json',
		test: '🧪 Testing',
		format: '🎨 Formatting',
		build: '🔨 Build',
		runtime: '🏃 Runtime',
		docs: '📚 Documentation',
		ci: '🔄 CI/CD',
		hooks: '🪝 Git Hooks',
		github: '🐙 GitHub',
		monorepo: '📦 Monorepo',
	}

	// Print results by category
	for (const [category, results] of byCategory) {
		const label = categoryLabels[category] ?? category
		lines.push(pc.bold(label))

		for (const result of results) {
			lines.push(formatResult(result))
		}

		lines.push('')
	}

	// Summary
	lines.push(pc.bold('━'.repeat(50)))

	const score = report.total > 0 ? Math.round((report.passed / report.total) * 100) : 0
	const scoreColor = score >= 90 ? pc.green : score >= 70 ? pc.yellow : pc.red

	lines.push(
		`Score: ${scoreColor(`${report.passed}/${report.total}`)} (${scoreColor(`${score}%`)})`
	)

	if (report.failed > 0) {
		lines.push(pc.red(`Errors: ${report.failed}`))
	}

	if (report.warnings > 0) {
		lines.push(pc.yellow(`Warnings: ${report.warnings}`))
	}

	const fixable = report.results.filter((r) => !r.passed && r.fixable).length
	if (fixable > 0) {
		lines.push(pc.cyan(`Fixable: ${fixable} (run with --fix)`))
	}

	lines.push('')

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
		lines.push(pc.cyan(`Run "bunx sylphx-doctor check --fix" to fix ${fixable} issue(s)`))
	}

	return lines.join('\n')
}
