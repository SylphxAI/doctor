import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileExists } from '../utils/fs'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Check if directory exists and has files
 */
function directoryHasFiles(dirPath: string): boolean {
	if (!fileExists(dirPath)) return false
	try {
		const files = readdirSync(dirPath)
		return files.length > 0
	} catch {
		return false
	}
}

/**
 * Detect which migration tool is used
 */
function detectMigrationTool(
	_cwd: string,
	packageJson: Record<string, unknown> | null
): string | null {
	if (!packageJson) return null

	const deps = {
		...(packageJson.dependencies as Record<string, string> | undefined),
		...(packageJson.devDependencies as Record<string, string> | undefined),
	}

	if (deps['drizzle-kit']) return 'drizzle'
	if (deps.prisma || deps['@prisma/client']) return 'prisma'
	if (deps.kysely) return 'kysely'
	if (deps.knex) return 'knex'
	if (deps.typeorm) return 'typeorm'

	return null
}

/**
 * Get expected migrations directory for each tool
 */
function getMigrationsDir(tool: string): string {
	switch (tool) {
		case 'drizzle':
			return 'drizzle' // or migrations/, configurable
		case 'prisma':
			return 'prisma/migrations'
		case 'kysely':
			return 'migrations'
		case 'knex':
			return 'migrations'
		case 'typeorm':
			return 'migrations'
		default:
			return 'migrations'
	}
}

/**
 * Dangerous commands that bypass migration files
 */
const DANGEROUS_COMMANDS: Record<string, string[]> = {
	drizzle: ['drizzle-kit push', 'db push'],
	prisma: ['prisma db push', 'npx prisma db push', 'bunx prisma db push'],
}

