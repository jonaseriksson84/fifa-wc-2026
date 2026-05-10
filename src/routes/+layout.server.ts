import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		poolName: platform!.env.POOL_NAME,
		poolAccentHex: platform!.env.POOL_ACCENT_HEX
	};
};
