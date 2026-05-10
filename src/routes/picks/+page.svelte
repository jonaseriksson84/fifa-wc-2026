<script lang="ts">
	import Sticker from '$lib/components/Sticker.svelte';
	import { fixtureIdentifier } from '$lib/fixture-identifier';
	import { displayName } from '$lib/display-name';
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

<div class="picks-layout">
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

	<aside class="top10-sidebar" aria-label="Top 10 standings">
		<div class="sidebar-panel">
			<span class="sidebar-overhang">TOP 10</span>
			{#if data.topLeaderboard.length === 0}
				<p class="sidebar-empty">No standings yet.</p>
			{:else}
				<table class="sidebar-table">
					<tbody>
						{#each data.topLeaderboard as entry}
							{@const isYou = entry.userId === data.currentUserId}
							<tr class:you={isYou}>
								<td class="sidebar-rank-cell">
									<span class="sidebar-rank">{entry.rank}</span>
									{#if entry.tied}<span class="sidebar-tied">=</span>{/if}
								</td>
								<td class="sidebar-who-cell">
									<span class="sidebar-who">{displayName(entry)}</span>
								</td>
								<td class="sidebar-pts-cell">
									<span class="sidebar-pts">{entry.points}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			<a class="sidebar-link" href="/leaderboard">See full leaderboard &rarr;</a>
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
	.sidebar-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 4px;
	}
	.sidebar-table tr {
		border-bottom: 1px dashed rgba(24, 20, 13, 0.3);
	}
	.sidebar-table tr:last-child {
		border-bottom: none;
	}
	.sidebar-table tr.you {
		background: rgba(199, 147, 33, 0.18);
		box-shadow: -16px 0 0 rgba(199, 147, 33, 0.18), 16px 0 0 rgba(199, 147, 33, 0.18);
	}
	.sidebar-table td {
		padding: 7px 0;
		vertical-align: baseline;
	}
	.sidebar-rank-cell {
		width: 30px;
	}
	.sidebar-rank {
		font-family: var(--display);
		font-size: 18px;
		color: var(--ink);
	}
	.sidebar-tied {
		font-family: var(--mono);
		font-size: 10px;
		margin-left: 1px;
		opacity: 0.6;
	}
	.sidebar-who-cell {
		max-width: 0;
		overflow: hidden;
	}
	.sidebar-who {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.03em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}
	.sidebar-pts-cell {
		text-align: right;
	}
	.sidebar-pts {
		font-family: var(--display);
		font-size: 16px;
		color: var(--accent);
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
	.sidebar-empty {
		font-family: var(--mono);
		font-size: 12px;
		opacity: 0.6;
		letter-spacing: 0.06em;
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
