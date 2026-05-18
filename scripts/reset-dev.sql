-- Reset local D1 to a clean state: wipe user data, restore fixtures to their
-- "tournament not started" shape. Idempotent.
-- Run via: npm run dev:reset
--
-- After this you have:
--   - No users, sessions, picks, or verification tokens.
--   - Group fixtures kept with their real kickoffs from api-football, results
--     cleared. (Re-run `npm run seed:fixtures` if your DB is missing groups.)
--   - 32 knockout placeholders restored to their migration-0007 shape
--     (placeholder team labels, original future kickoffs, NULL results).
--
-- Walkthrough for local dev:
--   1. npm run db:migrate                  # one-time, after new migration
--   2. npm run seed:fixtures               # pulls 72 real group fixtures
--   3. npm run dev:demo                    # fake 5 users + completed tournament (optional)
--   4. npm run dev                         # open http://localhost:5173
--   5. npm run dev:reset                   # back to clean state
--   6. npm run dev:fastforward             # resolve another batch (idempotent, run repeatedly)

-- 1. Wipe user state.
DELETE FROM pick;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM account;
DELETE FROM user;

-- 2. Clear results on every fixture (groups keep their api-football kickoffs).
UPDATE fixture SET result = NULL, final_score = NULL;

-- 3. Restore knockout placeholders by wiping the unresolved rows (any row
--    whose api_football_id is NULL — i.e. not yet replaced by a real fixture)
--    and re-inserting from migration 0007. Resolved knockouts (with an
--    api_football_id) are left alone since they reflect real upstream state.
DELETE FROM fixture WHERE api_football_id IS NULL AND stage <> 'Group';

-- R32 (16 matches) — chronological order matches R32.01 .. R32.16.
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up A', 'Runner-up B', '2026-06-28T19:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner C', 'Runner-up F', '2026-06-29T17:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner E', '3rd-place', '2026-06-29T20:30:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner F', 'Runner-up C', '2026-06-30T01:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up E', 'Runner-up I', '2026-06-30T17:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner I', '3rd-place', '2026-06-30T21:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner A', '3rd-place', '2026-07-01T01:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner L', '3rd-place', '2026-07-01T16:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner G', '3rd-place', '2026-07-01T20:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner D', '3rd-place', '2026-07-02T00:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner H', 'Runner-up J', '2026-07-02T19:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up K', 'Runner-up L', '2026-07-02T23:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner B', '3rd-place', '2026-07-03T03:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up D', 'Runner-up G', '2026-07-03T18:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner J', 'Runner-up H', '2026-07-03T22:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner K', '3rd-place', '2026-07-04T01:30:00.000Z', 'R32', NULL, NULL, NULL, NULL, datetime('now'));

-- R16 (8 matches) — Winner R32.NN labels.
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.01', 'Winner R32.04', '2026-07-04T17:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.03', 'Winner R32.06', '2026-07-04T21:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.02', 'Winner R32.05', '2026-07-05T20:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.07', 'Winner R32.08', '2026-07-06T00:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.12', 'Winner R32.11', '2026-07-06T19:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.10', 'Winner R32.09', '2026-07-07T00:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.15', 'Winner R32.14', '2026-07-07T16:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.13', 'Winner R32.16', '2026-07-07T20:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, datetime('now'));

-- QF (4 matches)
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.02', 'Winner R16.01', '2026-07-09T20:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.05', 'Winner R16.06', '2026-07-10T19:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.03', 'Winner R16.04', '2026-07-11T21:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.07', 'Winner R16.08', '2026-07-12T01:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, datetime('now'));

-- SF (2 matches)
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner QF.01', 'Winner QF.02', '2026-07-14T19:00:00.000Z', 'SF', NULL, NULL, NULL, NULL, datetime('now'));
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner QF.03', 'Winner QF.04', '2026-07-15T19:00:00.000Z', 'SF', NULL, NULL, NULL, NULL, datetime('now'));

-- 3rd-place playoff
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Loser SF.01', 'Loser SF.02', '2026-07-18T21:00:00.000Z', '3rd-place', NULL, NULL, NULL, NULL, datetime('now'));

-- Final
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner SF.01', 'Winner SF.02', '2026-07-19T19:00:00.000Z', 'Final', NULL, NULL, NULL, NULL, datetime('now'));
