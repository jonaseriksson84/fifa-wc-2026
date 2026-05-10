<script lang="ts">
	import { enhance } from '$app/forms';
	import ResultStamp from './ResultStamp.svelte';
	import EmptySlot from './EmptySlot.svelte';
	import { foilTier } from '$lib/foil-tier';

	type PicksByValue = {
		HOME: string[];
		DRAW: string[];
		AWAY: string[];
		noPick: string[];
	};

	let {
		fixture,
		identifier,
		currentPick,
		picksByValue,
		locked,
		error
	}: {
		fixture: { id: number; homeTeam: string; awayTeam: string; kickoff: string; stage: string; result: string | null };
		identifier: string;
		currentPick: string | null;
		picksByValue: PicksByValue | null;
		locked: boolean;
		error: string | null;
	} = $props();

	let tier = $derived(foilTier(fixture.stage));
	let isKnockout = $derived(tier !== 'paper');
	let isFilled = $derived(locked && fixture.result !== null);

	let foilClass = $derived(`foil-${tier}`);

	let kickoffDisplay = $derived(
		new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(fixture.kickoff))
	);

	function buttonLabel(value: string): string {
		if (value === 'HOME') return fixture.homeTeam;
		if (value === 'AWAY') return fixture.awayTeam;
		return 'Draw';
	}

	let pickValues = $derived(isKnockout ? ['HOME', 'AWAY'] : ['HOME', 'DRAW', 'AWAY']);
</script>

<article
	class="sticker {isFilled ? 'filled' : 'empty'} {foilClass}"
	aria-label="{fixture.homeTeam} vs {fixture.awayTeam} — {locked ? 'locked' : 'open'}{isFilled && currentPick === fixture.result ? ' — correct' : isFilled && currentPick ? ' — missed' : ''}"
