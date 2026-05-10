type UserLike = {
	displayName?: string | null;
	name?: string | null;
	email: string;
};

export function displayName(user: UserLike): string {
	if (user.displayName) return user.displayName;
	if (user.name) return user.name;
	const local = user.email.split('@')[0];
	const plusIdx = local.indexOf('+');
	return plusIdx >= 0 ? local.slice(0, plusIdx) : local;
}
