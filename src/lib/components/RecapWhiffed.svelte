<script lang="ts">
	// The we-all-whiffed beat: the settled fixtures where the whole pool got it
	// wrong — nobody in the room picked the Result — collected into one collective
	// blind-spot joke rather than one beat per fixture. Computed in the seam; this
	// lists them. Reveals on scroll; reduced motion shows it flat. Degrades to a
	// quiet "clean sheet" line when the pool somehow whiffed on nothing.
	import { onMount } from 'svelte';
	import { getStage } from '$lib/stage';
	import { formatKickoffDate } from '$lib/kickoff-format';
	import type { RecapWhiffed } from '$lib/server/recap/recap';

	let { whiffed }: { whiffed: RecapWhiffed } = $props();

	function stageName(stage: string): string {
		return getStage(stage).displayName;
	}

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
			{ threshold: 0.15 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="whiffed" bind:this={el} class:revealed data-scroll-reveal>
	<header class="beat-head">
		<span class="kicker">We All Whiffed</span>
		<h2>
			{#if whiffed.count > 0}
				{whiffed.count} fixture{whiffed.count === 1 ? '' : 's'} nobody saw coming
			{:else}
				Not a single blind spot
			{/if}
		</h2>
		<p class="sub">
			{#if whiffed.count > 0}
				The whole pool got these wrong — not one correct Pick between us. A shared moment of
				shame.
			{:else}
				Somebody in the pool called every settled fixture. Impressive, frankly.
			{/if}
		</p>
	</header>

	{#if whiffed.count > 0}
		<ul class="list">
			{#each whiffed.fixtures as f, i (f.fixtureId)}
				<li class="row" style="--i: {i}">
					<span class="mark">✗</span>
					<span class="meta">
						<span class="stage">{stageName(f.stage)}</span>
						<span class="fixture">{f.homeTeam} <small>vs</small> {f.awayTeam}</span>
						<span class="date">{formatKickoffDate(f.kickoff)}</span>
					</span>
					<span class="result">{f.result}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.whiffed {
		margin-top: 64px;
	}
	.beat-head {
		text-align: center;
		margin-bottom: 22px;
	}
	.kicker {
		display: inline-block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		background: var(--danger, #c0392b);
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
		margin: 0 auto;
		max-width: 44ch;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		column-gap: 9px;
		row-gap: 8px;
		border: 2px solid var(--ink);
		border-top: 5px solid var(--danger, #c0392b);
		background: var(--paper-card);
		padding: 10px 11px 11px;
		opacity: 0;
		transform: translateY(10px);
	}
	.revealed .row {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.4s ease,
			transform 0.5s cubic-bezier(0.22, 0.9, 0.36, 1);
		transition-delay: calc(var(--i) * 70ms);
	}
	.mark {
		font-family: var(--display);
		font-size: 18px;
		color: var(--danger, #c0392b);
		line-height: 1;
	}
	.meta {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}
	.stage {
		font-family: var(--headline);
		font-size: 15px;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--ink);
	}
	.date {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		opacity: 0.6;
		margin-top: 2px;
	}
	.fixture {
		font-family: var(--body);
		font-size: 12px;
		line-height: 1.2;
		color: var(--ink);
		margin-top: 2px;
	}
	.fixture small {
		font-family: var(--mono);
		font-size: 8px;
		text-transform: uppercase;
		opacity: 0.55;
	}
	.result {
		grid-column: 1 / -1;
		justify-self: stretch;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-align: center;
		background: var(--ink);
		color: var(--paper);
		padding: 4px 8px;
		white-space: nowrap;
	}

	@media (max-width: 359px) {
		.list {
			grid-template-columns: 1fr;
		}
		.row {
			grid-template-columns: auto 1fr auto;
		}
		.result {
			grid-column: auto;
			justify-self: end;
		}
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
