<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-sm mt-16 px-4">
	<h1 class="text-2xl font-bold mb-6">Account</h1>
	<div class="rounded-lg border border-gray-200 p-4 space-y-2">
		<p class="text-sm text-gray-500">Signed in as</p>
		<p class="font-medium">{data.user.email}</p>
	</div>
</div>
