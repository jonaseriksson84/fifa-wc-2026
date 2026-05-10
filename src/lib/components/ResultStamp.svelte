<script lang="ts">
	let { pick, result, homeTeam, awayTeam }: {
		pick: string | null;
		result: string;
		homeTeam: string;
		awayTeam: string;
	} = $props();

	let correct = $derived(pick === result);

	function valueLabel(value: string | null): string {
		if (value === 'HOME') return homeTeam;
		if (value === 'AWAY') return awayTeam;
		if (value === 'DRAW') return 'Draw';
		return '—';
	}

	let pickLabel = $derived(valueLabel(pick));
	let resultLabel = $derived(valueLabel(result));
</script>

<div class="result-stamp" class:wrong={!correct && pick !== null}>
	{#if pick}
		<span class="stamped-pick">Picked: {pickLabel}</span>
	{:else}
		<span class="stamped-pick">No pick</span>
	{/if}
	<span class="result-tag">{resultLabel} wins</span>
	{#if pick}
		<span class="verdict">{correct ? 'Correct' : 'Missed'}</span>
	{:else}
		<span class="verdict missed">Missed</span>
	{/if}
</div>

<style>
	.result-stamp {
		--correct: #2d6a4f;
		--wrong: #c1121f;
		margin-top: 4px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 12px;
		border: 2px solid var(--ink);
		background: var(--paper);
	}
	.result-stamp .stamped-pick {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.result-stamp .result-tag {
		font-family: var(--display);
		font-size: 18px;
		color: var(--correct);
		transform: rotate(-3deg);
	}
	.result-stamp.wrong .result-tag {
		color: var(--wrong);
	}
	.result-stamp .verdict {
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.15em;
		padding: 3px 7px;
		background: var(--correct);
		color: var(--paper);
		text-transform: uppercase;
	}
	.result-stamp.wrong .verdict,
	.result-stamp .verdict.missed {
		background: var(--wrong);
	}
</style>
