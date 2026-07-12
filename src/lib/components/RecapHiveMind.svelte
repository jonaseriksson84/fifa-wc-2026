<script lang="ts">
	// The Hive Mind beat: the pool's majority Pick scored as one synthetic entrant,
	// and where that robot would have placed on the final leaderboard. It's the
	// "did the crowd beat the individuals?" reveal — everything is computed in the
	// seam, this just renders the placement. Reveals on scroll; reduced motion shows
	// it flat.
	import { onMount } from 'svelte';
	import type { RecapHiveMind } from '$lib/server/recap/recap';

	let { hiveMind }: { hiveMind: RecapHiveMind } = $props();

	// Ordinal suffix for the placement — "2nd", "3rd", "11th".
	function ordinal(n: number): string {
		const rem100 = n % 100;
		if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
		switch (n % 10) {
			case 1:
				return `${n}st`;
			case 2:
				return `${n}nd`;
			case 3:
				return `${n}rd`;
			default:
				return `${n}th`;
		}
	}

	// The verdict line: did the crowd out-think the room, or land mid-table?
	const verdict = $derived(
		hiveMind.rank === 1
			? 'The crowd beat every single one of you.'
			: hiveMind.beat === 0
				? 'Dead last. So much for the wisdom of the crowd.'
				: `The crowd would have finished ahead of ${hiveMind.beat} of you.`
	);

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
			{ threshold: 0.3 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});
</script>

<section class="hive" bind:this={el} class:revealed data-scroll-reveal>
	<header class="beat-head">
		<span class="kicker">The Hive Mind</span>
		<h2>What if the crowd played as one?</h2>
		<p class="sub">
			Every fixture decided by the pool's majority Pick — one robot, all of your gut calls stacked
			up.
		</p>
	</header>

	<div class="robot">
		<div class="badge">🤖</div>
		<p class="place">{ordinal(hiveMind.rank)}</p>
		<p class="place-note">of {hiveMind.playerCount} players</p>
		<div class="stats">
			<div class="stat">
				<span class="num">{hiveMind.points}</span>
				<span class="lbl">points</span>
			</div>
			<div class="stat">
				<span class="num">{hiveMind.correct}/{hiveMind.settledCount}</span>
				<span class="lbl">fixtures right</span>
			</div>
		</div>
		<p class="verdict">{verdict}</p>
	</div>
</section>

<style>
	.hive {
		margin-top: 64px;
		opacity: 0;
		transform: translateY(16px);
	}
	.hive.revealed {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.75s ease,
			transform 0.8s cubic-bezier(0.22, 0.9, 0.36, 1);
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
		margin: 0 auto;
		max-width: 44ch;
	}

	.robot {
		position: relative;
		border: 3px solid var(--ink);
		box-shadow: 4px 4px 0 var(--ink);
		background: var(--paper-card);
		padding: 28px 22px 24px;
		text-align: center;
	}
	.badge {
		font-size: 46px;
		line-height: 1;
	}
	.place {
		font-family: var(--display);
		font-size: clamp(46px, 16vw, 72px);
		line-height: 0.95;
		margin: 6px 0 0;
		color: var(--ink);
	}
	.place-note {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.7;
		margin: 2px 0 0;
	}
	.stats {
		display: flex;
		justify-content: center;
		gap: 32px;
		margin: 20px 0 0;
	}
	.stat {
		display: flex;
		flex-direction: column;
	}
	.stat .num {
		font-family: var(--display);
		font-size: 28px;
		line-height: 1;
		color: var(--ink);
	}
	.stat .lbl {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.65;
		margin-top: 4px;
	}
	.verdict {
		font-family: var(--body);
		font-size: 15px;
		line-height: 1.5;
		margin: 20px auto 0;
		max-width: 40ch;
		color: var(--ink);
	}

	@media (prefers-reduced-motion: reduce) {
		.hive {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
