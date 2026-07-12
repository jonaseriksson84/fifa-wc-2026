<script lang="ts">
	// The heatmap beat: a GitHub-contribution-graph grid, one row per User (sorted
	// by final rank) and one column per Fixture (grouped by Stage, kickoff order
	// within each). Cells are correct / wrong / missing / pending. It's meant to be
	// read as texture first — the champion's greener row up top, dropouts fading to
	// grey, vertical red stripes where the whole pool whiffed — with a zoom escape
	// hatch to read individual cells on a phone.
	//
	// Mobile-first: the full 104-column grid is squeezed edge-to-edge as texture by
	// default; tapping "Zoom" swaps to a fixed larger cell size and lets the grid
	// scroll horizontally so any single cell is legible.
	import { onMount } from 'svelte';
	import type { RecapHeatmap } from '$lib/server/recap/recap';

	let { heatmap }: { heatmap: RecapHeatmap } = $props();

	const rows = $derived(heatmap.rows);
	const columns = $derived(heatmap.columns);

	let zoomed = $state(false);
	let selectedUserId = $state('');
	function selectRow(userId: string): void {
		selectedUserId = selectedUserId === userId ? '' : userId;
	}
	function handleRowKey(event: KeyboardEvent, userId: string): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			selectRow(userId);
		}
	}

	// Short, legible column-band labels (the stage prefixes like "M" / "FNL" read
	// cryptically). Falls back to the raw stage for anything unexpected.
	const stageLabels: Record<string, string> = {
		Group: 'GRP',
		R32: 'R32',
		R16: 'R16',
		QF: 'QF',
		SF: 'SF',
		'3rd-place': '3RD',
		Final: 'FIN'
	};
	function stageLabel(stage: string): string {
		return stageLabels[stage] ?? stage;
	}

	// Rows cascade in by rank on scroll; the observer just flips `revealed`, and CSS
	// staggers each row with a rank-indexed delay. Reduced motion shows them at once.
	let el = $state<HTMLElement>();
	let revealed = $state(false);
	onMount(() => {
		if (typeof IntersectionObserver === 'undefined' || !el) {
			revealed = true;
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						revealed = true;
						obs.disconnect();
					}
				}
			},
			{ threshold: 0.2 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="heat" bind:this={el} class:revealed class:zoomed data-scroll-reveal>
	<header class="beat-head">
		<span class="kicker">The Heatmap</span>
		<h2>Everyone, every fixture</h2>
		<p class="sub">
			{rows.length} players × {columns.length} fixtures — one glance at the whole tournament's shape.
		</p>
	</header>

	{#if columns.length === 0 || rows.length === 0}
		<p class="empty">Nothing to chart yet.</p>
	{:else}
		<div class="toolbar">
			<div class="legend" aria-hidden="true">
				<span class="key"><i class="cell correct"></i> Correct</span>
				<span class="key"><i class="cell wrong"></i> Wrong</span>
				<span class="key"><i class="cell missing"></i> No pick</span>
			</div>
			<button type="button" class="zoom-toggle" onclick={() => (zoomed = !zoomed)}>
				{zoomed ? 'Fit' : 'Zoom'}
			</button>
		</div>

		<div class="grid-scroll">
			<div class="grid" style="--cols: {columns.length}">
				{#if zoomed}
					<div class="numbered-line">
						<span class="row-number" aria-hidden="true">#</span>
						<div class="stage-band" style="grid-template-columns: repeat({columns.length}, var(--cell));">
							{#each heatmap.stageGroups as g (g.stage + g.startIndex)}
								<div class="stage-tag" style="grid-column: span {g.count}" title={g.stage}>
									<span>{stageLabel(g.stage)}</span>
								</div>
							{/each}
						</div>
					</div>
					{#each rows as row, r (row.userId)}
						<div
							class="numbered-line interactive"
							class:muted={selectedUserId && selectedUserId !== row.userId}
							role="button"
							tabindex="0"
							aria-label="Highlight {row.name}"
							aria-pressed={selectedUserId === row.userId}
							onclick={() => selectRow(row.userId)}
							onkeydown={(event) => handleRowKey(event, row.userId)}
						>
							<span class="row-number">{r + 1}</span>
							<div class="row" style="--r: {r}; grid-template-columns: repeat({columns.length}, var(--cell));">
								{#each row.cells as state, c (columns[c].fixtureId)}
									<i class="cell {state}" title="{row.name} · {stageLabel(columns[c].stage)} · {state}"></i>
								{/each}
							</div>
						</div>
					{/each}
				{:else}
					<!-- Fit mode deliberately keeps the original direct grid structure. -->
					<div class="stage-band" style="grid-template-columns: repeat({columns.length}, var(--cell));">
						{#each heatmap.stageGroups as g (g.stage + g.startIndex)}
							<div class="stage-tag" style="grid-column: span {g.count}" title={g.stage}>
								<span>{stageLabel(g.stage)}</span>
							</div>
						{/each}
					</div>
					{#each rows as row, r (row.userId)}
						<div class="row" class:muted={selectedUserId && selectedUserId !== row.userId} style="--r: {r}; grid-template-columns: repeat({columns.length}, var(--cell));">
							{#each row.cells as state, c (columns[c].fixtureId)}
								<i class="cell {state}" title="{row.name} · {stageLabel(columns[c].stage)} · {state}"></i>
							{/each}
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Rank/name rail read alongside the grid; kept compact so the grid owns width. -->
		<ol class="rail">
			{#each rows as row (row.userId)}
				<li class:muted={selectedUserId && selectedUserId !== row.userId} class:selected={selectedUserId === row.userId}>
					<button class="rail-select" type="button" onclick={() => selectRow(row.userId)} aria-pressed={selectedUserId === row.userId}>
						<span class="rank">{row.rank}</span>
						<span class="name">{row.name}</span>
						<span class="tally">{row.correctCount}/{row.pickCount}</span>
					</button>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.heat {
		margin-top: 64px;
	}
	.beat-head {
		text-align: center;
		margin-bottom: 18px;
	}
	.kicker {
		display: inline-block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		background: var(--ink);
		color: var(--paper);
		padding: 4px 12px;
		margin-bottom: 12px;
	}
	.beat-head h2 {
		font-family: var(--headline);
		font-size: clamp(24px, 7vw, 34px);
		letter-spacing: 0.02em;
		text-transform: uppercase;
		margin: 0 0 6px;
		color: var(--ink);
	}
	.sub {
		font-family: var(--body);
		font-size: 14px;
		opacity: 0.8;
		margin: 0;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		opacity: 0.85;
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.key .cell {
		width: 11px;
		height: 11px;
	}
	.zoom-toggle {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		color: var(--ink);
		padding: 6px 14px;
		cursor: pointer;
		box-shadow: 2px 2px 0 rgba(24, 20, 13, 0.14);
	}
	.zoom-toggle:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 rgba(24, 20, 13, 0.14);
	}

	.grid-scroll {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 10px;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	.grid {
		/* Fit mode: the grid stretches edge-to-edge as texture. Cells are sized off
		   the available width so all 104 columns show at once on a phone. */
		--cell: calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols));
		--gap: 1px;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		min-width: 100%;
	}
	.zoomed .grid {
		/* Zoom mode: fixed legible cells; the grid overflows and scrolls sideways. */
		--cell: 12px;
		--gap: 2px;
		min-width: max-content;
	}
	.numbered-line {
		display: grid;
		grid-template-columns: 18px max-content;
		align-items: stretch;
		gap: 4px;
		transition: opacity 0.18s ease;
	}
	.numbered-line.muted { opacity: 0.12; }
	.numbered-line.interactive {
		cursor: pointer;
		outline: none;
		-webkit-tap-highlight-color: transparent;
	}
	.row-number {
		display: grid;
		place-items: center;
		border: 0;
		padding: 0;
		background: transparent;
		color: var(--ink);
		font-family: var(--mono);
		font-size: 8px;
		cursor: pointer;
	}

	.stage-band {
		display: grid;
		gap: var(--gap);
		margin-bottom: 3px;
	}
	.stage-tag {
		border-bottom: 2px solid var(--ink);
		overflow: hidden;
		min-width: 0;
	}
	.stage-tag span {
		display: block;
		font-family: var(--mono);
		font-size: 8px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.7;
		white-space: nowrap;
		padding-bottom: 2px;
	}

	.row {
		display: grid;
		gap: var(--gap);
		opacity: 0;
		transform: translateX(-6px);
		transition: opacity 0.18s ease;
	}
	.revealed .row {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.55s ease,
			transform 0.55s ease;
		/* cascade rows in by rank */
		transition-delay: calc(var(--r) * 45ms);
	}
	.revealed .row.muted { opacity: 0.12; }

	.cell {
		display: block;
		aspect-ratio: 1 / 1;
		width: 100%;
		border-radius: 1px;
	}
	.cell.correct {
		background: var(--good, #3f8f4f);
	}
	.cell.wrong {
		background: var(--bad, #c2402f);
	}
	.cell.missing {
		background: rgba(24, 20, 13, 0.12);
	}
	.cell.pending {
		background: rgba(24, 20, 13, 0.04);
		border: 1px dashed rgba(24, 20, 13, 0.18);
	}

	.rail {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.rail li {
		font-family: var(--body);
		font-size: 13px;
		transition: opacity 0.18s ease, background 0.18s ease;
	}
	.rail li.muted { opacity: 0.24; }
	.rail li.selected { background: rgba(192, 57, 43, 0.08); }
	.rail-select {
		display: flex;
		align-items: baseline;
		gap: 10px;
		width: 100%;
		padding: 2px 4px;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.rail .rank {
		font-family: var(--mono);
		font-size: 11px;
		width: 2ch;
		text-align: right;
		opacity: 0.6;
	}
	.rail .name {
		font-family: var(--headline);
		letter-spacing: 0.03em;
		text-transform: uppercase;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rail .tally {
		font-family: var(--mono);
		font-size: 11px;
		opacity: 0.65;
	}

	.empty {
		text-align: center;
		font-family: var(--mono);
		font-size: 13px;
		opacity: 0.6;
	}

	@media (prefers-reduced-motion: reduce) {
		.row {
			opacity: 1;
			transform: none;
		}
		.revealed .row {
			transition: none;
			transition-delay: 0ms;
		}
	}
</style>
