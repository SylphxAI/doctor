import pc from 'picocolors'
import { version } from '../package.json'

interface ChecklistItem {
	text: string
}

interface ChecklistSection {
	id: string
	title: string
	description: string
	items: ChecklistItem[]
}

const checklist: ChecklistSection[] = [
	{
		id: 'architecture',
		title: '1. Architecture & Design',
		description: 'System boundaries, layering, dependency direction',
		items: [
			{ text: 'Clear system boundaries — infra/framework stays at the edge' },
			{ text: 'Unidirectional dependencies: core → feature → app' },
			{ text: 'Domain layer is pure — no IO, no framework dependencies' },
			{
				text: 'Critical business logic in explicit use-case layer, not scattered in controllers',
			},
			{ text: 'Composition Root — dependencies assembled and injected externally' },
			{ text: 'Separate read/write paths when needed' },
			{ text: 'Public API surface is small and stable' },
		],
	},
	{
		id: 'types',
		title: '2. Type System & Contracts',
		description: 'Type safety, schemas, contracts',
		items: [
			{ text: 'Strict type checking enabled project-wide' },
			{ text: 'External APIs/events/config defined by schemas; types generated from schemas' },
			{ text: 'Public API types explicit — no untyped data leaking out' },
			{ text: 'End-to-end type safety between client and server' },
			{ text: 'Domain types are semantic (e.g. UserId, Amount), not primitive aliases' },
			{ text: 'External SDKs wrapped to isolate dynamic types' },
			{ text: 'Errors as typed values, not arbitrary exceptions' },
		],
	},
	{
		id: 'functional',
		title: '3. Functional & Composition',
		description: 'Pure functions, immutability, composition',
		items: [
			{ text: 'Prefer immutable data by default' },
			{ text: 'Core logic as pure functions — same input, same output, no side effects' },
			{ text: 'Composition over inheritance — build complex from simple' },
			{ text: 'Side effects pushed to the edge (IO, logging, DB outside domain core)' },
			{ text: 'Data transformation via pipelines, not deep nesting' },
			{ text: "Parse, don't validate — parse at boundary, trust types thereafter" },
		],
	},
	{
		id: 'state',
		title: '4. State & Side Effects',
		description: 'State machines, effect boundaries',
		items: [
			{ text: 'Complex state flows use explicit state machines or state transitions' },
			{ text: 'Side effects have clear boundaries — know where IO happens' },
			{ text: 'Event-driven logic has clear event → handler mapping' },
			{ text: 'Avoid hidden state — make state explicit and inspectable' },
		],
	},
	{
		id: 'runtime',
		title: '5. Runtime & Resilience',
		description: 'Stateless, idempotent, fault-tolerant',
		items: [
			{ text: 'Handlers/services stateless by default' },
			{ text: 'All operations idempotent — safe to retry' },
			{ text: 'External calls have timeout + cancellation' },
			{ text: 'External services have retry + exponential backoff' },
			{ text: 'Critical paths have circuit breaker / fallback' },
			{ text: 'Infra dependencies (filesystem, network) abstracted via adapters' },
			{ text: 'Background jobs clearly defined (trigger, replayability, max duration)' },
			{ text: 'APIs have rate limits / payload size limits' },
		],
	},
	{
		id: 'concurrency',
		title: '6. Concurrency & Async',
		description: 'Parallelism, streaming, cancellation',
		items: [
			{ text: 'Large data uses streaming, not load-all-at-once' },
			{ text: 'Has backpressure handling when needed' },
			{ text: 'Long-running tasks support cancellation' },
			{ text: 'Parallelism has concurrency limits' },
			{ text: 'CPU-intensive work isolated (workers, separate processes)' },
		],
	},
	{
		id: 'config',
		title: '7. Configuration & DX',
		description: 'Zero-config, developer experience',
		items: [
			{ text: 'Common scenarios have sensible defaults' },
			{ text: 'Config validated at startup — fail-fast' },
			{ text: 'Convention-over-configuration for routes/handlers/jobs' },
			{ text: 'Environment differences via config/adapters, not scattered conditionals' },
			{ text: 'CLI provides one-command operations (dev/test/build/deploy)' },
		],
	},
	{
		id: 'modularity',
		title: '8. Modularity & Dependencies',
		description: 'Module boundaries, dependency management',
		items: [
			{ text: 'Each module has single responsibility' },
			{ text: 'Modules communicate via interfaces/ports, not concrete implementations' },
			{ text: 'External services behind Ports & Adapters' },
			{ text: 'Respect dependency direction — no reverse imports' },
			{ text: 'Any feature can be safely removed without hidden coupling' },
			{ text: 'Features grouped by business capability, not technical layer' },
		],
	},
	{
		id: 'testing',
		title: '9. Testing & Quality',
		description: 'Test pyramid, quality gates',
		items: [
			{ text: 'Clear Test Pyramid: unit → integration → e2e' },
			{ text: 'Domain logic tested without infra/network/time dependencies' },
			{ text: 'Public contracts have contract tests' },
			{ text: 'External services have mocks/fakes/sandboxes' },
			{ text: 'Tests are deterministic — no real time, randomness, or network' },
			{ text: 'Critical features require tests before merge' },
			{ text: 'CI enforces type-check + lint + tests' },
		],
	},
	{
		id: 'observability',
		title: '10. Observability',
		description: 'Logging, metrics, tracing, alerting',
		items: [
			{ text: 'Structured logs with correlation IDs' },
			{ text: 'Core paths have metrics (throughput, latency, error rate)' },
			{ text: 'Trace ID propagated across all services' },
			{ text: 'Every service has health / readiness endpoints' },
			{ text: 'Clear error classification: business vs system vs external' },
			{ text: 'Critical errors have alerts, not just logs' },
			{ text: 'Releases traceable to commits' },
		],
	},
	{
		id: 'security',
		title: '11. Security & Compliance',
		description: 'Auth, authorization, data protection',
		items: [
			{ text: 'All input validated — prevent injection' },
			{ text: 'Secrets via secret manager / env — no hardcoding' },
			{ text: 'Auth logic centralized; permissions clearly auditable' },
			{ text: 'Least privilege + minimal exposed surface' },
			{ text: 'Encryption in transit (TLS)' },
			{ text: 'Logs exclude sensitive data' },
			{ text: 'PII/financial data has audit logs + retention policy' },
		],
	},
	{
		id: 'api',
		title: '12. API & Interface Design',
		description: 'Minimal surface, clarity, consistency',
		items: [
			{ text: 'Public API minimal but complete' },
			{ text: 'Complex config via builder pattern or options object' },
			{ text: 'Avoid boolean flags — use named options or separate functions' },
			{ text: "Return types consistent — don't mix return values and exceptions" },
			{ text: 'Breaking changes have versioning + migration path' },
		],
	},
	{
		id: 'evolution',
		title: '13. Code Health & Evolution',
		description: 'Dead code, dependencies, refactoring',
		items: [
			{ text: 'Regular scans for dead code / unused dependencies' },
			{ text: 'Dependencies reviewed: security updates, remove bloat' },
			{ text: 'Schema/API changes have migration scripts, rollback-able' },
			{ text: 'Semantic versioning + changelog' },
			{ text: 'Architecture decisions recorded (ADR)' },
			{ text: 'Refactoring is routine — always ask "can this be simpler?"' },
			{ text: 'Code style enforced by automated tools' },
		],
	},
	{
		id: 'docs',
		title: '14. Documentation',
		description: 'Architecture, API docs, onboarding',
		items: [
			{ text: 'Architecture diagram — boundaries, flows, core modules visible' },
			{ text: 'Public APIs have auto-generated docs' },
			{ text: 'README: how to dev / test / build / deploy' },
			{ text: 'Critical business flows have dedicated docs' },
			{ text: 'New hire onboarding < 1 day to run local dev' },
		],
	},
]

