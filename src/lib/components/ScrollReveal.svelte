<script lang="ts">
	// Scroll-reveal primitive: wraps a Recap beat and plays it into view the first
	// time it enters the viewport. Every later beat (race chart, heatmap, award
	// cards, …) reuses this so the Recap reads as a scroll-driven story rather than
	// an autoplaying sequence — you can scroll back up and re-watch any beat.
	//
	// Respects prefers-reduced-motion (content is simply shown, no transition) and
	// degrades to visible if IntersectionObserver is unavailable (SSR / old
	// browsers), so the beat is never trapped hidden.
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let {
		children,
		once = true,
		threshold = 0.28
	}: { children: Snippet; once?: boolean; threshold?: number } = $props();

	let el = $state<HTMLElement>();
	let revealed = $state(false);

	onMount(() => {
		if (typeof IntersectionObserver === 'undefined' || !el) {
			revealed = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						revealed = true;
						if (once) observer.disconnect();
					} else if (!once) {
						revealed = false;
					}
				}
			},
			{ threshold }
		);

		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<div bind:this={el} class="scroll-reveal" class:revealed data-scroll-reveal>
	{@render children()}
</div>

<style>
	.scroll-reveal {
		opacity: 0;
		transform: translateY(28px);
		transition:
			opacity 0.9s ease,
			transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
		will-change: opacity, transform;
	}
	.scroll-reveal.revealed {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.scroll-reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
