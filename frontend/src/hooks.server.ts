import type { Handle } from '@sveltejs/kit';

// Minimal hooks.server.ts to debug serverless function crash
// All middleware temporarily disabled to isolate the issue

export const handle: Handle = async ({ event, resolve }) => {
	console.log(`[Minimal Hook] ${event.request.method} ${event.url.pathname}`);
	return resolve(event);
};
