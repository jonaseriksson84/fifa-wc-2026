<script>
	import '../app.css';

	let { children } = $props();
</script>

<header class="border-b border-gray-200 bg-white">
	<nav class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
		<a href="/" class="text-lg font-bold">WC 2026</a>
		<a href="/faq" class="text-sm font-medium text-gray-600 hover:text-gray-900">FAQ</a>
	</nav>
</header>

{@render children()}
