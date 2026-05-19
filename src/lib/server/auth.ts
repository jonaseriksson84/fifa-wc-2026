import { betterAuth, APIError } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/d1';
import { Resend } from 'resend';
import * as schema from './db/schema';
import { isEmailAllowed, parseAllowedDomains } from './email-domain';

export function createAuth(env: App.Platform['env']) {
	const db = drizzle(env.DB, { schema });
	const resend = new Resend(env.RESEND_API_KEY);
	const allowedDomains = parseAllowedDomains(env.ALLOWED_EMAIL_DOMAINS);
	const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL ?? 'http://localhost:5173',
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite', schema }),
		emailAndPassword: { enabled: false },
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ['google', 'magic-link']
			}
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						if (!isEmailAllowed(user.email, allowedDomains)) {
							throw new APIError('FORBIDDEN', {
								message: 'Sign-in is restricted to allowed email domains.'
							});
						}
						return { data: user };
					}
				}
			}
		},
		socialProviders: googleEnabled
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID!,
						clientSecret: env.GOOGLE_CLIENT_SECRET!
					}
				}
			: undefined,
		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					if (!isEmailAllowed(email, allowedDomains)) return;
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
