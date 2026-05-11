<script lang="ts">
	import { getStage } from '$lib/stage';

	let { stage }: { stage: string } = $props();

	let stageInfo = $derived(getStage(stage));
	let tier = $derived(stageInfo.foilTier);
	let isKnockout = $derived(stageInfo.isKnockout);

	const tierLabels: Record<string, string> = {
		paper: 'Sticker to come',
		pearl: 'Foil sticker pending',
		holo: 'Holo sticker pending',
		gold: 'Gold sticker pending',
		legendary: 'Legendary sticker pending'
	};
	let labelA = $derived(tierLabels[tier]);
	let labelB = $derived(
		isKnockout ? 'winner advances' : 'arrives at full time'
	);
</script>

<div class="to-come">
	<span class="qmark">?</span>
	<div class="label-stack">
		<span class="a">{labelA}</span>
		<span class="b">{labelB}</span>
	</div>
</div>

<style>
	.to-come {
		margin-top: 12px;
		padding: 14px 12px;
		border: 2px dashed var(--ink);
		background: rgba(24, 20, 13, 0.04);
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--ink-mute);
		position: relative;
		z-index: 1;
	}
	.to-come .qmark {
		font-family: var(--display);
		font-size: 22px;
		color: var(--ink);
		opacity: 0.5;
		line-height: 1;
	}
	.to-come .label-stack {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: right;
	}
	.to-come .label-stack .a {
		color: var(--ink);
	}
	.to-come .label-stack .b {
		color: var(--ink-mute);
		font-size: 10px;
	}
</style>
