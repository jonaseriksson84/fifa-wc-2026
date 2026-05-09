<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<header class="border-b border-gray-200 px-4 py-3">
	<nav class="mx-auto flex max-w-4xl items-center justify-between">
		<a href="/" class="font-bold">WC 2026</a>
		{#if data.user}
			<div class="flex items-center gap-4 text-sm">
				<span class="text-gray-600">{data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="text-blue-600 hover:underline">Sign out</button>
				</form>
			</div>
		{:else}
			<a href="/login" class="text-sm text-blue-600 hover:underline">Sign in</a>
		{/if}
	</nav>
</header>

<main>
	{@render children()}
</main>
