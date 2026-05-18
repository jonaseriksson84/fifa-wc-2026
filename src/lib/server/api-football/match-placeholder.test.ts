import { describe, it, expect } from 'vitest';
import { matchPlaceholder, type PlaceholderRow } from './match-placeholder';
import type { DomainFixture } from './types';

const incomingR32: DomainFixture = {
	apiFootballId: 99001,
	homeTeam: 'Brazil',
	awayTeam: 'South Korea',
	kickoff: '2026-06-28T19:00:00.000Z',
	stage: 'R32',
	matchday: null
};

const placeholderR32: PlaceholderRow = {
	id: 73,
	stage: 'R32',
	kickoff: '2026-06-28T19:00:00.000Z',
	homeTeam: 'Winner A',
	awayTeam: 'Runner-up B'
};

describe('matchPlaceholder', () => {
	it('returns the placeholder row on exact (stage, kickoff) match', () => {
		const result = matchPlaceholder(incomingR32, [placeholderR32]);
		expect(result).toEqual({ row: placeholderR32 });
	});

	it('returns null when stage differs but kickoff matches', () => {
		const wrongStage: PlaceholderRow = { ...placeholderR32, stage: 'R16' };
		const result = matchPlaceholder(incomingR32, [wrongStage]);
		expect(result).toEqual({ row: null });
	});

	it('returns null when kickoff differs but stage matches', () => {
		const wrongKickoff: PlaceholderRow = {
			...placeholderR32,
			kickoff: '2026-06-28T22:00:00.000Z'
		};
		const result = matchPlaceholder(incomingR32, [wrongKickoff]);
		expect(result).toEqual({ row: null });
	});

	it('disambiguates multiple candidates at the same kickoff but different stage', () => {
		const r16SameKickoff: PlaceholderRow = {
			id: 89,
			stage: 'R16',
			kickoff: '2026-06-28T19:00:00.000Z',
			homeTeam: 'Winner R32.01',
			awayTeam: 'Winner R32.02'
		};
		const result = matchPlaceholder(incomingR32, [r16SameKickoff, placeholderR32]);
		expect(result).toEqual({ row: placeholderR32 });
	});

	it('returns null when no placeholders exist', () => {
		const result = matchPlaceholder(incomingR32, []);
		expect(result).toEqual({ row: null });
	});

	it('uses string-equality for kickoff — differently-formatted ISO strings do NOT match', () => {
		const noMillis: DomainFixture = {
			...incomingR32,
			kickoff: '2026-06-28T19:00:00Z'
		};
		const result = matchPlaceholder(noMillis, [placeholderR32]);
		expect(result).toEqual({ row: null });
	});
});