>
	{#if isFilled}
		<span class="corner">FT · STUCK</span>
	{:else if tier === 'legendary'}
		<span class="corner">★ LEGENDARY ★</span>
	{:else}
		<span class="corner">EMPTY SLOT</span>
	{/if}

	<div class="sticker-head">
		<span>{identifier}</span>
		<span>{kickoffDisplay}</span>
	</div>

	<div class="matchup">
		<div class="team">
			<span class="team-name">{fixture.homeTeam}</span>
		</div>
		<div class="versus">×</div>
		<div class="team">
			<span class="team-name">{fixture.awayTeam}</span>
		</div>
	</div>

	{#if !isFilled}
		<div class="pick-row" class:knockout={isKnockout}>
			{#each pickValues as value}
				<form method="POST" action="?/pick" use:enhance>
					<input type="hidden" name="fixtureId" value={fixture.id} />
					<input type="hidden" name="value" value={value} />
					<button
						type="submit"
						disabled={locked}
						class="pick-btn"
						class:selected={currentPick === value}
						aria-pressed={currentPick === value}
					>
						{buttonLabel(value)}
					</button>
				</form>
			{/each}
		</div>

		<EmptySlot stage={fixture.stage} />
	{/if}

	{#if isFilled}
		<ResultStamp
			pick={currentPick}
			result={fixture.result!}
			homeTeam={fixture.homeTeam}
			awayTeam={fixture.awayTeam}
		/>
	{/if}

	{#if error}
		<p class="error-msg">{error}</p>
	{/if}

	{#if locked && picksByValue}
		<div class="others-picks">
			{#each pickValues as v}
				{@const emails = picksByValue[v as keyof PicksByValue]}
				{#each emails as email}
					<span class="chip"><strong>{buttonLabel(v)}</strong> {email.split('@')[0]}</span>
				{/each}
			{/each}
		</div>
	{/if}
</article>

<style>
	.sticker {
		background: #fdf6e3;
		border: 3px solid var(--ink);
		padding: 16px 16px 14px;
		position: relative;
		box-shadow: 4px 4px 0 var(--ink);
		transition: transform 0.2s cubic-bezier(.25, .95, .45, 1.4), box-shadow 0.2s;
	}
	.sticker:nth-child(2n) { transform: rotate(-1deg); }
	.sticker:nth-child(3n) { transform: rotate(1.3deg); }
	.sticker:nth-child(5n) { transform: rotate(-0.6deg); }
	.sticker:hover {
		transform: rotate(0deg) translateY(-3px) scale(1.02);
		box-shadow: 8px 8px 0 var(--ink);
		z-index: 5;
	}

	/* Filled */
	.sticker.filled {
		background: var(--paper-deep);
	}
	.sticker.filled.foil-pearl {
		background-image:
			linear-gradient(135deg,
				rgba(255, 230, 150, 0.12) 0%,
				rgba(220, 180, 240, 0.08) 50%,
				rgba(150, 220, 230, 0.12) 100%);
		background-color: var(--paper-deep);
	}
	.sticker.filled.foil-holo {
		background-image:
			linear-gradient(135deg,
				rgba(255, 200, 130, 0.18) 0%,
				rgba(255, 150, 200, 0.14) 35%,
				rgba(180, 200, 255, 0.16) 70%,
				rgba(160, 240, 200, 0.16) 100%);
		background-color: var(--paper-deep);
	}
	.sticker.filled.foil-gold {
		background-image:
			linear-gradient(135deg,
				rgba(255, 215, 100, 0.30) 0%,
				rgba(255, 165, 70, 0.22) 50%,
				rgba(255, 215, 100, 0.30) 100%);
		background-color: var(--paper-deep);
		border-color: #6b3d0e;
	}
	.sticker.filled.foil-legendary {
		background:
			conic-gradient(from 45deg,
				rgba(255, 209, 102, 0.30),
				rgba(239, 71, 111, 0.25),
				rgba(179, 136, 255, 0.30),
				rgba(6, 214, 160, 0.25),
				rgba(255, 247, 154, 0.25),
				rgba(255, 209, 102, 0.30));
		background-color: var(--paper-deep);
		border: 4px solid var(--ink);
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			6px 6px 0 var(--ink);
		overflow: hidden;
	}

	/* Empty */
	.sticker.empty {
		background:
			repeating-linear-gradient(45deg,
				transparent 0 8px,
				rgba(24, 20, 13, 0.04) 8px 16px),
			var(--paper-empty);
		border: 3px dashed var(--ink);
		box-shadow:
			inset 4px 4px 0 rgba(24, 20, 13, 0.04),
			inset -4px -4px 0 rgba(255, 255, 255, 0.18),
			2px 2px 0 rgba(24, 20, 13, 0.18);
	}
	.sticker.empty:hover {
		box-shadow:
			inset 4px 4px 0 rgba(24, 20, 13, 0.04),
			inset -4px -4px 0 rgba(255, 255, 255, 0.18),
			6px 6px 0 rgba(24, 20, 13, 0.32);
	}

	/* Corner tag */
	.corner {
		position: absolute;
		top: -10px;
		right: -10px;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--mono);
		font-size: 10px;
		padding: 4px 8px;
		letter-spacing: 0.12em;
		transform: rotate(8deg);
	}
	.sticker.filled .corner {
		background: var(--gold);
		color: var(--ink);
	}
	.sticker.empty .corner {
		background: var(--paper);
		color: var(--ink);
		border: 2px dashed var(--ink);
		font-size: 9px;
		padding: 3px 7px;
	}

	/* Foil tiers */
	.sticker.foil-pearl {
		background-image:
			linear-gradient(135deg,
				rgba(255, 230, 150, 0.20) 0%,
				rgba(220, 180, 240, 0.14) 50%,
				rgba(150, 220, 230, 0.20) 100%),
			repeating-linear-gradient(45deg,
				transparent 0 8px,
				rgba(24, 20, 13, 0.04) 8px 16px);
		background-color: var(--paper-empty);
	}
	.sticker.foil-holo {
		background-image:
			linear-gradient(135deg,
				rgba(255, 200, 130, 0.32) 0%,
				rgba(255, 150, 200, 0.26) 35%,
				rgba(180, 200, 255, 0.30) 70%,
				rgba(160, 240, 200, 0.30) 100%),
			repeating-linear-gradient(45deg,
				transparent 0 8px,
				rgba(24, 20, 13, 0.03) 8px 16px);
		background-color: var(--paper-empty);
	}
	.sticker.foil-gold {
		background-image:
			linear-gradient(135deg,
				rgba(255, 215, 100, 0.55) 0%,
				rgba(255, 165, 70, 0.45) 50%,
				rgba(255, 215, 100, 0.55) 100%),
			repeating-linear-gradient(45deg,
				transparent 0 8px,
				rgba(24, 20, 13, 0.04) 8px 16px);
		background-color: #f8e0a0;
		border-color: #6b3d0e;
	}
	.sticker.foil-legendary {
		background:
			conic-gradient(from 45deg,
				rgba(255, 209, 102, 0.55),
				rgba(239, 71, 111, 0.50),
				rgba(179, 136, 255, 0.55),
				rgba(6, 214, 160, 0.50),
				rgba(255, 247, 154, 0.50),
				rgba(255, 209, 102, 0.55));
		background-color: var(--paper-empty);
		border: 4px solid var(--ink);
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--ink),
			6px 6px 0 var(--ink);
		overflow: hidden;
	}
	.sticker.foil-legendary::before {
		content: "";
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(60deg,
			transparent 35%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 65%);
		animation: shine 4.5s ease-in-out infinite;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
	@keyframes shine {
		0% { transform: translate(-40%, -40%); }
		50% { transform: translate(20%, 20%); }
		100% { transform: translate(-40%, -40%); }
	}
	@media (prefers-reduced-motion: reduce) {
		.sticker.foil-legendary::before {
			animation: none;
		}
	}
	.sticker.foil-legendary .corner {
		background: var(--ink);
		color: #ffd166;
		font-family: var(--display);
		font-size: 11px;
		padding: 5px 10px;
		border: 2px solid #ffd166;
		letter-spacing: 0.06em;
		transform: rotate(8deg);
	}

	/* Sticker head */
	.sticker-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 12px;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		opacity: 0.65;
		position: relative;
		z-index: 1;
	}

	/* Matchup */
	.matchup {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 10px;
		align-items: center;
		margin: 10px 0 14px;
		position: relative;
		z-index: 1;
	}
	.team {
		font-family: var(--headline);
		font-size: 20px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1;
	}
	.team:last-child {
		text-align: right;
	}
	.versus {
		font-family: var(--display);
		font-size: 22px;
		color: var(--accent);
	}
	.sticker.foil-legendary .versus {
		color: var(--ink);
	}

	/* Pick row */
	.pick-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		margin-top: 12px;
		position: relative;
		z-index: 1;
	}
	.pick-row.knockout {
		grid-template-columns: repeat(2, 1fr);
	}
	.pick-row form {
		display: contents;
	}
	.pick-btn {
		font-family: var(--headline);
		font-size: 14px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 2px solid var(--ink);
		background: var(--paper);
		padding: 9px 6px;
		cursor: pointer;
		transition: all 0.12s;
		position: relative;
	}
	.pick-btn:hover:not(:disabled) {
		background: var(--ink);
		color: var(--paper);
	}
	.pick-btn.selected {
		background: var(--ink);
		color: var(--paper);
		box-shadow: inset 0 0 0 3px var(--paper), inset 0 0 0 5px var(--ink);
	}
	.pick-btn.selected::after {
		content: "★";
		position: absolute;
		top: -8px;
		right: -8px;
		background: var(--accent);
		color: var(--paper);
		width: 18px;
		height: 18px;
		border-radius: 50%;
		font-size: 11px;
		display: grid;
		place-items: center;
		border: 2px solid var(--ink);
	}
	.pick-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Error message */
	.error-msg {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--accent);
	}

	/* Others' picks */
	.others-picks {
		margin-top: 10px;
		font-family: var(--mono);
		font-size: 11px;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		position: relative;
		z-index: 1;
	}
	.others-picks .chip {
		border: 1.5px solid var(--ink);
		padding: 2px 7px;
		background: var(--paper-deep);
	}
	.others-picks .chip strong {
		font-family: var(--headline);
	}
</style>
