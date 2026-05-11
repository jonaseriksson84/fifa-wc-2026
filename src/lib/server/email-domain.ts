export function parseAllowedDomains(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map((d) => d.trim().toLowerCase())
		.filter((d) => d.length > 0);
}

export function isEmailAllowed(email: string, allowedDomains: string[]): boolean {
	if (allowedDomains.length === 0) return true;
	const at = email.lastIndexOf('@');
	if (at === -1) return false;
	const domain = email.slice(at + 1).toLowerCase();
	return allowedDomains.includes(domain);
}
