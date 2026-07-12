<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import ScrollReveal from '$lib/components/ScrollReveal.svelte';
	import RecapTitleCard from '$lib/components/RecapTitleCard.svelte';
	import RecapRaceChart from '$lib/components/RecapRaceChart.svelte';
	import RecapHeatmap from '$lib/components/RecapHeatmap.svelte';
	import RecapAwards from '$lib/components/RecapAwards.svelte';
	import RecapHiveMind from '$lib/components/RecapHiveMind.svelte';
	import RecapWhiffed from '$lib/components/RecapWhiffed.svelte';
	import RecapFallen from '$lib/components/RecapFallen.svelte';
	import RecapCloser from '$lib/components/RecapCloser.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Recap preview — {data.poolName}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !data.authorized || !data.recap}
	<div class="preview-lock">
		<div class="lock-card">
			<span class="kicker">Private preview</span>
			<div class="seal" aria-hidden="true">26</div>
			<h1>Recap under wraps</h1>
			<p>Enter the shared password for an early look.</p>

			{#if form?.error}<p class="error">{form.error}</p>{/if}

			<form method="POST">
				<label for="password">Preview password</label>
				<input id="password" name="password" type="password" autocomplete="current-password" required />
				<button type="submit">Open the Recap</button>
			</form>
		</div>
	</div>
{:else}
	<div class="recap-page">
		<p class="preview-ribbon">Private preview · current tournament data</p>

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
		<ScrollReveal><RecapRaceChart race={data.recap.race} /></ScrollReveal>
		<RecapHeatmap heatmap={data.recap.heatmap} />
		<RecapAwards awards={data.recap.awards} />
		<RecapHiveMind hiveMind={data.recap.hiveMind} />
		<RecapWhiffed whiffed={data.recap.whiffed} />
		<RecapFallen fallen={data.recap.fallen} />
		<RecapCloser closer={data.recap.closer} />
	</div>
{/if}

<style>
	.preview-lock {
		max-width: 430px;
		margin: 56px auto 80px;
		padding: 0 20px;
	}
	.lock-card {
		position: relative;
		border: 3px solid var(--ink);
		border-top: 7px solid var(--accent);
		background: var(--paper-card);
		box-shadow: 7px 7px 0 var(--ink);
		padding: 34px 28px 30px;
		text-align: center;
	}
	.kicker,
	.preview-ribbon {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}
	.kicker {
		display: inline-block;
		background: var(--ink);
		color: var(--paper);
		padding: 5px 10px;
	}
	.seal {
		width: 68px;
		height: 68px;
		display: grid;
		place-items: center;
		margin: 24px auto 20px;
		border: 3px solid var(--ink);
		background: var(--accent);
		box-shadow: 4px 4px 0 var(--ink);
		transform: rotate(-3deg);
		font-family: var(--display);
		font-size: 28px;
		color: var(--paper);
	}
	h1 {
		font-family: var(--display);
		font-size: clamp(30px, 9vw, 42px);
		line-height: 0.95;
		margin: 0 0 10px;
	}
	.lock-card > p {
		font-family: var(--body);
		margin: 0 0 22px;
	}
	.error {
		color: var(--danger, #c0392b);
		font-weight: 700;
	}
	form {
		text-align: left;
	}
	label {
		display: block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 6px;
	}
	input {
		box-sizing: border-box;
		width: 100%;
		border: 2px solid var(--ink);
		background: var(--paper);
		color: var(--ink);
		font-family: var(--body);
		font-size: 18px;
		padding: 11px 12px;
		outline: none;
	}
	input:focus {
		box-shadow: 3px 3px 0 var(--accent);
	}
	button {
		width: 100%;
		margin-top: 12px;
		border: 2px solid var(--ink);
		background: var(--ink);
		color: var(--paper);
		padding: 11px 16px;
		font-family: var(--headline);
		font-size: 15px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
	}
	button:hover,
	button:focus-visible {
		background: var(--accent);
		color: var(--ink);
	}

	.recap-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 28px 24px 80px;
	}
	@media (min-width: 760px) {
		.recap-page { max-width: 900px; }
	}
	.preview-ribbon {
		width: fit-content;
		margin: 0 auto 28px;
		border: 1.5px solid var(--ink);
		background: var(--accent);
		color: var(--ink);
		padding: 6px 10px;
		box-shadow: 2px 2px 0 var(--ink);
	}
	.scroll-hint {
		text-align: center;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.55;
		margin-top: 32px;
	}
	@media (max-width: 640px) {
		.recap-page {
			padding: 24px 16px 60px;
		}
	}
</style>
