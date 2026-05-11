import { getStage } from './stage';

export function fixtureIdentifier(stage: string, indexInStage: number): string {
	const info = getStage(stage);
	if (info.identifierIsSingleton) return info.identifierPrefix;
	return `${info.identifierPrefix}.${String(indexInStage + 1).padStart(2, '0')}`;
}
