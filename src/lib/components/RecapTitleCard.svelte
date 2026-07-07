<script lang="ts">
	// The Recap's opening beat: a foil title card that sets the tone before the
	// data hits — tournament name, dates, and the "N fixtures · N players" line.
	// Legendary-foil language matching the sticker tiers (the pool's grand finale).
	import { formatKickoff } from '$lib/kickoff-format';

	let {
		poolName,
		fixtureCount,
		playerCount,
		firstKickoff,
		lastKickoff
	}: {
		poolName: string;
		fixtureCount: number;
		playerCount: number;
		firstKickoff: string | null;
		lastKickoff: string | null;
	} = $props();

	// Just the "Weekday Month Nth" part of the kickoff, dropping the clock time.
	function asDate(iso: string): string {
		return formatKickoff(iso).replace(/\s+\d{2}:\d{2}$/, '');
	}

	let dateSpan = $derived(
		firstKickoff && lastKickoff ? `${asDate(firstKickoff)} — ${asDate(lastKickoff)}` : null
	);
</script>

<div class="title-card foil-legendary">
	<span class="kicker">The Recap</span>
	<h1 class="tournament">FIFA World Cup 2026</h1>
	<p class="pool">{poolName}</p>
	{#if dateSpan}
		<p class="dates">{dateSpan}</p>
	{/if}
	<div class="stat-line">
		<span class="stat"><strong>{fixtureCount}</strong> fixtures</span>
		<span class="sep">·</span>
		<span class="stat"><strong>{playerCount}</strong> players</span>
	</div>
</div>

<style>
	.title-card {
		position: relative;
		overflow: hidden;
		text-align: center;
		padding: 48px 28px 44px;
		border: 4px solid var(--ink);
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			8px 8px 0 var(--ink);
	}
	.foil-legendary {
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
	}
	.foil-legendary::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			60deg,
			transparent 35%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 65%
		);
		background-size: 250% 250%;
		animation: shine 4.5s ease-in-out infinite;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
	@keyframes shine {
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

	.kicker {
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
	.tournament {
		font-family: var(--display);
		font-size: clamp(30px, 9vw, 52px);
		line-height: 0.95;
		margin: 0 0 4px;
		color: var(--ink);
	}
	.pool {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin: 6px 0 0;
		color: var(--ink);
	}
	.dates {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		margin: 14px 0 0;
		opacity: 0.8;
	}
	.stat-line {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 12px;
		margin-top: 22px;
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.stat strong {
		font-family: var(--display);
		font-size: 26px;
		color: var(--ink);
	}
	.sep {
		opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.foil-legendary::before {
			animation: none;
		}
	}
</style>