export function formatReviewChecklist(): string {
	const lines: string[] = []

	// Header
	lines.push('')
	lines.push(`${pc.bold('🩺 doctor review')} ${pc.dim(`v${version}`)}`)
	lines.push('')
	lines.push(pc.bold('Project Review Checklist — Universal Edition'))
	lines.push(pc.dim('High-level architectural review — manual verification required'))
	lines.push('')

	// Core principles
	lines.push(pc.bold('━'.repeat(60)))
	lines.push('')
	lines.push(pc.bold('Core Principle'))
	lines.push(pc.cyan('Type-safe, Stateless-ready, Highly Decoupled, Testable, Evolvable'))
	lines.push('')

	lines.push(pc.bold('Pillars'))
	const pillars = [
		'Type-safe',
		'Stateless',
		'Zero-config',
		'Composable',
		'Testable',
		'Observable',
		'Evolvable',
		'Documented',
	]
	lines.push(pillars.map((p) => pc.green(p)).join(pc.dim(' · ')))
	lines.push('')
	lines.push(pc.bold('━'.repeat(60)))
	lines.push('')

	// Sections
	for (const section of checklist) {
		lines.push(pc.bold(pc.blue(section.title)))
		lines.push(pc.dim(section.description))
		lines.push('')

		for (const item of section.items) {
			lines.push(`  ${pc.dim('○')} ${item.text}`)
		}

		lines.push('')
	}

	// Footer
	lines.push(pc.bold('━'.repeat(60)))
	lines.push('')
	lines.push(pc.bold('Scoring Guide'))
	lines.push(`  ${pc.green('✓ 80%+')}  Production-ready architecture`)
	lines.push(`  ${pc.yellow('⚠ 60-80%')} Acceptable with known gaps`)
	lines.push(`  ${pc.red('✗ <60%')}  Significant architectural debt`)
	lines.push('')
	lines.push(
		pc.dim('This checklist is for manual review — items cannot be automatically verified.')
	)
	lines.push(
		pc.dim('Walk through each section, note gaps, and create actionable improvement tasks.')
	)
	lines.push('')
	lines.push(pc.dim('─'.repeat(60)))
	lines.push(pc.dim('✨ Powered by @sylphx | https://github.com/SylphxAI'))
	lines.push('')

	return lines.join('\n')
}

export function formatReviewSection(sectionId: string): string | null {
	const section = checklist.find((s) => s.id === sectionId)
	if (!section) return null

	const lines: string[] = []

	lines.push('')
	lines.push(`${pc.bold('🩺 doctor review')} ${pc.dim(`v${version}`)}`)
	lines.push('')
	lines.push(pc.bold(pc.blue(section.title)))
	lines.push(pc.dim(section.description))
	lines.push('')

	for (const item of section.items) {
		lines.push(`  ${pc.dim('○')} ${item.text}`)
	}

	lines.push('')
	lines.push(pc.dim('─'.repeat(60)))
	lines.push(pc.dim('✨ Powered by @sylphx | https://github.com/SylphxAI'))
	lines.push('')

	return lines.join('\n')
}

export function getAvailableSections(): string[] {
	return checklist.map((s) => s.id)
}
