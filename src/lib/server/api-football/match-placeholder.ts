import type { DomainFixture } from './types';

export interface PlaceholderRow {
	id: number;
	stage: string;
	kickoff: string;
	homeTeam: string;
	awayTeam: string;
}

type MatchResult = { row: PlaceholderRow } | { row: null };

export function matchPlaceholder(
	incoming: DomainFixture,
	existingKnockouts: PlaceholderRow[]
): MatchResult {
	const matched = existingKnockouts.find(
		(row) => row.stage === incoming.stage && row.kickoff === incoming.kickoff
	);
	return matched ? { row: matched } : { row: null };
}
