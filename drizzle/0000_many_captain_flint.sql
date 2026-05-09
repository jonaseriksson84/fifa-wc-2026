CREATE TABLE `fixture` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`home_team` text NOT NULL,
	`away_team` text NOT NULL,
	`kickoff` text NOT NULL,
	`stage` text NOT NULL,
	`result` text,
	`api_football_id` integer,
	`updated_at` text NOT NULL
);
