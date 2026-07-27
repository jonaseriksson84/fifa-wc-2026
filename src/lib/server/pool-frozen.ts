/**
 * A frozen pool is one whose tournament is over and whose data is final: no new
 * users, no picks, no winner bets, no profile edits, and no scheduled fixture or
 * result writes. Existing users can still sign in and read everything.
 *
 * Set POOL_FROZEN="true" in the deployment's vars to freeze it.
 */
export function isPoolFrozen(raw: string | undefined): boolean {
	return raw?.trim().toLowerCase() === 'true';
}

export const POOL_FROZEN_MESSAGE = 'This pool is frozen — the tournament is over.';
export const SIGNUP_CLOSED_MESSAGE =
	'Sign-ups are closed — the tournament is over. Only existing members can sign in.';
