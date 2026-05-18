-- Seed 32 knockout placeholder fixtures (M73–M104).
-- Kickoff times: UTC ISO, sourced from FIFA schedule via Wikipedia + Sky Sports.
-- Labels follow the scheme in PRD #33: group-placement names for R32,
-- app-identifier references (R32.01, R16.01, …) for later rounds.
-- Chronological order within each stage determines the .NN suffix.

-- R32 (16 matches) — sorted chronologically → R32.01 through R32.16
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up A', 'Runner-up B', '2026-06-28T19:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner C', 'Runner-up F', '2026-06-29T17:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner E', '3rd-place', '2026-06-29T20:30:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner F', 'Runner-up C', '2026-06-30T01:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up E', 'Runner-up I', '2026-06-30T17:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner I', '3rd-place', '2026-06-30T21:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner A', '3rd-place', '2026-07-01T01:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner L', '3rd-place', '2026-07-01T16:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner G', '3rd-place', '2026-07-01T20:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner D', '3rd-place', '2026-07-02T00:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner H', 'Runner-up J', '2026-07-02T19:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up K', 'Runner-up L', '2026-07-02T23:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner B', '3rd-place', '2026-07-03T03:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Runner-up D', 'Runner-up G', '2026-07-03T18:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner J', 'Runner-up H', '2026-07-03T22:00:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner K', '3rd-place', '2026-07-04T01:30:00.000Z', 'R32', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');

-- R16 (8 matches) — sorted chronologically → R16.01 through R16.08
-- Home/away reference the R32 app-identifier of the feeder match.
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.01', 'Winner R32.04', '2026-07-04T17:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.03', 'Winner R32.06', '2026-07-04T21:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.02', 'Winner R32.05', '2026-07-05T20:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.07', 'Winner R32.08', '2026-07-06T00:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.12', 'Winner R32.11', '2026-07-06T19:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.10', 'Winner R32.09', '2026-07-07T00:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.15', 'Winner R32.14', '2026-07-07T16:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R32.13', 'Winner R32.16', '2026-07-07T20:00:00.000Z', 'R16', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');

-- QF (4 matches) — sorted chronologically → QF.01 through QF.04
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.02', 'Winner R16.01', '2026-07-09T20:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.05', 'Winner R16.06', '2026-07-10T19:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.03', 'Winner R16.04', '2026-07-11T21:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner R16.07', 'Winner R16.08', '2026-07-12T01:00:00.000Z', 'QF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');

-- SF (2 matches) — sorted chronologically → SF.01, SF.02
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner QF.01', 'Winner QF.02', '2026-07-14T19:00:00.000Z', 'SF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner QF.03', 'Winner QF.04', '2026-07-15T19:00:00.000Z', 'SF', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');

-- 3rd-place playoff (1 match) — singleton identifier 3PP
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Loser SF.01', 'Loser SF.02', '2026-07-18T21:00:00.000Z', '3rd-place', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');

-- Final (1 match) — singleton identifier FNL
INSERT INTO fixture (home_team, away_team, kickoff, stage, matchday, api_football_id, result, final_score, updated_at)
VALUES ('Winner SF.01', 'Winner SF.02', '2026-07-19T19:00:00.000Z', 'Final', NULL, NULL, NULL, NULL, '2026-05-18T00:00:00.000Z');
