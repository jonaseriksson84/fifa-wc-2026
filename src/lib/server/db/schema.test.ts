import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { fixture, user, session, account, pick, verification } from './schema';

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

describe('user schema', () => {
	it('defines the user table with expected columns', () => {
		const columns = Object.keys(user);
		expect(columns).toContain('id');
		expect(columns).toContain('name');
		expect(columns).toContain('email');
		expect(columns).toContain('emailVerified');
		expect(columns).toContain('image');
		expect(columns).toContain('createdAt');
		expect(columns).toContain('updatedAt');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(user)).toBe('user');
	});
});

describe('session schema', () => {
	it('defines the session table with expected columns', () => {
		const columns = Object.keys(session);
		expect(columns).toContain('id');
		expect(columns).toContain('expiresAt');
		expect(columns).toContain('token');
		expect(columns).toContain('createdAt');
		expect(columns).toContain('updatedAt');
		expect(columns).toContain('ipAddress');
		expect(columns).toContain('userAgent');
		expect(columns).toContain('userId');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(session)).toBe('session');
	});
});

describe('account schema', () => {
	it('defines the account table with expected columns', () => {
		const columns = Object.keys(account);
		expect(columns).toContain('id');
		expect(columns).toContain('accountId');
		expect(columns).toContain('providerId');
		expect(columns).toContain('userId');
		expect(columns).toContain('accessToken');
		expect(columns).toContain('refreshToken');
		expect(columns).toContain('idToken');
		expect(columns).toContain('accessTokenExpiresAt');
		expect(columns).toContain('refreshTokenExpiresAt');
		expect(columns).toContain('scope');
		expect(columns).toContain('password');
		expect(columns).toContain('createdAt');
		expect(columns).toContain('updatedAt');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(account)).toBe('account');
	});
});

describe('pick schema', () => {
	it('defines the pick table with expected columns', () => {
		const columns = Object.keys(pick);
		expect(columns).toContain('id');
		expect(columns).toContain('userId');
		expect(columns).toContain('fixtureId');
		expect(columns).toContain('value');
		expect(columns).toContain('updatedAt');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(pick)).toBe('pick');
	});
});

describe('verification schema', () => {
	it('defines the verification table with expected columns', () => {
		const columns = Object.keys(verification);
		expect(columns).toContain('id');
		expect(columns).toContain('identifier');
		expect(columns).toContain('value');
		expect(columns).toContain('expiresAt');
		expect(columns).toContain('createdAt');
		expect(columns).toContain('updatedAt');
	});

	it('maps to the correct SQL table name', () => {
		expect(getTableName(verification)).toBe('verification');
	});
});
