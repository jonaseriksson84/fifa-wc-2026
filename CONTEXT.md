# FIFA WC 2026 Betting Pool

A small social prediction app: friends (and separately, work colleagues) predict every match of the FIFA World Cup 2026 and compete on a leaderboard. Each deployment hosts exactly one pool — there is no multi-tenancy.

## Language

**User**:
A person who registers and submits picks. One identity per deployment.
_Avoid_: Player, member, account.

**Fixture**:
A scheduled match in the tournament. WC 2026 has 104 of them.
_Avoid_: Match, game.

**Pick**:
A user's prediction of who progresses past a fixture. Allowed values depend on the fixture's **Stage**:
- **Group** fixtures: `HOME` / `DRAW` / `AWAY` (the 90-minute result)
- **Knockout** fixtures (R32, R16, QF, SF, 3rd-place, Final): `HOME` / `AWAY` only — there is no `DRAW`, because a knockout always produces a winner via extra time or penalties.

At most one pick per user per fixture.
_Avoid_: Bet (implies money — there is none), tip, prediction.

**Result**:
The actual outcome of a fixture once it has been played. For a group fixture, the 90-minute result (`HOME` / `DRAW` / `AWAY`). For a knockout fixture, the team that advanced after extra time and/or penalties (`HOME` / `AWAY`) — the 90-minute scoreline is **not** the result for scoring purposes. A **Pick** is correct iff it equals the **Result** in this stage-aware sense.
_Avoid_: Outcome, score (the numeric scoreline is separate).

**Stage**:
The phase of the tournament a fixture belongs to. WC 2026 stages: group, R32, R16, QF, SF, Final, 3rd-place.
_Avoid_: Round, phase.

**Admin**:
The operator of a deployment. Enters results, manages users, regenerates anything that needs regenerating. There is no in-app role hierarchy beyond user/admin.

**Recap**:
The post-tournament summary page — the pool's shared infographic of the whole tournament (leaderboard race, pick heatmap, awards). Becomes available the moment the Final's **Result** is entered; before that, the route shows only a placeholder. One Recap per deployment; everyone sees the same page.
_Avoid_: Wrapped (implies a per-user private flow), summary, review.

**Active user**:
A **User** whose participation is high enough to qualify for rate-based Recap awards: picks on at least 50% of settled **Fixtures**. Users below the threshold still appear in factual Recap views (heatmap, race chart) but cannot win rate-based awards.

**Lock time**:
The instant a **Fixture** stops accepting new or updated **Picks**. Equal to the fixture's scheduled kickoff time — picks are open right up to kickoff and frozen the moment the match starts.

**Score weight**:
The point value of a correct **Pick** for a given **Fixture**, derived from its **Stage**. Group = 1pt, R32/R16 = 2pt, QF/SF = 3pt, 3rd-place = 4pt, Final = 6pt. Each foil tier (paper/pearl/holo/gold/legendary) maps 1:1 to a single point value. The 3rd-place bump is a deliberate catch-up mechanic giving trailing players one last swing before the Final.

**Frozen**:
The end state of a deployment: the tournament is over and the pool's data is
final. A frozen deployment accepts no writes at all — no new **Users**, no
**Picks**, no winner bets, no profile edits, and no scheduled **Fixture** or
**Result** writes. Existing **Users** can still sign in and read everything,
including the **Recap**. Distinct from **Lock time**, which freezes one fixture's
picks; freezing closes the whole pool.
_Avoid_: Closed, archived, locked (reserved for **Lock time**).

## Relationships

- A **User** submits zero or more **Picks**, at most one per **Fixture**.
- A **Fixture** belongs to exactly one **Stage** and has at most one **Result**.
- A **Pick** is correct iff it equals the **Fixture**'s **Result**, and contributes the **Fixture**'s **Score weight** to the user's total.
- A **Pick** is mutable until its **Fixture**'s **Lock time**, then immutable forever.
- A **Pick** is private to its **User** until **Lock time**; once a **Fixture** locks, every user's **Pick** on it becomes visible to all users.
- A missing **Pick** scores zero. There is no auto-default and no backfill — late signups, forgetfulness, and absence all collapse to the same outcome.
- The leaderboard ranks **Users** by total points; ties share a rank.
- **Fixtures** and **Results** are sourced from the [api-football](https://www.api-football.com/) free tier, polled by a background job. The **Admin** can override any **Result** manually for cases the API misreports (e.g. VAR overturns).

## Notes on retired terminology

- **League** was a first-class entity in the predecessor (Euro 2020) app — a many-to-many group of users with a shared join code. It is **not** a domain term in this project: the deployment *is* the pool. "League" may appear in product copy ("the friends league") but never in code, schema, or docs.
- **Bet / UserBet** from the predecessor are renamed **Pick** to avoid implying money.
