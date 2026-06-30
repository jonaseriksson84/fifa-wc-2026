<script lang="ts">
	let { pick, result, finalScore, homeTeam, awayTeam }: {
		pick: string | null;
		result: string;
		finalScore: string | null;
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

	// Split e.g. "1-1 (2-3 pen.)" or "1-1 a.e.t. 2-1" into the main FT score
	// and the extra-time/penalty detail, so the detail can sit on its own row.
	let scoreMain = $derived(finalScore ? (finalScore.split(' ')[0] ?? '—') : '—');
	let scoreExtra = $derived(
		finalScore && finalScore.includes(' ') ? finalScore.slice(finalScore.indexOf(' ') + 1) : null
	);
</script>

<div class="result-stamp" class:wrong={!correct}>
	<div class="stamp-row">
		{#if pick}
			<span class="stamped-pick">Picked: {pickLabel}</span>
		{:else}
			<span class="stamped-pick">No pick</span>
		{/if}
		<span class="result-tag">{scoreMain}</span>
		{#if pick}
			<span class="verdict">{correct ? 'Correct' : 'Missed'}</span>
		{:else}
			<span class="verdict missed">Missed</span>
		{/if}
	</div>
	{#if scoreExtra}
		<span class="score-extra">{scoreExtra}</span>
	{/if}
</div>

<style>
	.result-stamp {
		--correct: #2d6a4f;
		--wrong: #c1121f;
		margin-top: 4px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px;
		border: 2px solid var(--ink);
		background: var(--paper);
	}
	.stamp-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.result-stamp .stamped-pick {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.result-stamp .result-tag {
		font-family: var(--display);
		font-size: 20px;
		color: var(--correct);
		transform: rotate(-3deg);
		white-space: nowrap;
	}
	.result-stamp.wrong .result-tag {
		color: var(--wrong);
	}
	.result-stamp .score-extra {
		align-self: center;
		font-family: var(--display);
		font-size: 14px;
		color: var(--correct);
		white-space: nowrap;
	}
	.result-stamp.wrong .score-extra {
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
