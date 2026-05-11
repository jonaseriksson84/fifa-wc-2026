import { describe, it, expect } from 'vitest';
import { isEmailAllowed, parseAllowedDomains } from './email-domain';

describe('parseAllowedDomains', () => {
	it('returns empty array for undefined', () => {
		expect(parseAllowedDomains(undefined)).toEqual([]);
	});

	it('returns empty array for empty string', () => {
		expect(parseAllowedDomains('')).toEqual([]);
	});

	it('splits comma-separated values and lowercases', () => {
		expect(parseAllowedDomains('Embark-Studios.com, example.org')).toEqual([
			'embark-studios.com',
			'example.org'
		]);
	});

	it('drops empty entries from trailing commas', () => {
		expect(parseAllowedDomains('embark-studios.com,,')).toEqual(['embark-studios.com']);
	});
});

describe('isEmailAllowed', () => {
	it('allows any email when allowedDomains is empty', () => {
		expect(isEmailAllowed('anyone@anywhere.com', [])).toBe(true);
	});

	it('allows an email whose domain matches', () => {
		expect(isEmailAllowed('jonas@embark-studios.com', ['embark-studios.com'])).toBe(true);
	});

	it('rejects an email whose domain does not match', () => {
		expect(isEmailAllowed('jonas@gmail.com', ['embark-studios.com'])).toBe(false);
	});

	it('is case-insensitive on the domain', () => {
		expect(isEmailAllowed('Jonas@EMBARK-STUDIOS.com', ['embark-studios.com'])).toBe(true);
	});

	it('matches against the part after the last @', () => {
		expect(isEmailAllowed('weird@thing@embark-studios.com', ['embark-studios.com'])).toBe(true);
	});

	it('rejects malformed emails with no @', () => {
		expect(isEmailAllowed('not-an-email', ['embark-studios.com'])).toBe(false);
	});

	it('supports multiple allowed domains', () => {
		expect(isEmailAllowed('a@one.com', ['one.com', 'two.com'])).toBe(true);
		expect(isEmailAllowed('b@two.com', ['one.com', 'two.com'])).toBe(true);
		expect(isEmailAllowed('c@three.com', ['one.com', 'two.com'])).toBe(false);
	});
});
