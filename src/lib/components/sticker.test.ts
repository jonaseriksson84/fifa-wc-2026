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
	it('passes finalScore to ResultStamp', () => {
		expect(stickerSvelte).toContain('finalScore={fixture.finalScore}');
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

describe('Chip correct/wrong tinting', () => {
	it('adds correct class to chip when pick value matches fixture result', () => {
		expect(stickerSvelte).toMatch(/class:correct=\{.*isFilled.*===.*fixture\.result/);
	});

	it('adds wrong class to chip when pick value does not match fixture result', () => {
		expect(stickerSvelte).toMatch(/class:wrong=\{.*isFilled.*!==.*fixture\.result/);
	});

	it('has CSS rule for .chip.correct with green-tinted background', () => {
		expect(stickerSvelte).toContain('.chip.correct');
	});

	it('has CSS rule for .chip.wrong with red-tinted background', () => {
		expect(stickerSvelte).toContain('.chip.wrong');
	});

	it('uses rgba for chip tinting backgrounds', () => {
		const correctMatch = stickerSvelte.match(/\.chip\.correct[^}]*background:\s*rgba\([^)]+\)/s);
		const wrongMatch = stickerSvelte.match(/\.chip\.wrong[^}]*background:\s*rgba\([^)]+\)/s);
		expect(correctMatch).not.toBeNull();
		expect(wrongMatch).not.toBeNull();
	});
});

describe('Sticker kickoff format', () => {
	it('imports formatKickoff from kickoff-format module', () => {
		expect(stickerSvelte).toContain("from '$lib/kickoff-format'");
	});

	it('uses formatKickoff for kickoff display', () => {
		expect(stickerSvelte).toContain('formatKickoff(');
	});
});

describe('Sticker TBD layout for unknown teams', () => {
	it('imports isKnownTeam from is-known-team module', () => {
		expect(stickerSvelte).toContain("from '$lib/is-known-team'");
	});

	it('derives a isTbd flag from isKnownTeam checks', () => {
		expect(stickerSvelte).toMatch(/isTbd/);
	});

	it('renders a .sticker-tbd block for TBD stickers', () => {
		expect(stickerSvelte).toContain('.sticker-tbd');
	});

	it('shows "TBD" headline text in the TBD block', () => {
		expect(stickerSvelte).toContain('TBD');
	});

	it('says "Teams to be decided" not "Bracket not drawn yet"', () => {
		expect(stickerSvelte).toContain('Teams to be decided');
		expect(stickerSvelte).not.toContain('Bracket not drawn yet');
	});

	it('shows bracket slot hint caption in the TBD block', () => {
		expect(stickerSvelte).toContain('slot-hint');
	});

	it('pick-row is inside the else branch of the isTbd conditional', () => {
		const tbdIdx = stickerSvelte.indexOf('{#if isTbd}');
		const elseIdx = stickerSvelte.indexOf('{:else}', tbdIdx);
		const pickRowIdx = stickerSvelte.indexOf('pick-row', elseIdx);
		expect(tbdIdx).toBeGreaterThan(-1);
		expect(elseIdx).toBeGreaterThan(tbdIdx);
		expect(pickRowIdx).toBeGreaterThan(elseIdx);
	});

	it('matchup is inside the else branch of the isTbd conditional', () => {
		const tbdIdx = stickerSvelte.indexOf('{#if isTbd}');
		const elseIdx = stickerSvelte.indexOf('{:else}', tbdIdx);
		const matchupIdx = stickerSvelte.indexOf('class="matchup"', elseIdx);
		expect(matchupIdx).toBeGreaterThan(elseIdx);
	});

	it('preserves foil class on article regardless of TBD state', () => {
		expect(stickerSvelte).toContain('{foilClass}');
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

	it('uses the same foil treatment before and after settlement', () => {
		expect(stickerSvelte).not.toMatch(/\.sticker\.filled\.foil-(pearl|holo|gold|legendary)/);
	});

	it('gates legendary shine animation on prefers-reduced-motion', () => {
		expect(stickerSvelte).toContain('prefers-reduced-motion: reduce');
		expect(stickerSvelte).toContain('animation: none');
	});
});
