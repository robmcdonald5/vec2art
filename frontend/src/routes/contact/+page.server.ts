import { fail } from '@sveltejs/kit';
import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import type { Actions } from './$types';

// Enhanced form validation constants (matching client-side)
const EMAIL_REGEX = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MIN_NAME_LENGTH = 2;

interface TurnstileResponse {
	success: boolean;
	'error-codes'?: string[];
	challenge_ts?: string;
	hostname?: string;
}

async function validateTurnstile(token: string, ip: string): Promise<TurnstileResponse> {
	const formData = new FormData();
	formData.append('secret', TURNSTILE_SECRET_KEY);
	formData.append('response', token);
	formData.append('remoteip', ip);

	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: formData
	});

	return response.json();
}

function getClientAddress(request: Request): string {
	// Handle various proxy headers for getting real client IP
	const forwardedFor = request.headers.get('x-forwarded-for');
	const realIP = request.headers.get('x-real-ip');
	const cfConnectingIP = request.headers.get('cf-connecting-ip');

	if (cfConnectingIP) return cfConnectingIP;
	if (realIP) return realIP;
	if (forwardedFor) {
		// X-Forwarded-For can contain multiple IPs, use the first one
		return forwardedFor.split(',')[0].trim();
	}

	return 'unknown';
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const clientIP = getClientAddress(request);

		// Extract form data
		const name = (formData.get('name') as string)?.trim() || '';
		const email = (formData.get('email') as string)?.trim() || '';
		const message = (formData.get('message') as string)?.trim() || '';
		const category = (formData.get('category') as string) || 'general';
		const bugType = (formData.get('bugType') as string) || '';
		const turnstileToken = (formData.get('cf-turnstile-response') as string) || '';

		// Server-side validation (CRITICAL: Re-validate everything)
		const errors: Record<string, string> = {};

		// Name validation
		if (!name) {
			errors.name = 'Name is required';
		} else if (name.length < MIN_NAME_LENGTH) {
			errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters long`;
		}

		// Email validation
		if (!email) {
			errors.email = 'Email is required';
		} else if (!EMAIL_REGEX.test(email)) {
			errors.email = 'Please enter a valid email address';
		}

		// Message validation
		if (!message) {
			errors.message = 'Message is required';
		} else if (message.length < MIN_MESSAGE_LENGTH) {
			errors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters long`;
		} else if (message.length > MAX_MESSAGE_LENGTH) {
			errors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`;
		}

		// Bug type validation
		if (category === 'bug' && !bugType) {
			errors.bugType = 'Please select a bug type';
		}

		// Turnstile validation (CRITICAL: Always verify server-side)
		if (!turnstileToken) {
			errors.turnstile = 'Please complete the verification challenge';
		} else {
			try {
				const turnstileResult = await validateTurnstile(turnstileToken, clientIP);

				if (!turnstileResult.success) {
					console.error('Turnstile verification failed:', turnstileResult['error-codes']);
					errors.turnstile = 'Verification failed. Please try again.';

					// Log specific error codes for debugging
					const errorCodes = turnstileResult['error-codes'] || [];
					if (errorCodes.includes('timeout-or-duplicate')) {
						errors.turnstile = 'Verification expired. Please refresh the page and try again.';
					} else if (errorCodes.includes('invalid-input-response')) {
						errors.turnstile = 'Invalid verification. Please refresh the page and try again.';
					}
				}
			} catch (error) {
				console.error('Turnstile verification error:', error);
				errors.turnstile = 'Verification service temporarily unavailable. Please try again.';
			}
		}

		// Return validation errors if any
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				name,
				email,
				message,
				category,
				bugType
			});
		}

		// If we get here, all validation passed
		// The actual form submission will still be handled by the client-side code
		// This just validates the Turnstile and form data

		return {
			success: true,
			message: 'Form validation passed'
		};
	}
};
