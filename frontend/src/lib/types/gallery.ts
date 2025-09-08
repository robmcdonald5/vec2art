export interface GalleryItem {
	id: number;
	title: string;
	algorithm: string;
	algorithmKey: string;
	category: string;
	beforeImage: string;
	afterImage: string;
	afterSvg: string;
	dimensions: string;
	fileSize: string;
	svgSize: string;
}

export interface GalleryCategory {
	name: string;
	count: number;
}

export interface GalleryManifest {
	generated: string;
	totalImages: number;
	categories: Record<string, GalleryCategory>;
	items: GalleryItem[];
}

export type AlgorithmFilter = 'all' | 'edgetracing' | 'stippling' | 'superpixel' | 'centerline';
export type ViewMode = 'grid' | 'list';

export interface GalleryFilters {
	search: string;
	category: string;
	algorithm: AlgorithmFilter;
}