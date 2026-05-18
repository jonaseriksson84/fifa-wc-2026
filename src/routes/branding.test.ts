import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

const appHtml = readFileSync(resolve(root, 'src/app.html'), 'utf-8');
const wranglerToml = readFileSync(resolve(root, 'wrangler.toml'), 'utf-8');
const appDts = readFileSync(resolve(root, 'src/app.d.ts'), 'utf-8');
const layoutServerTs = readFileSync(resolve(__dirname, '+layout.server.ts'), 'utf-8');
const layoutSvelte = readFileSync(resolve(__dirname, '+layout.svelte'), 'utf-8');
const authTs = readFileSync(resolve(root, 'src/lib/server/auth.ts'), 'utf-8');

const svelteFiles = [
	{ name: '+layout.svelte', content: layoutSvelte },
	{
		name: '+page.svelte',
		content: readFileSync(resolve(__dirname, '+page.svelte'), 'utf-8')
	},
	{
		name: 'leaderboard/+page.svelte',
		content: readFileSync(resolve(__dirname, 'leaderboard/+page.svelte'), 'utf-8')
	},
	{
		name: 'faq/+page.svelte',
		content: readFileSync(resolve(__dirname, 'faq/+page.svelte'), 'utf-8')
	}
];

describe('per-deployment branding: wrangler.toml', () => {
	it('defines POOL_NAME in env.friends.vars', () => {
		const friendsIdx = wranglerToml.indexOf('[env.friends');
		const workIdx = wranglerToml.indexOf('[env.work');
		const poolNameIdx = wranglerToml.indexOf('POOL_NAME', friendsIdx);
		expect(poolNameIdx).toBeGreaterThan(friendsIdx);
		expect(poolNameIdx).toBeLessThan(workIdx);
	});

	it('defines POOL_ACCENT_HEX in env.friends.vars', () => {
		const friendsIdx = wranglerToml.indexOf('[env.friends');
		const workIdx = wranglerToml.indexOf('[env.work');
		const accentIdx = wranglerToml.indexOf('POOL_ACCENT_HEX', friendsIdx);
		expect(accentIdx).toBeGreaterThan(friendsIdx);
		expect(accentIdx).toBeLessThan(workIdx);
	});

	it('defines POOL_NAME in env.work.vars', () => {
		const workIdx = wranglerToml.indexOf('[env.work');
		const poolNameIdx = wranglerToml.indexOf('POOL_NAME', workIdx);
		expect(poolNameIdx).toBeGreaterThan(workIdx);
	});

	it('defines POOL_ACCENT_HEX in env.work.vars', () => {
		const workIdx = wranglerToml.indexOf('[env.work');
		const accentIdx = wranglerToml.indexOf('POOL_ACCENT_HEX', workIdx);
		expect(accentIdx).toBeGreaterThan(workIdx);
	});

	it('uses operator-chosen values from issue #2', () => {
		expect(wranglerToml).toContain('WC26 Jobbiga Bets');
		expect(wranglerToml).toContain('#0369A1');
		expect(wranglerToml).toContain('WC26 Office Picks');
		expect(wranglerToml).toContain('#0284C7');
	});
});

describe('per-deployment branding: types', () => {
	it('declares POOL_NAME in App.Platform.env', () => {
		expect(appDts).toContain('POOL_NAME');
	});

	it('declares POOL_ACCENT_HEX in App.Platform.env', () => {
		expect(appDts).toContain('POOL_ACCENT_HEX');
	});
});

describe('per-deployment branding: server-side', () => {
	it('layout server exposes poolName from env', () => {
		expect(layoutServerTs).toContain('poolName');
		expect(layoutServerTs).toContain('POOL_NAME');
	});

	it('layout server exposes poolAccentHex from env', () => {
		expect(layoutServerTs).toContain('poolAccentHex');
		expect(layoutServerTs).toContain('POOL_ACCENT_HEX');
	});

	it('auth email subject uses pool name from env, not hardcoded', () => {
		expect(authTs).toContain('POOL_NAME');
		expect(authTs).not.toContain("'Sign in to WC 2026'");
	});
});

describe('per-deployment branding: UI', () => {
	it('layout header renders pool name from data', () => {
		expect(layoutSvelte).toContain('data.poolName');
	});

	it('layout sets --accent CSS variable from data', () => {
		expect(layoutSvelte).toContain('--accent');
		expect(layoutSvelte).toContain('poolAccentHex');
	});

	it('no hardcoded deployment-specific pool name in any svelte file', () => {
		for (const { name, content } of svelteFiles) {
			expect(content, `${name} contains hardcoded "WC 2026"`).not.toContain('WC 2026');
		}
	});

	it('accent elements use var(--accent) instead of hardcoded color', () => {
		expect(layoutSvelte).toContain('var(--accent)');
	});
});

describe('favicon', () => {
	it('favicon.svg exists in static/', () => {
		expect(existsSync(resolve(root, 'static/favicon.svg'))).toBe(true);
	});

	it('favicon.png exists in static/', () => {
		expect(existsSync(resolve(root, 'static/favicon.png'))).toBe(true);
	});

	it('apple-touch-icon.png exists in static/', () => {
		expect(existsSync(resolve(root, 'static/apple-touch-icon.png'))).toBe(true);
	});

	it('app.html references favicon.svg', () => {
		expect(appHtml).toContain('favicon.svg');
	});

	it('app.html references favicon.png', () => {
		expect(appHtml).toContain('favicon.png');
	});

	it('app.html references apple-touch-icon', () => {
		expect(appHtml).toContain('apple-touch-icon');
	});

	it('favicon.svg is a valid SVG', () => {
		const svg = readFileSync(resolve(root, 'static/favicon.svg'), 'utf-8');
		expect(svg).toContain('<svg');
		expect(svg).toContain('</svg>');
	});

	it('favicon.png is a valid PNG (magic bytes)', () => {
		const buf = readFileSync(resolve(root, 'static/favicon.png'));
		expect(buf[0]).toBe(0x89);
		expect(buf[1]).toBe(0x50); // P
		expect(buf[2]).toBe(0x4e); // N
		expect(buf[3]).toBe(0x47); // G
	});
});
