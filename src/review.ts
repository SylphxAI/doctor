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
			{ text: 'Critical business logic in explicit use-case layer, not scattered in controllers' },
			{ text: 'Composition Root — dependencies assembled and injected externally' },
			{ text: 'Separate read/write paths when needed (CQRS)' },
			{ text: 'Public API surface is small and stable' },
			{ text: 'Service boundaries align with team ownership' },
		],
	},
	{
		id: 'contracts',
		title: '2. Contracts & Validation',
		description: 'Type safety, schemas, interface contracts',
		items: [
			{
				text: 'Strictest available type checking enabled (strict mode, mypy, compiler warnings as errors)',
			},
			{ text: 'External APIs/events/config defined by schemas; types generated from schemas' },
			{ text: 'Public API types explicit — no untyped data leaking out' },
			{ text: 'Type safety maintained across service boundaries (client-server, microservices)' },
			{ text: 'Domain types are semantic (UserId, Amount), not primitive aliases' },
			{
				text: 'Third-party dependencies with unclear contracts wrapped with well-defined interfaces',
			},
			{
				text: 'Null/None/nil handling is explicit (Options, nullability annotations, or explicit checks)',
			},
			{ text: 'Validation at boundaries — parse and validate, then trust internal types' },
		],
	},
	{
		id: 'design',
		title: '3. Design Principles',
		description: 'Composition, immutability, separation of concerns',
		items: [
			{ text: 'Prefer immutable data by default' },
			{ text: 'Business logic is deterministic — same input, same output, minimal hidden state' },
			{
				text: 'Favor composition over inheritance — interfaces/traits, delegation, small composed units',
			},
			{ text: 'Side effects pushed to the edge (IO, logging, DB outside domain core)' },
			{ text: 'Data transformation via pipelines or clear steps, not deep nesting' },
			{ text: 'Dependencies injected, not instantiated internally' },
			{ text: 'Single Responsibility — each unit does one thing well' },
		],
	},
	{
		id: 'state',
		title: '4. State & Side Effects',
		description: 'State machines, effect boundaries, predictability',
		items: [
			{ text: 'Complex state flows use explicit state machines or state transitions' },
			{ text: 'Side effects have clear boundaries — know where IO happens' },
			{ text: 'Event-driven logic has clear event → handler mapping' },
			{ text: 'Avoid hidden state — make state explicit and inspectable' },
			{ text: 'Global mutable state minimized or eliminated' },
		],
	},
	{
		id: 'errors',
		title: '5. Error Handling & Recovery',
		description: 'Error strategy, boundaries, graceful degradation',
		items: [
			{ text: 'Error handling strategy is consistent and idiomatic for the language' },
			{ text: 'Errors classified: transient vs permanent, business vs system vs external' },
			{ text: 'Error messages are actionable — what went wrong AND how to fix' },
			{ text: 'Partial failures handled — system degrades gracefully, not all-or-nothing' },
			{
				text: 'Error context preserved — correlation ID, user context, stack trace where appropriate',
			},
			{ text: 'Retry logic uses jittered exponential backoff for transient errors' },
			{ text: 'Dead letter queues or equivalent for failed async operations' },
			{ text: 'Critical errors trigger alerts, not just logs' },
		],
	},
	{
		id: 'runtime',
		title: '6. Runtime & Resilience',
		description: 'Stateless, idempotent, fault-tolerant',
		items: [
			{ text: 'Handlers/services stateless by default' },
			{ text: 'All operations idempotent — safe to retry' },
			{ text: 'External calls have timeout + cancellation' },
			{ text: 'External services have retry + exponential backoff' },
			{ text: 'Critical paths have circuit breaker / fallback' },
			{ text: 'Infra dependencies (filesystem, network) abstracted via adapters' },
			{ text: 'Graceful shutdown — drain requests, close connections, release resources' },
			{ text: 'Health endpoints distinguish liveness vs readiness' },
			{ text: 'Resource limits defined (connections, memory, file handles)' },
			{ text: 'Background jobs clearly defined (trigger, replayability, max duration)' },
			{ text: 'APIs have rate limits / payload size limits' },
		],
	},
	{
		id: 'concurrency',
		title: '7. Concurrency & Async',
		description: 'Thread safety, parallelism, streaming, cancellation',
		items: [
			{ text: 'Shared mutable state protected (locks, channels, or avoided entirely)' },
			{ text: 'Race conditions and deadlocks prevented by design' },
			{ text: 'Large data uses streaming, not load-all-at-once' },
			{ text: 'Backpressure handling when needed' },
			{ text: 'Long-running tasks support cancellation' },
			{ text: 'Parallelism has concurrency limits' },
			{ text: 'CPU-intensive work uses appropriate model (threads, workers, separate processes)' },
			{ text: 'Async operations follow language idioms (async/await, futures, goroutines)' },
		],
	},
	{
		id: 'config',
		title: '8. Configuration & DX',
		description: 'Zero-config, developer experience',
		items: [
			{ text: 'Common scenarios have sensible defaults' },
			{ text: 'Config validated at startup — fail-fast on invalid config' },
			{ text: 'Convention-over-configuration for routes/handlers/jobs' },
			{ text: 'Environment differences via config/adapters, not scattered conditionals' },
			{ text: 'Secrets via secret manager / env — never hardcoded' },
			{ text: 'CLI provides one-command operations (dev/test/build/deploy)' },
			{ text: 'Local dev environment setup documented and scripted' },
		],
	},
	{
		id: 'data',
		title: '9. Data & Persistence',
		description: 'Data modeling, consistency, caching, lifecycle',
		items: [
			{ text: 'Data access isolated — persistence logic separated from business logic' },
			{ text: 'Data model matches domain — clear aggregates, no god tables/documents' },
			{ text: 'Consistency model explicit — ACID vs eventual consistency documented' },
			{ text: 'Schema versioned — migrations exist, tested, and rollback-able' },
			{ text: 'Indexes cover query patterns — no full scans in critical paths' },
			{ text: 'Connection pooling configured with limits and timeouts' },
			{ text: 'N+1 query problem prevented (eager loading, batching, DataLoader)' },
			{ text: 'Caching strategy explicit — invalidation rules, TTL documented' },
			{ text: 'Backup + restore tested regularly — RPO/RTO defined' },
			{ text: 'Data retention policy enforced — archive/purge automated' },
			{ text: 'PII/sensitive data encrypted at rest' },
		],
	},
	{
		id: 'modularity',
		title: '10. Modularity & Dependencies',
		description: 'Module boundaries, dependency management',
		items: [
			{ text: 'Each module has single responsibility — describable in one sentence' },
			{ text: 'Modules communicate via interfaces/ports, not concrete implementations' },
			{ text: 'External services behind Ports & Adapters' },
			{ text: 'Respect dependency direction — no reverse imports' },
			{ text: 'Any feature can be safely removed without hidden coupling' },
			{ text: 'Features grouped by business capability, not technical layer' },
			{ text: 'Dependency versions locked and reproducible' },
		],
	},
	{
		id: 'testing',
		title: '11. Testing & Quality',
		description: 'Test pyramid, coverage, quality gates',
		items: [
			{ text: 'Clear Test Pyramid: unit → integration → e2e, unit tests dominate' },
			{ text: 'Domain logic tested without infra/network/time dependencies' },
			{ text: 'Public contracts have contract tests' },
			{ text: 'External services have mocks/fakes/sandboxes' },
			{ text: 'Tests are deterministic — no real time, randomness, or network' },
			{ text: 'Happy AND unhappy paths tested — error scenarios not ignored' },
			{ text: 'Critical features require tests before merge' },
			{ text: 'Tests are fast — unit < 100ms, full suite < 5 min' },
			{ text: 'No flaky tests — fix or remove' },
			{ text: 'Performance benchmarks for critical paths' },
			{ text: 'Security scenarios tested (auth, input validation)' },
			{ text: 'CI enforces type-check + lint + tests' },
		],
	},
	{
		id: 'observability',
		title: '12. Observability',
		description: 'Logging, metrics, tracing, alerting',
		items: [
			{ text: 'Structured logs with correlation IDs' },
			{ text: 'Core paths have metrics (throughput, latency p50/p99, error rate)' },
			{ text: 'Trace ID propagated across all services' },
			{ text: 'Every service has health / readiness endpoints' },
			{ text: 'Clear error classification: business vs system vs external' },
			{ text: 'Critical errors have alerts, not just logs' },
			{ text: 'SLIs/SLOs defined for critical user journeys' },
			{ text: 'Dashboards per service — latency, errors, saturation at a glance' },
			{ text: 'Deployment markers visible in metrics for correlation' },
			{ text: 'Releases traceable to commits' },
		],
	},
	{
		id: 'security',
		title: '13. Security & Compliance',
		description: 'Auth, encryption, supply chain, incident response',
		items: [
			{ text: 'All input validated at boundaries — prevent injection' },
			{ text: 'Auth logic centralized; permissions clearly auditable' },
			{ text: 'Least privilege + minimal exposed surface' },
			{ text: 'Encryption in transit (TLS 1.2+) and at rest for sensitive data' },
			{ text: 'Secrets rotated regularly; emergency rotation runbook exists' },
			{ text: 'Dependency vulnerabilities scanned in CI (fail on high/critical)' },
			{ text: 'SBOM generated for releases; supply chain verified' },
			{ text: 'Security headers configured (CSP, HSTS, X-Frame-Options)' },
			{ text: 'SAST/DAST in CI pipeline for security regression' },
			{ text: 'Security incident response plan documented and tested' },
			{ text: 'Logs exclude sensitive data (tokens, passwords, PII)' },
			{ text: 'PII has audit logs + data retention policy' },
		],
	},
	{
		id: 'api',
		title: '14. API & Interface Design',
		description: 'Minimal surface, clarity, consistency',
		items: [
			{ text: 'Public API minimal but complete' },
			{ text: 'Complex configuration uses builder pattern or configuration objects' },
			{ text: 'Avoid boolean flags — use named options or separate functions' },
			{ text: 'Error handling consistent across the API (no mixing styles)' },
			{ text: 'Breaking changes have versioning + migration path' },
			{ text: 'API design favors discoverability — IDE/autocomplete guides usage' },
			{ text: 'Deprecation warnings before removal (minimum one version)' },
		],
	},
	{
		id: 'deployment',
		title: '15. Build & Deployment',
		description: 'CI/CD, release strategy, environments',
		items: [
			{ text: 'Build is deterministic — same input = same output' },
			{ text: 'Artifacts tagged with version and commit SHA' },
			{ text: 'Zero-downtime deployments (rolling, blue-green, or canary)' },
			{ text: 'Database migrations decoupled from code deploy when needed' },
			{ text: 'Rollback procedure documented and tested' },
			{ text: 'Feature flags for gradual rollout and emergency toggles' },
			{ text: 'Environment parity — dev/staging/prod use same artifacts' },
			{ text: 'Deployment smoke tests verify critical paths' },
			{ text: 'Release notes auto-generated from commits/PRs' },
		],
	},
	{
		id: 'operations',
		title: '16. Operational Readiness',
		description: 'SLOs, runbooks, capacity, disaster recovery',
		items: [
			{ text: 'SLOs defined for critical services (latency, availability, error rate)' },
			{ text: 'Runbooks for common operational tasks and incidents' },
			{ text: 'On-call rotation and escalation path documented' },
			{ text: 'Capacity planning based on metrics and growth projections' },
			{ text: 'Load testing performed regularly, not just pre-launch' },
			{ text: 'Backup/restore tested quarterly; RPO/RTO verified' },
			{ text: 'Disaster recovery plan tested (failover, data recovery)' },
			{ text: 'Post-incident reviews conducted within 48 hours' },
			{ text: 'Cost monitoring with budgets and alerts' },
		],
	},
	{
		id: 'evolution',
		title: '17. Code Health & Evolution',
		description: 'Dead code, dependencies, refactoring',
		items: [
			{ text: 'Regular scans for dead code / unused dependencies' },
			{ text: 'Dependencies reviewed: security updates, remove bloat' },
			{ text: 'API/schema changes have migration scripts' },
			{ text: 'Semantic versioning + changelog maintained' },
			{ text: 'Architecture decisions recorded (ADR)' },
			{ text: 'Refactoring is routine — always ask "can this be simpler?"' },
			{ text: 'Code style enforced by automated tools' },
			{ text: 'Technical debt tracked and addressed regularly' },
		],
	},
	{
		id: 'docs',
		title: '18. Documentation',
		description: 'Architecture, API docs, onboarding',
		items: [
			{ text: 'Architecture diagram — boundaries, flows, core modules visible' },
			{ text: 'Public APIs have auto-generated docs' },
			{ text: 'README: how to dev / test / build / deploy' },
			{ text: 'Critical business flows have dedicated docs' },
			{ text: 'Runbooks for operational procedures' },
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
	lines.push(pc.cyan('Well-typed, Resilient, Decoupled, Testable, Evolvable'))
	lines.push('')

	lines.push(pc.bold('Pillars'))
	const pillars = [
		'Well-typed',
		'Resilient',
		'Pragmatic',
		'Modular',
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
	lines.push(`  ${pc.green('✓ 80%+')}  Production-ready`)
	lines.push(`  ${pc.yellow('⚠ 60-80%')} Acceptable with known gaps`)
	lines.push(`  ${pc.red('✗ <60%')}  Significant gaps — prioritize improvements`)
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
