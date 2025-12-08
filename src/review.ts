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
	// ============================================
	// CORE ARCHITECTURE (1-10)
	// ============================================
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
			{ text: 'Non-critical features have fallback (e.g., recommendations down → show default)' },
			{ text: 'Self-healing capability (auto-restart, health check + replace)' },
			{ text: "Failure blast radius controlled — one failure doesn't cascade to entire system" },
		],
	},
	{
		id: 'runtime',
		title: '6. Runtime & Resilience',
		description: 'Stateless, idempotent, fault-tolerant, serverless-ready',
		items: [
			{ text: 'Handlers/services stateless by default — no in-memory state across requests' },
			{ text: 'Session/state externalized (Redis, DB, external store)' },
			{ text: 'All operations idempotent — safe to retry' },
			{ text: 'External calls have timeout + cancellation' },
			{ text: 'External services have retry + exponential backoff' },
			{ text: 'Critical paths have circuit breaker / fallback' },
			{ text: 'Infra dependencies (filesystem, network) abstracted via adapters' },
			{ text: 'Graceful shutdown — drain requests, close connections, release resources' },
			{ text: 'Health endpoints distinguish liveness vs readiness' },
			{ text: 'Resource limits defined (connections, memory, file handles)' },
			{ text: 'Cold start optimized — lazy imports, minimal init, small bundles' },
			{ text: 'Execution time aware — know function/request timeout limits' },
			{ text: "Horizontal scaling ready — adding instances doesn't require code changes" },
			{ text: 'Event-driven triggers clearly defined (HTTP, queue, schedule, event)' },
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
			{ text: 'Stateful coordination uses external primitives (distributed lock, lease)' },
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
			{ text: 'Consistency model explicit — strong vs eventual, documented per use case' },
			{ text: 'Distributed operations use Saga / Outbox pattern when needed' },
			{ text: 'Event Sourcing considered — events as source of truth if applicable' },
			{ text: 'Schema versioned — migrations exist, tested, and rollback-able' },
			{ text: 'Indexes cover query patterns — no full scans in critical paths' },
			{ text: 'Connection pooling configured with limits and timeouts' },
			{ text: 'N+1 query problem prevented (eager loading, batching, DataLoader)' },
			{ text: 'Multi-level caching strategy (memory → distributed → CDN)' },
			{ text: 'Cache invalidation has clear rules; TTL defined' },
			{ text: 'Cache keys consistent and predictable' },
			{ text: 'Backup + restore tested regularly — RPO/RTO defined' },
			{ text: 'Data retention policy enforced — archive/purge automated' },
			{ text: 'Large datasets have pagination (offset or cursor-based)' },
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

	// ============================================
	// QUALITY & OPERATIONS (11-18)
	// ============================================
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
		id: 'deployment',
		title: '14. Build & Deployment',
		description: 'CI/CD, release strategy, environments, infrastructure',
		items: [
			{ text: 'Build is deterministic — same input = same output' },
			{ text: 'Artifacts tagged with version and commit SHA' },
			{ text: 'Container-ready — Dockerfile / OCI image if applicable' },
			{ text: 'Follows 12-factor app principles' },
			{ text: 'Infrastructure as Code (Terraform, Pulumi, CDK)' },
			{ text: 'Zero-downtime deployments (rolling, blue-green, or canary)' },
			{ text: 'Database migrations decoupled from code deploy when needed' },
			{ text: 'Rollback procedure documented and tested (< 5 min)' },
			{ text: 'Feature flags for gradual rollout and emergency toggles' },
			{ text: 'Environment parity — dev/staging/prod use same artifacts' },
			{ text: "Immutable deployments — replace, don't patch" },
			{ text: 'Deployment smoke tests verify critical paths' },
			{ text: 'Release notes auto-generated from commits/PRs' },
		],
	},
	{
		id: 'operations',
		title: '15. Operational Readiness',
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
		title: '16. Code Health & Evolution',
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
		title: '17. Documentation',
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
	{
		id: 'extensibility',
		title: '18. Extensibility & Plugins',
		description: 'Hooks, extension points, feature flags',
		items: [
			{ text: 'Clear extension points — where custom logic can plug in' },
			{ text: 'Plugins/middleware have standardized interface' },
			{ text: 'Hook system allows before/after/around extension' },
			{ text: "Core and plugins loosely coupled — plugin failure doesn't crash core" },
			{ text: 'Feature flags control functionality without redeploy' },
			{ text: 'Dynamic loading supported if needed (runtime plugin loading)' },
			{ text: 'Plugins have lifecycle (init/start/stop/destroy)' },
		],
	},

	// ============================================
	// INTERNATIONALIZATION (19)
	// ============================================
	{
		id: 'i18n',
		title: '19. Internationalization & Localization',
		description: 'i18n ready, timezone, formatting',
		items: [
			{ text: 'Text externalized via i18n framework, not hardcoded' },
			{ text: 'Timezone aware — store UTC, display local' },
			{ text: 'Date/number/currency formatting follows locale' },
			{ text: 'RTL support if needed' },
			{ text: 'Translation workflow defined (extract → translate → integrate)' },
		],
	},

	// ============================================
	// API DESIGN (20-22)
	// ============================================
	{
		id: 'api-design',
		title: '20. API Design Fundamentals',
		description: 'Style, naming, consistency, discoverability',
		items: [
			{ text: 'Clear API style choice (REST, GraphQL, gRPC, RPC)' },
			{ text: 'Resource naming consistent (nouns, plural, kebab-case)' },
			{ text: 'URL structure hierarchical and predictable' },
			{ text: 'HTTP methods semantically correct (GET=read, POST=create, PUT/PATCH=update)' },
			{ text: 'HTTP status codes accurate (2xx/4xx/5xx clearly distinguished)' },
			{ text: 'Request/Response has consistent envelope (data, error, meta)' },
			{ text: 'Field naming consistent (camelCase or snake_case — pick one)' },
			{ text: 'Timestamps in ISO 8601 UTC format' },
			{ text: 'API design favors discoverability — IDE/autocomplete guides usage' },
			{ text: 'API style guide documented; team follows it' },
		],
	},
	{
		id: 'api-querying',
		title: '21. API Pagination, Filtering & Errors',
		description: 'Large datasets, query patterns, error handling',
		items: [
			{ text: 'Pagination for large datasets (offset vs cursor-based)' },
			{ text: 'Cursor-based for real-time data / infinite scroll' },
			{ text: 'Consistent pagination response (total, next, prev)' },
			{ text: 'Filtering has standard query syntax' },
			{ text: 'Sorting has consistent parameter (sort=field:asc)' },
			{ text: 'Default and max limits defined' },
			{ text: 'Error response has consistent structure (code, message, details)' },
			{ text: 'Error codes machine-readable, not just HTTP status' },
			{ text: 'Validation errors have field-level detail' },
			{ text: 'No internal errors/stack traces exposed in production' },
		],
	},
	{
		id: 'api-operations',
		title: '22. API Versioning & Operations',
		description: 'Versioning, idempotency, bulk, webhooks, SDK',
		items: [
			{ text: 'Versioning strategy defined (URL, header, or query param)' },
			{ text: 'Breaking changes defined; deprecation has notice period + sunset header' },
			{ text: "Changelog records each version's changes" },
			{ text: 'Migration guide for clients on breaking changes' },
			{ text: 'Mutating operations support idempotency key' },
			{ text: 'GET/HEAD/OPTIONS are safe (no side effects)' },
			{ text: 'PUT/DELETE are idempotent' },
			{ text: 'Rate limiting with headers (limit, remaining, reset)' },
			{ text: '429 returned with retry-after on rate limit' },
			{ text: 'Bulk operations supported (batch create/update/delete)' },
			{ text: 'Bulk responses have partial success handling' },
			{ text: 'Webhooks have consistent payload + signature verification (HMAC)' },
			{ text: 'Webhook retry policy with exponential backoff' },
			{ text: 'OpenAPI/GraphQL schema as source of truth' },
			{ text: 'SDK auto-generated from schema with typed responses' },
			{ text: 'API playground available (Swagger UI, GraphiQL)' },
		],
	},

	// ============================================
	// FRONTEND / UI (23-30)
	// ============================================
	{
		id: 'ui-state',
		title: '23. UI State & Reactivity',
		description: 'Reactive data flow, state management, derived state',
		items: [
			{ text: 'Reactive data binding — state changes auto-update UI' },
			{ text: 'State clearly classified: local / shared / server / URL' },
			{ text: 'Single source of truth — avoid duplicated state' },
			{ text: 'Derived state uses computed/selectors, not manual sync' },
			{ text: 'State updates immutable — no direct mutation' },
			{ text: 'Complex UI flows use state machines (modals, wizards, multi-step)' },
			{ text: 'Unidirectional data flow — easy to trace and debug' },
		],
	},
	{
		id: 'ui-data',
		title: '24. Data Fetching & Sync',
		description: 'Optimistic updates, caching, background sync',
		items: [
			{ text: 'Optimistic updates — instant UI feedback, rollback on failure' },
			{ text: 'Server state has cache + revalidation strategy' },
			{ text: 'Loading / error / empty / success states all handled' },
			{ text: 'Stale-while-revalidate — show cached data while fetching fresh' },
			{ text: 'Background sync — offline operations queue and sync when online' },
			{ text: 'Conflict resolution strategy defined (last-write-wins, merge, prompt)' },
			{ text: 'Request deduplication — same data not fetched multiple times' },
		],
	},
	{
		id: 'ui-responsive',
		title: '25. Responsive & Adaptive Design',
		description: 'Screen sizes, input modes, progressive enhancement',
		items: [
			{ text: 'Mobile-first or responsive design approach' },
			{ text: 'Breakpoints have consistent system' },
			{ text: 'Touch / mouse / keyboard input modes all supported' },
			{ text: 'Progressive enhancement — core functionality works everywhere' },
			{ text: 'Slow network / low-end device considered' },
			{ text: 'Images/assets have responsive loading (srcset, lazy load)' },
			{ text: 'Layout uses flexible units (rem, %, vh/vw), not hardcoded px' },
		],
	},
	{
		id: 'accessibility',
		title: '26. Accessibility (a11y)',
		description: 'Inclusive design, assistive technology',
		items: [
			{ text: 'Semantic HTML — correct headings, landmarks, buttons' },
			{ text: 'All interactive elements keyboard accessible' },
			{ text: 'Sufficient color contrast (WCAG AA/AAA)' },
			{ text: 'Images have alt text' },
			{ text: 'Forms have labels + error messages, correctly associated' },
			{ text: 'Focus management — modals, route changes have correct focus' },
			{ text: 'Screen reader support (ARIA used correctly)' },
			{ text: 'Reduced motion support (prefers-reduced-motion)' },
		],
	},
	{
		id: 'ui-feedback',
		title: '27. UI Feedback & Errors',
		description: 'Error boundaries, user feedback, recovery',
		items: [
			{ text: "Error boundaries — partial errors don't crash entire app" },
			{ text: 'Errors have user-friendly messages, not raw errors' },
			{ text: 'Retry mechanism available for users' },
			{ text: 'Loading states have skeleton / spinner / progress' },
			{ text: 'Success operations have confirmation feedback (toast, animation)' },
			{ text: 'Form validation has inline feedback, not just on submit' },
			{ text: 'Empty states are designed, not blank' },
		],
	},
	{
		id: 'ui-realtime',
		title: '28. Real-time & Live Updates',
		description: 'WebSocket, SSE, polling, collaboration',
		items: [
			{ text: 'Real-time needs have appropriate solution (WebSocket, SSE, polling)' },
			{ text: 'Connection has reconnection + backoff' },
			{ text: 'Connection state indicator (online/offline/connecting)' },
			{ text: 'Live data has throttle/debounce to avoid UI thrashing' },
			{ text: 'Collaborative editing has conflict handling (CRDT, OT)' },
			{ text: "Presence support if needed (who's online, who's viewing)" },
		],
	},
	{
		id: 'ui-performance',
		title: '29. Frontend Performance',
		description: 'Code splitting, lazy loading, perceived speed',
		items: [
			{ text: 'Code splitting — not loading entire app upfront' },
			{ text: 'Route-based lazy loading' },
			{ text: 'Critical rendering path optimized' },
			{ text: 'Perceived performance — skeleton UI, optimistic updates, instant feedback' },
			{ text: 'Performance budget defined (LCP, FID, CLS targets)' },
			{ text: 'Heavy computation off main thread (Web Workers)' },
			{ text: 'Virtualization for long lists' },
			{ text: 'Memoization for expensive pure computations' },
			{ text: 'Hot paths profiled, not guessed' },
		],
	},
	{
		id: 'design-system',
		title: '30. Design System & Consistency',
		description: 'Component library, tokens, patterns',
		items: [
			{ text: 'Design tokens defined (color, spacing, typography)' },
			{ text: 'Component library has consistent API' },
			{ text: 'Pattern documentation (how to use, when to use)' },
			{ text: 'Themeable — dark mode, branding customization' },
			{ text: 'Components composable, not monolithic' },
			{ text: 'Visual regression testing prevents accidental UI changes' },
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
	lines.push(pc.dim('Comprehensive hints for project health — select what applies to your project'))
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

	// Section overview
	lines.push(
		pc.dim('Sections: Core (1-10) · Quality (11-18) · i18n (19) · API (20-22) · Frontend (23-30)')
	)
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
	lines.push(pc.dim("Not all sections apply to every project. Skip sections that don't apply."))
	lines.push(pc.dim("Use this as hints — each project decides what's relevant."))
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
