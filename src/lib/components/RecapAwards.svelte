<script lang="ts">
	// The awards beat: seven foil trading cards, each flipping and shimmering in as
	// it scrolls into view. The card language leans on the existing sticker tiers
	// (paper / pearl / holo / gold / legendary) so the finale feels like the rest of
	// the album — a foil sheen sweeps across every card, brightest on the legendary
	// Oracle. Each card carries the award name, the winner(s), one number, and one
	// snarky subtitle; everything is computed in the seam, this just renders it.
	//
	// Mobile-first: cards stack one per row on a phone and the shimmer keeps working
	// at that width. Reduced motion drops the flip and the sweep and shows the cards
	// flat. Awards with no qualifying winner are omitted upstream, so we render
	// whatever the seam hands us — an empty list degrades to a quiet note.
	import { onMount } from 'svelte';
	import type { RecapAward } from '$lib/server/recap/recap';

	let { awards }: { awards: RecapAward[] } = $props();

	// A little glyph per award to sit in the corner tag — flavour, not meaning.
	const glyphs: Record<string, string> = {
		oracle: '🔮',
		sheep: '🐑',
		contrarian: '🎭',
		'draw-whisperer': '🤝',
		'deadline-demon': '⏱',
		'lone-genius': '💡',
		ghost: '👻'
	};
	function glyph(key: string): string {
		return glyphs[key] ?? '★';
	}

	// Join tied winners for display ("Anna & Ben"); the seam already flags `tied`.
	function winnerLine(award: RecapAward): string {
		const names = award.winners.map((w) => w.name);
		if (names.length <= 1) return names[0] ?? '—';
		if (names.length === 2) return `${names[0]} & ${names[1]}`;
		return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
	}

	// Cards flip/shimmer in one by one on scroll; the observer flips `revealed` and
	// CSS staggers each card with an index-based delay. Reduced motion shows them at
	// once (handled in the stylesheet).
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
			{ threshold: 0.1 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="awards" bind:this={el} class:revealed data-scroll-reveal>
	<header class="beat-head">
		<span class="kicker">The Awards</span>
		<h2>Seven foil crowns</h2>
		<p class="sub">The season's honours — pinned, stamped, and handed out.</p>
	</header>

	{#if awards.length === 0}
		<p class="empty">No awards to hand out yet.</p>
	{:else}
		<div class="cards">
			{#each awards as award, i (award.key)}
				<article
					class="card foil-{award.tier}"
					style="--i: {i}"
					aria-label="{award.title} — {winnerLine(award)} — {award.stat}"
				>
					<span class="corner">{glyph(award.key)} AWARD</span>
					<h3 class="title">{award.title}</h3>
					<p class="stat">{award.stat}</p>
					<p class="winner">
						{winnerLine(award)}
						{#if award.tied}<span class="tie-note">tied</span>{/if}
					</p>
					<p class="subtitle">{award.subtitle}</p>
					<p class="description">{award.description}</p>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.awards {
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

	.cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}
	@media (min-width: 480px) {
		.cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.card {
		position: relative;
		/* Let the award tab break the card edge like the album's pick stickers. */
		overflow: visible;
		border: 3px solid var(--ink);
		box-shadow: 4px 4px 0 var(--ink);
		padding: 20px 18px 18px;
		text-align: center;
		background-color: var(--paper-empty);
		/* Flip-in start state; the reveal below animates to flat. */
		opacity: 0;
		transform: perspective(700px) rotateY(28deg) translateY(10px);
		transform-origin: center;
	}
	.revealed .card {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.5s ease,
			transform 0.6s cubic-bezier(0.22, 0.9, 0.36, 1);
		/* Cards flip in one by one. */
		transition-delay: calc(var(--i) * 120ms);
	}

	/* Foil sheen: a diagonal highlight sweeps across every card. Its timing is
	   staggered per card so the row shimmers in sequence, brightest on legendary. */
	.card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			60deg,
			transparent 35%,
			rgba(255, 255, 255, 0.5) 50%,
			transparent 65%
		);
		background-size: 250% 250%;
		animation: shine 4.5s ease-in-out infinite;
		animation-delay: calc(var(--i) * 300ms);
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

	/* Foil tiers — mirrors the Sticker album language. */
	.foil-paper {
		background-image: repeating-linear-gradient(
			45deg,
			transparent 0 8px,
			rgba(24, 20, 13, 0.04) 8px 16px
		);
		background-color: var(--paper-empty);
	}
	.foil-pearl {
		background-image: linear-gradient(
			135deg,
			rgba(255, 230, 150, 0.24) 0%,
			rgba(220, 180, 240, 0.16) 50%,
			rgba(150, 220, 230, 0.24) 100%
		);
		background-color: var(--paper-empty);
	}
	.foil-holo {
		background-image: linear-gradient(
			135deg,
			rgba(255, 200, 130, 0.34) 0%,
			rgba(255, 150, 200, 0.28) 35%,
			rgba(180, 200, 255, 0.32) 70%,
			rgba(160, 240, 200, 0.32) 100%
		);
		background-color: var(--paper-empty);
	}
	.foil-gold {
		background-image: linear-gradient(
			135deg,
			rgba(255, 215, 100, 0.55) 0%,
			rgba(255, 165, 70, 0.45) 50%,
			rgba(255, 215, 100, 0.55) 100%
		);
		background-color: #f8e0a0;
		border-color: #6b3d0e;
	}
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
		border: 4px solid var(--ink);
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			6px 6px 0 var(--ink);
	}

	.corner {
		position: absolute;
		top: -10px;
		right: -10px;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--mono);
		font-size: 10px;
		padding: 4px 8px;
		letter-spacing: 0.12em;
		transform: rotate(8deg);
		z-index: 1;
	}
	.foil-legendary .corner {
		color: #ffd166;
		border: 2px solid #ffd166;
	}

	.title {
		position: relative;
		z-index: 1;
		font-family: var(--display);
		font-size: clamp(22px, 6vw, 28px);
		line-height: 1;
		margin: 6px 0 0;
		color: var(--ink);
	}
	.stat {
		position: relative;
		z-index: 1;
		font-family: var(--display);
		font-size: clamp(34px, 11vw, 46px);
		line-height: 1;
		margin: 12px 0 4px;
		color: var(--ink);
	}
	.winner {
		position: relative;
		z-index: 1;
		font-family: var(--headline);
		font-size: 16px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin: 0;
		color: var(--ink);
	}
	.tie-note {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		background: var(--ink);
		color: var(--paper);
		padding: 1px 6px;
		margin-left: 6px;
		vertical-align: 2px;
	}
	.subtitle {
		position: relative;
		z-index: 1;
		font-family: var(--body);
		font-size: 13px;
		line-height: 1.4;
		opacity: 0.85;
		margin: 10px 0 0;
	}
	.description {
		position: relative;
		z-index: 1;
		max-width: 34ch;
		margin: 8px auto 0;
		padding-top: 8px;
		border-top: 1px solid rgba(24, 20, 13, 0.25);
		font-family: var(--mono);
		font-size: 9px;
		line-height: 1.45;
		letter-spacing: 0.03em;
		opacity: 0.72;
	}

	.empty {
		text-align: center;
		font-family: var(--mono);
		font-size: 13px;
		opacity: 0.6;
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			opacity: 1;
			transform: none;
		}
		.revealed .card {
			transition: none;
			transition-delay: 0ms;
		}
		.card::before {
			animation: none;
		}
	}
</style>
