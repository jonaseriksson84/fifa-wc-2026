import { displayName } from './display-name';
import { isLocked } from './lock-time';

export type PicksByValue = {
	HOME: string[];
	DRAW: string[];
	AWAY: string[];
	noPick: string[];
};

type RevealPick = { fixtureId: number; userId: string; value: string };
type RevealUser = {
	id: string;
	name: string | null;
	email: string;
	displayName: string | null;
};

export type PickReveal = (fixtureId: number, kickoff: string, now: Date) => PicksByValue | null;

export function pickRevealIndex(allPicks: RevealPick[], allUsers: RevealUser[]): PickReveal {
	const userById = new Map(allUsers.map((u) => [u.id, u]));
	const picksByFixtureId = new Map<number, RevealPick[]>();
	for (const p of allPicks) {
		const existing = picksByFixtureId.get(p.fixtureId);
		if (existing) existing.push(p);
		else picksByFixtureId.set(p.fixtureId, [p]);
	}

	return (fixtureId, kickoff, now) => {
		if (!isLocked(kickoff, now)) return null;

		const buckets: PicksByValue = { HOME: [], DRAW: [], AWAY: [], noPick: [] };
		const pickedUserIds = new Set<string>();

		for (const p of picksByFixtureId.get(fixtureId) ?? []) {
			const u = userById.get(p.userId);
			if (!u) continue;
			const bucket = buckets[p.value as keyof PicksByValue];
			if (bucket) bucket.push(displayName(u));
			pickedUserIds.add(p.userId);
		}

		for (const u of allUsers) {
			if (!pickedUserIds.has(u.id)) {
				buckets.noPick.push(displayName(u));
			}
		}

		return buckets;
	};
}
