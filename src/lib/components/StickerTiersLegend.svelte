<script lang="ts">
	let { compact = false }: { compact?: boolean } = $props();
</script>

<div class="scoring" class:compact>
	<h4>Sticker tiers</h4>
	<dl>
		<dt>Group · paper</dt>
		<dd>1 pt</dd>
		<span class="swatch swatch-paper"></span>

		<dt>R32 / R16 · pearl</dt>
		<dd>2 pts</dd>
		<span class="swatch swatch-pearl"></span>

		<dt>QF / SF · holo</dt>
		<dd>3 pts</dd>
		<span class="swatch swatch-holo"></span>

		<dt>3rd-place · gold</dt>
		<dd>4 pts</dd>
		<span class="swatch swatch-gold"></span>

		<dt>The Final · legendary</dt>
		<dd>6 pts</dd>
		<span class="swatch swatch-legendary"></span>
	</dl>
</div>

<style>
	.scoring {
		margin-top: 22px;
		border-top: 2px solid var(--ink);
		padding-top: 16px;
	}
	.scoring.compact {
		margin-top: 18px;
		padding-top: 14px;
	}
	.scoring h4 {
		font-family: var(--headline);
		font-size: 13px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin: 0 0 10px;
	}
	.scoring.compact h4 {
		font-size: 12px;
		margin: 0 0 8px;
	}
	.scoring dl {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr auto 14px;
		gap: 4px 12px;
		font-family: var(--mono);
		font-size: 12px;
		align-items: center;
	}
	.scoring.compact dl {
		grid-template-columns: 1fr auto 12px;
		gap: 4px 10px;
		font-size: 11px;
	}
	.scoring dt {
		opacity: 0.85;
	}
	.scoring dd {
		margin: 0;
		font-weight: bold;
		color: var(--accent);
	}
	.swatch {
		width: 14px;
		height: 14px;
		border: 1.5px solid var(--ink);
		display: inline-block;
	}
	.compact .swatch {
		width: 12px;
		height: 12px;
	}
	.swatch-paper {
		background: var(--paper-card);
	}
	.swatch-pearl {
		background: linear-gradient(135deg, #ffe696, #b1d4ff);
	}
	.swatch-holo {
		background: linear-gradient(135deg, #ffc882, #ff96c8 50%, #b4c8ff);
	}
	.swatch-gold {
		background: linear-gradient(135deg, #ffd764, #ffa946);
	}
	.swatch-legendary {
		background: conic-gradient(from 45deg, #ffd166, #ef476f, #b388ff, #06d6a0, #fff79a, #ffd166);
	}
</style>
