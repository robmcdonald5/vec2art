<script lang="ts">
	import {
		Shield,
		Lock,
		Server,
		Eye,
		Cookie,
		FileText,
		Users,
		Github
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy | vec2art</title>
	<meta
		name="description"
		content="Privacy Policy for vec2art - Complete local processing, zero data collection, and transparent practices."
	/>
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
					Privacy Policy
				</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					Transparent practices built on privacy-first principles. Your images never leave your
					device.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<div
						class="flex items-center gap-2 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
					>
						<Shield class="h-4 w-4" />
						100% Local Processing
					</div>
					<div
						class="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
					>
						<Lock class="h-4 w-4" />
						Zero Server Uploads
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Privacy Policy Content -->
	<section class="bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Shield class="text-ferrari-600 mx-auto mb-4 h-12 w-12" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Privacy Policy</h2>
				<p class="text-lg text-gray-600">Last updated: January 2025</p>
			</div>

			<div class="space-y-8">
				<!-- Complete Local Processing -->
				<div class="border-ferrari-500 bg-ferrari-50 rounded-r-lg border-l-4 p-6">
					<div class="flex items-start gap-4">
						<Server class="text-ferrari-600 mt-1 h-6 w-6 flex-shrink-0" />
						<div>
							<h3 class="mb-2 text-xl font-semibold text-gray-900">Complete Local Processing</h3>
							<p class="mb-3 text-gray-700">
								vec2art operates entirely within your browser using WebAssembly (WASM) technology.
								All image processing, conversion algorithms, and file handling occur locally on your
								device.
							</p>
							<p class="font-medium text-gray-700">
								<strong>Your images never leave your device.</strong> We have no servers that receive,
								store, or process your uploaded images.
							</p>
						</div>
					</div>
				</div>

				<!-- Data Collection -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Eye class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Data Collection</h3>
					</div>
					<div class="prose prose-gray max-w-none">
						<p class="mb-4 text-gray-700">We collect minimal data to improve our service:</p>
						<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
							<li>
								<strong>Usage Analytics:</strong> Basic usage statistics via Vercel Analytics (page views,
								performance metrics)
							</li>
							<li>
								<strong>Technical Data:</strong> Browser type, device capabilities, and error reports
								for debugging
							</li>
							<li>
								<strong>No Personal Data:</strong> We do not collect names, email addresses, or any personally
								identifiable information
							</li>
							<li>
								<strong>No Image Data:</strong> Your uploaded images are never transmitted to our servers
							</li>
						</ul>
					</div>
				</div>

				<!-- Local Storage -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<FileText class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Local Storage</h3>
					</div>
					<p class="mb-4 text-gray-700">We use your browser's local storage for:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>Saving your algorithm preferences and settings</li>
						<li>Storing theme preferences (light/dark mode)</li>
						<li>Caching conversion history for quick access</li>
						<li>Remembering your export format preferences</li>
					</ul>
					<p class="mt-4 text-gray-700">
						This data never leaves your browser and can be cleared through your browser settings at
						any time.
					</p>
				</div>

				<!-- Cookies -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Cookie class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Cookies</h3>
					</div>
					<p class="mb-4 text-gray-700">We use minimal cookies for:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>Analytics:</strong> Vercel Analytics uses cookies to track usage patterns
						</li>
						<li><strong>Preferences:</strong> Storing your theme and setting preferences</li>
						<li>
							<strong>No Tracking:</strong> We do not use advertising or social media tracking cookies
						</li>
					</ul>
				</div>

				<!-- Open Source Transparency -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Github class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Open Source Transparency</h3>
					</div>
					<p class="mb-4 text-gray-700">
						vec2art is built with transparency in mind. Our code is available for review, ensuring
						you can verify our privacy claims.
					</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>Core algorithms written in Rust for performance and security</li>
						<li>WebAssembly compilation ensures code integrity</li>
						<li>No hidden network requests or data transmission</li>
						<li>Community-driven development with public contributions</li>
					</ul>
				</div>

				<!-- Your Rights -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Users class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Your Rights</h3>
					</div>
					<p class="mb-4 text-gray-700">
						Since we don't collect personal data, you have complete control:
					</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>Clear local storage data at any time through browser settings</li>
						<li>Use the service without creating accounts or providing personal information</li>
						<li>Block analytics cookies without affecting core functionality</li>
						<li>Access and use the service completely offline after initial load</li>
					</ul>
				</div>

				<!-- Contact -->
				<div class="rounded-lg bg-gray-50 p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">Questions About Privacy?</h3>
					<p class="text-gray-700">
						If you have questions about our privacy practices, please contact us through our GitHub
						repository or support channels.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Navigation Links -->
	<section class="bg-section-elevated py-8">
		<div class="mx-auto max-w-4xl px-4 text-center md:px-6 lg:px-8">
			<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
				<a
					href="/info/terms-of-service"
					class="text-ferrari-600 hover:text-ferrari-700 hover:bg-ferrari-50 flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-sm"
				>
					<FileText class="h-4 w-4" />
					Terms of Service
				</a>
				<button
					onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					class="text-ferrari-600 hover:text-ferrari-700 hover:bg-ferrari-50 inline-flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer"
				>
					<Shield class="h-4 w-4" />
					Back to Top
				</button>
			</div>
		</div>
	</section>
</div>