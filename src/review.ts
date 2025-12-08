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
			{ text: 'Clear system boundaries - infra/framework at edges only' },
			{
				text: 'Layered architecture (Hexagonal/Clean) - single dependency direction: core → feature → app',
			},
			{ text: 'Domain layer pure - no IO, no framework dependencies' },
			{
				text: 'Explicit use-case layer for critical business logic (not scattered in controllers)',
			},
			{ text: 'Composition Root exists - dependencies assembled/injected externally' },
			{ text: 'Read/write paths clearly separated (CQRS when needed)' },
			{ text: 'Public API surface small and stable' },
		],
	},
	{
		id: 'types',
		title: '2. Type System & Contracts',
		description: 'Type safety, schemas, end-to-end contracts',
		items: [
			{ text: 'TypeScript strict mode enabled (including strictNullChecks)' },
			{ text: 'External API/event/config has schema - types generated from schema' },
			{ text: 'Public API types clear - no any/unknown leaking' },
			{ text: 'End-to-end type-safe channel between Client ↔ Server' },
			{ text: 'Branded types for critical data (UserId, Amount - not bare string/number)' },
			{ text: 'External SDKs isolated via wrapper to contain dynamic types' },
			{ text: 'Typed errors (Result/Either) - not arbitrary throws' },
			{ text: 'Minimal type assertions (as) - justified when used' },
		],
	},
	{
		id: 'runtime',
		title: '3. Runtime & Resilience',
		description: 'Stateless, idempotent, fault-tolerant',
		items: [
			{ text: 'Handlers/services default stateless' },
			{ text: 'All operations idempotent - safe to retry' },
			{ text: 'Every external call has timeout + cancellation' },
			{ text: 'External services have retry + exponential backoff' },
			{ text: 'Critical paths have circuit breaker / fallback' },
			{ text: 'No direct Node API dependency (fs/net) - or abstracted via adapter' },
			{ text: 'Cold start controlled: lazy imports, split bundles' },
			{ text: 'Background jobs clearly defined (trigger conditions, rerunnable, max duration)' },
			{ text: 'API has rate limit / payload size limit' },
		],
	},
	{
		id: 'config',
		title: '4. Configuration & DX',
		description: 'Zero-config, developer experience',
		items: [
			{ text: 'Sensible defaults for common scenarios - works out of box' },
			{ text: 'Environment variables validated with schema - fail-fast on startup' },
			{ text: 'Config in TypeScript (*.config.ts) with type inference' },
			{ text: 'Convention-over-configuration for auto-registering routes/handlers/jobs' },
			{ text: 'Environment differences handled via config/adapter - no scattered if-else' },
			{ text: 'CLI provides one-command operations (dev/test/build/deploy)' },
		],
	},
	{
		id: 'modularity',
		title: '5. Modularity & Dependencies',
		description: 'Module boundaries, dependency management',
		items: [
			{ text: 'Each module single responsibility - describable in one sentence' },
			{ text: 'Modules communicate via interface/port - no direct implementation dependency' },
			{ text: 'External services (DB/queue/cache/email) all via Port & Adapter' },
			{ text: 'Dependency direction enforced - no reverse imports' },
			{ text: 'Shared utilities in shared/core - no bidirectional dependencies' },
			{ text: 'Any feature safely removable without hidden coupling' },
			{ text: 'Features grouped by business capability - not pure technical classification' },
		],
	},
	{
		id: 'testing',
		title: '6. Testing & Quality',
		description: 'Test pyramid, quality gates',
		items: [
			{ text: 'Test Pyramid clear: unit → integration → e2e' },
			{ text: 'Domain logic has comprehensive unit tests - no infra/network/time dependency' },
			{ text: 'Public contracts have contract tests - prevent breaking clients' },
			{ text: 'External services have mock/fake/sandbox' },
			{ text: 'Tests deterministic: no real time, real random, real network' },
			{ text: 'Critical features require tests before merge' },
			{ text: 'Core modules have coverage floor' },
			{ text: 'CI enforces type-check + lint + tests' },
		],
	},
	{
		id: 'observability',
		title: '7. Observability',
		description: 'Logging, metrics, tracing, alerting',
		items: [
			{ text: 'Structured JSON logs with request_id / correlation_id / user_id' },
			{ text: 'Core path metrics: QPS, latency p99, error rate' },
			{ text: 'Trace ID propagated from entry to all downstream services' },
			{ text: 'Each service has health / readiness endpoint' },
			{
				text: 'Error classification clear: business error vs system error vs external service error',
			},
			{ text: 'Important errors have alert rules - not just logged' },
			{ text: 'Release/deploy traceable: know which commit changed what behavior' },
		],
	},
	{
		id: 'security',
		title: '8. Security & Compliance',
		description: 'Authentication, authorization, data protection',
		items: [
			{ text: 'All inputs validated with schema - prevent injection' },
			{ text: 'Secrets via secret manager / env - never hardcoded' },
			{ text: 'Auth logic centralized - RBAC/permissions clear and auditable' },
			{ text: 'Least privilege principle + minimal exposure surface' },
			{ text: 'Full HTTPS/TLS' },
			{ text: "Logs don't output sensitive data (token/password/PII)" },
			{ text: 'Personal data/financial data has audit log + data retention policy' },
		],
	},
	{
		id: 'evolution',
		title: '9. Code Health & Evolution',
		description: 'Dead code, dependencies, API/schema evolution',
		items: [
			{ text: 'Static tools regularly scan dead code / unused exports / stale deps' },
			{ text: 'Dead code has process: mark deprecated → notice period → remove' },
			{ text: 'Dependencies reviewed regularly: security updates, remove heavy libraries' },
			{ text: 'API has versioning strategy - breaking changes have migration path' },
			{ text: 'DB schema changes have migration scripts - can rollback' },
			{ text: 'Semantic versioning + changelog maintained' },
			{ text: 'Architecture decisions recorded in ADR' },
			{ text: 'Refactor is routine: actively ask "can this be simpler?" in reviews' },
			{ text: 'Code style enforced by automated tools (lint + formatter)' },
		],
	},
	{
		id: 'docs',
		title: '10. Documentation',
		description: 'Architecture diagrams, API docs, onboarding',
		items: [
			{
				text: 'High-level architecture diagram: boundaries, flows, core modules at a glance',
			},
			{ text: 'Public API has auto-generated docs (OpenAPI/TypeDoc)' },
			{ text: 'README clearly states: how to run dev / test / build / deploy' },
			{ text: 'Critical business flows (payment, accounting, permissions) have dedicated docs' },
			{ text: 'New hire onboarding guide exists - local dev up in < 1 day' },
		],
	},
]

export function formatReviewChecklist(): string {
	const lines: string[] = []

	// Header
	lines.push('')
	lines.push(`${pc.bold('🩺 doctor review')} ${pc.dim(`v${version}`)}`)
	lines.push('')
	lines.push(pc.bold('Project Review Checklist'))
	lines.push(pc.dim('High-level architectural review - manual verification required'))
	lines.push('')

	// Core principles
	lines.push(pc.bold('━'.repeat(60)))
	lines.push('')
	lines.push(pc.bold('Core Principle'))
	lines.push(
		pc.cyan('Type-safe, Serverless-ready, highly decoupled, testable TypeScript architecture')
	)
	lines.push('')

	lines.push(pc.bold('Eight Pillars'))
	const pillars = [
		'Type-safe',
		'Serverless',
		'Zero-config',
		'Fine-grained',
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
		pc.dim('This checklist is for manual review - items cannot be automatically verified.')
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
