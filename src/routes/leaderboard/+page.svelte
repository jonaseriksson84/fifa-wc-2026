<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function emailSuffix(email: string): string {
		const local = email.split('@')[0];
		const plusIdx = local.indexOf('+');
		return plusIdx >= 0 ? local.slice(plusIdx) : email;
	}

	function displayName(entry: { name: string | null; email: string }): string {
		if (entry.name) return entry.name;
		const local = entry.email.split('@')[0];
		const plusIdx = local.indexOf('+');
		return plusIdx >= 0 ? local.slice(plusIdx + 1) : local;
	}
</script>

<svelte:head>
	<title>Leaderboard — {data.poolName}</title>
</svelte:head>

<div class="leaderboard-page">
	<div class="panel">
		<span class="overhang">STANDINGS</span>

		{#if data.leaderboard.length === 0}
			<p class="empty">No users yet.</p>
		{:else}
			<table class="standings-table">
				<tbody>
					{#each data.leaderboard as entry}
						{@const isCurrentUser = entry.userId === data.currentUserId}
						<tr class:you={isCurrentUser}>
							<td class="rank-cell">
								<span class="rank">{entry.rank}</span>
								{#if entry.tied}<span class="tied">=</span>{/if}
							</td>
							<td class="who-cell">
								<span class="who">{displayName(entry)}</span>
								<small class="suffix">{emailSuffix(entry.email)}</small>
							</td>
							<td class="pts-cell">
								<span class="pts">{entry.points}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		<div class="scoring">
			<h4>Sticker tiers</h4>
			<dl>
				<dt>Group · paper</dt>
				<dd>1 pt</dd>
				<span class="swatch swatch-paper"></span>

				<dt>R32 / R16 · pearl</dt>
				<dd>2 pts</dd>
				<span class="swatch swatch-pearl"></span>

				<dt>QF / SF · holo</dt>
				<dd>2 pts</dd>
				<span class="swatch swatch-holo"></span>

				<dt>3rd-place · gold</dt>
				<dd>3 pts</dd>
				<span class="swatch swatch-gold"></span>

				<dt>The Final · legendary</dt>
				<dd>5 pts</dd>
				<span class="swatch swatch-legendary"></span>
			</dl>
		</div>
	</div>

	<h2 class="results-heading">Results &amp; My Picks</h2>

	{#if data.fixturesWithResults.length === 0}
		<p class="empty">No results yet.</p>
	{:else}
		<ul class="results-list">
			{#each data.fixturesWithResults as f}
				<li class="result-card">
					<div class="result-top">
						<div>
							<span class="matchup">{f.homeTeam} vs {f.awayTeam}</span>
							<span class="stage-badge">{f.stage}</span>
						</div>
						<span class="result-value">Result: {f.result}</span>
					</div>

					{#if f.myPick}
						<div class="my-pick">
							<span>User pick: {f.myPick}</span>
							{#if f.correct === true}
								<span class="verdict correct">Correct</span>
							{:else if f.correct === false}
								<span class="verdict wrong">Wrong</span>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.leaderboard-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 40px 24px 60px;
	}

	/* Panel */
	.panel {
		background: var(--paper-deep);
		border: 1.5px solid var(--ink);
		box-shadow: 4px 4px 0 rgba(24, 20, 13, 0.12);
		padding: 28px 22px 26px;
		position: relative;
		border-top: 4px solid var(--accent);
	}

	/* Overhang tab */
	.overhang {
		position: absolute;
		top: -18px;
		left: 16px;
		background: var(--accent);
		color: var(--paper);
		font-family: var(--display);
		font-size: 18px;
		padding: 4px 14px;
		letter-spacing: 0.04em;
		border: 1.5px solid var(--ink);
	}

	/* Standings table */
	.standings-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
	}
	.standings-table tr {
		border-bottom: 1px dashed rgba(24, 20, 13, 0.3);
	}
	.standings-table tr:last-child {
		border-bottom: none;
	}
	.standings-table tr.you {
		background: rgba(199, 147, 33, 0.18);
		box-shadow: -22px 0 0 rgba(199, 147, 33, 0.18), 22px 0 0 rgba(199, 147, 33, 0.18);
	}
	.standings-table td {
		padding: 10px 0;
		vertical-align: baseline;
	}

	/* Rank */
	.rank-cell {
		width: 38px;
	}
	.rank {
		font-family: var(--display);
		font-size: 24px;
		color: var(--ink);
	}
	.tied {
		font-family: var(--mono);
		font-size: 12px;
		margin-left: 2px;
		opacity: 0.6;
	}

	/* User identity */
	.who {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.03em;
	}
	.suffix {
		display: block;
		font-family: var(--mono);
		font-size: 10px;
		font-weight: normal;
		letter-spacing: 0.1em;
		opacity: 0.6;
		margin-top: 2px;
	}

	/* Points */
	.pts-cell {
		text-align: right;
	}
	.pts {
		font-family: var(--display);
		font-size: 22px;
		color: var(--accent);
	}

	/* Scoring legend */
	.scoring {
		margin-top: 22px;
		border-top: 2px solid var(--ink);
		padding-top: 16px;
	}
	.scoring h4 {
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin: 0 0 10px;
	}
	.scoring dl {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr auto 14px;
		gap: 4px 12px;
		font-family: var(--mono);
		font-size: 12px;
		align-items: center;
	}
	.scoring dt {
		opacity: 0.85;
	}
	.scoring dd {
		margin: 0;
		font-weight: bold;
		color: var(--accent);
	}

	/* Foil swatches */
	.swatch {
		width: 14px;
		height: 14px;
		border: 1.5px solid var(--ink);
		display: inline-block;
	}
	.swatch-paper {
		background: var(--paper-card);
	}
	.swatch-pearl {
		background: linear-gradient(135deg, #ffe696, #b1d4ff);
	}
	.swatch-holo {
		background: linear-gradient(135deg, #ffc882, #ff96c8 50%, #b4c8ff);
	}
	.swatch-gold {
		background: linear-gradient(135deg, #ffd764, #ffa946);
	}
	.swatch-legendary {
		background: conic-gradient(from 45deg, #ffd166, #ef476f, #b388ff, #06d6a0, #fff79a, #ffd166);
	}

	/* Results section */
	.results-heading {
		font-family: var(--headline);
		font-size: 20px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 40px 0 16px;
	}
	.results-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.result-card {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		padding: 14px 16px;
		box-shadow: 2px 2px 0 rgba(24, 20, 13, 0.08);
	}
	.result-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.matchup {
		font-family: var(--headline);
		font-size: 16px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.stage-badge {
		display: inline-block;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border: 1px solid var(--ink);
		padding: 1px 6px;
		margin-left: 8px;
		opacity: 0.7;
	}
	.result-value {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.06em;
		background: var(--paper-deep);
		border: 1px solid var(--ink);
		padding: 3px 8px;
		white-space: nowrap;
	}
	.my-pick {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
	}
	.verdict {
		margin-left: 8px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 11px;
		padding: 2px 6px;
	}
	.verdict.correct {
		background: var(--green);
		color: var(--paper);
	}
	.verdict.wrong {
		background: var(--accent);
		color: var(--paper);
	}

	.empty {
		font-family: var(--mono);
		font-size: 13px;
		opacity: 0.6;
		letter-spacing: 0.06em;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.leaderboard-page {
			padding: 30px 16px 40px;
		}
		.panel {
			padding: 24px 16px 22px;
		}
		.standings-table tr.you {
			margin: 0 -16px;
		}
		.rank {
			font-size: 20px;
		}
		.who {
			font-size: 16px;
		}
		.pts {
			font-size: 18px;
		}
	}
</style>
