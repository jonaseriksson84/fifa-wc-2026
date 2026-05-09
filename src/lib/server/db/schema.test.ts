import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { fixture } from './schema';

describe('fixture schema', () => {
	it('defines the fixture table with expected columns', () => {
		const columns = Object.keys(fixture);
		expect(columns).toContain('id');
		expect(columns).toContain('homeTeam');
		expect(columns).toContain('awayTeam');
		expect(columns).toContain('kickoff');
		expect(columns).toContain('stage');
		expect(columns).toContain('result');
		expect(columns).toContain('apiFootballId');
		expect(columns).toContain('updatedAt');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(fixture)).toBe('fixture');
	});
});
