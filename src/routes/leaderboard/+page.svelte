<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Leaderboard — {data.poolName}</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">Leaderboard</h1>

	{#if data.leaderboard.length === 0}
		<p class="text-gray-500">No users yet.</p>
	{:else}
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="border-b border-gray-200 text-xs uppercase text-gray-500">
					<th class="pb-2 pr-4">Rank</th>
					<th class="pb-2 pr-4">User</th>
					<th class="pb-2 text-right">Points</th>
				</tr>
			</thead>
			<tbody>
				{#each data.leaderboard as entry}
					{@const isCurrentUser = entry.userId === data.currentUserId}
					<tr class="border-b border-gray-100 {isCurrentUser ? 'bg-blue-50 font-semibold' : ''}">
						<td class="py-2 pr-4 tabular-nums">{entry.rank}</td>
						<td class="py-2 pr-4">{entry.email}</td>
						<td class="py-2 text-right tabular-nums">{entry.points}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<h2 class="mb-4 mt-10 text-xl font-semibold">Results &amp; My Picks</h2>

	{#if data.fixturesWithResults.length === 0}
		<p class="text-gray-500">No results yet.</p>
	{:else}
		<ul class="space-y-3">
			{#each data.fixturesWithResults as f}
				<li class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<span class="font-semibold">{f.homeTeam} vs {f.awayTeam}</span>
							<p class="mt-0.5 text-xs text-gray-500">
								<span class="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{f.stage}</span>
							</p>
						</div>
						<span class="rounded bg-gray-100 px-2 py-1 text-sm font-medium"
							>Result: {f.result}</span
						>
					</div>

					{#if f.myPick}
						<div class="mt-2 text-sm">
							<span class="text-gray-600">My pick: {f.myPick}</span>
							{#if f.correct === true}
								<span class="ml-2 font-medium text-green-600">Correct</span>
							{:else if f.correct === false}
								<span class="ml-2 font-medium text-red-600">Wrong</span>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
