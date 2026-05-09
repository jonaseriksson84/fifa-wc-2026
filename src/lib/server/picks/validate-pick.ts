export type PickValue = 'HOME' | 'DRAW' | 'AWAY';

export type PickFixture = {
	id: number;
	stage: string;
	kickoff: string;
};

type ValidResult = { valid: true };
type InvalidResult = { valid: false; reason: 'fixture_locked' | 'draw_not_allowed' };
export type ValidationResult = ValidResult | InvalidResult;

const knockoutStages = new Set(['R32', 'R16', 'QF', 'SF', '3rd-place', 'Final']);

export function validatePick(
	fixture: PickFixture,
	value: PickValue,
	now: Date
): ValidationResult {
	if (now.getTime() >= new Date(fixture.kickoff).getTime()) {
		return { valid: false, reason: 'fixture_locked' };
	}

	if (value === 'DRAW' && knockoutStages.has(fixture.stage)) {
		return { valid: false, reason: 'draw_not_allowed' };
	}

	return { valid: true };
}
