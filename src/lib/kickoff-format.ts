const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

function ordinal(n: number): string {
	if (n >= 11 && n <= 13) return `${n}th`;
	switch (n % 10) {
		case 1: return `${n}st`;
		case 2: return `${n}nd`;
		case 3: return `${n}rd`;
		default: return `${n}th`;
	}
}

export function formatKickoff(iso: string): string {
	const d = new Date(iso);
	const weekday = WEEKDAYS[d.getUTCDay()];
	const month = MONTHS[d.getUTCMonth()];
	const day = ordinal(d.getUTCDate());
	const hh = String(d.getUTCHours()).padStart(2, '0');
	const mm = String(d.getUTCMinutes()).padStart(2, '0');
	return `${weekday} ${month} ${day} ${hh}:${mm}`;
}
