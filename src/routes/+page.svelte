<script lang="ts">
	import Sticker from '$lib/components/Sticker.svelte';
	import Standings from '$lib/components/Standings.svelte';
	import StickerTiersLegend from '$lib/components/StickerTiersLegend.svelte';
	import { fixtureIdentifier } from '$lib/fixture-identifier';
	import { getStage } from '$lib/stage';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let guest = $derived(!data.currentUserId);
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

	// Group-stage fixtures are subdivided by matchday (1, 2, 3). The album
	// metaphor: each matchday is a page within the group section.
	function groupByMatchday(fixtures: Fixture[]): [number | null, Fixture[]][] {
		const days = new Map<number | null, Fixture[]>();
		for (const f of fixtures) {
			const md = f.matchday ?? null;
			const existing = days.get(md);
			if (existing) existing.push(f);
			else days.set(md, [f]);
		}
		return Array.from(days.entries()).sort(([a], [b]) => {
			if (a === null) return 1;
			if (b === null) return -1;
			return a - b;
		});
	}

	let identifiers = $derived.by(() => {
		const map = new Map<number, string>();
		for (const [, stageFixtures] of groupByStage(data.fixtures)) {
			stageFixtures.forEach((f, i) => map.set(f.id, fixtureIdentifier(f.stage, i)));
		}
		return map;
	});

	let visibleFixtures = $derived(
		showUnpickedOnly
			? data.fixtures.filter((f) => f.currentPick === null && !isLocked(f.kickoff))
			: data.fixtures
	);

	let groupedFixtures = $derived(groupByStage(visibleFixtures));
</script>

<svelte:head>
	<title>My Picks — {data.poolName}</title>
</svelte:head>

<div class="picks-layout">
	<div class="picks-page">
		<div class="page-header">
			<span class="section-kicker">Your album · {data.totalCount} stickers</span>
			<h1 class="section-heading">My Picks</h1>
		</div>

		<div class="picks-toolbar">
			<span class="unpicked-count">
				{data.unpickedCount} of {data.pickableCount} unpicked
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
				{@const stageInfo = getStage(stage)}
				{#if stageIdx > 0}
					<div class="stage-ornament" aria-hidden="true">★ ★ ★</div>
				{/if}
				<section class="stage-section">
					<span class="section-kicker">{stageInfo.albumPageKicker}</span>
					<h2 class="section-heading">{stageInfo.displayName}</h2>
					<div class="stage-label-row">
						<span class="stage-name">{stageInfo.displayName}</span>
						<span class="stage-rule"></span>
						<span class="point-hint">{stageInfo.pointHint}</span>
					</div>
					{#if stage === 'Group'}
						{#each groupByMatchday(fixtures) as [matchday, mdFixtures], mdIdx}
							{#if mdIdx > 0}
								<div class="matchday-divider" aria-hidden="true">
									<span class="matchday-rule"></span>
									<span class="matchday-label">Matchday {matchday}</span>
									<span class="matchday-rule"></span>
								</div>
							{:else if matchday !== null}
								<div class="matchday-label-top">Matchday {matchday}</div>
							{/if}
							<div class="sticker-grid">
								{#each mdFixtures as f}
									{@const locked = isLocked(f.kickoff)}
									<Sticker
										fixture={f}
										identifier={identifiers.get(f.id) ?? ''}
										currentPick={f.currentPick}
										picksByValue={f.picksByValue}
										{locked}
										{guest}
										error={form?.fixtureId === f.id && form?.error ? form.error : null}
									/>
								{/each}
							</div>
						{/each}
					{:else}
						<div class="sticker-grid">
							{#each fixtures as f}
								{@const locked = isLocked(f.kickoff)}
								<Sticker
									fixture={f}
									identifier={identifiers.get(f.id) ?? ''}
									currentPick={f.currentPick}
									picksByValue={f.picksByValue}
									{locked}
									{guest}
									error={form?.fixtureId === f.id && form?.error ? form.error : null}
								/>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		{/if}
	</div>

	<aside class="top10-sidebar" aria-label="Top 10 standings">
		<div class="sidebar-panel">
			<span class="sidebar-overhang">TOP 10</span>
			<Standings entries={data.topLeaderboard} currentUserId={data.currentUserId} compact />
			<a class="sidebar-link" href="/leaderboard">See full leaderboard &rarr;</a>
			<StickerTiersLegend compact />
		</div>
	</aside>
</div>

<style>
	.picks-layout {
		max-width: 1200px;
		margin: 0 auto;
		padding: 32px 24px 60px;
		display: flex;
		gap: 32px;
	}
	.picks-page {
		flex: 1;
		min-width: 0;
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
	.matchday-label-top {
		font-family: var(--headline);
		font-size: 12px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--ink-mute);
		margin: 8px 0 14px;
	}
	.matchday-divider {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 28px 0 18px;
	}
	.matchday-rule {
		flex: 1;
		border-top: 1px dashed rgba(24, 20, 13, 0.4);
	}
	.matchday-label {
		font-family: var(--headline);
		font-size: 12px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--ink-mute);
		white-space: nowrap;
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

	/* Sidebar */
	.top10-sidebar {
		width: 260px;
		flex-shrink: 0;
		position: sticky;
		top: 24px;
		align-self: flex-start;
	}
	.sidebar-panel {
		background: var(--paper-deep);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 28px 16px 18px;
		position: relative;
		border-top: 4px solid var(--accent);
	}
	.sidebar-overhang {
		position: absolute;
		top: -18px;
		left: 12px;
		background: var(--accent);
		color: var(--paper);
		font-family: var(--display);
		font-size: 14px;
		padding: 3px 10px;
		letter-spacing: 0.04em;
		border: 1.5px solid var(--ink);
	}
	.sidebar-link {
		display: block;
		margin-top: 14px;
		padding-top: 12px;
		border-top: 2px solid var(--ink);
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		text-decoration: none;
	}
	.sidebar-link:hover {
		text-decoration: underline;
	}

	@media (max-width: 1023px) {
		.picks-layout {
			flex-direction: column;
		}
		.top10-sidebar {
			width: 100%;
			position: static;
		}
	}
	@media (max-width: 640px) {
		.picks-layout {
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
