function ordinal(n: number): string {
	if (n >= 11 && n <= 13) return `${n}th`;
	switch (n % 10) {
		case 1: return `${n}st`;
		case 2: return `${n}nd`;
		case 3: return `${n}rd`;
		default: return `${n}th`;
	}
}

export function formatKickoff(iso: string, timeZone?: string): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(new Date(iso));
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? '';
	return `${get('weekday')} ${get('month')} ${ordinal(Number(get('day')))} ${get('hour')}:${get('minute')}`;
}
