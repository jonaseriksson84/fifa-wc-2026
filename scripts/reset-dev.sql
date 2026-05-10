-- Reset local D1 to a clean state with everything pickable.
-- Run via: npm run dev:reset
--
-- After this you have:
--   - No users, sessions, picks, or verification tokens.
--   - 6 future group fixtures (HOME / DRAW / AWAY pickable).
--   - 1 future knockout fixture (HOME / AWAY only — stage-aware UI).
--
-- Walkthrough:
--   1. npm run dev:reset
--   2. npm run dev   (in another terminal)
--   3. Sign up as jonaseriksson84+alice@gmail.com (and any +bob, +carol)
--      via the magic-link flow. Use separate browser profiles for each.
--   4. Each user submits picks at /picks.
--   5. npm run dev:fastforward     (resolves 3 group fixtures)
--   6. Reload /leaderboard — points appear, ranks tie/differ.
--   7. Run dev:fastforward again to resolve the remaining group fixtures.

-- 1. Wipe user state.
DELETE FROM pick;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM account;
DELETE FROM user;

-- 2. Wipe and re-seed fixtures — all in the future, all pickable.
DELETE FROM fixture;

INSERT INTO fixture (home_team, away_team, kickoff, stage, updated_at) VALUES
  ('Sweden',    'Brazil',     datetime('now', '+1 day'),   'Group', datetime('now')),
  ('Germany',   'Japan',      datetime('now', '+2 days'),  'Group', datetime('now')),
  ('Argentina', 'Mexico',     datetime('now', '+3 days'),  'Group', datetime('now')),
  ('France',    'Denmark',    datetime('now', '+4 days'),  'Group', datetime('now')),
  ('England',   'USA',        datetime('now', '+5 days'),  'Group', datetime('now')),
  ('Spain',     'Costa Rica', datetime('now', '+6 days'),  'Group', datetime('now')),
  ('Brazil',    'Croatia',    datetime('now', '+14 days'), 'QF',    datetime('now'));
