// Main exports for programmatic usage
export { defineConfig, loadConfig } from './config'
export { runChecks } from './runner'
export { formatReport, formatPreCommitReport } from './reporter'
export { getPreset, getSeverity, presets } from './presets'
export { allChecks, checksByName, getCheck } from './checks'

// Types
export type {
	Check,
	CheckContext,
	CheckReport,
	CheckResult,
	CheckStage,
	DoctorConfig,
	PackageJson,
	PresetConfig,
	PresetName,
	Severity,
} from './types'
