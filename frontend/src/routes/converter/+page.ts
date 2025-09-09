import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	// Extract algorithm parameters from URL
	const backend = url.searchParams.get('backend');
	const preset = url.searchParams.get('preset');

	return {
		algorithmParams: {
			backend: backend as 'edge' | 'dots' | 'superpixel' | 'centerline' | null,
			preset: preset as 'sketch' | 'technical' | 'artistic' | 'poster' | 'comic' | null
		}
	};
};
