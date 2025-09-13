import { redirect } from '@sveltejs/kit';

export function load() {
	// Redirect /vec2art to /converter
	throw redirect(301, '/converter');
}
