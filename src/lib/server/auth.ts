import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/d1';
import { Resend } from 'resend';
import * as schema from './db/schema';

export function createAuth(env: App.Platform['env']) {
	const db = drizzle(env.DB, { schema });
	const resend = new Resend(env.RESEND_API_KEY);

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL ?? 'http://localhost:5173',
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite', schema }),
		emailAndPassword: { enabled: false },
		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await resend.emails.send({
						from: env.SENDER_EMAIL ?? 'onboarding@resend.dev',
						to: email,
						subject: `Sign in to ${env.POOL_NAME}`,
						html: `<a href="${url}">Click here to sign in</a>`
					});
				}
			})
		]
	});
}

export type Auth = ReturnType<typeof createAuth>;
