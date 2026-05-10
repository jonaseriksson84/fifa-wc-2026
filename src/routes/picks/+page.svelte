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
	<h1>My Picks</h1>

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
				<h2 class="stage-title">{stageDisplayNames[stage] ?? stage}</h2>
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
	h1 {
		font-family: var(--headline);
		font-size: 32px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 8px;
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
	.stage-title {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin: 0 0 16px;
		padding-bottom: 8px;
		border-bottom: 2px solid var(--ink);
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
		h1 {
			font-size: 26px;
		}
		.sticker-grid {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
