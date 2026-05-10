-- Reset local D1 to a clean, demo-friendly state.
-- Run via: npm run dev:reset
--
-- After this you have:
--   - No users, sessions, picks, or verification tokens.
--   - 3 past group fixtures with results (the leaderboard has ammo).
--   - 3 future group fixtures (pickable).
--   - 1 future knockout fixture (stage-aware picker UI: HOME / AWAY only).

-- 1. Wipe user state.
DELETE FROM pick;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM account;
DELETE FROM user;

-- 2. Wipe and re-seed fixtures.
DELETE FROM fixture;

-- Past, scored — for leaderboard scoring.
INSERT INTO fixture (home_team, away_team, kickoff, stage, result, updated_at) VALUES
  ('Sweden',    'Brazil', datetime('now', '-10 days'), 'Group', 'HOME', datetime('now')),
  ('Germany',   'Japan',  datetime('now', '-9 days'),  'Group', 'AWAY', datetime('now')),
  ('Argentina', 'Mexico', datetime('now', '-8 days'),  'Group', 'DRAW', datetime('now'));

-- Future, pickable — group stage (HOME / DRAW / AWAY).
INSERT INTO fixture (home_team, away_team, kickoff, stage, updated_at) VALUES
  ('France',  'Denmark',    datetime('now', '+2 days'), 'Group', datetime('now')),
  ('England', 'USA',        datetime('now', '+3 days'), 'Group', datetime('now')),
  ('Spain',   'Costa Rica', datetime('now', '+4 days'), 'Group', datetime('now'));

-- Future, pickable — knockout (HOME / AWAY only, no DRAW).
INSERT INTO fixture (home_team, away_team, kickoff, stage, updated_at) VALUES
  ('Brazil', 'Croatia', datetime('now', '+10 days'), 'QF', datetime('now'));
