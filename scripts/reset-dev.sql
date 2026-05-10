-- Reset local D1 to a clean state with everything pickable.
-- Run via: npm run dev:reset
--
-- After this you have:
--   - No users, sessions, picks, or verification tokens.
--   - 6 future Group fixtures (HOME / DRAW / AWAY pickable).
--   - 1 future fixture per knockout stage so every foil tier is exercised:
--       R32 (pearl), R16 (pearl), QF (holo), SF (holo), 3rd-place (gold), Final (legendary).
--     Knockout fixtures only allow HOME / AWAY (no DRAW).
--
-- Walkthrough:
--   1. npm run dev:reset
--   2. npm run dev   (in another terminal)
--   3. Sign up as jonaseriksson84+alice@gmail.com (and any +bob, +carol)
--      via the magic-link flow. Use separate browser profiles for each.
--   4. Each user submits picks at /picks (12 fixtures, all pickable).
--   5. npm run dev:fastforward
--      → resolves 3 Group fixtures and ALL knockouts in one run, so every
--        foil tier appears as a filled sticker on /picks and the leaderboard
--        starts showing points.
--   6. Run dev:fastforward again to resolve the remaining 3 Group fixtures.

-- 1. Wipe user state.
DELETE FROM pick;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM account;
DELETE FROM user;

-- 2. Wipe and re-seed fixtures — all in the future, all pickable.
DELETE FROM fixture;

INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, updated_at) VALUES
  -- Group matchday 1 (paper, 1pt) — 2 fixtures, simulates "all groups, first round"
  ('Sweden',    'Brazil',     datetime('now', '+1 day'),   'Group',     1, datetime('now')),
  ('Germany',   'Japan',      datetime('now', '+1 day'),   'Group',     1, datetime('now')),
  -- Group matchday 2
  ('Argentina', 'Mexico',     datetime('now', '+3 days'),  'Group',     2, datetime('now')),
  ('France',    'Denmark',    datetime('now', '+3 days'),  'Group',     2, datetime('now')),
  -- Group matchday 3
  ('England',   'USA',        datetime('now', '+5 days'),  'Group',     3, datetime('now')),
  ('Spain',     'Costa Rica', datetime('now', '+5 days'),  'Group',     3, datetime('now')),
  -- R32 (pearl, 2pt)
  ('Netherlands','Senegal',   datetime('now', '+10 days'), 'R32',       NULL, datetime('now')),
  -- R16 (pearl, 2pt)
  ('Portugal',  'Switzerland',datetime('now', '+12 days'), 'R16',       NULL, datetime('now')),
  -- QF (holo, 3pt)
  ('Brazil',    'Croatia',    datetime('now', '+14 days'), 'QF',        NULL, datetime('now')),
  -- SF (holo, 3pt)
  ('France',    'Morocco',    datetime('now', '+18 days'), 'SF',        NULL, datetime('now')),
  -- 3rd-place (gold, 4pt)
  ('Croatia',   'Morocco',    datetime('now', '+22 days'), '3rd-place', NULL, datetime('now')),
  -- Final (legendary, 6pt)
  ('Argentina', 'France',     datetime('now', '+24 days'), 'Final',     NULL, datetime('now'));
