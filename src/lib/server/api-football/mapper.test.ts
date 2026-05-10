import { describe, it, expect } from 'vitest';
import { parseRound, deriveResult, deriveScoreShape, mapFixture, mapResult } from './mapper';
import type { ApiFixtureResponse } from './types';

import groupHomeWin from '../../../../tests/fixtures/api-football/group-home-win.json';
import groupDraw from '../../../../tests/fixtures/api-football/group-draw.json';
import groupAwayWin from '../../../../tests/fixtures/api-football/group-away-win.json';
import knockout90min from '../../../../tests/fixtures/api-football/knockout-90min.json';
import knockoutExtraTime from '../../../../tests/fixtures/api-football/knockout-extra-time.json';
import knockoutPenalties from '../../../../tests/fixtures/api-football/knockout-penalties.json';
import notStarted from '../../../../tests/fixtures/api-football/not-started.json';

describe('parseRound', () => {
	it('maps group rounds to Group stage', () => {
		expect(parseRound('Group A - 1')).toBe('Group');
		expect(parseRound('Group F - 3')).toBe('Group');
	});

	it('maps knockout rounds to correct stages', () => {
		expect(parseRound('Round of 32')).toBe('R32');
		expect(parseRound('Round of 16')).toBe('R16');
		expect(parseRound('Quarter-finals')).toBe('QF');
		expect(parseRound('Semi-finals')).toBe('SF');
		expect(parseRound('3rd Place')).toBe('3rd-place');
		expect(parseRound('Final')).toBe('Final');
	});

	it('throws on unknown round', () => {
		expect(() => parseRound('Unknown Round')).toThrow('Unknown round');
	});
});

describe('deriveResult', () => {
	it('returns HOME for a group fixture where home team wins', () => {
		expect(deriveResult(groupHomeWin as ApiFixtureResponse)).toBe('HOME');
	});

	it('returns DRAW for a group fixture ending level', () => {
		expect(deriveResult(groupDraw as ApiFixtureResponse)).toBe('DRAW');
	});

	it('returns AWAY for a group fixture where away team wins', () => {
		expect(deriveResult(groupAwayWin as ApiFixtureResponse)).toBe('AWAY');
	});

	it('returns the advancing team for knockout decided in 90 minutes', () => {
		expect(deriveResult(knockout90min as ApiFixtureResponse)).toBe('HOME');
	});

	it('returns the advancing team for knockout decided in extra time', () => {
		const result = deriveResult(knockoutExtraTime as ApiFixtureResponse);
		expect(result).toBe('AWAY');
	});

	it('returns the advancing team for knockout decided on penalties', () => {
		const result = deriveResult(knockoutPenalties as ApiFixtureResponse);
		expect(result).toBe('HOME');
	});

	it('returns null for a fixture that has not started', () => {
		expect(deriveResult(notStarted as ApiFixtureResponse)).toBeNull();
	});
});

describe('mapFixture', () => {
	it('maps an api-football entry to a domain fixture', () => {
		const fixture = mapFixture(groupHomeWin as ApiFixtureResponse);
		expect(fixture).toEqual({
			apiFootballId: 1145510,
			homeTeam: 'Mexico',
			awayTeam: 'Canada',
			kickoff: '2026-06-11T21:00:00.000Z',
			stage: 'Group'
		});
	});

	it('maps knockout round correctly', () => {
		const fixture = mapFixture(knockoutPenalties as ApiFixtureResponse);
		expect(fixture.stage).toBe('SF');
	});

	it('maps the Final stage', () => {
		const fixture = mapFixture(notStarted as ApiFixtureResponse);
		expect(fixture.stage).toBe('Final');
	});
});

describe('deriveScoreShape', () => {
	it('returns ft-only shape for a 90-minute result', () => {
		expect(deriveScoreShape(groupHomeWin as ApiFixtureResponse)).toEqual({
			ft: [2, 1], et: null, pens: null
		});
	});

	it('returns et shape for extra-time result', () => {
		expect(deriveScoreShape(knockoutExtraTime as ApiFixtureResponse)).toEqual({
			ft: [2, 2], et: [2, 3], pens: null
		});
	});

	it('returns pens shape for penalty result', () => {
		expect(deriveScoreShape(knockoutPenalties as ApiFixtureResponse)).toEqual({
			ft: [1, 1], et: null, pens: [5, 3]
		});
	});

	it('returns null for unstarted fixture', () => {
		expect(deriveScoreShape(notStarted as ApiFixtureResponse)).toBeNull();
	});
});

describe('mapResult', () => {
	it('returns a domain result with finalScore for a finished fixture', () => {
		const result = mapResult(groupHomeWin as ApiFixtureResponse);
		expect(result).toEqual({
			apiFootballId: 1145510,
			result: 'HOME',
			finalScore: '2-1'
		});
	});

	it('returns null for an unfinished fixture', () => {
		expect(mapResult(notStarted as ApiFixtureResponse)).toBeNull();
	});

	it('correctly derives knockout penalty result with finalScore', () => {
		const result = mapResult(knockoutPenalties as ApiFixtureResponse);
		expect(result).toEqual({
			apiFootballId: 1145580,
			result: 'HOME',
			finalScore: '1-1 (5-3 pen.)'
		});
	});

	it('includes a.e.t. finalScore for extra-time result', () => {
		const result = mapResult(knockoutExtraTime as ApiFixtureResponse);
		expect(result).toEqual({
			apiFootballId: 1145570,
			result: 'AWAY',
			finalScore: '2-2 a.e.t. 2-3'
		});
	});
});
