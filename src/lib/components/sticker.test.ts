import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stickerSvelte = readFileSync(resolve(__dirname, 'Sticker.svelte'), 'utf-8');
const resultStampSvelte = readFileSync(resolve(__dirname, 'ResultStamp.svelte'), 'utf-8');

describe('Sticker flag rendering', () => {
	it('imports flagEmoji from team-flag module', () => {
		expect(stickerSvelte).toContain("from '$lib/team-flag'");
	});

	it('renders flagEmoji for home team', () => {
		expect(stickerSvelte).toContain('flagEmoji(fixture.homeTeam)');
	});

	it('renders flagEmoji for away team', () => {
		expect(stickerSvelte).toContain('flagEmoji(fixture.awayTeam)');
	});

	it('has team-flag CSS class', () => {
		expect(stickerSvelte).toContain('.team-flag');
	});

	it('renders chip flag for others-picks', () => {
		expect(stickerSvelte).toContain('chip-flag');
	});
});

describe('Sticker final score display', () => {
	it('renders finalScore on filled stickers', () => {
		expect(stickerSvelte).toContain('fixture.finalScore');
	});

	it('has final-score CSS class', () => {
		expect(stickerSvelte).toContain('.final-score');
	});

	it('accepts finalScore in fixture prop type', () => {
		expect(stickerSvelte).toContain('finalScore: string | null');
	});
});

describe('ResultStamp hard-coded colours', () => {
	it('uses --correct CSS variable set to #2d6a4f', () => {
		expect(resultStampSvelte).toContain('--correct: #2d6a4f');
	});

	it('uses --wrong CSS variable set to #c1121f', () => {
		expect(resultStampSvelte).toContain('--wrong: #c1121f');
	});

	it('does not use --accent for result colouring', () => {
		expect(resultStampSvelte).not.toContain('var(--accent)');
	});

	it('does not use --green for result colouring', () => {
		expect(resultStampSvelte).not.toContain('var(--green)');
	});
});

describe('Sticker foil class names', () => {
	it('derives foil class from tier using foil- prefix', () => {
		expect(stickerSvelte).toContain('`foil-${tier}`');
	});

	it('has CSS rules for foil-pearl', () => {
		expect(stickerSvelte).toContain('.sticker.foil-pearl');
	});

	it('has CSS rules for foil-holo', () => {
		expect(stickerSvelte).toContain('.sticker.foil-holo');
	});

	it('has CSS rules for foil-gold', () => {
		expect(stickerSvelte).toContain('.sticker.foil-gold');
	});

	it('has CSS rules for foil-legendary', () => {
		expect(stickerSvelte).toContain('.sticker.foil-legendary');
	});

	it('does not use numbered foil classes', () => {
		expect(stickerSvelte).not.toContain('foil-1');
		expect(stickerSvelte).not.toContain('foil-2');
		expect(stickerSvelte).not.toContain('foil-3');
		expect(stickerSvelte).not.toContain('foil-final');
	});

	it('preserves foil background on filled stickers', () => {
		expect(stickerSvelte).toContain('.sticker.filled.foil-pearl');
		expect(stickerSvelte).toContain('.sticker.filled.foil-holo');
		expect(stickerSvelte).toContain('.sticker.filled.foil-gold');
		expect(stickerSvelte).toContain('.sticker.filled.foil-legendary');
	});

	it('gates legendary shine animation on prefers-reduced-motion', () => {
		expect(stickerSvelte).toContain('prefers-reduced-motion: reduce');
		expect(stickerSvelte).toContain('animation: none');
	});
});
