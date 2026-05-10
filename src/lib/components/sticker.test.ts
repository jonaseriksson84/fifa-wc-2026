import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stickerSvelte = readFileSync(resolve(__dirname, 'Sticker.svelte'), 'utf-8');

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
