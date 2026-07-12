<script lang="ts">
	// The closer beat: the champion's name in gold/legendary foil, a "see you in
	// 2030" sign-off, and the coin-flip baseline as the optional one-liner. Ties
	// share the crown. Computed in the seam; this renders it and shimmers the foil
	// in on scroll. Reduced motion drops the sheen and the rise.
	import { onMount } from 'svelte';
	import type { RecapCloser } from '$lib/server/recap/recap';

	let { closer }: { closer: RecapCloser } = $props();

	function championLine(c: RecapCloser): string {
		const names = c.champions.map((w) => w.name);
		if (names.length <= 1) return names[0] ?? '—';
		if (names.length === 2) return `${names[0]} & ${names[1]}`;
		return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
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
			{ threshold: 0.35 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="closer" bind:this={el} class:revealed data-scroll-reveal>
	<div class="crown-card foil-legendary">
		<span class="kicker">{closer.tied ? 'Co-Champions' : 'Champion'}</span>
		<p class="crown">👑</p>
		<h2 class="name">{championLine(closer)}</h2>
		{#if closer.champions.length > 0}
			<p class="tag">Winner, FIFA World Cup 2026 pool</p>
		{:else}
			<p class="tag">A title still up for grabs</p>
		{/if}
	</div>

	{#if closer.coinFlipPoints > 0}
		<p class="baseline">
			A coin-flipping monkey would have scored about {closer.coinFlipPoints} points. You all did
			better than that. Probably.
		</p>
	{/if}

	<p class="signoff">See you in 2030.</p>
</section>

<style>
	.closer {
		margin-top: 72px;
		text-align: center;
		opacity: 0;
		transform: translateY(18px);
	}
	.closer.revealed {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.85s ease,
			transform 0.9s cubic-bezier(0.22, 0.9, 0.36, 1);
	}

	.crown-card {
		position: relative;
		overflow: hidden;
		border: 4px solid var(--ink);
		padding: 32px 24px 28px;
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			6px 6px 0 var(--ink);
	}
	.kicker {
		display: inline-block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		background: var(--ink);
		color: #ffd166;
		padding: 4px 12px;
	}
	.crown {
		font-size: 44px;
		line-height: 1;
		margin: 14px 0 0;
	}
	.name {
		position: relative;
		z-index: 1;
		font-family: var(--display);
		font-size: clamp(34px, 12vw, 60px);
		line-height: 0.95;
		margin: 6px 0 0;
		color: var(--ink);
	}
	.tag {
		position: relative;
		z-index: 1;
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.85;
		margin: 12px 0 0;
		color: var(--ink);
	}

	/* Legendary foil sheen — mirrors the sticker-album / awards language. */
	.foil-legendary {
		background: conic-gradient(
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

	.baseline {
		font-family: var(--body);
		font-size: 14px;
		line-height: 1.55;
		opacity: 0.8;
		margin: 24px auto 0;
		max-width: 42ch;
	}
	.signoff {
		font-family: var(--display);
		font-size: clamp(22px, 7vw, 32px);
		margin: 32px 0 0;
		color: var(--ink);
	}

	@media (prefers-reduced-motion: reduce) {
		.closer {
			opacity: 1;
			transform: none;
			transition: none;
		}
		.foil-legendary::before {
			animation: none;
		}
	}
</style>
