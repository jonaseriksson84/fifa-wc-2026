import { WC_TEAMS } from './wc-teams';

export function isKnownTeam(team: string): boolean {
	return WC_TEAMS.has(team);
}
