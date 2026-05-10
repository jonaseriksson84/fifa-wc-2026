<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showUnpickedOnly = $state(false);

	const knockoutStages = new Set(['R32', 'R16', 'QF', 'SF', '3rd-place', 'Final']);

	function isLocked(kickoff: string): boolean {
		return new Date() >= new Date(kickoff);
	}

	function buttonLabel(value: string, fixture: Fixture): string {
		if (value === 'HOME') return fixture.homeTeam;
		if (value === 'AWAY') return fixture.awayTeam;
		return 'DRAW';
	}

	type Fixture = (typeof data.fixtures)[number];

	function groupByStage(fixtures: Fixture[]): [string, Fixture[]][] {
		const groups = new Map<string, Fixture[]>();
		for (const f of fixtures) {
			const existing = groups.get(f.stage);
			if (existing) {
				existing.push(f);
			} else {
				groups.set(f.stage, [f]);
			}
		}
		return Array.from(groups.entries());
	}

	let visibleFixtures = $derived(
		showUnpickedOnly ? data.fixtures.filter((f) => f.currentPick === null) : data.fixtures
	);

	let groupedFixtures = $derived(groupByStage(visibleFixtures));
</script>

<svelte:head>
	<title>My Picks — {data.poolName}</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-2 text-3xl font-bold">My Picks</h1>

	<div class="mb-6 flex items-center justify-between">
		<p class="text-sm text-gray-600">
			{data.unpickedCount} of {data.totalCount} fixtures unpicked
		</p>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={showUnpickedOnly} class="rounded" />
			Show unpicked only
		</label>
	</div>

	{#if data.fixtures.length === 0}
		<p class="text-gray-500">No fixtures available yet.</p>
	{:else}
		{#each groupedFixtures as [stage, fixtures]}
			<section class="mb-8">
				<h2 class="mb-3 text-lg font-semibold text-gray-700">{stage}</h2>
				<ul class="space-y-3">
					{#each fixtures as f}
						{@const locked = isLocked(f.kickoff)}
						{@const isKnockout = knockoutStages.has(f.stage)}
						<li class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
							<div class="flex items-center justify-between">
								<div>
									<span class="font-semibold">{f.homeTeam} vs {f.awayTeam}</span>
									<p class="mt-0.5 text-xs text-gray-500">
										<time datetime={f.kickoff}>
											{new Intl.DateTimeFormat(undefined, {
												dateStyle: 'medium',
												timeStyle: 'short'
											}).format(new Date(f.kickoff))}
										</time>
										<span class="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-blue-700"
											>{f.stage}</span
										>
									</p>
								</div>
								{#if locked}
									<span class="text-xs font-medium text-red-600">Closed</span>
								{/if}
							</div>

							<div class="mt-3 flex gap-2">
								{#each isKnockout ? ['HOME', 'AWAY'] : ['HOME', 'DRAW', 'AWAY'] as value}
									<form method="POST" action="?/pick" use:enhance>
										<input type="hidden" name="fixtureId" value={f.id} />
										<input type="hidden" name="value" value={value} />
										<button
											type="submit"
											disabled={locked}
											class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors
												{f.currentPick === value
												? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white'
												: 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}
												{locked ? ' cursor-not-allowed opacity-50' : ''}"
										>
											{buttonLabel(value, f)}
										</button>
									</form>
								{/each}
							</div>

							{#if form?.error && form?.fixtureId === f.id}
								<p class="mt-2 text-sm text-red-600">{form.error}</p>
							{/if}

							{#if locked && f.picksByValue}
								{@const values: ('HOME' | 'DRAW' | 'AWAY')[] = isKnockout ? ['HOME', 'AWAY'] : ['HOME', 'DRAW', 'AWAY']}
								<div class="mt-4 border-t border-gray-100 pt-3">
									<p class="mb-2 text-xs font-semibold text-gray-500 uppercase">Pick breakdown</p>
									<div class="grid gap-2 {isKnockout ? 'grid-cols-2' : 'grid-cols-3'}">
										{#each values as v}
											{@const emails = f.picksByValue[v]}
											<div class="rounded bg-gray-50 p-2">
												<p class="text-xs font-medium text-gray-600">
													{v === 'HOME' ? f.homeTeam : v === 'AWAY' ? f.awayTeam : 'Draw'}
													<span class="text-gray-400">({emails.length})</span>
												</p>
												{#each emails as email}
													<p class="truncate text-xs text-gray-700">{email}</p>
												{/each}
												{#if emails.length === 0}
													<p class="text-xs italic text-gray-400">—</p>
												{/if}
											</div>
										{/each}
									</div>
									{#if f.picksByValue.noPick.length > 0}
										<div class="mt-2 rounded bg-red-50 p-2">
											<p class="text-xs font-medium text-red-600">
												No pick <span class="text-red-400">({f.picksByValue.noPick.length})</span>
											</p>
											{#each f.picksByValue.noPick as email}
												<p class="truncate text-xs text-red-700">{email}</p>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</div>
