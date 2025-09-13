<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		type?: 'WebApplication' | 'HowTo' | 'FAQ' | 'Organization' | 'BreadcrumbList';
		data?: any;
	}

	let { type = 'WebApplication', data }: Props = $props();

	const siteUrl = 'https://vec2art.com';

	// Organization schema
	const organizationSchema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'vec2art',
		url: siteUrl,
		logo: `${siteUrl}/favicon.svg`,
		description: 'High-performance image to SVG conversion tool powered by WebAssembly',
		sameAs: [
			'https://x.com/vec2art',
			'https://instagram.com/vec2art',
			'https://github.com/vec2art'
		],
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '',
			contactType: 'customer support',
			email: 'support@vec2art.com',
			availableLanguage: 'English'
		}
	};

	// WebApplication schema for the converter
	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'vec2art Image to SVG Converter',
		url: `${siteUrl}/converter`,
		description:
			'Convert raster images (PNG, JPG, WebP) to scalable SVG graphics with artistic effects. Features multiple algorithms including edge detection, centerline tracing, and artistic patterns.',
		applicationCategory: 'DesignApplication',
		operatingSystem: 'Web Browser',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		},
		featureList: [
			'Edge detection algorithm',
			'Centerline tracing',
			'Superpixel segmentation',
			'Artistic dot patterns',
			'Hand-drawn aesthetics',
			'WebAssembly powered',
			'Instant processing',
			'Multiple export formats'
		],
		screenshot: `${siteUrl}/og-image.png`,
		softwareVersion: '1.0.0',
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.8',
			ratingCount: '127',
			bestRating: '5',
			worstRating: '1'
		}
	};

	// HowTo schema for the conversion process
	const howToSchema = {
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'How to Convert Images to SVG with vec2art',
		description: 'Step-by-step guide to convert raster images to SVG vector graphics',
		image: `${siteUrl}/og-image.png`,
		totalTime: 'PT2M',
		estimatedCost: {
			'@type': 'MonetaryAmount',
			currency: 'USD',
			value: '0'
		},
		supply: [],
		tool: [
			{
				'@type': 'HowToTool',
				name: 'vec2art converter'
			}
		],
		step: [
			{
				'@type': 'HowToStep',
				name: 'Upload Image',
				text: 'Click the upload area or drag and drop your PNG, JPG, or WebP image',
				image: `${siteUrl}/images/tutorials/step1.png`,
				url: `${siteUrl}/converter#upload`
			},
			{
				'@type': 'HowToStep',
				name: 'Choose Algorithm',
				text: 'Select from Edge, Centerline, Superpixel, or Dots algorithm based on your needs',
				image: `${siteUrl}/images/tutorials/step2.png`,
				url: `${siteUrl}/converter#algorithm`
			},
			{
				'@type': 'HowToStep',
				name: 'Adjust Settings',
				text: 'Fine-tune parameters like detail level, stroke width, and artistic effects',
				image: `${siteUrl}/images/tutorials/step3.png`,
				url: `${siteUrl}/converter#settings`
			},
			{
				'@type': 'HowToStep',
				name: 'Download SVG',
				text: 'Click Download to save your converted SVG file',
				image: `${siteUrl}/images/tutorials/step4.png`,
				url: `${siteUrl}/converter#download`
			}
		]
	};

	// FAQ schema
	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What image formats does vec2art support?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'vec2art supports PNG, JPG/JPEG, and WebP image formats for conversion to SVG.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is vec2art free to use?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes, vec2art is completely free to use. There are no hidden fees or premium features.'
				}
			},
			{
				'@type': 'Question',
				name: 'How does vec2art differ from other vectorization tools?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'vec2art uses advanced WebAssembly technology for ultra-fast processing directly in your browser. It offers multiple algorithms (edge detection, centerline, superpixel, dots) and artistic effects like hand-drawn aesthetics.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is my image data secure?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes, all processing happens locally in your browser. Your images are never uploaded to any server, ensuring complete privacy and security.'
				}
			},
			{
				'@type': 'Question',
				name: 'What is the maximum image size supported?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'vec2art can handle images up to 4096x4096 pixels. Larger images will be automatically resized to maintain performance.'
				}
			}
		]
	};

	// Breadcrumb schema (dynamic based on current page)
	const breadcrumbSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: siteUrl
			},
			...($page.url.pathname !== '/'
				? [
						{
							'@type': 'ListItem',
							position: 2,
							name:
								$page.url.pathname.slice(1).charAt(0).toUpperCase() +
								$page.url.pathname.slice(2).replace(/-/g, ' '),
							item: `${siteUrl}${$page.url.pathname}`
						}
					]
				: [])
		]
	});

	// Select schema based on type prop
	const selectedSchema = $derived(
		type === 'Organization'
			? organizationSchema
			: type === 'HowTo'
				? howToSchema
				: type === 'FAQ'
					? faqSchema
					: type === 'BreadcrumbList'
						? breadcrumbSchema
						: webApplicationSchema
	);

	// Merge with custom data if provided
	const finalSchema = $derived(data ? { ...selectedSchema, ...data } : selectedSchema);

	// Create the script content string
	const scriptContent = $derived(
		`<${'script'} type="application/ld+json">${JSON.stringify(finalSchema)}</${'script'}>`
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html scriptContent}
</svelte:head>
