-- Fast-forward 3 unresolved group fixtures: shift their kickoff to the past
-- and set results to HOME / AWAY / DRAW (one of each, for variety).
-- Run via: npm run dev:fastforward
--
-- Idempotent: only operates on fixtures that are still unresolved (result IS NULL).
-- Run repeatedly until all 6 group fixtures are done. The knockout fixture is
-- left alone (DRAW isn't a valid knockout result; resolve manually if needed).

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
