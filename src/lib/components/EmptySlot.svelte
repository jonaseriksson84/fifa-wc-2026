<script lang="ts">
	let { stage }: { stage: string } = $props();

	const knockoutStages = new Set(['R32', 'R16', 'QF', 'SF', '3rd-place', 'Final']);
	let isKnockout = $derived(knockoutStages.has(stage));

	let labelA = $derived(
		stage === 'Final' ? 'Legendary sticker pending' :
		stage === '3rd-place' ? 'Gold sticker pending' :
		(stage === 'QF' || stage === 'SF') ? 'Holo sticker pending' :
		(stage === 'R32' || stage === 'R16') ? 'Foil sticker pending' :
		'Sticker to come'
	);
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
