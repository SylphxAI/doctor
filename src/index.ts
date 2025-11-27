// Main exports for programmatic usage

export { allChecks, checksByName, getCheck } from './checks'
export { defineConfig, loadConfig } from './config'
export { guards } from './guards'
export { getGuardsForHook, getInfoForHook, runHook } from './hooks'
export { infoMessages } from './info'
export { getPreset, getSeverity, presets } from './presets'
export { formatPreCommitReport, formatReport } from './reporter'
export { runChecks } from './runner'

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
