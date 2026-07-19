<script lang="ts">
	import { enhance } from '$app/forms';
	import { displayName } from '$lib/display-name';

	type Entry = {
		userId: string;
		rank: number;
		points: number;
		displayName?: string | null;
		name?: string | null;
		email: string;
	};

	type WinnerBetOptions = {
		enabled: boolean;
		tagLabel: string;
		eligibleIds: string[];
		myBet: string | null;
		locked: boolean;
		bets?: { bettorId: string; pickedUserId: string }[];
	};

	let { entries, currentUserId, compact = false, winnerBet }: {
		entries: Entry[];
		currentUserId: string | null;
		compact?: boolean;
		winnerBet?: WinnerBetOptions;
	} = $props();

	const eligibleIds = $derived(new Set(winnerBet?.eligibleIds ?? []));
	const pickedEntry = $derived(entries.find((entry) => entry.userId === winnerBet?.myBet) ?? null);
	const entryById = $derived(new Map(entries.map((entry) => [entry.userId, entry])));
	const backersByPickedUserId = $derived.by(() => {
		const backers = new Map<string, Entry[]>();
		if (!winnerBet?.locked) return backers;

		for (const winnerPick of winnerBet.bets ?? []) {
			const bettor = entryById.get(winnerPick.bettorId);
			if (!bettor) continue;

			const pickedBackers = backers.get(winnerPick.pickedUserId) ?? [];
			pickedBackers.push(bettor);
			backers.set(winnerPick.pickedUserId, pickedBackers);
		}

		return backers;
	});
</script>

{#if winnerBet?.enabled && entries.length > 0}
	<p class="winner-hint">
		{#if pickedEntry}
			Your winner pick: <strong>{displayName(pickedEntry)}</strong>{winnerBet.locked
				? " — bets are frozen. 🎫 shows who's backing whom."
				: ' — tap ◉ to clear or ◎ to change.'}
		{:else if winnerBet.locked}
			Bets are frozen. No pick placed. 🎫 shows who's backing whom.
		{:else if currentUserId}
			Tap ◎ to pick who wins the pool. Just for fun.
		{:else}
			Sign in to pick who wins the pool. Just for fun.
		{/if}
	</p>
{/if}

{#if entries.length === 0}
	<p class="empty">No standings yet.</p>
{:else}
	<table class="standings-table" class:compact>
		<tbody>
			{#each entries as entry}
				{@const isYou = entry.userId === currentUserId}
				{@const isBet = winnerBet?.enabled && entry.userId === winnerBet.myBet}
				{@const canStillWin = !winnerBet?.enabled || eligibleIds.has(entry.userId)}
				{@const backers = backersByPickedUserId.get(entry.userId) ?? []}
				<tr class:you={isYou} class:eliminated={!canStillWin}>
					<td class="rank-cell">
						<span class="rank">{entry.rank}</span>
					</td>
					<td class="who-cell">
						{#if winnerBet?.enabled}
							<span class="who-line">
								<span class="who">{displayName(entry)}</span>
								{#if isBet}<span class="winner-tag">{winnerBet.tagLabel}</span>{/if}
								{#if !canStillWin}<span class="out-tag">OUT</span>{/if}
							</span>
						{:else}
							<span class="who">{displayName(entry)}</span>
						{/if}
						{#if backers.length > 0}
							<span class="backer-line">
								🎫
								{#each backers as backer, index}<span
										class="backer"
										class:me={backer.userId === currentUserId}>{displayName(backer)}</span
									>{index < backers.length - 1 ? ', ' : ''}{/each}
							</span>
						{/if}
					</td>
					<td class="pts-cell">
						<span class="pts">{entry.points}</span>
					</td>
					{#if winnerBet?.enabled}
						<td class="winner-cell">
							{#if currentUserId && !winnerBet.locked && canStillWin}
								<form method="POST" action="?/winnerBet" use:enhance>
									<button
										type="submit"
										name="pickedUserId"
										value={isBet ? '' : entry.userId}
										class="winner-button"
										class:active={isBet}
										aria-label={isBet
											? `Clear winner pick on ${displayName(entry)}`
											: `Pick ${displayName(entry)} to win the pool`}
										aria-pressed={isBet}
									>
										{isBet ? '◉' : '◎'}
									</button>
								</form>
							{/if}
						</td>
					{/if}
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
	.winner-hint {
		font-family: var(--mono);
		font-size: 11px;
		line-height: 1.5;
		letter-spacing: 0.045em;
		margin: 4px 0 8px;
		opacity: 0.76;
	}
	.winner-hint strong {
		color: var(--green);
		font-weight: 700;
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
	.standings-table tr.eliminated .rank,
	.standings-table tr.eliminated .who,
	.standings-table tr.eliminated .pts {
		opacity: 0.38;
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
	.who-line {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.who-line .who {
		min-width: 0;
	}
	.backer-line {
		display: block;
		margin-top: 4px;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.04em;
		line-height: 1.6;
		opacity: 0.75;
	}
	.backer.me {
		background: var(--green);
		color: var(--paper);
		padding: 1px 4px;
	}
	.winner-tag,
	.out-tag {
		flex: 0 0 auto;
		font-family: var(--mono);
		font-size: 9px;
		line-height: 1;
		letter-spacing: 0.1em;
		padding: 3px 5px 2px;
	}
	.winner-tag {
		background: var(--green);
		border: 1px solid var(--ink);
		color: var(--paper);
	}
	.out-tag {
		border: 1px solid color-mix(in srgb, var(--ink) 42%, transparent);
		color: color-mix(in srgb, var(--ink) 55%, transparent);
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
	.standings-table td.winner-cell {
		width: 40px;
		padding-left: 8px;
		text-align: right;
	}
	.winner-cell form {
		margin: 0;
	}
	.winner-button {
		appearance: none;
		background: transparent;
		border: 0;
		color: color-mix(in srgb, var(--ink) 38%, transparent);
		cursor: pointer;
		font: inherit;
		font-size: 21px;
		line-height: 1;
		padding: 5px 2px 5px 8px;
		transition: color 120ms ease, transform 120ms ease;
	}
	.winner-button:hover {
		color: var(--ink);
		transform: scale(1.08);
	}
	.winner-button.active {
		color: var(--green);
	}
	.winner-button:focus-visible {
		border-radius: 50%;
		outline: 2px solid var(--green);
		outline-offset: 2px;
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
		.standings-table:not(.compact) .winner-tag,
		.standings-table:not(.compact) .out-tag {
			font-size: 8px;
			padding-inline: 4px;
		}
		.standings-table:not(.compact) .who-line {
			gap: 5px;
		}
		.standings-table:not(.compact) tr.you {
			box-shadow: -16px 0 0 rgba(199, 147, 33, 0.18), 16px 0 0 rgba(199, 147, 33, 0.18);
		}
	}
</style>
