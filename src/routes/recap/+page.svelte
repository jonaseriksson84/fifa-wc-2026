<script lang="ts">
	import type { PageData } from './$types';
	import ScrollReveal from '$lib/components/ScrollReveal.svelte';
	import RecapTitleCard from '$lib/components/RecapTitleCard.svelte';
	import RecapRaceChart from '$lib/components/RecapRaceChart.svelte';
	import RecapHeatmap from '$lib/components/RecapHeatmap.svelte';
	import RecapAwards from '$lib/components/RecapAwards.svelte';
	import RecapHiveMind from '$lib/components/RecapHiveMind.svelte';
	import RecapWhiffed from '$lib/components/RecapWhiffed.svelte';
	import RecapFallen from '$lib/components/RecapFallen.svelte';
	import RecapCloser from '$lib/components/RecapCloser.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Recap — {data.poolName}</title>
</svelte:head>

<div class="recap-page">
	{#if !data.recap.available}
		<div class="placeholder">
			<span class="kicker">The Recap</span>
			<h1>Come back after the Final</h1>
			<p>
				The Recap unlocks the moment the Final's result is in — the whole tournament played back
				as one shared story. Nothing to spoil yet.
			</p>
		</div>
	{:else}
		<ScrollReveal>
			<RecapTitleCard
				poolName={data.poolName}
				fixtureCount={data.recap.title.fixtureCount}
				playerCount={data.recap.title.playerCount}
				firstKickoff={data.recap.title.firstKickoff}
				lastKickoff={data.recap.title.lastKickoff}
			/>
		</ScrollReveal>

		<p class="scroll-hint">Scroll on ↓</p>

		<ScrollReveal>
			<RecapRaceChart race={data.recap.race} />
		</ScrollReveal>

		<RecapHeatmap heatmap={data.recap.heatmap} />

		<RecapAwards awards={data.recap.awards} />

		<RecapHiveMind hiveMind={data.recap.hiveMind} />

		<RecapWhiffed whiffed={data.recap.whiffed} />

		<RecapFallen fallen={data.recap.fallen} />

		<RecapCloser closer={data.recap.closer} />
	{/if}
</div>

<style>
	.recap-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 48px 24px 80px;
	}

	/* Placeholder (Final not settled) */
	.placeholder {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		border-top: 4px solid var(--accent);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 44px 28px;
		text-align: center;
	}
	.placeholder .kicker {
		display: inline-block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		background: var(--ink);
		color: var(--paper);
		padding: 4px 12px;
		margin-bottom: 18px;
	}
	.placeholder h1 {
		font-family: var(--display);
		font-size: clamp(26px, 7vw, 40px);
		line-height: 1;
		margin: 0 0 16px;
	}
	.placeholder p {
		font-family: var(--body);
		font-size: 16px;
		line-height: 1.55;
		max-width: 42ch;
		margin: 0 auto;
		opacity: 0.85;
	}

	.scroll-hint {
		text-align: center;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.55;
		margin-top: 32px;
		animation: nudge 1.8s ease-in-out infinite;
	}
	@keyframes nudge {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(4px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scroll-hint {
			animation: none;
		}
	}

	@media (max-width: 640px) {
		.recap-page {
			padding: 32px 16px 60px;
		}
	}
</style>
