<script lang="ts">
	// The Fallen beat: an in-memoriam scroll of the dropouts — Users who fell below
	// the Active threshold — each with a last-seen date from their latest Pick. The
	// beat is absent entirely when there are no dropouts (the friends pool is all
	// committed), so the whole section is guarded on a non-empty list. Reveals row
	// by row on scroll; reduced motion shows it flat.
	import { onMount } from 'svelte';
	import { formatKickoff } from '$lib/kickoff-format';
	import type { RecapFallenUser } from '$lib/server/recap/recap';

	let { fallen }: { fallen: RecapFallenUser[] } = $props();

	function lastSeenLabel(user: RecapFallenUser): string {
		if (user.pickCount === 0) return 'Never made a Pick';
		if (!user.lastSeen) return `${user.pickCount} Pick${user.pickCount === 1 ? '' : 's'}`;
		const date = formatKickoff(user.lastSeen).replace(/\s+\d{2}:\d{2}$/, '');
		return `Last seen ${date}`;
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

{#if fallen.length > 0}
	<section class="fallen" bind:this={el} class:revealed data-scroll-reveal>
		<header class="beat-head">
			<span class="kicker">The Fallen</span>
			<h2>In memoriam</h2>
			<p class="sub">
				They started strong, then drifted away. We picked on without them — but never forgot.
			</p>
		</header>

		<ul class="stones">
			{#each fallen as user, i (user.userId)}
				<li class="stone" style="--i: {i}">
					<span class="cross">†</span>
					<span class="name">{user.name}</span>
					<span class="seen">{lastSeenLabel(user)}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.fallen {
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
		font-family: var(--display);
		font-size: clamp(26px, 8vw, 40px);
		margin: 0 0 6px;
		color: var(--ink);
	}
	.sub {
		font-family: var(--body);
		font-size: 14px;
		font-style: italic;
		opacity: 0.8;
		margin: 0 auto;
		max-width: 40ch;
	}

	.stones {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.stone {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		border: 2px solid var(--ink);
		border-radius: 40px 40px 6px 6px;
		background: var(--paper-card);
		padding: 22px 18px 16px;
		opacity: 0;
		transform: translateY(14px);
	}
	.revealed .stone {
		opacity: 1;
		transform: none;
		transition:
			opacity 0.5s ease,
			transform 0.55s cubic-bezier(0.22, 0.9, 0.36, 1);
		transition-delay: calc(var(--i) * 90ms);
	}
	.cross {
		font-family: var(--display);
		font-size: 26px;
		opacity: 0.55;
		line-height: 1;
	}
	.name {
		font-family: var(--headline);
		font-size: 20px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin-top: 6px;
		color: var(--ink);
	}
	.seen {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		opacity: 0.6;
		margin-top: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		.stone {
			opacity: 1;
			transform: none;
		}
		.revealed .stone {
			transition: none;
			transition-delay: 0ms;
		}
	}
</style>
