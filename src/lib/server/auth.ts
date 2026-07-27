import { betterAuth, APIError } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { Resend } from 'resend';
import * as schema from './db/schema';
import { isEmailAllowed, parseAllowedDomains } from './email-domain';
import { isPoolFrozen, SIGNUP_CLOSED_MESSAGE } from './pool-frozen';

async function hasAccount(db: ReturnType<typeof drizzle>, email: string): Promise<boolean> {
	const [existing] = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(sql`lower(${schema.user.email}) = ${email.trim().toLowerCase()}`);
	return !!existing;
}

export function createAuth(env: App.Platform['env']) {
	const db = drizzle(env.DB, { schema });
	const resend = new Resend(env.RESEND_API_KEY);
	const allowedDomains = parseAllowedDomains(env.ALLOWED_EMAIL_DOMAINS);
	const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
	const frozen = isPoolFrozen(env.POOL_FROZEN);

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
						// Backstop for every sign-up path (magic link, Google, anything
						// added later): a frozen pool never gains a new user.
						if (frozen) {
							throw new APIError('FORBIDDEN', { message: SIGNUP_CLOSED_MESSAGE });
						}
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
				// Verifying a link for an unknown email fails cleanly instead of
				// creating a user; /login blocks the send itself so no link goes out.
				disableSignUp: frozen,
				sendMagicLink: async ({ email, url }) => {
					if (!isEmailAllowed(email, allowedDomains)) return;
					// Frozen: a stranger hitting the API directly gets no email at all,
					// rather than a link that would only fail on redemption.
					if (frozen && !(await hasAccount(db, email))) {
						console.log('Pool is frozen: suppressed magic link to a non-member');
						return;
					}
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
