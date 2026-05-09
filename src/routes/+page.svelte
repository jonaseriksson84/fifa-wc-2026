<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>WC 2026 Predictions</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">WC 2026 Fixtures</h1>

	{#if data.fixtures.length === 0}
		<p class="text-gray-500">No fixtures yet. Run <code class="rounded bg-gray-100 px-1 py-0.5 text-sm">npm run seed:fixtures</code> to add one.</p>
	{:else}
		<ul class="space-y-4">
			{#each data.fixtures as f}
				<li class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between">
						<span class="text-lg font-semibold">{f.homeTeam} vs {f.awayTeam}</span>
						<span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{f.stage}</span>
					</div>
					<p class="mt-1 text-sm text-gray-500">
						{new Date(f.kickoff).toLocaleString()}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</main>
