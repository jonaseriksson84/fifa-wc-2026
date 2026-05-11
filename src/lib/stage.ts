export type Stage = 'Group' | 'R32' | 'R16' | 'QF' | 'SF' | '3rd-place' | 'Final';

export type FoilTier = 'paper' | 'pearl' | 'holo' | 'gold' | 'legendary';

export type StageInfo = {
	name: Stage;
	weight: number;
	isKnockout: boolean;
	sortIndex: number;
	foilTier: FoilTier;
	identifierPrefix: string;
	identifierIsSingleton: boolean;
	displayName: string;
	pointHint: string;
	albumPageKicker: string;
};

export const STAGES: Record<Stage, StageInfo> = {
	Group: {
		name: 'Group',
		weight: 1,
		isKnockout: false,
		sortIndex: 0,
		foilTier: 'paper',
		identifierPrefix: 'M',
		identifierIsSingleton: false,
		displayName: 'Group Stage',
		pointHint: 'paper · 1 pt each',
		albumPageKicker: 'Round one · Album page 01'
	},
	R32: {
		name: 'R32',
		weight: 2,
		isKnockout: true,
		sortIndex: 1,
		foilTier: 'pearl',
		identifierPrefix: 'R32',
		identifierIsSingleton: false,
		displayName: 'Round of 32',
		pointHint: 'pearl · 2 pts each',
		albumPageKicker: 'Round two · Album page 02'
	},
	R16: {
		name: 'R16',
		weight: 2,
		isKnockout: true,
		sortIndex: 2,
		foilTier: 'pearl',
		identifierPrefix: 'R16',
		identifierIsSingleton: false,
		displayName: 'Round of 16',
		pointHint: 'pearl · 2 pts each',
		albumPageKicker: 'Round three · Album page 03'
	},
	QF: {
		name: 'QF',
		weight: 3,
		isKnockout: true,
		sortIndex: 3,
		foilTier: 'holo',
		identifierPrefix: 'QF',
		identifierIsSingleton: false,
		displayName: 'Quarter-finals',
		pointHint: 'holo · 3 pts each',
		albumPageKicker: 'Round four · Album page 04'
	},
	SF: {
		name: 'SF',
		weight: 3,
		isKnockout: true,
		sortIndex: 4,
		foilTier: 'holo',
		identifierPrefix: 'SF',
		identifierIsSingleton: false,
		displayName: 'Semi-finals',
		pointHint: 'holo · 3 pts each',
		albumPageKicker: 'Round five · Album page 05'
	},
	'3rd-place': {
		name: '3rd-place',
		weight: 4,
		isKnockout: true,
		sortIndex: 5,
		foilTier: 'gold',
		identifierPrefix: '3PP',
		identifierIsSingleton: true,
		displayName: 'Third-place Playoff',
		pointHint: 'gold · 4 pts',
		albumPageKicker: 'The decider · Album page 06'
	},
	Final: {
		name: 'Final',
		weight: 6,
		isKnockout: true,
		sortIndex: 6,
		foilTier: 'legendary',
		identifierPrefix: 'FNL',
		identifierIsSingleton: true,
		displayName: 'The Final',
		pointHint: 'legendary · 6 pts',
		albumPageKicker: 'The final · Album page 07'
	}
};

export function getStage(stage: string): StageInfo {
	const info = STAGES[stage as Stage];
	if (!info) throw new Error(`Unknown stage: ${stage}`);
	return info;
}
