<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { LayoutData } from '../$types';
	import { page } from '$app/stores';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let layoutData = $derived($page.data as LayoutData);
</script>

<div class="login-page">
	<div class="login-crest">
		<span class="login-crest-text">26</span>
	</div>

	<h1 class="login-brand">{layoutData.poolName}</h1>
	<p class="login-tagline">the friends edition</p>

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

		{#if form?.error || data.oauthError}
			<p class="login-error">{form?.error ?? data.oauthError}</p>
		{/if}

		{#if data.googleEnabled}
			<form method="POST" action="/login/google" class="login-form login-form-google">
				<button type="submit" class="login-google-button">
					<svg class="login-google-icon" viewBox="0 0 18 18" aria-hidden="true">
						<path
							fill="#4285F4"
							d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
						/>
						<path
							fill="#34A853"
							d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
						/>
						<path
							fill="#FBBC05"
							d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
						/>
						<path
							fill="#EA4335"
							d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
						/>
					</svg>
					Sign in with Google
				</button>
			</form>

			<div class="login-divider"><span>or</span></div>
		{/if}

		<form method="POST" action="?/magicLink" class="login-form">
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

	.login-form-google {
		margin-bottom: 18px;
	}
	.login-google-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}
	.login-google-icon {
		width: 18px;
		height: 18px;
	}

	.login-divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0 0 18px;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-mute);
	}
	.login-divider::before,
	.login-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--ink);
		opacity: 0.3;
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
