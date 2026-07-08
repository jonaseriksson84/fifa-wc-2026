<script lang="ts">
	// The race chart beat: an animated cumulative-points line chart, one line per
	// User across every settled fixture in kickoff order. It draws left-to-right
	// as it scrolls into view and lands on the final standings — the top three
	// lighting up as the podium reveal. This beat doubles as the champion reveal.
	//
	// Mobile-first: a full pool (14 lines) stays legible because everyone but the
	// podium is drawn faint and thin, while the top three are thick and coloured.
	import { onMount } from 'svelte';
	import type { RecapRace } from '$lib/server/recap/recap';

	let { race }: { race: RecapRace } = $props();

	// SVG user-space geometry. The chart scales to its container via viewBox.
	const W = 340;
	const H = 190;
	const padL = 8;
	const padR = 64; // room for the podium end-labels
	const padT = 12;
	const padB = 10;
	const plotW = W - padL - padR;
	const plotH = H - padT - padB;

	const n = $derived(race.steps.length);
	const ymax = $derived(Math.max(race.maxPoints, 1));

	// x runs over n+1 points: index 0 is the shared origin (everyone on zero
	// before the first fixture), then one point per settled fixture.
	function x(i: number): number {
		return n <= 0 ? padL : padL + (i / n) * plotW;
	}
	function y(pts: number): number {
		return padT + plotH - (pts / ymax) * plotH;
	}

	function pointsFor(cumulative: number[]): string {
		const pts = [`${x(0)},${y(0)}`];
		for (let i = 0; i < cumulative.length; i++) pts.push(`${x(i + 1)},${y(cumulative[i])}`);
		return pts.join(' ');
	}

	// Podium colours keyed by final rank; ties on a rank share the colour.
	const podiumColor: Record<number, string> = { 1: 'var(--gold)', 2: '#8f8676', 3: '#b3712f' };
	const medal: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

	// Non-podium lines render first (underneath, faint); the podium renders last so
	// the top three sit on top and read as the reveal.
	const backLines = $derived(race.series.filter((s) => !s.isPodium));
	const podium = $derived(race.series.filter((s) => s.isPodium));
	const champions = $derived(race.series.filter((s) => s.rank === 1));

	function endY(s: { cumulative: number[] }): number {
		return s.cumulative.length > 0 ? y(s.cumulative[s.cumulative.length - 1]) : y(0);
	}

	let el = $state<HTMLElement>();
	let drawn = $state(false);
	onMount(() => {
		if (typeof IntersectionObserver === 'undefined' || !el) {
			drawn = true;
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						drawn = true;
						obs.disconnect();
					}
				}
			},
			{ threshold: 0.3 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="race" bind:this={el} class:drawn>
	<header class="beat-head">
		<span class="kicker">The Race</span>
		<h2>Every point, every day</h2>
		<p class="sub">Cumulative points across all {n} settled fixtures — first to the podium wins.</p>
	</header>

	{#if n === 0}
		<p class="empty">No settled fixtures to chart yet.</p>
	{:else}
		<div class="chart-frame">
			<svg
				viewBox="0 0 {W} {H}"
				preserveAspectRatio="none"
				role="img"
				aria-label="Cumulative points per player over the tournament"
			>
				<!-- baseline -->
				<line class="axis" x1={x(0)} y1={y(0)} x2={x(n)} y2={y(0)} />

				{#each backLines as s (s.userId)}
					<polyline class="line back" pathLength="1" points={pointsFor(s.cumulative)} />
				{/each}

				{#each podium as s (s.userId)}
					<polyline
						class="line podium"
						pathLength="1"
						points={pointsFor(s.cumulative)}
						style="stroke: {podiumColor[Math.min(s.rank, 3)]}"
					/>
				{/each}

				{#each podium as s (s.userId)}
					<circle class="end-dot" cx={x(n)} cy={endY(s)} r="3" style="fill: {podiumColor[Math.min(s.rank, 3)]}" />
					<text class="end-label" x={x(n) + 6} y={endY(s)} dominant-baseline="middle">{s.name}</text>
				{/each}
			</svg>
		</div>

		<ol class="podium-list">
			{#each podium as s (s.userId)}
				<li class="podium-row" style="--medal-color: {podiumColor[Math.min(s.rank, 3)]}">
					<span class="medal">{medal[Math.min(s.rank, 3)]}</span>
					<span class="name">{s.name}{s.tied ? ' (tied)' : ''}</span>
					<span class="pts">{s.finalPoints}<small> pts</small></span>
				</li>
			{/each}
		</ol>

		<div class="champ">
			{#if champions.length > 1}
				<strong>Co-champions:</strong> {champions.map((c) => c.name).join(' & ')}
			{:else if champions.length === 1}
				<strong>Champion:</strong> {champions[0].name}
			{/if}
		</div>

		{#if race.leadSegments.length > 0}
			<div class="leads">
				<span class="leads-head">
					{#if race.leadChanges === 0}
						Wire to wire — the lead never changed hands.
					{:else}
						{race.leadChanges}
						{race.leadChanges === 1 ? 'lead change' : 'lead changes'} along the way.
					{/if}
				</span>
				<ul>
					{#each race.leadSegments as seg (seg.fromKickoff + seg.userId)}
						<li>
							<span class="lead-name">{seg.name}</span> led for
							<strong>{seg.days}</strong>
							{seg.days === 1 ? 'day' : 'days'}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</section>

<style>
	.race {
		margin-top: 56px;
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

	.chart-frame {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 12px 10px;
	}
	svg {
		display: block;
		width: 100%;
		height: 190px;
		overflow: visible;
	}

	.axis {
		stroke: var(--ink);
		stroke-width: 1;
		opacity: 0.25;
		vector-effect: non-scaling-stroke;
	}

	.line {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
		/* draw-on animation: hide the stroke, then run it in left-to-right */
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
	}
	.line.back {
		stroke: var(--ink);
		stroke-width: 1.25;
		opacity: 0.22;
	}
	.line.podium {
		stroke-width: 2.75;
		opacity: 0.95;
		filter: drop-shadow(0 1px 0 rgba(24, 20, 13, 0.25));
	}
	.drawn .line {
		stroke-dashoffset: 0;
		transition: stroke-dashoffset 1.7s cubic-bezier(0.5, 0, 0.2, 1);
	}

	.end-dot {
		opacity: 0;
	}
	.end-label {
		font-family: var(--mono);
		font-size: 9px;
		fill: var(--ink);
		opacity: 0;
	}
	.drawn .end-dot,
	.drawn .end-label {
		opacity: 1;
		transition: opacity 0.5s ease 1.6s;
	}

	.podium-list {
		list-style: none;
		margin: 20px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.podium-row {
		display: flex;
		align-items: baseline;
		gap: 12px;
		border: 1.5px solid var(--ink);
		border-left: 5px solid var(--medal-color);
		background: var(--paper-card);
		padding: 10px 14px;
	}
	.medal {
		font-size: 20px;
		line-height: 1;
	}
	.podium-row .name {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		flex: 1;
		color: var(--ink);
	}
	.podium-row .pts {
		font-family: var(--display);
		font-size: 20px;
		color: var(--ink);
	}
	.podium-row .pts small {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
	}

	.champ {
		text-align: center;
		font-family: var(--body);
		font-size: 16px;
		margin-top: 16px;
	}
	.champ strong {
		font-family: var(--headline);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.leads {
		margin-top: 22px;
		border-top: 1.5px dashed var(--ink);
		padding-top: 14px;
	}
	.leads-head {
		display: block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.75;
		margin-bottom: 8px;
	}
	.leads ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.leads li {
		font-family: var(--body);
		font-size: 15px;
	}
	.lead-name {
		font-family: var(--headline);
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}
	.leads strong {
		font-family: var(--display);
		font-size: 15px;
	}

	.empty {
		text-align: center;
		font-family: var(--mono);
		font-size: 13px;
		opacity: 0.6;
	}

	@media (prefers-reduced-motion: reduce) {
		.line {
			stroke-dashoffset: 0;
		}
		.drawn .line {
			transition: none;
		}
		.end-dot,
		.end-label,
		.drawn .end-dot,
		.drawn .end-label {
			opacity: 1;
			transition: none;
		}
	}
</style>
