<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="account-page">
	<h1 class="account-heading">Account</h1>

	<div class="account-card">
		<p class="account-label">Signed in as</p>
		<p class="account-email">{data.user.email}</p>
	</div>

	<div class="account-card">
		<p class="account-label">Display name</p>
		<form method="POST" action="?/updateDisplayName" use:enhance>
			<input
				type="text"
				name="displayName"
				value={data.user.displayName ?? ''}
				maxlength="24"
				placeholder="How others see you"
				class="display-name-input"
				disabled={data.frozen}
			/>
			<button type="submit" class="display-name-save" disabled={data.frozen}>Save</button>
		</form>
		{#if data.frozen}
			<p class="account-frozen">The pool is frozen — the tournament is over and names are final.</p>
		{/if}
	</div>

	<form method="POST" action="/logout">
		<button type="submit" class="account-signout">Sign out</button>
	</form>
</div>

<style>
	.account-page {
		max-width: 380px;
		margin: 60px auto 0;
		padding: 0 20px;
	}

	.account-heading {
		font-family: var(--headline);
		font-size: 28px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 24px;
	}

	.account-card {
		border: 2px solid var(--ink);
		background: var(--paper-card, #fdf6e3);
		padding: 20px 22px;
		box-shadow: 4px 4px 0 var(--ink);
		margin-bottom: 24px;
	}
	.account-label {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-mute);
		margin: 0 0 6px;
	}
	.account-email {
		font-family: var(--body);
		font-size: 18px;
		margin: 0;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.display-name-input {
		font-family: var(--body);
		font-size: 16px;
		border: 2px solid var(--ink);
		background: var(--paper);
		padding: 10px 14px;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 10px;
	}
	.display-name-input::placeholder {
		opacity: 0.5;
		font-style: italic;
	}

	.display-name-save {
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 2px solid var(--ink);
		background: var(--accent);
		color: var(--paper);
		padding: 10px 22px;
		cursor: pointer;
		transition: all 0.12s;
	}
	.display-name-save:hover {
		background: var(--ink);
	}
	.display-name-save:disabled,
	.display-name-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.display-name-save:disabled:hover {
		background: var(--accent);
	}

	.account-frozen {
		font-family: var(--mono);
		font-size: 12px;
		line-height: 1.5;
		color: var(--ink-mute);
		margin: 12px 0 0;
	}

	.account-signout {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 2px solid var(--ink);
		background: var(--accent);
		color: var(--paper);
		padding: 14px 28px;
		cursor: pointer;
		transition: all 0.12s;
	}
	.account-signout:hover {
		background: var(--ink);
	}

	@media (max-width: 640px) {
		.account-page {
			margin-top: 36px;
		}
	}
</style>
