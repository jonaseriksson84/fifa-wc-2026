<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let currentPath = $derived($page.url.pathname);
</script>

<div style:--accent={data.poolAccentHex}>
	<header class="masthead">
		<div class="title-block">
			<div class="crest">
				<span class="crest-text">26</span>
			</div>
			<div>
				<div class="brand"><a href="/">{data.poolName}</a></div>
				<div class="tagline">Friends edition · 2026</div>
			</div>
		</div>
		{#if data.user}
			<div class="user-pill">{data.user.email}</div>
		{:else}
			<a href="/login" class="user-pill">Sign in</a>
		{/if}
	</header>

	<div class="progress-strip">
		<span class="progress-label">Album</span>
		<div class="progress-bar"><div class="progress-fill" style:width="{data.albumProgress.percent}%"></div></div>
		<span class="progress-pct">{data.albumProgress.stuck} / {data.albumProgress.total}</span>
		<span class="progress-stat">stickers earned · {data.albumProgress.remaining} to come</span>
	</div>

	<nav class="tabs">
		<a href="/picks" class:active={currentPath === '/picks'}>Picks</a>
		<a href="/leaderboard" class:active={currentPath === '/leaderboard'}>Leaderboard</a>
		<a href="/faq" class:active={currentPath === '/faq'}>FAQ</a>
		{#if data.user}
			<form method="POST" action="/logout" class="tab-form">
				<button type="submit">Sign out</button>
			</form>
		{/if}
	</nav>

	<main>
		{@render children()}
	</main>

	<footer class="site-footer">
		<span>{data.poolName} · No prize, only honour</span>
		<span>Album · {data.albumProgress.stuck} / {data.albumProgress.total} stuck · {data.albumProgress.remaining} to come</span>
	</footer>
</div>

<style>
	.masthead {
		border-bottom: 4px double var(--ink);
		padding: 24px 40px 18px;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 40px;
		position: relative;
	}
	.masthead::before {
		content: 'EST. 2026 · ALBUM IN PROGRESS';
		position: absolute;
		top: 6px;
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.3em;
		color: var(--ink);
		opacity: 0.7;
	}
	.title-block {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	.crest {
		width: 60px;
		height: 60px;
		background: var(--accent);
		border: 3px solid var(--ink);
		display: grid;
		place-items: center;
		transform: rotate(-3deg);
		box-shadow: 4px 4px 0 var(--ink);
		flex-shrink: 0;
	}
	.crest-text {
		font-family: var(--display);
		font-size: 24px;
		color: var(--paper);
		line-height: 1;
	}
	.brand {
		font-family: var(--display);
		font-size: 46px;
		line-height: 0.9;
		margin: 0;
	}
	.brand a {
		color: inherit;
		text-decoration: none;
	}
	.tagline {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin-top: 6px;
		opacity: 0.75;
	}
	.user-pill {
		font-family: var(--mono);
		font-size: 12px;
		border: 2px solid var(--ink);
		padding: 8px 14px;
		background: var(--paper-deep);
		transform: rotate(1.5deg);
		text-decoration: none;
		color: var(--ink);
		white-space: nowrap;
	}
	.user-pill::before {
		content: '◀ ';
		color: var(--accent);
	}

	/* Progress strip */
	.progress-strip {
		border-bottom: 2px solid var(--ink);
		background: var(--paper-deep);
		padding: 14px 40px;
		display: flex;
		align-items: center;
		gap: 22px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.05em;
	}
	.progress-label {
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.progress-bar {
		flex: 1;
		height: 18px;
		background: var(--paper);
		border: 2px solid var(--ink);
		position: relative;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: repeating-linear-gradient(
			45deg,
			var(--accent) 0 6px,
			color-mix(in srgb, var(--accent) 70%, black) 6px 12px
		);
	}
	.progress-pct {
		font-family: var(--display);
		font-size: 18px;
		color: var(--accent);
	}
	.progress-stat {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-mute);
	}

	/* Tabs */
	nav.tabs {
		display: flex;
		border-bottom: 2px solid var(--ink);
		padding: 0 40px;
		font-family: var(--headline);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	nav.tabs a,
	nav.tabs .tab-form button {
		padding: 14px 22px;
		color: var(--ink);
		text-decoration: none;
		font-size: 14px;
		border-right: 1px solid rgba(24, 20, 13, 0.2);
		background: none;
		border-top: none;
		border-bottom: none;
		border-left: none;
		font-family: var(--headline);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}
	nav.tabs a.active {
		border-bottom: 2px solid var(--accent);
		margin-bottom: -2px;
	}
	nav.tabs .tab-form {
		display: contents;
	}

	/* Footer */
	.site-footer {
		border-top: 4px double var(--ink);
		margin-top: 60px;
		padding: 24px 40px;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		display: flex;
		justify-content: space-between;
		opacity: 0.65;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.masthead {
			padding: 18px 16px 14px;
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}
		.masthead::before {
			display: none;
		}
		.brand {
			font-size: 28px;
		}
		.progress-strip {
			padding: 10px 16px;
			flex-wrap: wrap;
			gap: 10px;
		}
		.progress-stat {
			display: none;
		}
		nav.tabs {
			padding: 0 16px;
			overflow-x: auto;
		}
		nav.tabs a,
		nav.tabs .tab-form button {
			padding: 12px 14px;
			font-size: 13px;
		}
		.site-footer {
			padding: 20px 16px;
			flex-direction: column;
			gap: 6px;
		}
	}
</style>
