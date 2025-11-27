import { describe, expect, test } from 'bun:test'
import { allChecks } from '../checks'
import { getPreset, getSeverity, presets } from './index'

describe('presets', () => {
	test('has all three presets', () => {
		expect(Object.keys(presets)).toEqual(['init', 'dev', 'stable'])
	})

	test('init preset is most lenient', () => {
		const init = getPreset('init')
		// init should have more 'off' and 'warn' than 'error'
		const values = Object.values(init)
		const offCount = values.filter((v) => v === 'off').length
		expect(offCount).toBeGreaterThan(0)
	})

	test('stable preset is strictest', () => {
		const stable = getPreset('stable')
		// stable should have mostly 'error'
		const values = Object.values(stable)
		const errorCount = values.filter((v) => v === 'error').length
		expect(errorCount).toBeGreaterThan(values.length / 2)
	})

	test('dev preset is in between', () => {
		const init = getPreset('init')
		const dev = getPreset('dev')
		const stable = getPreset('stable')

		const countErrors = (p: Record<string, string>) =>
			Object.values(p).filter((v) => v === 'error').length

		expect(countErrors(dev)).toBeGreaterThan(countErrors(init))
		expect(countErrors(stable)).toBeGreaterThan(countErrors(dev))
	})
})

describe('getPreset', () => {
	test('returns init preset', () => {
		const preset = getPreset('init')
		expect(preset['files/readme']).toBe('error')
		expect(preset['test/has-tests']).toBe('off')
	})

	test('returns dev preset', () => {
		const preset = getPreset('dev')
		expect(preset['files/readme']).toBe('error')
		expect(preset['test/has-tests']).toBe('warn')
	})

	test('returns stable preset', () => {
		const preset = getPreset('stable')
		expect(preset['files/readme']).toBe('error')
		expect(preset['test/has-tests']).toBe('error')
	})
})

describe('getSeverity', () => {
	test('returns severity from preset', () => {
		expect(getSeverity('files/readme', 'init')).toBe('error')
		expect(getSeverity('test/has-tests', 'init')).toBe('off')
		expect(getSeverity('test/has-tests', 'stable')).toBe('error')
	})

	test('returns off for unknown check', () => {
		expect(getSeverity('unknown/check', 'init')).toBe('off')
	})

	test('override takes precedence', () => {
		expect(getSeverity('files/readme', 'init', { 'files/readme': 'off' })).toBe('off')
		expect(getSeverity('test/has-tests', 'init', { 'test/has-tests': 'error' })).toBe('error')
	})
})

describe('preset completeness', () => {
	test('all checks have preset entry', () => {
		const basePreset = getPreset('init')
		const presetKeys = Object.keys(basePreset)

		const missingChecks = allChecks
			.map((check) => check.name)
			.filter((name) => !presetKeys.includes(name))

		if (missingChecks.length > 0) {
			throw new Error(`Missing preset entries for: ${missingChecks.join(', ')}`)
		}

		expect(missingChecks).toEqual([])
	})

	test('no orphan preset entries', () => {
		const basePreset = getPreset('init')
		const checkNames = allChecks.map((check) => check.name)

		const orphanEntries = Object.keys(basePreset).filter((name) => !checkNames.includes(name))

		if (orphanEntries.length > 0) {
			throw new Error(`Orphan preset entries (no matching check): ${orphanEntries.join(', ')}`)
		}

		expect(orphanEntries).toEqual([])
	})
})
