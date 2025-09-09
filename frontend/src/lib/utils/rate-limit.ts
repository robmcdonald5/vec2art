import { dev } from '$app/environment';

// Simple in-memory rate limiter for development
// In production, use Upstash Redis or similar service

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

class InMemoryRateLimiter {
	private limits: Map<string, RateLimitEntry> = new Map();
	private readonly windowMs: number;
	private readonly maxRequests: number;

	constructor(windowMs = 60000, maxRequests = 100) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
		
		// Clean up old entries every minute
		if (typeof setInterval !== 'undefined') {
			setInterval(() => this.cleanup(), 60000);
		}
	}

	async check(identifier: string): Promise<{ success: boolean; remaining: number; reset: Date }> {
		const now = Date.now();
		const entry = this.limits.get(identifier);

		if (!entry || now > entry.resetTime) {
			// New window
			this.limits.set(identifier, {
				count: 1,
				resetTime: now + this.windowMs
			});
			
			return {
				success: true,
				remaining: this.maxRequests - 1,
				reset: new Date(now + this.windowMs)
			};
		}

		if (entry.count >= this.maxRequests) {
			// Rate limit exceeded
			return {
				success: false,
				remaining: 0,
				reset: new Date(entry.resetTime)
			};
		}

		// Increment counter
		entry.count++;
		this.limits.set(identifier, entry);

		return {
			success: true,
			remaining: this.maxRequests - entry.count,
			reset: new Date(entry.resetTime)
		};
	}

	private cleanup() {
		const now = Date.now();
		for (const [key, entry] of this.limits.entries()) {
			if (now > entry.resetTime) {
				this.limits.delete(key);
			}
		}
	}
}

// Production rate limiter using Upstash Redis
class UpstashRateLimiter {
	private readonly url: string;
	private readonly token: string;
	private readonly windowMs: number;
	private readonly maxRequests: number;

	constructor(url: string, token: string, windowMs = 60000, maxRequests = 100) {
		this.url = url;
		this.token = token;
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
	}

	async check(identifier: string): Promise<{ success: boolean; remaining: number; reset: Date }> {
		const key = `rate_limit:${identifier}`;
		const now = Date.now();
		const window = Math.floor(now / this.windowMs);
		const resetTime = (window + 1) * this.windowMs;

		try {
			// Use Upstash Redis REST API
			const response = await fetch(`${this.url}/pipeline`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify([
					['INCR', `${key}:${window}`],
					['EXPIRE', `${key}:${window}`, Math.ceil(this.windowMs / 1000)]
				])
			});

			if (!response.ok) {
				console.error('Rate limit check failed:', response.statusText);
				// Fail open in case of Redis errors
				return {
					success: true,
					remaining: this.maxRequests,
					reset: new Date(resetTime)
				};
			}

			const data = await response.json();
			const count = data.result?.[0]?.result || 1;

			if (count > this.maxRequests) {
				return {
					success: false,
					remaining: 0,
					reset: new Date(resetTime)
				};
			}

			return {
				success: true,
				remaining: this.maxRequests - count,
				reset: new Date(resetTime)
			};
		} catch (error) {
			console.error('Rate limit check error:', error);
			// Fail open in case of network errors
			return {
				success: true,
				remaining: this.maxRequests,
				reset: new Date(resetTime)
			};
		}
	}
}

// Factory function to create appropriate rate limiter
export function createRateLimiter(
	windowMs = 60000,
	maxRequests = 100
): { check: (identifier: string) => Promise<{ success: boolean; remaining: number; reset: Date }> } {
	// Use environment variables if available
	const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
	const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

	if (!dev && upstashUrl && upstashToken) {
		// Production: Use Upstash Redis
		return new UpstashRateLimiter(upstashUrl, upstashToken, windowMs, maxRequests);
	} else {
		// Development: Use in-memory rate limiter
		return new InMemoryRateLimiter(windowMs, maxRequests);
	}
}

// Specific rate limiters for different endpoints
export const apiRateLimiter = createRateLimiter(60000, 100); // 100 requests per minute
export const uploadRateLimiter = createRateLimiter(300000, 10); // 10 uploads per 5 minutes
export const downloadRateLimiter = createRateLimiter(60000, 50); // 50 downloads per minute

// Helper function to get client identifier
export function getClientIdentifier(request: Request, clientAddress: string): string {
	// Try to get a unique identifier from various sources
	const forwarded = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const cfConnectingIp = request.headers.get('cf-connecting-ip');
	
	// Use the most reliable IP address available
	const ip = cfConnectingIp || realIp || forwarded?.split(',')[0] || clientAddress;
	
	// In development, use a more granular identifier
	if (dev) {
		const userAgent = request.headers.get('user-agent') || 'unknown';
		return `${ip}:${userAgent.substring(0, 50)}`;
	}
	
	return ip;
}

// Middleware helper for SvelteKit hooks
export async function handleRateLimit(
	request: Request,
	clientAddress: string,
	limiter = apiRateLimiter
): Promise<Response | null> {
	const identifier = getClientIdentifier(request, clientAddress);
	const result = await limiter.check(identifier);

	if (!result.success) {
		return new Response('Too many requests', {
			status: 429,
			headers: {
				'X-RateLimit-Limit': '100',
				'X-RateLimit-Remaining': '0',
				'X-RateLimit-Reset': result.reset.toISOString(),
				'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
			}
		});
	}

	return null;
}