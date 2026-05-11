import { isTBDFixture } from '$lib/is-known-team';
import { isLocked } from '$lib/lock-time';
import { getStage } from '$lib/stage';

export type PickValue = 'HOME' | 'DRAW' | 'AWAY';

export type PickFixture = {
	id: number;
	stage: string;
	kickoff: string;
	homeTeam: string;
	awayTeam: string;
};

type ValidResult = { valid: true };
type InvalidResult = { valid: false; reason: 'fixture_locked' | 'draw_not_allowed' | 'teams_not_known' };
export type ValidationResult = ValidResult | InvalidResult;

export function validatePick(
	fixture: PickFixture,
	value: PickValue,
	now: Date
): ValidationResult {
	if (isTBDFixture(fixture)) {
		return { valid: false, reason: 'teams_not_known' };
	}

	if (isLocked(fixture.kickoff, now)) {
		return { valid: false, reason: 'fixture_locked' };
	}

	if (value === 'DRAW' && getStage(fixture.stage).isKnockout) {
		return { valid: false, reason: 'draw_not_allowed' };
	}

	return { valid: true };
}
