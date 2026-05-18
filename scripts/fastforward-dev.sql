-- Fast-forward unresolved fixtures: shift kickoff to the past, set result and
-- final_score, so the picks page renders filled stickers and the leaderboard
-- shows points.
-- Run via: npm run dev:fastforward
--
-- Idempotent: only operates on fixtures still unresolved (result IS NULL).
-- Each invocation advances ONE fixture per stage (the oldest unresolved),
-- so you can run repeatedly to progressively drain the schedule.
--
-- Knockout fixtures get hardcoded team substitutions — they all end up
-- "Portugal vs Switzerland" / "Brazil vs Croatia" / etc. That's fine for
-- dev: the goal is to exercise scoring, foil tiers, and the resolve-in-place
-- path, not realistic football. For a fully-played tournament with deterministic
-- bracket propagation, use `npm run dev:demo` instead.

-- ============= Group stage (HOME, AWAY, DRAW for variety) =============

UPDATE fixture
SET kickoff = datetime('now', '-3 hour'),
    result = 'HOME',
    final_score = '2-1',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'Group'
  ORDER BY kickoff ASC LIMIT 1
);

UPDATE fixture
SET kickoff = datetime('now', '-2 hour'),
    result = 'AWAY',
    final_score = '0-3',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'Group'
  ORDER BY kickoff ASC LIMIT 1
);

UPDATE fixture
SET kickoff = datetime('now', '-1 hour'),
    result = 'DRAW',
    final_score = '1-1',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'Group'
  ORDER BY kickoff ASC LIMIT 1
);

-- ============= Knockouts (one per stage per run) =============

-- R32 — pearl, 2pt — regulation HOME win.
UPDATE fixture
SET kickoff = datetime('now', '-6 hour'),
    home_team = 'Netherlands',
    away_team = 'Senegal',
    result = 'HOME',
    final_score = '3-1',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'R32'
  ORDER BY kickoff ASC LIMIT 1
);

-- R16 — pearl, 2pt — penalties.
UPDATE fixture
SET kickoff = datetime('now', '-5 hour'),
    home_team = 'Portugal',
    away_team = 'Switzerland',
    result = 'AWAY',
    final_score = '1-1 (3-5 pen.)',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'R16'
  ORDER BY kickoff ASC LIMIT 1
);

-- QF — holo, 3pt — a.e.t.
UPDATE fixture
SET kickoff = datetime('now', '-4 hour'),
    home_team = 'Brazil',
    away_team = 'Croatia',
    result = 'HOME',
    final_score = '2-1 a.e.t.',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'QF'
  ORDER BY kickoff ASC LIMIT 1
);

-- SF — holo, 3pt — regulation.
UPDATE fixture
SET kickoff = datetime('now', '-90 minute'),
    home_team = 'France',
    away_team = 'Morocco',
    result = 'AWAY',
    final_score = '0-3',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'SF'
  ORDER BY kickoff ASC LIMIT 1
);

-- 3rd-place — gold, 4pt — regulation.
UPDATE fixture
SET kickoff = datetime('now', '-60 minute'),
    home_team = 'Croatia',
    away_team = 'Morocco',
    result = 'HOME',
    final_score = '2-1',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = '3rd-place'
  ORDER BY kickoff ASC LIMIT 1
);

-- Final — legendary, 6pt — penalties.
UPDATE fixture
SET kickoff = datetime('now', '-30 minute'),
    home_team = 'Argentina',
    away_team = 'France',
    result = 'HOME',
    final_score = '2-2 (5-3 pen.)',
    updated_at = datetime('now')
WHERE id = (
  SELECT id FROM fixture
  WHERE result IS NULL AND stage = 'Final'
  ORDER BY kickoff ASC LIMIT 1
);
