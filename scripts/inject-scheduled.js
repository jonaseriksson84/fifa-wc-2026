import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const result = await build({
	entryPoints: ['src/lib/server/scheduled.ts'],
	bundle: true,
	format: 'iife',
	globalName: '__scheduled',
	write: false,
	platform: 'browser',
	target: 'es2022'
});

const scheduledBundle = result.outputFiles[0].text;

const workerPath = '.svelte-kit/cloudflare/_worker.js';
let worker = readFileSync(workerPath, 'utf-8');

worker = worker.replace(
	'var worker_default = worker;',
	[
		scheduledBundle,
		'worker.scheduled = async function(event, env, ctx) {',
		'  await __scheduled.handleScheduled(event, env);',
		'};',
		'var worker_default = worker;'
	].join('\n')
);

writeFileSync(workerPath, worker);
console.log('Injected scheduled handler into _worker.js');
