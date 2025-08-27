<script lang="ts">
	import { Shield, Lock, Server, Eye, Cookie, FileText, Scale, Users, AlertTriangle, Github } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy & Terms of Service | vec2art</title>
	<meta name="description" content="Privacy Policy and Terms of Service for vec2art - Complete local processing, zero data collection, and transparent practices." />
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
					Privacy Policy & Terms of Service
				</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					Transparent practices built on privacy-first principles. Your images never leave your device.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<div class="flex items-center gap-2 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
						<Shield class="h-4 w-4" />
						100% Local Processing
					</div>
					<div class="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
						<Lock class="h-4 w-4" />
						Zero Server Uploads
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Quick Navigation -->
	<section class="bg-section-elevated py-8">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-8">
				<a href="#privacy-policy" class="flex items-center gap-2 text-ferrari-600 hover:text-ferrari-700 transition-colors">
					<Shield class="h-4 w-4" />
					Privacy Policy
				</a>
				<a href="#terms-of-service" class="flex items-center gap-2 text-ferrari-600 hover:text-ferrari-700 transition-colors">
					<Scale class="h-4 w-4" />
					Terms of Service
				</a>
			</div>
		</div>
	</section>

	<!-- Privacy Policy Section -->
	<section id="privacy-policy" class="bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Shield class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Privacy Policy</h2>
				<p class="text-lg text-gray-600">
					Last updated: January 2025
				</p>
			</div>

			<div class="space-y-8">
				<!-- Complete Local Processing -->
				<div class="border-l-4 border-ferrari-500 bg-ferrari-50 p-6 rounded-r-lg">
					<div class="flex items-start gap-4">
						<Server class="h-6 w-6 text-ferrari-600 mt-1 flex-shrink-0" />
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">Complete Local Processing</h3>
							<p class="text-gray-700 mb-3">
								vec2art operates entirely within your browser using WebAssembly (WASM) technology. All image processing, conversion algorithms, and file handling occur locally on your device.
							</p>
							<p class="text-gray-700 font-medium">
								<strong>Your images never leave your device.</strong> We have no servers that receive, store, or process your uploaded images.
							</p>
						</div>
					</div>
				</div>

				<!-- Data Collection -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Eye class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Data Collection</h3>
					</div>
					<div class="prose prose-gray max-w-none">
						<p class="text-gray-700 mb-4">We collect minimal data to improve our service:</p>
						<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
							<li><strong>Usage Analytics:</strong> Basic usage statistics via Vercel Analytics (page views, performance metrics)</li>
							<li><strong>Technical Data:</strong> Browser type, device capabilities, and error reports for debugging</li>
							<li><strong>No Personal Data:</strong> We do not collect names, email addresses, or any personally identifiable information</li>
							<li><strong>No Image Data:</strong> Your uploaded images are never transmitted to our servers</li>
						</ul>
					</div>
				</div>

				<!-- Local Storage -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<FileText class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Local Storage</h3>
					</div>
					<p class="text-gray-700 mb-4">We use your browser's local storage for:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li>Saving your algorithm preferences and settings</li>
						<li>Storing theme preferences (light/dark mode)</li>
						<li>Caching conversion history for quick access</li>
						<li>Remembering your export format preferences</li>
					</ul>
					<p class="text-gray-700 mt-4">
						This data never leaves your browser and can be cleared through your browser settings at any time.
					</p>
				</div>

				<!-- Cookies -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Cookie class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Cookies</h3>
					</div>
					<p class="text-gray-700 mb-4">We use minimal cookies for:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>Analytics:</strong> Vercel Analytics uses cookies to track usage patterns</li>
						<li><strong>Preferences:</strong> Storing your theme and setting preferences</li>
						<li><strong>No Tracking:</strong> We do not use advertising or social media tracking cookies</li>
					</ul>
				</div>

				<!-- Open Source Transparency -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Github class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Open Source Transparency</h3>
					</div>
					<p class="text-gray-700 mb-4">
						vec2art is built with transparency in mind. Our code is available for review, ensuring you can verify our privacy claims.
					</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li>Core algorithms written in Rust for performance and security</li>
						<li>WebAssembly compilation ensures code integrity</li>
						<li>No hidden network requests or data transmission</li>
						<li>Community-driven development with public contributions</li>
					</ul>
				</div>

				<!-- Your Rights -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Users class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Your Rights</h3>
					</div>
					<p class="text-gray-700 mb-4">Since we don't collect personal data, you have complete control:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li>Clear local storage data at any time through browser settings</li>
						<li>Use the service without creating accounts or providing personal information</li>
						<li>Block analytics cookies without affecting core functionality</li>
						<li>Access and use the service completely offline after initial load</li>
					</ul>
				</div>

				<!-- Contact -->
				<div class="bg-gray-50 p-6 rounded-lg">
					<h3 class="text-xl font-semibold text-gray-900 mb-4">Questions About Privacy?</h3>
					<p class="text-gray-700">
						If you have questions about our privacy practices, please contact us through our GitHub repository or support channels.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Terms of Service Section -->
	<section id="terms-of-service" class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Scale class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Terms of Service</h2>
				<p class="text-lg text-gray-600">
					Last updated: January 2025
				</p>
			</div>

			<div class="space-y-8">
				<!-- Usage Rights -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Users class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Usage Rights</h3>
					</div>
					<div class="prose prose-gray max-w-none">
						<p class="text-gray-700 mb-4">vec2art is provided as a free service for both personal and commercial use:</p>
						<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
							<li><strong>Personal Use:</strong> Create SVG art for personal projects, hobbies, and individual creative work</li>
							<li><strong>Commercial Use:</strong> Use generated SVGs in commercial projects, marketing materials, and business applications</li>
							<li><strong>No Account Required:</strong> Full access to all features without registration</li>
							<li><strong>No Usage Limits:</strong> Convert unlimited images with no restrictions</li>
						</ul>
					</div>
				</div>

				<!-- User Responsibilities -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<AlertTriangle class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">User Responsibilities</h3>
					</div>
					<p class="text-gray-700 mb-4">When using vec2art, you agree to:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>Respect Copyright:</strong> Only upload images you own or have permission to modify</li>
						<li><strong>Intellectual Property:</strong> Respect third-party trademarks, copyrights, and intellectual property rights</li>
						<li><strong>Lawful Use:</strong> Use the service only for legal purposes in your jurisdiction</li>
						<li><strong>No Harmful Content:</strong> Do not process images containing illegal, harmful, or inappropriate content</li>
						<li><strong>No Abuse:</strong> Do not attempt to reverse engineer, hack, or disrupt the service</li>
					</ul>
				</div>

				<!-- Service Availability -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Server class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Service Availability</h3>
					</div>
					<p class="text-gray-700 mb-4">Regarding service availability and reliability:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>Best Effort:</strong> We strive to maintain high availability but cannot guarantee 100% uptime</li>
						<li><strong>Browser Requirements:</strong> Service requires a modern browser with WebAssembly support</li>
						<li><strong>Local Processing:</strong> Once loaded, the service works offline for core functionality</li>
						<li><strong>Updates:</strong> We may update the service with new features and improvements</li>
					</ul>
				</div>

				<!-- Intellectual Property -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<FileText class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Intellectual Property</h3>
					</div>
					<p class="text-gray-700 mb-4">Rights and ownership:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>Your Content:</strong> You retain all rights to images you upload and SVGs you create</li>
						<li><strong>Our Software:</strong> vec2art's algorithms, code, and interface remain our intellectual property</li>
						<li><strong>Open Source:</strong> Portions of our code are open source under respective licenses</li>
						<li><strong>No Claims:</strong> We make no claims to your creative output or generated SVGs</li>
					</ul>
				</div>

				<!-- Limitation of Liability -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<Shield class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Limitation of Liability</h3>
					</div>
					<p class="text-gray-700 mb-4">Legal limitations and disclaimers:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>As-Is Service:</strong> vec2art is provided "as is" without warranties of any kind</li>
						<li><strong>No Damages:</strong> We are not liable for any direct, indirect, or consequential damages</li>
						<li><strong>User Responsibility:</strong> Users are responsible for backing up important work</li>
						<li><strong>Local Processing:</strong> Since processing is local, data loss is limited to browser issues</li>
					</ul>
				</div>

				<!-- Modifications to Terms -->
				<div>
					<div class="flex items-center gap-3 mb-4">
						<FileText class="h-6 w-6 text-ferrari-600" />
						<h3 class="text-xl font-semibold text-gray-900">Modifications to Terms</h3>
					</div>
					<p class="text-gray-700 mb-4">How we handle changes to these terms:</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li><strong>Notice of Changes:</strong> We will notify users of material changes to these terms</li>
						<li><strong>Effective Date:</strong> Changes become effective 30 days after notification</li>
						<li><strong>Continued Use:</strong> Using the service after changes constitutes acceptance</li>
						<li><strong>Version History:</strong> Previous versions of terms are available on request</li>
					</ul>
				</div>

				<!-- Contact Information -->
				<div class="bg-white p-6 rounded-lg border-l-4 border-ferrari-500">
					<h3 class="text-xl font-semibold text-gray-900 mb-4">Questions About These Terms?</h3>
					<p class="text-gray-700 mb-4">
						If you have questions about these Terms of Service or need clarification on any points, please contact us through:
					</p>
					<ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
						<li>GitHub repository for technical questions and issues</li>
						<li>Support channels for general inquiries</li>
						<li>Community forums for user discussions</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- Back to Top -->
	<section class="bg-white py-8">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 text-center">
			<a href="#" class="inline-flex items-center gap-2 text-ferrari-600 hover:text-ferrari-700 transition-colors">
				<Shield class="h-4 w-4" />
				Back to Top
			</a>
		</div>
	</section>
</div>