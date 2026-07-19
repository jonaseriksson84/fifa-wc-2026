<a href="/recap" class="ribbon">
	<span class="shine" aria-hidden="true"></span>
	<span class="kicker">New</span>
	<strong>The Recap is live</strong>
	<span class="sub">The whole tournament, played back</span>
	<span class="go">Open →</span>
</a>

<style>
	.ribbon {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 9px 40px;
		border-bottom: 3px solid var(--ink);
		text-decoration: none;
		color: var(--ink);
		background:
			conic-gradient(
				from 45deg,
				rgba(255, 209, 102, 0.55),
				rgba(239, 71, 111, 0.5),
				rgba(179, 136, 255, 0.55),
				rgba(6, 214, 160, 0.5),
				rgba(255, 247, 154, 0.5),
				rgba(255, 209, 102, 0.55)
			);
		background-color: var(--paper-empty);
	}
	.shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(60deg, transparent 35%, rgba(255, 255, 255, 0.6) 50%, transparent 65%);
		background-size: 250% 250%;
		animation: ribbon-shine 3.5s ease-in-out infinite;
		pointer-events: none;
		mix-blend-mode: overlay;
	}
	@keyframes ribbon-shine {
		0% {
			background-position: 100% 100%;
		}
		50% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 100% 100%;
		}
	}
	.kicker {
		flex-shrink: 0;
		font-family: var(--mono);
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		background: var(--ink);
		color: var(--paper);
		padding: 3px 8px;
	}
	strong {
		font-family: var(--headline);
		font-size: 15px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-weight: normal;
	}
	.sub {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
		opacity: 0.8;
	}
	.go {
		margin-left: auto;
		flex-shrink: 0;
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.ribbon:hover .go {
		text-decoration: underline;
	}
	@media (prefers-reduced-motion: reduce) {
		.shine {
			animation: none;
		}
	}
	@media (max-width: 640px) {
		.ribbon {
			padding: 8px 16px;
			gap: 10px;
		}
		.sub {
			display: none;
		}
	}
</style>
