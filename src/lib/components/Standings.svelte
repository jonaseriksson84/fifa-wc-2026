<script lang="ts">
	import { displayName } from '$lib/display-name';

	type Entry = {
		userId: string;
		rank: number;
		points: number;
		displayName?: string | null;
		name?: string | null;
		email: string;
	};

	let { entries, currentUserId, compact = false }: {
		entries: Entry[];
		currentUserId: string | null;
		compact?: boolean;
	} = $props();
</script>

{#if entries.length === 0}
	<p class="empty">No standings yet.</p>
{:else}
	<table class="standings-table" class:compact>
		<tbody>
			{#each entries as entry}
				{@const isYou = entry.userId === currentUserId}
				<tr class:you={isYou}>
					<td class="rank-cell">
						<span class="rank">{entry.rank}</span>
					</td>
					<td class="who-cell">
						<span class="who">{displayName(entry)}</span>
					</td>
					<td class="pts-cell">
						<span class="pts">{entry.points}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.empty {
		font-family: var(--mono);
		font-size: 12px;
		opacity: 0.6;
		letter-spacing: 0.06em;
	}
	.standings-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
		table-layout: fixed;
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
	.standings-table.compact tr.you {
		box-shadow: -16px 0 0 rgba(199, 147, 33, 0.18), 16px 0 0 rgba(199, 147, 33, 0.18);
	}
	.standings-table td {
		padding: 14px 0;
		vertical-align: middle;
	}
	.standings-table.compact td {
		padding: 7px 0;
	}

	.standings-table td.rank-cell {
		width: 56px;
		padding-right: 18px;
		white-space: nowrap;
	}
	.standings-table.compact td.rank-cell {
		width: 36px;
		padding-right: 14px;
	}
	.rank {
		font-family: var(--display);
		font-size: 22px;
		color: var(--ink);
		line-height: 1;
	}
	.compact .rank {
		font-size: 18px;
	}

	.who-cell {
		width: auto;
		overflow: hidden;
	}
	.who {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.03em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
		max-width: 100%;
	}
	.compact .who {
		font-size: 14px;
	}

	.standings-table td.pts-cell {
		width: 52px;
		text-align: right;
		padding-left: 12px;
		padding-right: 2px;
	}
	.standings-table.compact td.pts-cell {
		width: 44px;
		padding-left: 8px;
	}
	.pts {
		font-family: var(--display);
		font-size: 22px;
		color: var(--accent);
	}
	.compact .pts {
		font-size: 16px;
	}

	@media (max-width: 640px) {
		.standings-table:not(.compact) .rank {
			font-size: 20px;
		}
		.standings-table:not(.compact) .who {
			font-size: 16px;
		}
		.standings-table:not(.compact) .pts {
			font-size: 18px;
		}
		.standings-table:not(.compact) tr.you {
			box-shadow: -16px 0 0 rgba(199, 147, 33, 0.18), 16px 0 0 rgba(199, 147, 33, 0.18);
		}
	}
</style>
