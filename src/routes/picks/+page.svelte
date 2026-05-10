<script lang="ts">
	import Sticker from '$lib/components/Sticker.svelte';
	import { fixtureIdentifier } from '$lib/fixture-identifier';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showUnpickedOnly = $state(false);

	type Fixture = (typeof data.fixtures)[number];

	function isLocked(kickoff: string): boolean {
		return new Date() >= new Date(kickoff);
	}

	function groupByStage(fixtures: Fixture[]): [string, Fixture[]][] {
		const groups = new Map<string, Fixture[]>();
		for (const f of fixtures) {
			const existing = groups.get(f.stage);
			if (existing) {
				existing.push(f);
			} else {
				groups.set(f.stage, [f]);
			}
		}
		return Array.from(groups.entries());
	}

	const stageDisplayNames: Record<string, string> = {
		Group: 'Group Stage',
		R32: 'Round of 32',
		R16: 'Round of 16',
		QF: 'Quarter-finals',
		SF: 'Semi-finals',
		'3rd-place': 'Third-place Playoff',
		Final: 'The Final'
	};

	const stagePointHints: Record<string, string> = {
		Group: 'paper · 1 pt each',
		R32: 'pearl · 2 pts each',
		R16: 'pearl · 2 pts each',
		QF: 'holo · 2 pts each',
		SF: 'holo · 2 pts each',
		'3rd-place': 'gold · 3 pts',
		Final: 'legendary · 5 pts'
	};

	const stageKickers: Record<string, string> = {
		Group: 'Round one · Album page 01',
		R32: 'Round two · Album page 02',
		R16: 'Round three · Album page 03',
		QF: 'Round four · Album page 04',
		SF: 'Round five · Album page 05',
		'3rd-place': 'The decider · Album page 06',
		Final: 'The final · Album page 07'
	};

	let identifiers = $derived.by(() => {
		const map = new Map<number, string>();
		for (const [, stageFixtures] of groupByStage(data.fixtures)) {
			stageFixtures.forEach((f, i) => map.set(f.id, fixtureIdentifier(f.stage, i)));
		}
		return map;
	});

	let visibleFixtures = $derived(
		showUnpickedOnly ? data.fixtures.filter((f) => f.currentPick === null) : data.fixtures
	);

	let groupedFixtures = $derived(groupByStage(visibleFixtures));
</script>

<svelte:head>
	<title>My Picks — {data.poolName}</title>
</svelte:head>

<div class="picks-page">
	<div class="page-header">
		<span class="section-kicker">Your album · {data.totalCount} stickers</span>
		<h1 class="section-heading">My Picks</h1>
	</div>

	<div class="picks-toolbar">
		<span class="unpicked-count">
			{data.unpickedCount} of {data.totalCount} unpicked
		</span>
		<label class="filter-toggle">
			<input type="checkbox" bind:checked={showUnpickedOnly} />
			Show unpicked only
		</label>
	</div>

	{#if data.fixtures.length === 0}
		<p class="empty-msg">No fixtures available yet.</p>
	{:else}
		{#each groupedFixtures as [stage, fixtures], stageIdx}
			{#if stageIdx > 0}
				<div class="stage-ornament" aria-hidden="true">★ ★ ★</div>
			{/if}
			<section class="stage-section">
				<span class="section-kicker">{stageKickers[stage] ?? ''}</span>
				<h2 class="section-heading">{stageDisplayNames[stage] ?? stage}</h2>
				<div class="stage-label-row">
					<span class="stage-name">{stageDisplayNames[stage] ?? stage}</span>
					<span class="stage-rule"></span>
					<span class="point-hint">{stagePointHints[stage] ?? ''}</span>
				</div>
				<div class="sticker-grid">
					{#each fixtures as f}
						{@const locked = isLocked(f.kickoff)}
						<Sticker
							fixture={f}
							identifier={identifiers.get(f.id) ?? ''}
							currentPick={f.currentPick}
							picksByValue={f.picksByValue}
							{locked}
							error={form?.fixtureId === f.id && form?.error ? form.error : null}
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	.picks-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 32px 24px 60px;
	}
	.page-header {
		margin-bottom: 8px;
	}
	.section-kicker {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--red);
		display: block;
		margin-bottom: 4px;
	}
	.section-heading {
		font-family: var(--display);
		font-size: 28px;
		margin: 0 0 4px;
		line-height: 1.1;
	}
	.picks-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 28px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.05em;
	}
	.unpicked-count {
		color: var(--ink-mute);
	}
	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
		color: var(--ink-mute);
	}
	.filter-toggle input {
		accent-color: var(--accent);
	}
	.stage-ornament {
		text-align: center;
		font-family: var(--display);
		font-size: 16px;
		color: var(--accent);
		letter-spacing: 0.4em;
		margin: 36px 0;
		opacity: 0.7;
	}
	.stage-section {
		margin-bottom: 8px;
	}
	.stage-label-row {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 18px;
	}
	.stage-name {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.stage-rule {
		flex: 1;
		height: 0;
		border-top: 2px dashed var(--ink);
		opacity: 0.4;
	}
	.point-hint {
		font-family: var(--mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--ink);
		opacity: 0.7;
		white-space: nowrap;
	}
	.sticker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 24px;
	}
	.empty-msg {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--ink-mute);
	}

	@media (max-width: 640px) {
		.picks-page {
			padding: 20px 16px 40px;
		}
		.section-heading {
			font-size: 22px;
		}
		.stage-label-row {
			gap: 10px;
		}
		.sticker-grid {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
