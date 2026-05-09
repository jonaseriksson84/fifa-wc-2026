import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		include: ['src/**/*.test.ts']
	},
	resolve: {
		alias: {
			$lib: '/home/agent/workspace/src/lib'
		}
	}
});
