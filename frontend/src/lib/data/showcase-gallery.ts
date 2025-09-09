/**
 * Curated gallery showcase data for the landing page carousel
 * Maps selected gallery images to showcase algorithms with optimized loading
 */

import {
	BarChart3,
	Palette,
	PenTool,
	Grid3x3,
	Sparkles,
	Zap,
	Image,
	Layers
} from 'lucide-svelte';
import type { ComponentType } from 'svelte';

export interface ShowcaseAlgorithm {
	id: string;
	name: string;
	technicalName: string;
	description: string;
	icon: ComponentType;
	bestFor: string;
	features: string[];
	beforeImage: string;
	afterImage: string;
	afterSvgPath?: string; // For API endpoint construction
	color: string;
	bgGradient: string;
	backend: 'edge' | 'dots' | 'superpixel' | 'centerline';
	preset?: 'sketch' | 'technical' | 'artistic' | 'poster' | 'comic';
	isAvailable: boolean;
}

// Curated showcase mapping to best gallery examples - 15 unique, diverse examples
export const showcaseAlgorithms: ShowcaseAlgorithm[] = [
	{
		id: 'portrait-sketch',
		name: 'Portrait Sketching',
		technicalName: 'Edge Detection',
		description:
			'Transform portraits into elegant line drawings with natural, hand-drawn aesthetics.',
		icon: PenTool,
		bestFor: 'Portrait Photography',
		features: ['Character detail preservation', 'Natural line flow', 'Expressive strokes'],
		beforeImage: '/gallery/before/portraits-real/girl-beach.webp',
		afterImage: '/gallery/after-webp/portraits-real/girl-beach(edgetracing).webp',
		afterSvgPath: 'portraits-real/girl-beach(edgetracing).svg',
		color: 'text-emerald-600',
		bgGradient: 'from-emerald-50 to-teal-50',
		backend: 'edge',
		preset: 'sketch',
		isAvailable: true
	},
	{
		id: 'cinematic-stippling',
		name: 'Cinematic Dots',
		technicalName: 'Adaptive Stippling',
		description:
			'Create dramatic film noir effects with sophisticated dot patterns that emphasize lighting, shadows, and atmospheric depth.',
		icon: Sparkles,
		bestFor: 'Cinema & Film',
		features: ['Atmospheric depth', 'Lighting emphasis', 'Dramatic contrast'],
		beforeImage: '/gallery/before/cinema/nosferatu.jpg',
		afterImage: '/gallery/after-webp/cinema/nosferatu(stippling).webp',
		afterSvgPath: 'cinema/nosferatu(stippling).svg',
		color: 'text-purple-600',
		bgGradient: 'from-purple-50 to-indigo-50',
		backend: 'dots',
		preset: 'artistic',
		isAvailable: true
	},
	{
		id: 'gaming-geometric',
		name: 'Gaming Icons',
		technicalName: 'Superpixel Segmentation',
		description:
			'Transform game characters and assets into modern, geometric art with bold color regions perfect for 2d and 3d characters.',
		icon: Grid3x3,
		bestFor: 'Gaming & Icons',
		features: ['Bold color blocks', 'Clean geometry', 'Unique patterns'],
		beforeImage: '/gallery/before/gaming/conker.webp',
		afterImage: '/gallery/after-webp/gaming/conker(superpixel).webp',
		afterSvgPath: 'gaming/conker(superpixel).svg',
		color: 'text-orange-600',
		bgGradient: 'from-orange-50 to-red-50',
		backend: 'superpixel',
		preset: 'poster',
		isAvailable: true
	},
	{
		id: 'anime-lineart',
		name: 'Anime Line Art',
		technicalName: 'Manga Edge Detection',
		description:
			'Preserve the distinctive style of anime and manga with clean, bold outlines that maintain character design integrity.',
		icon: Layers,
		bestFor: 'Anime & Manga',
		features: ['Character preservation', 'Clean outlines', 'Style consistency'],
		beforeImage: '/gallery/before/anime/anime-girl-sideframe.png',
		afterImage: '/gallery/after-webp/anime/anime-girl-sideframe(edgetracing).webp',
		afterSvgPath: 'anime/anime-girl-sideframe(edgetracing).svg',
		color: 'text-cyan-600',
		bgGradient: 'from-cyan-50 to-blue-50',
		backend: 'edge',
		preset: 'comic',
		isAvailable: true
	},
	{
		id: 'artistic-flame',
		name: 'Abstract Art',
		technicalName: 'Dot Pattern Mapping',
		description:
			'Turn artistic images into stunning stippled masterpieces with organic dot patterns that emphasize texture and fine details.',
		icon: Zap,
		bestFor: 'Abstract Art',
		features: ['Organic patterns', 'High fidelity', 'Textural depth'],
		beforeImage: '/gallery/before/art/inferno.avif',
		afterImage: '/gallery/after-webp/art/inferno(stippling).webp',
		afterSvgPath: 'art/inferno(stippling).svg',
		color: 'text-red-600',
		bgGradient: 'from-red-50 to-orange-50',
		backend: 'dots',
		preset: 'poster',
		isAvailable: true
	},
	{
		id: 'wildlife-detail',
		name: 'Wildlife Details',
		technicalName: 'Fine Edge Tracing',
		description:
			'Capture intricate animal features with precise edge detection that brings out feathers, fur, and natural textures.',
		icon: Image,
		bestFor: 'Nature & Wildlife',
		features: ['Fine texture detail', 'Natural patterns', 'Biological accuracy'],
		beforeImage: '/gallery/before/animals/owl-closeup.avif',
		afterImage: '/gallery/after-webp/animals/owl-closeup(edgetracing).webp',
		afterSvgPath: 'animals/owl-closeup(edgetracing).svg',
		color: 'text-emerald-500',
		bgGradient: 'from-green-50 to-emerald-50',
		backend: 'edge',
		preset: 'sketch',
		isAvailable: true
	},
	{
		id: 'historical-moments',
		name: 'Historical Scenes',
		technicalName: 'Documentary Stippling',
		description:
			'Transform historical photographs into artistic interpretations that preserve the original vision with new artistic flavor.',
		icon: BarChart3,
		bestFor: 'Historical Images',
		features: ['Documentary style', 'Historical preservation', 'Emotional depth'],
		beforeImage: '/gallery/before/history/raising-the-flag-on-iwo-jima.webp',
		afterImage: '/gallery/after-webp/history/raising-the-flag-on-iwo-jima(stippling).webp',
		afterSvgPath: 'history/raising-the-flag-on-iwo-jima(stippling).svg',
		color: 'text-slate-600',
		bgGradient: 'from-slate-50 to-gray-50',
		backend: 'dots',
		preset: 'artistic',
		isAvailable: true
	},
	{
		id: 'sci-fi-landscapes',
		name: 'Sci-Fi Landscapes',
		technicalName: 'Atmospheric Edge Detection',
		description:
			'Create futuristic line art from science fiction scenes, emphasizing architectural details and atmospheric elements.',
		icon: Sparkles,
		bestFor: 'Sci-Fi & Futuristic',
		features: ['Architectural detail', 'Atmospheric depth', 'Futuristic aesthetic'],
		beforeImage: '/gallery/before/cinema/bladerunner-end-sceen.jpg',
		afterImage: '/gallery/after-webp/cinema/bladerunner-end-sceen(edgetracing).webp',
		afterSvgPath: 'cinema/bladerunner-end-sceen(edgetracing).svg',
		color: 'text-violet-600',
		bgGradient: 'from-violet-50 to-purple-50',
		backend: 'edge',
		preset: 'technical',
		isAvailable: true
	},
	{
		id: 'character-design',
		name: 'Character Design',
		technicalName: 'Creative Stippling',
		description:
			'Transform character artwork and illustrations into unique stippled designs perfect for creative projects and portfolios.',
		icon: Palette,
		bestFor: 'Character Art',
		features: ['Creative expression', 'Unique aesthetics', 'Portfolio ready'],
		beforeImage: '/gallery/before/portraits-fictional/Peileppe_Rogue_character.webp',
		afterImage: '/gallery/after-webp/portraits-fictional/Peileppe_Rogue_character(stippling).webp',
		afterSvgPath: 'portraits-fictional/Peileppe_Rogue_character(stippling).svg',
		color: 'text-pink-600',
		bgGradient: 'from-pink-50 to-rose-50',
		backend: 'dots',
		preset: 'comic',
		isAvailable: true
	},
	{
		id: 'technical-precision',
		name: 'Technical Precision',
		technicalName: 'Detailed Stippling',
		description:
			'Transform anime portraits into precise, detailed artwork with sophisticated dot patterns that capture fine facial features and character design elements.',
		icon: BarChart3,
		bestFor: 'Anime & Character Art',
		features: ['Fine detail capture', 'Character preservation', 'Professional quality'],
		beforeImage: '/gallery/before/anime/anime-girl-portrait.png',
		afterImage: '/gallery/after-webp/anime/anime-girl-portrait(stippling).webp',
		afterSvgPath: 'anime/anime-girl-portrait(stippling).svg',
		color: 'text-blue-600',
		bgGradient: 'from-blue-50 to-indigo-50',
		backend: 'dots',
		preset: 'technical',
		isAvailable: true
	},
	{
		id: 'vibrant-wildlife',
		name: 'Vibrant Nature',
		technicalName: 'Color-Rich Stippling',
		description:
			'Bring out the natural colors and patterns in wildlife photography with vibrant, expressive dot patterns.',
		icon: Image,
		bestFor: 'Colorful Wildlife',
		features: ['Color preservation', 'Natural vibrancy', 'Organic textures'],
		beforeImage: '/gallery/before/animals/beta-fish.avif',
		afterImage: '/gallery/after-webp/animals/beta-fish(stippling).webp',
		afterSvgPath: 'animals/beta-fish(stippling).svg',
		color: 'text-teal-600',
		bgGradient: 'from-teal-50 to-cyan-50',
		backend: 'dots',
		preset: 'sketch',
		isAvailable: true
	},
	{
		id: 'space-exploration',
		name: 'Space & Exploration',
		technicalName: 'Historic Line Tracing',
		description:
			'Convert iconic space exploration images into inspiring line art that celebrates human achievement and discovery.',
		icon: Sparkles,
		bestFor: 'Space & Science',
		features: ['Inspirational themes', 'Historic preservation', 'Scientific accuracy'],
		beforeImage: '/gallery/before/history/moon-landing.webp',
		afterImage: '/gallery/after-webp/history/moon-landing(edgetracing).webp',
		afterSvgPath: 'history/moon-landing(edgetracing).svg',
		color: 'text-indigo-600',
		bgGradient: 'from-indigo-50 to-blue-50',
		backend: 'edge',
		preset: 'sketch',
		isAvailable: true
	},
	{
		id: 'modern-portraits',
		name: 'Modern Portraits',
		technicalName: 'Superpixel Portrait',
		description:
			'Create contemporary, stylized portraits with geometric color regions that work beautifully for modern art and design.',
		icon: Grid3x3,
		bestFor: 'Modern Design',
		features: ['Contemporary style', 'Color blocking', 'Design friendly'],
		beforeImage: '/gallery/before/portraits-real/pool-hall.avif',
		afterImage: '/gallery/after-webp/portraits-real/pool-hall(superpixel).webp',
		afterSvgPath: 'portraits-real/pool-hall(superpixel).svg',
		color: 'text-amber-600',
		bgGradient: 'from-amber-50 to-yellow-50',
		backend: 'superpixel',
		preset: 'poster',
		isAvailable: true
	},
	{
		id: 'artistic-plants',
		name: 'Botanical Art',
		technicalName: 'Organic Segmentation',
		description:
			'Transform botanical images into elegant, scientific-style illustrations with clean geometric forms and natural beauty.',
		icon: Layers,
		bestFor: 'Botanical Studies',
		features: ['Pattern preservation', 'Natural forms', 'Educational value'],
		beforeImage: '/gallery/before/art/erbario-plant.avif',
		afterImage: '/gallery/after-webp/art/erbario-plant(superpixel).webp',
		afterSvgPath: 'art/erbario-plant(superpixel).svg',
		color: 'text-green-600',
		bgGradient: 'from-green-50 to-lime-50',
		backend: 'superpixel',
		preset: 'poster',
		isAvailable: true
	},
	{
		id: 'retro-gaming',
		name: 'Retro Gaming',
		technicalName: 'Pixel-Perfect Tracing',
		description:
			'Convert retro gaming assets into clean, vectorized line art perfect for modern game development and pixel art appreciation.',
		icon: Grid3x3,
		bestFor: 'Retro Gaming',
		features: ['Pixel perfect', 'Gaming nostalgia', 'Vector scalability'],
		beforeImage: '/gallery/before/gaming/minecraft_bee.webp',
		afterImage: '/gallery/after-webp/gaming/minecraft_bee(edgetracing).webp',
		afterSvgPath: 'gaming/minecraft_bee(edgetracing).svg',
		color: 'text-yellow-600',
		bgGradient: 'from-yellow-50 to-amber-50',
		backend: 'edge',
		preset: 'technical',
		isAvailable: true
	}
];

// Helper function to get showcase by ID
export function getShowcaseById(id: string): ShowcaseAlgorithm | undefined {
	return showcaseAlgorithms.find(alg => alg.id === id);
}

// Helper function to get available showcases only
export function getAvailableShowcases(): ShowcaseAlgorithm[] {
	return showcaseAlgorithms.filter(alg => alg.isAvailable);
}

// Helper function to construct SVG API URL
export function getSvgApiUrl(showcase: ShowcaseAlgorithm): string {
	if (!showcase.afterSvgPath) return '';
	return `/api/svg/${showcase.afterSvgPath}`;
}