export const dbModule: CheckModule = defineCheckModule(
	{
		category: 'db',
		label: '🗄️ Database',
		description: 'Check database migration practices',
		// Only enable if a migration tool is detected
		enabled: (ctx) => detectMigrationTool(ctx.cwd, ctx.packageJson) !== null,
	},
	[
		{
			name: 'has-migrations',
			description: 'Check if migration files exist',
			fixable: false,
			check(ctx) {
				const tool = detectMigrationTool(ctx.cwd, ctx.packageJson)
				if (!tool) {
					return {
						passed: true,
						message: 'No migration tool detected',
						skipped: true,
					}
				}

				const migrationsDir = getMigrationsDir(tool)
				const fullPath = join(ctx.cwd, migrationsDir)

				// Check common alternative paths
				const alternatePaths = [
					join(ctx.cwd, 'migrations'),
					join(ctx.cwd, 'drizzle'),
					join(ctx.cwd, 'src/db/migrations'),
					join(ctx.cwd, 'db/migrations'),
				]

				const foundPath = [fullPath, ...alternatePaths].find(directoryHasFiles)

				if (foundPath) {
					return {
						passed: true,
						message: `Migration files found (${tool})`,
					}
				}

				return {
					passed: false,
					message: `No migration files found for ${tool}`,
					hint:
						tool === 'drizzle'
							? 'Run: bunx drizzle-kit generate'
							: `Create migrations in ${migrationsDir}/`,
				}
			},
		},

		{
			name: 'no-push-in-prod',
			description: 'Check that production scripts use migrations, not db push',
			fixable: false,
			check(ctx) {
				const tool = detectMigrationTool(ctx.cwd, ctx.packageJson)
				if (!tool) {
					return {
						passed: true,
						message: 'No migration tool detected',
						skipped: true,
					}
				}

				const scripts = (ctx.packageJson?.scripts ?? {}) as Record<string, string>
				const dangerousPatterns = DANGEROUS_COMMANDS[tool] ?? []

				// Scripts where push is acceptable (dev only)
				const devScripts = ['db:push', 'db:dev', 'dev:db', 'db:sync']

				const issues: string[] = []

				for (const [name, command] of Object.entries(scripts)) {
					// Skip dev-only scripts
					if (devScripts.some((dev) => name.includes(dev) || name === dev)) continue

					// Check if script uses dangerous command
					const usesDangerous = dangerousPatterns.some((pattern) =>
						command.toLowerCase().includes(pattern.toLowerCase())
					)

					if (usesDangerous) {
						issues.push(`"${name}": uses db push (bypasses migrations)`)
					}
				}

				if (issues.length === 0) {
					return {
						passed: true,
						message: 'No db push in production scripts',
					}
				}

				return {
					passed: false,
					message: `${issues.length} script(s) use db push`,
					hint: `${issues.join('\n')}\n\nUse migrations instead: drizzle-kit migrate`,
				}
			},
		},

		{
			name: 'has-migrate-script',
			description: 'Check that a migration script exists',
			fixable: false,
			check(ctx) {
				const tool = detectMigrationTool(ctx.cwd, ctx.packageJson)
				if (!tool) {
					return {
						passed: true,
						message: 'No migration tool detected',
						skipped: true,
					}
				}

				const scripts = (ctx.packageJson?.scripts ?? {}) as Record<string, string>

				// Look for migration-related scripts
				const migrateScripts = ['db:migrate', 'migrate', 'migrate:run', 'db:deploy']
				const hasMigrateScript = migrateScripts.some((name) => scripts[name])

				if (hasMigrateScript) {
					return {
						passed: true,
						message: 'Migration script found',
					}
				}

				const hint =
					tool === 'drizzle'
						? 'Add scripts:\n  "db:generate": "drizzle-kit generate"\n  "db:migrate": "drizzle-kit migrate"'
						: 'Add a "db:migrate" script to run migrations'

				return {
					passed: false,
					message: 'No migration script found',
					hint,
				}
			},
		},

		{
			name: 'config-exists',
			description: 'Check that migration tool config exists',
			fixable: false,
			check(ctx) {
				const tool = detectMigrationTool(ctx.cwd, ctx.packageJson)
				if (!tool) {
					return {
						passed: true,
						message: 'No migration tool detected',
						skipped: true,
					}
				}

				const configFiles: Record<string, string[]> = {
					drizzle: ['drizzle.config.ts', 'drizzle.config.js', 'drizzle.config.mjs'],
					prisma: ['prisma/schema.prisma'],
					kysely: ['kysely.config.ts', 'kysely.config.js'],
					knex: ['knexfile.ts', 'knexfile.js'],
					typeorm: ['ormconfig.ts', 'ormconfig.js', 'ormconfig.json'],
				}

				const expectedConfigs = configFiles[tool] ?? []
				const foundConfig = expectedConfigs.find((config) => fileExists(join(ctx.cwd, config)))

				if (foundConfig) {
					return {
						passed: true,
						message: `${tool} config found: ${foundConfig}`,
					}
				}

				return {
					passed: false,
					message: `No ${tool} config found`,
					hint: `Create ${expectedConfigs[0]}`,
				}
			},
		},

		{
			name: 'ci-migrations',
			description: 'Check that CI runs migrations',
			fixable: false,
			check(ctx) {
				const tool = detectMigrationTool(ctx.cwd, ctx.packageJson)
				if (!tool) {
					return {
						passed: true,
						message: 'No migration tool detected',
						skipped: true,
					}
				}

				// Check for CI workflow files
				const ciPaths = [
					join(ctx.cwd, '.github/workflows/ci.yml'),
					join(ctx.cwd, '.github/workflows/ci.yaml'),
					join(ctx.cwd, '.github/workflows/test.yml'),
					join(ctx.cwd, '.github/workflows/test.yaml'),
				]

				const hasCi = ciPaths.some(fileExists)
				if (!hasCi) {
					return {
						passed: true,
						message: 'No CI workflow found',
						skipped: true,
					}
				}

				// This is a hint-only check - we can't easily parse YAML
				// to verify migrations are run
				return {
					passed: true,
					message: 'CI workflow exists (verify migrations run manually)',
					hint: 'Ensure CI runs: drizzle-kit migrate (or equivalent)',
				}
			},
		},
	]
)
