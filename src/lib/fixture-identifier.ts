const prefixes: Record<string, string> = {
	Group: 'M',
	R32: 'R32',
	R16: 'R16',
	QF: 'QF',
	SF: 'SF'
};

const singletons: Record<string, string> = {
	'3rd-place': '3PP',
	Final: 'FNL'
};

export function fixtureIdentifier(stage: string, indexInStage: number): string {
	const singleton = singletons[stage];
	if (singleton) return singleton;

	const prefix = prefixes[stage];
	if (prefix) return `${prefix}.${String(indexInStage + 1).padStart(2, '0')}`;

	return `${stage}.${String(indexInStage + 1).padStart(2, '0')}`;
}
