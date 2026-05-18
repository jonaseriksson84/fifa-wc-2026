import type { DomainFixture } from './types';
import type { Stage } from '$lib/stage';

export interface PlaceholderRow {
	id: number;
	stage: Stage;
	kickoff: string;
	homeTeam: string;
	awayTeam: string;
}

export function matchPlaceholder(
	incoming: DomainFixture,
	existingKnockouts: PlaceholderRow[]
): PlaceholderRow | null {
	return existingKnockouts.find(
		(row) => row.stage === incoming.stage && row.kickoff === incoming.kickoff
	) ?? null;
}
