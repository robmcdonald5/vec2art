import type { RequestHandler } from './$types';

// Define the site URL - will be replaced with actual domain in production
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://vec2art.com';

// Define static pages with their priorities and change frequencies
const staticPages = [
	{ path: '/', priority: 1.0, changefreq: 'weekly' },
	{ path: '/converter', priority: 0.9, changefreq: 'monthly' },
	{ path: '/gallery', priority: 0.8, changefreq: 'daily' },
	{ path: '/about', priority: 0.7, changefreq: 'monthly' },
	{ path: '/contact', priority: 0.6, changefreq: 'monthly' },
	{ path: '/info/privacy-policy', priority: 0.5, changefreq: 'yearly' },
	{ path: '/info/terms-of-service', priority: 0.5, changefreq: 'yearly' }
];

// Helper function to format date to W3C datetime format
function formatDate(date: Date): string {
	return date.toISOString();
}

export const GET: RequestHandler = async () => {
	// Get current date for lastmod
	const currentDate = formatDate(new Date());

	// Start building the XML
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
	xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
	xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
	xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

	// Add static pages
	for (const page of staticPages) {
		xml += '  <url>\n';
		xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
		xml += `    <lastmod>${currentDate}</lastmod>\n`;
		xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
		xml += `    <priority>${page.priority}</priority>\n`;
		xml += '  </url>\n';
	}

	// In the future, you could add dynamic content here
	// For example, if you have blog posts or user-generated galleries:
	/*
	const galleries = await fetchGalleryItems();
	for (const gallery of galleries) {
		xml += '  <url>\n';
		xml += `    <loc>${SITE_URL}/gallery/${gallery.id}</loc>\n`;
		xml += `    <lastmod>${formatDate(gallery.updatedAt)}</lastmod>\n`;
		xml += '    <changefreq>weekly</changefreq>\n';
		xml += '    <priority>0.6</priority>\n';
		xml += '  </url>\n';
	}
	*/

	xml += '</urlset>';

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600, s-maxage=3600', // Cache for 1 hour
			'X-Robots-Tag': 'noindex' // Don't index the sitemap itself
		}
	});
};

// Prerender the sitemap at build time
export const prerender = true;
