<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="mx-auto max-w-sm mt-16 px-4">
	<h1 class="text-2xl font-bold mb-6">Sign in</h1>

	{#if form?.success}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="font-medium text-green-800">Check your inbox</p>
			<p class="mt-1 text-sm text-green-700">
				We sent a sign-in link to <strong>{form.email}</strong>. Click the link to continue.
			</p>
		</div>
	{:else}
		<form method="POST" class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium mb-1">Email</label>
				<input
					type="email"
					name="email"
					id="email"
					required
					value={form?.email ?? ''}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					placeholder="you@example.com"
				/>
			</div>
			{#if form?.error}
				<p class="text-sm text-red-600">{form.error}</p>
			{/if}
			<button
				type="submit"
				class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Send magic link
			</button>
		</form>
	{/if}
</div>
