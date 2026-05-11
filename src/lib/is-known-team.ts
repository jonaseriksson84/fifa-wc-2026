import { WC_TEAMS } from './wc-teams';

export function isKnownTeam(team: string): boolean {
	return WC_TEAMS.has(team);
}

export function isTBDFixture(fixture: { homeTeam: string; awayTeam: string }): boolean {
	return !isKnownTeam(fixture.homeTeam) || !isKnownTeam(fixture.awayTeam);
}
