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
	// PHILOSOPHY (0)
	// ============================================
	{
		id: 'philosophy',
		title: '0. Philosophy & Trade-offs',
		description: 'Guiding principles, context awareness, decision framework',
		items: [
			{ text: 'Core values explicit: correctness > performance > convenience' },
			{ text: 'Trade-offs documented — every decision has costs, make them visible' },
			{ text: 'Context drives decisions — startup vs enterprise, library vs service, team size' },
			{ text: 'Simplicity preferred — complexity must justify itself' },
			{ text: 'Boring technology by default — proven > novel unless novel solves real problem' },
			{ text: 'Optimize for change — code will be modified more than written' },
			{ text: 'Fail fast, recover gracefully — detect errors early, handle them well' },
			{ text: 'Automation over documentation — if it can be automated, automate it' },
			{ text: 'Observability is not optional — if you cannot see it, you cannot fix it' },
			{ text: "Security is foundational — not a feature, it's a constraint" },
		],
	},

	// ============================================
	// ARCHITECTURE (1-4)
	// ============================================
	{
		id: 'architecture',
		title: '1. Architecture & Modularity',
		description: 'System boundaries, layering, dependency direction, module design',
		items: [
			{ text: 'Clear system boundaries — infra/framework stays at the edge' },
			{ text: 'Unidirectional dependencies: core → feature → app' },
			{ text: 'Domain layer is pure — no IO, no framework dependencies' },
			{ text: 'Critical business logic in explicit use-case layer, not scattered in controllers' },
			{ text: 'Composition Root — dependencies assembled and injected externally' },
			{ text: 'Separate read/write paths when needed (CQRS)' },
			{ text: 'Public API surface is small and stable' },
			{ text: 'Service boundaries align with team ownership' },
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
		id: 'contracts',
		title: '2. Contracts & Boundaries',
		description: 'Type safety, schemas, interface contracts, validation',
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
			{ text: 'All input validated at boundaries — prevent injection' },
		],
	},
	{
		id: 'design',
		title: '3. Design Principles',
		description: 'Composition, immutability, code hygiene, no workarounds',
		items: [
			// Core principles
			{ text: 'Prefer immutable data by default' },
			{ text: 'Business logic is deterministic — same input, same output, minimal hidden state' },
			{
				text: 'Favor composition over inheritance — interfaces/traits, delegation, small composed units',
			},
			{ text: 'Side effects pushed to the edge (IO, logging, DB outside domain core)' },
			{ text: 'Data transformation via pipelines or clear steps, not deep nesting' },
			{ text: 'Dependencies injected, not instantiated internally' },
			{ text: 'Single Responsibility — each unit does one thing well' },
			// Code hygiene
			{ text: 'No commented-out code — delete it, git has history' },
			{ text: 'No copy-paste — extract and reuse, DRY principle' },
			{ text: 'No hardcoded values — extract to config / constants' },
			{ text: 'No magic numbers/strings — named constants with meaning' },
			{ text: 'No suppressed warnings — fix the warning, not the symptom' },
			{ text: 'No catch-all exceptions — handle specific errors' },
			// Architectural integrity
			{ text: 'Workarounds are debt — proper fix or documented TODO with deadline + owner' },
			{ text: 'Root cause fix, not symptom patch' },
			{ text: 'YAGNI — You Ain\'t Gonna Need It, avoid over-engineering' },
			{ text: 'KISS — Keep It Simple, Stupid' },
		],
	},
	{
		id: 'state',
		title: '4. State & Effects',
		description: 'State machines, effect boundaries, predictability',
		items: [
			{ text: 'Complex state flows use explicit state machines or state transitions' },
			{ text: 'Side effects have clear boundaries — know where IO happens' },
			{ text: 'Event-driven logic has clear event → handler mapping' },
			{ text: 'Avoid hidden state — make state explicit and inspectable' },
			{ text: 'Global mutable state minimized or eliminated' },
		],
	},

	// ============================================
	// RELIABILITY (5-8)
	// ============================================
	{
		id: 'errors',
		title: '5. Error Handling & Recovery',
		description: 'Error strategy, boundaries, graceful degradation, retry logic',
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
		description: 'Stateless, fault-tolerant, serverless-ready, service mesh',
		items: [
			{ text: 'Handlers/services stateless by default — no in-memory state across requests' },
			{ text: 'Session/state externalized (Redis, DB, external store)' },
			{ text: 'External calls have timeout + cancellation' },
			{ text: 'Critical paths have circuit breaker / fallback' },
			{ text: 'Infra dependencies (filesystem, network) abstracted via adapters' },
			{ text: 'Graceful shutdown — drain requests, close connections, release resources' },
			{ text: 'Health endpoints distinguish liveness vs readiness' },
			{ text: 'Resource limits defined (connections, memory, file handles)' },
			{ text: 'Cold start optimized — lazy imports, minimal init, small bundles' },
			{ text: 'Execution time aware — know function/request timeout limits' },
			{ text: "Horizontal scaling ready — adding instances doesn't require code changes" },
			{ text: 'Event-driven triggers clearly defined (HTTP, queue, schedule, event)' },
			{ text: 'Service mesh evaluated for polyglot architectures (mTLS, traffic management)' },
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
		id: 'performance',
		title: '8. Efficiency & Performance',
		description: 'O(1) thinking, data structures, profiling, optimization',
		items: [
			// Complexity-aware design (design time)
			{ text: 'Default to O(1) — for every operation, ask "can this be O(1)?"' },
			{ text: 'Avoid hidden O(n²) — no O(n) operation inside loops' },
			{ text: 'Choose data structure by operation: HashMap for lookup, Heap for min/max, Set for membership' },
			{ text: 'Lookup uses Map/Set O(1), not Array.find() O(n)' },
			{ text: 'Pre-compute at build/startup, not per-request' },
			{ text: 'Expensive computations memoized' },
			{ text: 'Regex/templates compiled once, not per-call' },
			{ text: 'Use generators/iterators for large data — lazy evaluation' },
			{ text: 'Structural sharing for immutable updates, not deep clone' },
			// Database efficiency
			{ text: 'Every queried column has index — no full table scans' },
			{ text: 'COUNT(*) on big tables → use pre-computed counter' },
			{ text: 'N+1 query prevented (batch fetch, JOIN, DataLoader)' },
			{ text: 'Denormalize for read-heavy paths — trade write for O(1) read' },
			// Runtime measurement
			{ text: 'Performance targets defined (p50, p95, p99 latency)' },
			{ text: 'Hot paths identified via profiling, not guessing' },
			{ text: 'Memory profiling performed — no leaks in long-running processes' },
			{ text: 'Load testing results inform architecture decisions' },
			{ text: 'Performance regression detected in CI (benchmark comparisons)' },
			{ text: 'Resource efficiency measured (cost per request, memory per user)' },
		],
	},

	// ============================================
	// DATA & INTEGRATION (9-10)
	// ============================================
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
			{ text: 'Multi-level caching strategy (memory → distributed → CDN)' },
			{ text: 'Cache invalidation has clear rules; TTL defined' },
			{ text: 'Cache keys consistent and predictable' },
			{ text: 'Backup + restore tested regularly — RPO/RTO defined' },
			{ text: 'Data retention policy enforced — archive/purge automated' },
			{ text: 'Large datasets have pagination (offset or cursor-based)' },
			{ text: 'PII/sensitive data encrypted at rest' },
			{ text: 'Data lineage tracked for critical data flows' },
		],
	},
	{
		id: 'api',
		title: '10. API Design & Operations',
		description: 'Style, versioning, pagination, errors, idempotency, webhooks',
		items: [
			// Design fundamentals
			{ text: 'Clear API style choice (REST, GraphQL, gRPC, RPC) with rationale' },
			{ text: 'Resource naming consistent (nouns, plural, kebab-case)' },
			{ text: 'URL structure hierarchical and predictable' },
			{ text: 'HTTP methods semantically correct (GET=read, POST=create, PUT/PATCH=update)' },
			{ text: 'HTTP status codes accurate (2xx/4xx/5xx clearly distinguished)' },
			{ text: 'Request/Response has consistent envelope (data, error, meta)' },
			{ text: 'Field naming consistent (camelCase or snake_case — pick one)' },
			{ text: 'Timestamps in ISO 8601 UTC format' },
			// Pagination & filtering
			{ text: 'Pagination for large datasets (offset vs cursor-based)' },
			{ text: 'Cursor-based for real-time data / infinite scroll' },
			{ text: 'Filtering has standard query syntax' },
			{ text: 'Default and max limits defined' },
			// Errors
			{ text: 'Error response has consistent structure (code, message, details)' },
			{ text: 'Error codes machine-readable, not just HTTP status' },
			{ text: 'Validation errors have field-level detail' },
			{ text: 'No internal errors/stack traces exposed in production' },
			// Versioning & operations
			{ text: 'Versioning strategy defined (URL, header, or query param)' },
			{ text: 'Breaking changes defined; deprecation has notice period + sunset header' },
			{ text: 'All mutating operations idempotent — safe to retry with idempotency key' },
			{ text: 'GET/HEAD/OPTIONS are safe (no side effects)' },
			{ text: 'PUT/DELETE are idempotent' },
			{ text: 'Rate limiting with headers (limit, remaining, reset)' },
			{ text: '429 returned with retry-after on rate limit' },
			// Bulk & efficiency
			{ text: 'Batch API — 1 request for n items, not n requests' },
			{ text: 'Bulk responses have partial success handling' },
			{ text: 'Push over poll — webhooks/SSE for events, not repeated GET' },
			{ text: 'Webhooks have consistent payload + signature verification (HMAC)' },
			{ text: 'Webhook retry policy with exponential backoff' },
			// SDK & docs
			{ text: 'OpenAPI/GraphQL schema as source of truth' },
			{ text: 'SDK auto-generated from schema with typed responses' },
			{ text: 'API playground available (Swagger UI, GraphiQL)' },
		],
	},

	// ============================================
	// QUALITY (11-13)
	// ============================================
	{
		id: 'testing',
		title: '11. Testing & Correctness',
		description: 'Test pyramid, coverage, quality gates, invariants',
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
			{ text: 'Property-based testing for complex logic with many edge cases' },
			{ text: 'Invariants documented and tested — what must always be true' },
		],
	},
	{
		id: 'observability',
		title: '12. Observability',
		description: 'Logging, metrics, tracing, alerting, OpenTelemetry',
		items: [
			{ text: 'Structured logs with correlation IDs' },
			{ text: 'Core paths have metrics (throughput, latency p50/p99, error rate)' },
			{ text: 'OpenTelemetry instrumentation (vendor-neutral traces/metrics/logs)' },
			{ text: 'Trace ID propagated across all services' },
			{ text: 'Context propagation standardized (W3C Trace Context)' },
			{ text: 'SLIs/SLOs defined for critical user journeys' },
			{ text: 'Dashboards per service — latency, errors, saturation at a glance' },
			{ text: 'Deployment markers visible in metrics for correlation' },
			{ text: 'Releases traceable to commits' },
			{ text: 'Alerting rules codified — no manual alert configuration' },
			{ text: 'Telemetry exportable to multiple backends (Jaeger, Prometheus, etc.)' },
		],
	},
	{
		id: 'security',
		title: '13. Security & Compliance',
		description: 'Auth, encryption, supply chain, Zero Trust, compliance',
		items: [
			// Authentication & authorization
			{ text: 'Auth logic centralized; permissions clearly auditable' },
			{ text: 'Least privilege + minimal exposed surface' },
			{ text: 'Zero Trust principles: never trust, always verify' },
			{ text: 'Identity-based access control (RBAC/ABAC), not network-based' },
			{ text: 'Service-to-service authentication required (mTLS, JWT)' },
			// Encryption & secrets
			{ text: 'Encryption in transit (TLS 1.2+) and at rest for sensitive data' },
			{ text: 'Secrets rotated regularly; emergency rotation runbook exists' },
			{ text: 'Secrets in vault (not env vars for production)' },
			// Supply chain & dependencies
			{ text: 'Dependency vulnerabilities scanned in CI (fail on high/critical)' },
			{ text: 'SBOM generated for releases; supply chain verified' },
			{ text: 'Artifacts signed with cryptographic signatures (Sigstore/cosign)' },
			{ text: 'SLSA Level 2+ build provenance for critical services' },
			{ text: 'Base images minimal and regularly updated (distroless preferred)' },
			// Security testing
			{ text: 'Security headers configured (CSP, HSTS, X-Frame-Options)' },
			{ text: 'SAST/DAST in CI pipeline for security regression' },
			{ text: 'Policy as Code enforced (OPA, Kyverno) at deployment' },
			// Incident response
			{ text: 'Security incident response plan documented and tested' },
			{ text: 'Logs exclude sensitive data (tokens, passwords, PII)' },
			// Compliance
			{ text: 'PII has audit logs + data retention policy' },
			{ text: 'GDPR/CCPA compliance: right to erasure, data portability, consent' },
			{ text: 'Data residency requirements enforced if applicable' },
			{ text: 'License compliance checked (SPDX, license scanning)' },
		],
	},

	// ============================================
	// DELIVERY (14-15)
	// ============================================
	{
		id: 'deployment',
		title: '14. Build, Deploy & Supply Chain',
		description: 'CI/CD, GitOps, release strategy, artifact security',
		items: [
			// Build
			{ text: 'Build is deterministic — same input = same output' },
			{ text: 'Artifacts tagged with version and commit SHA' },
			{ text: 'Container-ready — Dockerfile / OCI image if applicable' },
			{ text: 'Follows 12-factor app principles' },
			// Infrastructure
			{ text: 'Infrastructure as Code (Terraform, Pulumi, CDK)' },
			{ text: 'GitOps: Git as single source of truth for infrastructure/config' },
			{ text: 'Config changes reviewed via Git PRs, not manual apply' },
			// Deployment strategy
			{ text: 'Zero-downtime deployments (rolling, blue-green, or canary)' },
			{ text: 'Database migrations decoupled from code deploy when needed' },
			{ text: 'Rollback procedure documented and tested (< 5 min)' },
			{ text: 'Feature flags for gradual rollout and emergency toggles' },
			{ text: 'Environment parity — dev/staging/prod use same artifacts' },
			{ text: "Immutable deployments — replace, don't patch" },
			{ text: 'Deployment smoke tests verify critical paths' },
			{ text: 'Release notes auto-generated from commits/PRs' },
			// Supply chain
			{ text: 'Build process runs in isolated, ephemeral environments' },
			{ text: 'Container images scanned for vulnerabilities before deployment' },
		],
	},
	{
		id: 'operations',
		title: '15. Operational Readiness',
		description: 'SLOs, runbooks, capacity, disaster recovery, cost',
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
			{ text: 'Resource right-sizing reviewed regularly' },
		],
	},

	// ============================================
	// EVOLUTION (16-18)
	// ============================================
	{
		id: 'evolution',
		title: '16. Code Health & Evolution',
		description: 'Dead code, refactoring, tech debt, red flags',
		items: [
			// Maintenance
			{ text: 'Regular scans for dead code / unused dependencies' },
			{ text: 'Dependencies reviewed: security updates, remove bloat' },
			{ text: 'API/schema changes have migration scripts' },
			{ text: 'Semantic versioning + changelog maintained' },
			{ text: 'Architecture decisions recorded (ADR)' },
			{ text: 'Code style enforced by automated tools' },
			// Refactor culture
			{ text: 'Refactoring is routine — not a "special event"' },
			{ text: 'PR reviews ask: "can this be simpler?"' },
			{ text: 'Delete code encouraged — less code = less bugs = less maintenance' },
			{ text: 'Boy Scout Rule — leave code better than you found it' },
			// Tech debt management
			{ text: 'Technical debt tracked in backlog with visibility' },
			{ text: 'Regular debt review (per sprint or monthly)' },
			{ text: 'Debt prioritized: blocking > high-impact > nice-to-have' },
			{ text: 'New features budget time to pay down debt' },
			// Red flags to watch
			{ text: 'Red flag: "temporary" fix without follow-up plan' },
			{ text: 'Red flag: same bug fixed twice' },
			{ text: 'Red flag: HACK/FIXME/XXX comments ignored' },
			{ text: 'Red flag: function > 100 lines, file > 500 lines' },
			{ text: 'Red flag: cyclomatic complexity too high' },
			{ text: 'Red flag: copy-paste more than 3 times' },
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
		id: 'config',
		title: '18. Configuration & DX',
		description: 'Zero-config, developer experience, local dev',
		items: [
			{ text: 'Common scenarios have sensible defaults' },
			{ text: 'Config validated at startup — fail-fast on invalid config' },
			{ text: 'Convention-over-configuration for routes/handlers/jobs' },
			{ text: 'Environment differences via config/adapters, not scattered conditionals' },
			{ text: 'CLI provides one-command operations (dev/test/build/deploy)' },
			{ text: 'Local dev environment setup documented and scripted' },
			{ text: 'Dev environment reproducible (Dev Containers, Docker Compose, Nix)' },
			{ text: 'Fast feedback loop (test < 1s, lint < 2s, build < 10s)' },
		],
	},

	// ============================================
	// FRONTEND (19-22)
	// ============================================
	{
		id: 'ui-state',
		title: '19. UI State & Data',
		description: 'State management, data fetching, caching, sync',
		items: [
			// State management
			{ text: 'Reactive data binding — state changes auto-update UI' },
			{ text: 'State clearly classified: local / shared / server / URL' },
			{ text: 'Single source of truth — avoid duplicated state' },
			{ text: 'Derived state uses computed/selectors, not manual sync' },
			{ text: 'State updates immutable — no direct mutation' },
			{ text: 'Complex UI flows use state machines (modals, wizards, multi-step)' },
			{ text: 'Unidirectional data flow — easy to trace and debug' },
			// Data fetching
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
		title: '20. Responsive & Accessible',
		description: 'Screen sizes, input modes, a11y, inclusive design',
		items: [
			// Responsive
			{ text: 'Mobile-first or responsive design approach' },
			{ text: 'Breakpoints have consistent system' },
			{ text: 'Touch / mouse / keyboard input modes all supported' },
			{ text: 'Progressive enhancement — core functionality works everywhere' },
			{ text: 'Slow network / low-end device considered' },
			{ text: 'Images/assets have responsive loading (srcset, lazy load)' },
			{ text: 'Layout uses flexible units (rem, %, vh/vw), not hardcoded px' },
			// Accessibility
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
		title: '21. UI Feedback & Real-time',
		description: 'Error boundaries, user feedback, live updates, collaboration',
		items: [
			// Feedback & errors
			{ text: "Error boundaries — partial errors don't crash entire app" },
			{ text: 'Errors have user-friendly messages, not raw errors' },
			{ text: 'Retry mechanism available for users' },
			{ text: 'Loading states have skeleton / spinner / progress' },
			{ text: 'Success operations have confirmation feedback (toast, animation)' },
			{ text: 'Form validation has inline feedback, not just on submit' },
			{ text: 'Empty states are designed, not blank' },
			// Real-time
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
		title: '22. Frontend Performance & Design System',
		description: 'Code splitting, lazy loading, perceived speed, consistency',
		items: [
			// Performance
			{ text: 'Code splitting — not loading entire app upfront' },
			{ text: 'Route-based lazy loading' },
			{ text: 'Critical rendering path optimized' },
			{ text: 'Perceived performance — skeleton UI, optimistic updates, instant feedback' },
			{ text: 'Performance budget defined (LCP, FID, CLS targets)' },
			{ text: 'Heavy computation off main thread (Web Workers)' },
			{ text: 'Virtualization for long lists' },
			{ text: 'Memoization for expensive pure computations' },
			// Design system
			{ text: 'Design tokens defined (color, spacing, typography)' },
			{ text: 'Component library has consistent API' },
			{ text: 'Pattern documentation (how to use, when to use)' },
			{ text: 'Themeable — dark mode, branding customization' },
			{ text: 'Components composable, not monolithic' },
			{ text: 'Visual regression testing prevents accidental UI changes' },
		],
	},

	// ============================================
	// CROSS-CUTTING (23-24)
	// ============================================
	{
		id: 'i18n',
		title: '23. i18n & Localization',
		description: 'i18n ready, timezone, formatting',
		items: [
			{ text: 'Text externalized via i18n framework, not hardcoded' },
			{ text: 'Timezone aware — store UTC, display local' },
			{ text: 'Date/number/currency formatting follows locale' },
			{ text: 'RTL support if needed' },
			{ text: 'Translation workflow defined (extract → translate → integrate)' },
		],
	},
	{
		id: 'extensibility',
		title: '24. Extensibility & Plugins',
		description: 'Hooks, extension points, dynamic loading',
		items: [
			{ text: 'Clear extension points — where custom logic can plug in' },
			{ text: 'Plugins/middleware have standardized interface' },
			{ text: 'Hook system allows before/after/around extension' },
			{ text: "Core and plugins loosely coupled — plugin failure doesn't crash core" },
			{ text: 'Dynamic loading supported if needed (runtime plugin loading)' },
			{ text: 'Plugins have lifecycle (init/start/stop/destroy)' },
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
	lines.push(pc.bold('Core Principles'))
	lines.push(pc.cyan('Correct → Resilient → Simple → Observable → Evolvable'))
	lines.push('')

	lines.push(pc.bold('Pillars'))
	const pillars = [
		'Well-typed',
		'Resilient',
		'Secure',
		'Performant',
		'Testable',
		'Observable',
		'Documented',
	]
	lines.push(pillars.map((p) => pc.green(p)).join(pc.dim(' · ')))
	lines.push('')

	// Section overview
	lines.push(
		pc.dim(
			'Sections: Philosophy (0) · Architecture (1-4) · Reliability (5-8) · Data (9-10) · Quality (11-13)'
		)
	)
	lines.push(
		pc.dim(
			'          Delivery (14-15) · Evolution (16-18) · Frontend (19-22) · Cross-cutting (23-24)'
		)
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
