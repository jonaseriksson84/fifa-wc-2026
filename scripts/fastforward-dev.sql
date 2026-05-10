-- Fast-forward unresolved fixtures: shift kickoff to the past, set result and
-- final_score, so the picks page renders filled stickers and the leaderboard
-- shows points.
-- Run via: npm run dev:fastforward
--
-- Idempotent: only operates on fixtures still unresolved (result IS NULL).
--
-- Behaviour per run:
--   - Resolves the 3 oldest unresolved Group fixtures (HOME, AWAY, DRAW
--     for variety). Run repeatedly to drain all 6 Group fixtures.
--   - Resolves ALL unresolved knockout fixtures in one go so every foil
--     tier is awarded after the first run: pearl (R32, R16), holo (QF, SF),
--     gold (3rd-place), legendary (Final). Includes a regulation, an a.e.t.,
--     and a penalties-decided final_score for ResultStamp coverage.

-- ============= Group stage (3 oldest, one of each result) =============

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

-- ============= Knockouts (all unresolved, one shot) =============

-- R32 — pearl, 2pt — regulation HOME win
UPDATE fixture
SET kickoff = datetime('now', '-6 hour'),
    result = 'HOME',
    final_score = '3-1',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = 'R32';

-- R16 — pearl, 2pt — resolve TBD teams then set result
UPDATE fixture
SET kickoff = datetime('now', '-5 hour'),
    home_team = 'Portugal',
    away_team = 'Switzerland',
    result = 'AWAY',
    final_score = '1-1 (3-5 pen.)',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = 'R16';

-- QF — holo, 3pt — resolve TBD teams then set result
UPDATE fixture
SET kickoff = datetime('now', '-4 hour'),
    home_team = 'Brazil',
    away_team = 'Croatia',
    result = 'HOME',
    final_score = '2-1 a.e.t.',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = 'QF';

-- SF — holo, 3pt — resolve TBD teams then set result
UPDATE fixture
SET kickoff = datetime('now', '-90 minute'),
    home_team = 'France',
    away_team = 'Morocco',
    result = 'AWAY',
    final_score = '0-3',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = 'SF';

-- 3rd-place — gold, 4pt — resolve TBD teams then set result
UPDATE fixture
SET kickoff = datetime('now', '-60 minute'),
    home_team = 'Croatia',
    away_team = 'Morocco',
    result = 'HOME',
    final_score = '2-1',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = '3rd-place';

-- Final — legendary, 6pt — resolve TBD teams then set result
UPDATE fixture
SET kickoff = datetime('now', '-30 minute'),
    home_team = 'Argentina',
    away_team = 'France',
    result = 'HOME',
    final_score = '2-2 (5-3 pen.)',
    updated_at = datetime('now')
WHERE result IS NULL AND stage = 'Final';
