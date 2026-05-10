<script lang="ts">
	import type { ActionData } from './$types';
	import type { LayoutData } from '../$types';
	import { page } from '$app/stores';

	let { form }: { form: ActionData } = $props();
	let layoutData = $derived($page.data as LayoutData);
</script>

<div class="login-page">
	<div class="login-crest">
		<span class="login-crest-text">26</span>
	</div>

	<h1 class="login-brand">{layoutData.poolName}</h1>
	<p class="login-tagline"><em>the friends edition</em></p>

	{#if form?.success}
		<div class="login-card">
			<div class="login-ornament">★ ★ ★</div>
			<p class="login-card-heading">Check your inbox</p>
			<p class="login-card-body">
				We sent a sign-in link to <strong>{form.email}</strong>. Click the link to continue.
			</p>
		</div>
	{:else}
		<p class="login-prompt">Sign in to {layoutData.poolName}</p>

		<form method="POST" class="login-form">
			{#if form?.error}
				<p class="login-error">{form.error}</p>
			{/if}
			<div class="login-field">
				<label for="email">Email address</label>
				<input
					type="email"
					name="email"
					id="email"
					required
					value={form?.email ?? ''}
					placeholder="you@example.com"
				/>
			</div>
			<button type="submit">Send magic link</button>
		</form>
	{/if}
</div>

<style>
	.login-page {
		max-width: 380px;
		margin: 60px auto 0;
		padding: 0 20px;
		text-align: center;
	}

	.login-crest {
		width: 90px;
		height: 90px;
		background: var(--accent);
		border: 3px solid var(--ink);
		display: grid;
		place-items: center;
		transform: rotate(-3deg);
		box-shadow: 4px 4px 0 var(--ink);
		margin: 0 auto 28px;
	}
	.login-crest-text {
		font-family: var(--display);
		font-size: 36px;
		color: var(--paper);
		line-height: 1;
	}

	.login-brand {
		font-family: var(--display);
		font-size: 42px;
		line-height: 0.9;
		margin: 0 0 8px;
	}

	.login-tagline {
		font-family: var(--body);
		font-size: 18px;
		font-style: italic;
		color: var(--ink-mute);
		margin: 0 0 36px;
	}
	.login-tagline em {
		font-style: italic;
	}

	.login-prompt {
		font-family: var(--headline);
		font-size: 20px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 20px;
	}

	.login-form {
		text-align: left;
	}

	.login-field {
		margin-bottom: 16px;
	}
	.login-field label {
		display: block;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-bottom: 6px;
		color: var(--ink-mute);
	}
	.login-field input {
		width: 100%;
		font-family: var(--body);
		font-size: 16px;
		border: 2px solid var(--ink);
		background: var(--paper-card, #fdf6e3);
		padding: 12px 14px;
		color: var(--ink);
		outline: none;
	}
	.login-field input:focus {
		box-shadow: 3px 3px 0 var(--ink);
	}

	.login-form button {
		width: 100%;
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 2px solid var(--ink);
		background: var(--paper);
		padding: 14px 6px;
		cursor: pointer;
		transition: all 0.12s;
	}
	.login-form button:hover {
		background: var(--ink);
		color: var(--paper);
	}

	.login-error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
		border: 1px solid var(--accent);
		background: var(--paper-card, #fdf6e3);
		padding: 10px 12px;
		margin-bottom: 14px;
	}

	/* Success card */
	.login-card {
		border: 2px solid var(--ink);
		background: var(--paper-card, #fdf6e3);
		padding: 32px 24px;
		box-shadow: 4px 4px 0 var(--ink);
	}
	.login-ornament {
		font-size: 14px;
		letter-spacing: 0.4em;
		color: var(--accent);
		margin-bottom: 14px;
	}
	.login-card-heading {
		font-family: var(--headline);
		font-size: 22px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin: 0 0 10px;
	}
	.login-card-body {
		font-family: var(--body);
		font-size: 16px;
		color: var(--ink-mute);
		margin: 0;
		line-height: 1.6;
	}
	.login-card-body strong {
		color: var(--ink);
	}

	@media (max-width: 640px) {
		.login-page {
			margin-top: 36px;
		}
		.login-brand {
			font-size: 30px;
		}
		.login-crest {
			width: 70px;
			height: 70px;
		}
		.login-crest-text {
			font-size: 28px;
		}
	}
</style>
