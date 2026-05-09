import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		include: ['src/**/*.test.ts']
	},
	resolve: {
		alias: {
			$lib: resolve(__dirname, 'src/lib')
		}
	}
});
