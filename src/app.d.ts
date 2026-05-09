declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
				token: string;
			} | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				API_FOOTBALL_KEY: string;
				RESEND_API_KEY: string;
				BETTER_AUTH_SECRET: string;
				SENDER_EMAIL?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
