<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>FAQ — {data.poolName}</title>
</svelte:head>

<div class="faq-page">
	<h1 class="page-title">Welcome to {data.poolName}</h1>
	<p class="intro">Everything you need to know about how the pool works.</p>

	<section class="faq-card">
		<h2>How do I sign in?</h2>
		<p>
			We use magic-link sign-in — no passwords. Enter your email address and
			you'll receive a link in your inbox. Click it and you're in.
		</p>
	</section>

	<section class="faq-card">
		<h2>How does picking work?</h2>
		<p>
			Every Fixture takes one tap. For group-stage Fixtures, choose
			<strong>HOME</strong>, <strong>DRAW</strong>, or <strong>AWAY</strong>.
			For knockout Fixtures (R32, R16, QF, SF, 3rd-place, Final), choose
			<strong>HOME</strong> or <strong>AWAY</strong> only — knockouts always
			produce a winner via extra time or penalties.
		</p>
	</section>

	<section class="faq-card">
		<h2>When do Picks lock?</h2>
		<p>
			Your Pick locks exactly at kickoff. Before kickoff you can change your
			Pick as many times as you like. Once the Fixture kicks off, your Pick
			is final.
		</p>
	</section>

	<section class="faq-card">
		<h2>What can other people see?</h2>
		<p>
			Your Pick is private until kickoff. Once a Fixture kicks off, every
			user's Pick on that Fixture becomes visible to everyone.
		</p>
	</section>

	<section class="faq-card">
		<h2>How does scoring work?</h2>
		<p>
			A correct Pick earns points based on the Fixture's Stage:
		</p>
		<table class="scoring-table">
			<thead>
				<tr>
					<th>Stage</th>
					<th>Points</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Group</td>
					<td class="pts">1</td>
				</tr>
				<tr>
					<td>R32 / R16</td>
					<td class="pts">2</td>
				</tr>
				<tr>
					<td>QF / SF</td>
					<td class="pts">3</td>
				</tr>
				<tr>
					<td>3rd-place playoff</td>
					<td class="pts">4</td>
				</tr>
				<tr>
					<td>Final</td>
					<td class="pts">6</td>
				</tr>
			</tbody>
		</table>
		<p class="note">
			Each foil tier maps 1:1 to a point value — the sticker tells the truth.
			The 3rd-place playoff is worth more than a semi-final — it's the last
			chance to catch up before the Final.
		</p>
	</section>

	<section class="faq-card">
		<h2>Sticker tiers</h2>
		<p>
			Each Stage has a foil tier that reflects its weight in the tournament.
			Higher-stage Fixtures earn fancier stickers — and more points.
			Every foil tier maps 1:1 to a single point value.
		</p>
		<dl class="tier-legend">
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
	</section>

	<section class="faq-card">
		<h2>What counts as "correct" in knockouts?</h2>
		<p>
			The team that advances is the answer, not the 90-minute scoreline. A
			<code>2–2</code> group Fixture is a DRAW. A <code>2–2</code>
			quarter-final decided on penalties is a win for whichever team won the
			shootout — your Pick of HOME or AWAY is judged against the Result after
			extra time and penalties.
		</p>
	</section>

	<section class="faq-card">
		<h2>What if I miss a Pick?</h2>
		<p>
			Missed Picks score zero. There is no auto-default and no backfill. If
			you join late, you score zero on every Fixture that already kicked off
			before you signed up.
		</p>
	</section>

	<section class="faq-card">
		<h2>How are ties handled?</h2>
		<p>
			There are no tie-breakers. If two users have the same total, they share
			a rank.
		</p>
	</section>

	<section class="faq-card">
		<h2>Where do Results come from?</h2>
		<p>
			Results are fetched automatically from a public football data API a few
			minutes after each Fixture ends. The leaderboard refreshes when you
			reload the page.
		</p>
	</section>
</div>

<style>
	.faq-page {
		max-width: 640px;
		margin: 0 auto;
		padding: 40px 24px 60px;
	}

	.page-title {
		font-family: var(--headline);
		font-size: 32px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin: 0 0 6px;
	}

	.intro {
		font-family: var(--mono);
		font-size: 13px;
		letter-spacing: 0.08em;
		opacity: 0.7;
		margin: 0 0 32px;
	}

	.faq-card {
		background: var(--paper-card);
		border: 1.5px solid var(--ink);
		box-shadow: 3px 3px 0 rgba(24, 20, 13, 0.10);
		padding: 22px 24px;
		margin-bottom: 18px;
	}

	.faq-card h2 {
		font-family: var(--headline);
		font-size: 18px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin: 0 0 10px;
	}

	.faq-card p {
		margin: 0 0 10px;
		line-height: 1.6;
	}
	.faq-card p:last-child {
		margin-bottom: 0;
	}

	.faq-card strong {
		font-weight: 700;
	}

	.faq-card code {
		font-family: var(--mono);
		font-size: 14px;
		background: var(--paper-deep);
		border: 1px solid rgba(24, 20, 13, 0.2);
		padding: 1px 5px;
	}

	/* Scoring table */
	.scoring-table {
		width: 100%;
		border-collapse: collapse;
		margin: 12px 0;
		font-size: 15px;
	}
	.scoring-table th {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-align: left;
		padding: 8px 0;
		border-bottom: 2px solid var(--ink);
		opacity: 0.7;
	}
	.scoring-table th:last-child {
		text-align: right;
	}
	.scoring-table td {
		padding: 8px 0;
		border-bottom: 1px dashed rgba(24, 20, 13, 0.25);
	}
	.scoring-table tr:last-child td {
		border-bottom: none;
	}
	.scoring-table .pts {
		text-align: right;
		font-family: var(--headline);
		font-size: 18px;
		color: var(--accent);
	}

	.note {
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.04em;
		opacity: 0.7;
		margin-top: 8px;
	}

	/* Sticker tiers legend */
	.tier-legend {
		margin: 14px 0 0;
		display: grid;
		grid-template-columns: 1fr auto 18px;
		gap: 6px 14px;
		font-family: var(--mono);
		font-size: 13px;
		align-items: center;
	}
	.tier-legend dt {
		opacity: 0.85;
	}
	.tier-legend dd {
		margin: 0;
		font-weight: bold;
		color: var(--accent);
	}

	/* Foil swatches — same gradients as leaderboard + Sticker component */
	.swatch {
		width: 18px;
		height: 18px;
		border: 1.5px solid var(--ink);
		display: inline-block;
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

	/* Mobile */
	@media (max-width: 640px) {
		.faq-page {
			padding: 24px 16px 40px;
		}
		.page-title {
			font-size: 24px;
		}
		.faq-card {
			padding: 18px 16px;
		}
	}
</style>
