import { describe, it, expect } from 'vitest';
import { displayName } from './display-name';

describe('displayName', () => {
	it('returns displayName when set', () => {
		expect(displayName({ displayName: 'Jonas', name: 'Jonas E', email: 'jonas@example.com' })).toBe('Jonas');
	});

	it('falls back to name when displayName is null', () => {
		expect(displayName({ displayName: null, name: 'Jonas E', email: 'jonas@example.com' })).toBe('Jonas E');
	});

	it('falls back to email local part when both displayName and name are absent', () => {
		expect(displayName({ displayName: null, name: '', email: 'jonas@example.com' })).toBe('jonas');
	});

	it('falls back to email local part when name is null', () => {
		expect(displayName({ displayName: null, name: null, email: 'bob.smith@company.co.uk' })).toBe('bob.smith');
	});

	it('strips +tag from email local part in fallback', () => {
		expect(displayName({ displayName: null, name: null, email: 'alice+pool1@gmail.com' })).toBe('alice');
	});

	it('prefers displayName over name and email', () => {
		expect(displayName({ displayName: 'DN', name: 'Full Name', email: 'user@test.com' })).toBe('DN');
	});

	it('handles email with multiple @ signs gracefully', () => {
		expect(displayName({ displayName: null, name: null, email: 'weird@name@example.com' })).toBe('weird');
	});

	it('handles empty displayName string as unset', () => {
		expect(displayName({ displayName: '', name: 'Fallback', email: 'x@y.com' })).toBe('Fallback');
	});
});
