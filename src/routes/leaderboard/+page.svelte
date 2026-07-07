<script lang="ts">
	import type { PageData } from './$types';
	import Standings from '$lib/components/Standings.svelte';
	import StickerTiersLegend from '$lib/components/StickerTiersLegend.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Leaderboard — {data.poolName}</title>
</svelte:head>

<div class="leaderboard-page">
	{#if data.recapAvailable}
		<a href="/recap" class="recap-banner">
			<span class="recap-shine"></span>
			<span class="recap-kicker">New</span>
			<span class="recap-copy">
				<strong>The Recap is live</strong>
				<span>The whole tournament, played back</span>
			</span>
			<span class="recap-go">Open →</span>
		</a>
	{/if}

	<div class="panel">
		<span class="overhang">STANDINGS</span>

		<Standings entries={data.leaderboard} currentUserId={data.currentUserId} />

		<StickerTiersLegend />
	</div>

	{#if data.currentUserId}
		<h2 class="results-heading">Results &amp; My Picks</h2>

		{#if data.fixturesWithResults.length === 0}
			<p class="empty">No results yet.</p>
		{:else}
			<ul class="results-list">
				{#each data.fixturesWithResults as f}
					<li class="result-card">
						<div class="result-top">
							<div>
								<span class="matchup">{f.homeTeam} vs {f.awayTeam}</span>
								<span class="stage-badge">{f.stage}</span>
							</div>
							<span class="result-value">Result: {f.result}</span>
						</div>

						{#if f.myPick}
							<div class="my-pick">
								<span>User pick: {f.myPick}</span>
								{#if f.correct === true}
									<span class="verdict correct">Correct</span>
								{:else if f.correct === false}
									<span class="verdict wrong">Wrong</span>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.leaderboard-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 40px 24px 60px;
	}

	/* Recap discovery banner (only rendered when the Recap is available) */
	.recap-banner {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 28px;
		padding: 16px 18px;
		border: 3px solid var(--ink);
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			6px 6px 0 var(--ink);
		text-decoration: none;
		color: var(--ink);
		background:
			conic-gradient(
				from 45deg,
				rgba(255, 209, 102, 0.55),
				rgba(239, 71, 111, 0.5),
				rgba(179, 136, 255, 0.55),
				rgba(6, 214, 160, 0.5),
				rgba(255, 247, 154, 0.5),
				rgba(255, 209, 102, 0.55)
			);
		background-color: var(--paper-empty);
		transition: transform 0.15s ease;
	}
	.recap-banner:hover {
		transform: translate(-1px, -1px);
	}
	.recap-shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			60deg,
			transparent 35%,
			rgba(255, 255, 255, 0.6) 50%,
			transparent 65%
		);
		background-size: 250% 250%;
		animation: recap-shine 3.5s ease-in-out infinite;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
	@keyframes recap-shine {
		0% {
			background-position: 100% 100%;
		}
		50% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 100% 100%;
		}
	}
	.recap-kicker {
		flex-shrink: 0;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		background: var(--ink);
		color: var(--paper);
		padding: 4px 8px;
	}
	.recap-copy {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.recap-copy strong {
		font-family: var(--headline);
		font-size: 17px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.recap-copy span {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		opacity: 0.8;
	}
	.recap-go {
		margin-left: auto;
		flex-shrink: 0;
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	@media (prefers-reduced-motion: reduce) {
		.recap-shine {
			animation: none;
		}
	}

	/* Panel */
	.panel {
		background: var(--paper-deep);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 28px 22px 26px;
		position: relative;
		border-top: 4px solid var(--accent);
	}

	/* Overhang tab */
	.overhang {
		position: absolute;
		top: -18px;
		left: 16px;
		background: var(--accent);
		color: var(--paper);
		font-family: var(--display);
		font-size: 18px;
		padding: 4px 14px;
		letter-spacing: 0.04em;
		border: 1.5px solid var(--ink);
	}

	/* Results section */
	.results-heading {
		font-family: var(--headline);
		font-size: 20px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 40px 0 16px;
	}
	.results-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.result-card {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		padding: 14px 16px;
		box-shadow: 2px 2px 0 rgba(24, 20, 13, 0.08);
	}
	.result-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.matchup {
		font-family: var(--headline);
		font-size: 16px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.stage-badge {
		display: inline-block;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px solid var(--ink);
		padding: 1px 6px;
		margin-left: 8px;
		opacity: 0.7;
	}
	.result-value {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.06em;
		background: var(--paper-deep);
		border: 1px solid var(--ink);
		padding: 3px 8px;
		white-space: nowrap;
	}
	.my-pick {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
	}
	.verdict {
		margin-left: 8px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 11px;
		padding: 2px 6px;
	}
	.verdict.correct {
		background: var(--green);
		color: var(--paper);
	}
	.verdict.wrong {
		background: var(--red);
		color: var(--paper);
	}

	.empty {
		font-family: var(--mono);
		font-size: 13px;
		opacity: 0.6;
		letter-spacing: 0.06em;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.leaderboard-page {
			padding: 30px 16px 40px;
		}
		.panel {
			padding: 24px 16px 22px;
		}
	}
</style>
