<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>FAQ — {data.poolName}</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-8 text-3xl font-bold">Frequently Asked Questions</h1>

	<div class="space-y-8">
		<section>
			<h2 class="mb-2 text-xl font-semibold">How do I sign in?</h2>
			<p class="text-gray-700">
				We use magic-link sign-in — no passwords. Enter your email address and
				you'll receive a link in your inbox. Click it and you're in.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">How does picking work?</h2>
			<p class="text-gray-700">
				Every Fixture takes one tap. For group-stage Fixtures, choose
				<strong>HOME</strong>, <strong>DRAW</strong>, or <strong>AWAY</strong>.
				For knockout Fixtures (R32, R16, QF, SF, 3rd-place, Final), choose
				<strong>HOME</strong> or <strong>AWAY</strong> only — knockouts always
				produce a winner via extra time or penalties.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">When do Picks lock?</h2>
			<p class="text-gray-700">
				Your Pick locks exactly at kickoff. Before kickoff you can change your
				Pick as many times as you like. Once the Fixture kicks off, your Pick
				is final.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">What can other people see?</h2>
			<p class="text-gray-700">
				Your Pick is private until kickoff. Once a Fixture kicks off, every
				user's Pick on that Fixture becomes visible to everyone.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">How does scoring work?</h2>
			<p class="mb-3 text-gray-700">
				A correct Pick earns points based on the Fixture's Stage:
			</p>
			<div class="overflow-hidden rounded-lg border border-gray-200">
				<table class="w-full text-left text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 font-medium text-gray-700">Stage</th>
							<th class="px-4 py-2 font-medium text-gray-700">Points</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						<tr>
							<td class="px-4 py-2">Group</td>
							<td class="px-4 py-2 font-semibold">1</td>
						</tr>
						<tr>
							<td class="px-4 py-2">Knockouts (R32, R16, QF, SF)</td>
							<td class="px-4 py-2 font-semibold">2</td>
						</tr>
						<tr>
							<td class="px-4 py-2">3rd-place playoff</td>
							<td class="px-4 py-2 font-semibold">3</td>
						</tr>
						<tr>
							<td class="px-4 py-2">Final</td>
							<td class="px-4 py-2 font-semibold">5</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p class="mt-2 text-sm text-gray-500">
				The 3rd-place playoff is worth more than a semi-final — it's the last
				chance to catch up before the Final.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">What counts as "correct" in knockouts?</h2>
			<p class="text-gray-700">
				The team that advances is the answer, not the 90-minute scoreline. A
				<code class="rounded bg-gray-100 px-1 py-0.5 text-sm">2–2</code> group
				Fixture is a DRAW. A
				<code class="rounded bg-gray-100 px-1 py-0.5 text-sm">2–2</code>
				quarter-final decided on penalties is a win for whichever team won the
				shootout — your Pick of HOME or AWAY is judged against the Result after
				extra time and penalties.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">What if I miss a Pick?</h2>
			<p class="text-gray-700">
				Missed Picks score zero. There is no auto-default and no backfill. If
				you join late, you score zero on every Fixture that already kicked off
				before you signed up.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">How are ties handled?</h2>
			<p class="text-gray-700">
				There are no tie-breakers. If two users have the same total, they share
				a rank.
			</p>
		</section>

		<section>
			<h2 class="mb-2 text-xl font-semibold">Where do Results come from?</h2>
			<p class="text-gray-700">
				Results are fetched automatically from a public football data API a few
				minutes after each Fixture ends. The leaderboard refreshes when you
				reload the page.
			</p>
		</section>
	</div>
</main>
