import { redirect } from '@sveltejs/kit';

export function load() {
	// Redirect /convert to /converter
	throw redirect(301, '/converter');
}