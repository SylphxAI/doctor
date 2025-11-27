// Main exports for programmatic usage
export { defineConfig, loadConfig } from './config'
export { runChecks } from './runner'
export { formatReport, formatPreCommitReport } from './reporter'
export { getPreset, getSeverity, presets } from './presets'
export { allChecks, checksByName, getCheck } from './checks'
export { runHook, getGuardsForHook, getInfoForHook } from './hooks'
export { guards } from './guards'
export { infoMessages } from './info'

// Types
export type {
	Check,
	CheckContext,
	CheckReport,
	CheckResult,
	DoctorConfig,
	Guard,
	HookName,
	InfoMessage,
	PackageJson,
	PresetConfig,
	PresetName,
	Severity,
} from './types'
