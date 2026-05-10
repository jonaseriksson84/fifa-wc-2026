export type FoilTier = 'paper' | 'pearl' | 'holo' | 'gold' | 'legendary';

const tierMap: Record<string, FoilTier> = {
	Group: 'paper',
	R32: 'pearl',
	R16: 'pearl',
	QF: 'holo',
	SF: 'holo',
	'3rd-place': 'gold',
	Final: 'legendary'
};

export function foilTier(stage: string): FoilTier {
	const tier = tierMap[stage];
	if (!tier) throw new Error(`Unknown stage: ${stage}`);
	return tier;
}
