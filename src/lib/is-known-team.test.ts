import { describe, it, expect } from 'vitest';
import { isKnownTeam, isTBDFixture } from './is-known-team';
import { WC_TEAMS } from './wc-teams';

describe('WC_TEAMS constant', () => {
	it('contains exactly 48 qualified nations', () => {
		expect(WC_TEAMS.size).toBe(48);
	});

	it('includes multi-word team names', () => {
		expect(WC_TEAMS.has('South Korea')).toBe(true);
		expect(WC_TEAMS.has('Saudi Arabia')).toBe(true);
		expect(WC_TEAMS.has('Bosnia & Herzegovina')).toBe(true);
		expect(WC_TEAMS.has('Cape Verde Islands')).toBe(true);
	});
});

describe('isKnownTeam', () => {
	it('returns true for a known qualifier', () => {
		expect(isKnownTeam('Brazil')).toBe(true);
	});

	it('returns true for every team in the set', () => {
		for (const team of WC_TEAMS) {
			expect(isKnownTeam(team)).toBe(true);
		}
	});

	it('returns false for an api-football placeholder string', () => {
		expect(isKnownTeam('Winner Group A')).toBe(false);
		expect(isKnownTeam('Runner-up Group B')).toBe(false);
		expect(isKnownTeam('Winner R32 - Match 1')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isKnownTeam('')).toBe(false);
	});

	it('is case-sensitive — lowercase does not match', () => {
		expect(isKnownTeam('brazil')).toBe(false);
		expect(isKnownTeam('BRAZIL')).toBe(false);
	});

	it('returns false for partial matches', () => {
		expect(isKnownTeam('South')).toBe(false);
		expect(isKnownTeam('Korea')).toBe(false);
	});
});

describe('isTBDFixture', () => {
	it('is false when both teams are known qualifiers', () => {
		expect(isTBDFixture({ homeTeam: 'Brazil', awayTeam: 'France' })).toBe(false);
	});

	it('is true when only the home team is a placeholder', () => {
		expect(isTBDFixture({ homeTeam: 'Winner Group A', awayTeam: 'France' })).toBe(true);
	});

	it('is true when only the away team is a placeholder', () => {
		expect(isTBDFixture({ homeTeam: 'Brazil', awayTeam: 'Runner-up Group B' })).toBe(true);
	});

	it('is true when both teams are placeholders', () => {
		expect(
			isTBDFixture({ homeTeam: 'Winner R32 - Match 1', awayTeam: 'Winner R32 - Match 2' })
		).toBe(true);
	});
});
