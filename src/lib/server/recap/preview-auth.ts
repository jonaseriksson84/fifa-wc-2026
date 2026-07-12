export const RECAP_PREVIEW_COOKIE = 'recap_preview_access';

const COOKIE_MESSAGE = 'fifa-wc-2026:recap-preview:v1';

function bytes(value: string): ArrayBuffer {
	return new TextEncoder().encode(value).buffer as ArrayBuffer;
}

function base64Url(value: ArrayBuffer): string {
	let binary = '';
	for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function digest(value: string): Promise<ArrayBuffer> {
	return crypto.subtle.digest('SHA-256', bytes(value));
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
	const [a, b] = await Promise.all([digest(left), digest(right)]);
	const aa = new Uint8Array(a);
	const bb = new Uint8Array(b);
	let difference = aa.length ^ bb.length;
	for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
		difference |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
	}
	return difference === 0;
}

export async function previewCookieValue(secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		bytes(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return base64Url(await crypto.subtle.sign('HMAC', key, bytes(COOKIE_MESSAGE)));
}

export async function hasPreviewAccess(cookie: string | undefined, secret: string): Promise<boolean> {
	if (!cookie) return false;
	return constantTimeEqual(cookie, await previewCookieValue(secret));
}

export async function passwordMatches(candidate: string, secret: string): Promise<boolean> {
	return constantTimeEqual(candidate, secret);
}
