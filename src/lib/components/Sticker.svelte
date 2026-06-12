<script lang="ts">
	import { enhance } from '$app/forms';
	import ResultStamp from './ResultStamp.svelte';
	import EmptySlot from './EmptySlot.svelte';
	import { getStage } from '$lib/stage';
	import { flagEmoji } from '$lib/team-flag';
	import { isTBDFixture } from '$lib/is-known-team';
	import { formatKickoff } from '$lib/kickoff-format';
	import type { PicksByValue } from '$lib/pick-reveal';

	let {
		fixture,
		identifier,
		currentPick,
		picksByValue,
		locked,
		error,
		guest = false
	}: {
		fixture: { id: number; homeTeam: string; awayTeam: string; kickoff: string; stage: string; result: string | null; finalScore: string | null };
		identifier: string;
		currentPick: string | null;
		picksByValue: PicksByValue | null;
		locked: boolean;
		error: string | null;
		guest?: boolean;
	} = $props();

	let stageInfo = $derived(getStage(fixture.stage));
	let tier = $derived(stageInfo.foilTier);
	let isKnockout = $derived(stageInfo.isKnockout);
	let isFilled = $derived(locked && fixture.result !== null);
	let isTbd = $derived(isTBDFixture(fixture));

	let foilClass = $derived(`foil-${tier}`);

	let kickoffDisplay = $derived(formatKickoff(fixture.kickoff));

	function buttonLabel(value: string): string {
		if (value === 'HOME') return fixture.homeTeam;
		if (value === 'AWAY') return fixture.awayTeam;
		return 'Draw';
	}

	function pickFlag(value: string): string {
		if (value === 'HOME') return flagEmoji(fixture.homeTeam);
		if (value === 'AWAY') return flagEmoji(fixture.awayTeam);
		return '';
	}

	let pickValues = $derived(isKnockout ? ['HOME', 'AWAY'] : ['HOME', 'DRAW', 'AWAY']);
</script>

<article
	class="sticker {isFilled ? 'filled' : 'empty'} {foilClass}"
	aria-label="{isTbd ? 'TBD — teams to be decided' : `${fixture.homeTeam} vs ${fixture.awayTeam}`} — {locked ? 'locked' : 'open'}{isFilled && currentPick === fixture.result ? ' — correct' : isFilled && currentPick ? ' — missed' : ''}"
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

	{#if isTbd}
		<div class="sticker-tbd">
			<span class="tbd-headline">TBD</span>
			<span class="tbd-sub">Teams to be decided</span>
			<span class="slot-hint">{fixture.homeTeam} vs {fixture.awayTeam}</span>
		</div>
	{:else}
		<div class="matchup">
			<div class="team">
				<span class="team-flag">{flagEmoji(fixture.homeTeam)}</span>
				<span class="team-name">{fixture.homeTeam}</span>
			</div>
			<div class="versus">vs</div>
			<div class="team">
				<span class="team-name">{fixture.awayTeam}</span>
				<span class="team-flag">{flagEmoji(fixture.awayTeam)}</span>
			</div>
		</div>

		{#if !isFilled}
			<div class="pick-row" class:knockout={isKnockout}>
				{#each pickValues as value}
					{#if guest}
						<a href="/login?then=/" class="pick-btn guest-link">
							{buttonLabel(value)}
						</a>
					{:else}
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
					{/if}
				{/each}
			</div>

			<EmptySlot stage={fixture.stage} />
		{/if}
	{/if}

	{#if isFilled}
		<ResultStamp
			pick={currentPick}
			result={fixture.result!}
			finalScore={fixture.finalScore}
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
				{@const names = picksByValue[v as keyof PicksByValue]}
				{@const chipFlag = pickFlag(v)}
				{#each names as name}
					<span
						class="chip"
						class:correct={isFilled && v === fixture.result}
						class:wrong={isFilled && v !== fixture.result}
					>{#if chipFlag}<span class="chip-flag">{chipFlag}</span>{/if}<strong>{buttonLabel(v)}</strong> {name}</span>
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
	}
	.sticker.foil-legendary::before {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(60deg,
			transparent 35%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 65%);
		background-size: 250% 250%;
		animation: shine 4.5s ease-in-out infinite;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
	@keyframes shine {
		0% { background-position: 100% 100%; }
		50% { background-position: 0% 0%; }
		100% { background-position: 100% 100%; }
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

	/* TBD block */
	.sticker-tbd {
		margin: 10px 0 14px;
		padding: 18px 12px 14px;
		border: 2px dashed var(--ink);
		background: rgba(24, 20, 13, 0.04);
		text-align: center;
		position: relative;
		z-index: 1;
	}
	.tbd-headline {
		display: block;
		font-family: var(--display);
		font-size: 28px;
		letter-spacing: 0.12em;
		color: var(--ink);
		opacity: 0.7;
		line-height: 1;
		margin-bottom: 4px;
	}
	.tbd-sub {
		display: block;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--ink-mute);
		margin-bottom: 10px;
	}
	.slot-hint {
		display: block;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.06em;
		color: var(--ink-mute);
		opacity: 0.7;
		font-variant: small-caps;
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
		display: flex;
		align-items: center;
		gap: 6px;
		overflow: hidden;
	}
	.team:last-child {
		text-align: right;
		justify-content: flex-end;
	}
	.team-flag {
		font-family: 'Twemoji Country Flags', system-ui, sans-serif;
		font-size: 22px;
		line-height: 1;
	}
	.team-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.versus {
		font-family: var(--display);
		font-size: 22px;
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
		top: -9px;
		right: -9px;
		background: var(--accent);
		color: var(--paper);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		font-size: 10px;
		line-height: 1;
		border: 2px solid var(--ink);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.pick-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	a.pick-btn.guest-link {
		text-decoration: none;
		color: var(--ink);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Error message */
	.error-msg {
		margin-top: 8px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--accent);
	}

	/* Final score */
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
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.others-picks .chip.correct {
		background: rgba(45, 106, 79, 0.15);
	}
	.others-picks .chip.wrong {
		background: rgba(193, 18, 31, 0.12);
	}
	.others-picks .chip strong {
		font-family: var(--headline);
	}
	.others-picks .chip-flag {
		font-family: 'Twemoji Country Flags', system-ui, sans-serif;
		margin-right: 2px;
	}
</style>
