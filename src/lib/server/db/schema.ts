import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const fixture = sqliteTable('fixture', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	homeTeam: text('home_team').notNull(),
	awayTeam: text('away_team').notNull(),
	kickoff: text('kickoff').notNull(),
	stage: text('stage').notNull(),
	result: text('result'),
	apiFootballId: integer('api_football_id'),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});
