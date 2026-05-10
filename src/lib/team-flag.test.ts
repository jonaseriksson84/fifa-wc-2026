import { describe, it, expect } from 'vitest';
import { flagEmoji } from './team-flag';

describe('flagEmoji', () => {
	it('returns US flag for USA', () => {
		expect(flagEmoji('USA')).toBe('🇺🇸');
	});

	it('returns Mexican flag for Mexico', () => {
		expect(flagEmoji('Mexico')).toBe('🇲🇽');
	});

	it('returns Canadian flag for Canada', () => {
		expect(flagEmoji('Canada')).toBe('🇨🇦');
	});

	it('returns Brazilian flag for Brazil', () => {
		expect(flagEmoji('Brazil')).toBe('🇧🇷');
	});

	it('returns Argentine flag for Argentina', () => {
		expect(flagEmoji('Argentina')).toBe('🇦🇷');
	});

	it('returns French flag for France', () => {
		expect(flagEmoji('France')).toBe('🇫🇷');
	});

	it('returns German flag for Germany', () => {
		expect(flagEmoji('Germany')).toBe('🇩🇪');
	});

	it('returns England regional flag', () => {
		expect(flagEmoji('England')).toBe('🏴󠁧󠁢󠁥󠁮󠁧󠁿');
	});

	it('returns Wales regional flag', () => {
		expect(flagEmoji('Wales')).toBe('🏴󠁧󠁢󠁷󠁬󠁳󠁿');
	});

	it('returns Japanese flag for Japan', () => {
		expect(flagEmoji('Japan')).toBe('🇯🇵');
	});

	it('returns empty string for unknown team', () => {
		expect(flagEmoji('Unknown')).toBe('');
	});

	it('returns empty string for empty string', () => {
		expect(flagEmoji('')).toBe('');
	});
});
