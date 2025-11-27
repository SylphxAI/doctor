import { describe, expect, test } from 'bun:test'
import { getNextPreset } from './runner'

describe('getNextPreset', () => {
	test('init -> dev', () => {
		expect(getNextPreset('init')).toBe('dev')
	})

	test('dev -> stable', () => {
		expect(getNextPreset('dev')).toBe('stable')
	})

	test('stable -> null (no next)', () => {
		expect(getNextPreset('stable')).toBeNull()
	})
})
