import { join } from 'node:path'
import { fileExists, findFiles, readFile } from '../utils/fs'
import type { CheckModule } from './define'
import { defineCheckModule } from './define'

/**
 * Read Cargo.toml and extract a field value
 */
function readCargoField(content: string, field: string): string | null {
	// Simple TOML parsing for top-level fields
	const regex = new RegExp(`^\\s*${field}\\s*=\\s*"([^"]+)"`, 'm')
	const match = content.match(regex)
	return match?.[1] ?? null
}

/**
 * Check if Cargo.toml indicates a binary crate
 */
function isBinaryCrate(content: string): boolean {
	// Has [[bin]] section or has src/main.rs reference
	return content.includes('[[bin]]') || content.includes('src/main.rs')
}

export const rustModule: CheckModule = defineCheckModule(
	{
		category: 'rust',
		label: '🦀 Rust',
		description: 'Check Rust project configuration',
		ecosystem: 'rust', // Auto-skip for non-Rust projects
	},
	[
		{
			name: 'has-cargo',
			description: 'Check if Cargo.toml exists',
			fixable: false,
			check(ctx) {
				const hasCargoToml = fileExists(join(ctx.cwd, 'Cargo.toml'))

				return {
					passed: hasCargoToml,
					message: hasCargoToml ? 'Cargo.toml exists' : 'No Cargo.toml found',
					hint: hasCargoToml ? undefined : 'Initialize with: cargo init',
				}
			},
		},

		{
			name: 'edition',
			description: 'Check if Cargo.toml uses modern Rust edition (2021+)',
			fixable: false,
			check(ctx) {
				const cargoPath = join(ctx.cwd, 'Cargo.toml')
				const content = readFile(cargoPath)

				if (!content) {
					return {
						passed: true,
						message: 'No Cargo.toml (skipped)',
						skipped: true,
					}
				}

				const edition = readCargoField(content, 'edition')

				if (!edition) {
					return {
						passed: false,
						message: 'Cargo.toml missing edition field',
						hint: 'Add edition = "2021" to [package] section',
					}
				}

				const modernEditions = ['2021', '2024']
				const isModern = modernEditions.includes(edition)

				return {
					passed: isModern,
					message: isModern
						? `Using Rust edition ${edition}`
						: `Using outdated Rust edition ${edition}`,
					hint: isModern ? undefined : 'Update to edition = "2021" or "2024"',
				}
			},
		},

		{
			name: 'has-rustfmt',
			description: 'Check if rustfmt.toml exists for formatting config',
			fixable: false,
			check(ctx) {
				const hasRustfmt =
					fileExists(join(ctx.cwd, 'rustfmt.toml')) || fileExists(join(ctx.cwd, '.rustfmt.toml'))

				return {
					passed: hasRustfmt,
					message: hasRustfmt ? 'rustfmt.toml exists' : 'No rustfmt.toml found',
					hint: hasRustfmt ? undefined : 'Create rustfmt.toml for consistent formatting',
				}
			},
		},

		{
			name: 'has-clippy',
			description: 'Check if clippy config exists for linting',
			fixable: false,
			check(ctx) {
				const hasClippy =
					fileExists(join(ctx.cwd, 'clippy.toml')) || fileExists(join(ctx.cwd, '.clippy.toml'))

				// Also check Cargo.toml for [lints.clippy] section
				const cargoContent = readFile(join(ctx.cwd, 'Cargo.toml')) ?? ''
				const hasClippyInCargo = cargoContent.includes('[lints.clippy]')

				if (hasClippy || hasClippyInCargo) {
					return {
						passed: true,
						message: hasClippy ? 'clippy.toml exists' : 'Clippy configured in Cargo.toml',
					}
				}

				return {
					passed: false,
					message: 'No clippy config found',
					hint: 'Create clippy.toml or add [lints.clippy] to Cargo.toml',
				}
			},
		},

		{
			name: 'has-tests',
			description: 'Check if Rust tests exist',
			fixable: false,
			async check(ctx) {
				// Check for tests/ directory
				const hasTestsDir = fileExists(join(ctx.cwd, 'tests'))

				// Check for #[test] in src/ files
				const srcFiles = await findFiles(join(ctx.cwd, 'src'), /\.rs$/)
				let hasTestAttribute = false

				for (const file of srcFiles) {
					const content = readFile(file)
					if (content?.includes('#[test]') || content?.includes('#[cfg(test)]')) {
						hasTestAttribute = true
						break
					}
				}

				const hasTests = hasTestsDir || hasTestAttribute

				return {
					passed: hasTests,
					message: hasTests
						? hasTestsDir
							? 'tests/ directory exists'
							: 'Found #[test] in source files'
						: 'No tests found',
					hint: hasTests ? undefined : 'Add tests/ directory or #[test] functions',
				}
			},
		},

		{
			name: 'deny',
			description: 'Check if cargo-deny is configured for security/license auditing',
			fixable: false,
			check(ctx) {
				const hasDeny = fileExists(join(ctx.cwd, 'deny.toml'))

				return {
					passed: hasDeny,
					message: hasDeny
						? 'deny.toml exists for security/license auditing'
						: 'No deny.toml found',
					hint: hasDeny ? undefined : 'Create deny.toml for cargo-deny (security & license audit)',
				}
			},
		},

		{
			name: 'cargo-lock',
			description: 'Check if binary crates have Cargo.lock committed',
			fixable: false,
			check(ctx) {
				const cargoContent = readFile(join(ctx.cwd, 'Cargo.toml'))

				if (!cargoContent) {
					return {
						passed: true,
						message: 'No Cargo.toml (skipped)',
						skipped: true,
					}
				}

				// Only check binary crates
				if (!isBinaryCrate(cargoContent)) {
					return {
						passed: true,
						message: 'Library crate (Cargo.lock not required)',
						skipped: true,
					}
				}

				const hasCargoLock = fileExists(join(ctx.cwd, 'Cargo.lock'))

				// Also check .gitignore doesn't ignore Cargo.lock
				const gitignore = readFile(join(ctx.cwd, '.gitignore')) ?? ''
				const ignoredCargoLock = gitignore.includes('Cargo.lock')

				if (ignoredCargoLock) {
					return {
						passed: false,
						message: 'Cargo.lock is in .gitignore (should be committed for binaries)',
						hint: 'Remove Cargo.lock from .gitignore for binary crates',
					}
				}

				return {
					passed: hasCargoLock,
					message: hasCargoLock
						? 'Cargo.lock exists (good for binary crate)'
						: 'Binary crate missing Cargo.lock',
					hint: hasCargoLock ? undefined : 'Run cargo build to generate Cargo.lock',
				}
			},
		},
	]
)
