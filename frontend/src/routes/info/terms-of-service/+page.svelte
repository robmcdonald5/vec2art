<script lang="ts">
	import {
		Scale,
		Users,
		AlertTriangle,
		Server,
		FileText,
		Shield
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>Terms of Service | vec2art</title>
	<meta
		name="description"
		content="Terms of Service for vec2art - Usage rights, responsibilities, and service conditions."
	/>
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
					Terms of Service
				</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					Clear terms for using vec2art - Free for personal use.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<div
						class="flex items-center gap-2 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
					>
						<Users class="h-4 w-4" />
						Free Personal
					</div>
					<div
						class="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
					>
						<Scale class="h-4 w-4" />
						No Account Required
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Terms of Service Content -->
	<section class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Scale class="text-ferrari-600 mx-auto mb-4 h-12 w-12" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Terms of Service</h2>
				<p class="text-lg text-gray-600">Last updated: January 2025</p>
			</div>

			<div class="space-y-8">
				<!-- Usage Rights -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Users class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Usage Rights</h3>
					</div>
					<div class="prose prose-gray max-w-none">
						<p class="mb-4 text-gray-700">
							vec2art is provided as a base free service for personal use:
						</p>
						<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
							<li>
								<strong>Personal Use:</strong> Create SVG art for personal projects, hobbies, and individual
								creative work
							</li>
							<li>
								<strong>Commercial Use:</strong> For use of vec2art in commercial settings, please refer to our contact page for licensing and API inqueries.
							</li>
							<li>
								<strong>No Account Required:</strong> Access to the base features of the converter is allowed to anyone even without an account.
							</li>
							<li>
								<strong>No Usage Limits:</strong> Convert unlimited images with no direct usage limates. API endpoint(s) to the Converter page is limited dependent on licensing agreement with vec2art.
							</li>
						</ul>
					</div>
				</div>

				<!-- User Responsibilities -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<AlertTriangle class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">User Responsibilities</h3>
					</div>
					<p class="mb-4 text-gray-700">When using vec2art, you agree to:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>Respect Copyright:</strong> Only upload images you own or are considered fair use
						</li>
						<li>
							<strong>Intellectual Property:</strong> Respect third-party trademarks, copyrights, and
							intellectual property rights
						</li>
						<li>
							<strong>No Harmful Content:</strong> Do not process images containing illegal, harmful,
							or inappropriate content
						</li>
						<li>
							<strong>No Abuse:</strong> Do not attempt to reverse engineer, hack, or disrupt the service
						</li>
					</ul>
				</div>

				<!-- Service Availability -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Server class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Service Availability</h3>
					</div>
					<p class="mb-4 text-gray-700">Regarding service availability and reliability:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>Best Effort:</strong> We strive to maintain high availability but cannot guarantee
							100% uptime
						</li>
						<li>
							<strong>Browser Requirements:</strong> Service requires a modern browser with WebAssembly
							support
						</li>
						<li>
							<strong>Local Processing:</strong> Once loaded, the service works offline for core functionality
						</li>
						<li>
							<strong>Updates:</strong> We may update the service with new features and improvements
						</li>
					</ul>
				</div>

				<!-- Intellectual Property -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<FileText class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Intellectual Property</h3>
					</div>
					<p class="mb-4 text-gray-700">Rights and ownership:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>Your Content:</strong> You retain all rights to images you upload and SVGs you
							create
						</li>
						<li>
							<strong>Our Software:</strong> vec2art's algorithms, code, and interface remain our intellectual
							property
						</li>
						<li>
							<strong>No Claims:</strong> We make no claims to your creative output or generated SVGs
						</li>
					</ul>
				</div>

				<!-- Limitation of Liability -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<Shield class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Limitation of Liability</h3>
					</div>
					<p class="mb-4 text-gray-700">Legal limitations and disclaimers:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>As-Is Service:</strong> vec2art is provided "as is" without warranties of any kind
						</li>
						<li>
							<strong>No Damages:</strong> We are not liable for any direct, indirect, or consequential
							damages to uploaded images
						</li>
						<li>
							<strong>User Responsibility:</strong> Users are responsible for backing up important work
						</li>
						<li>
							<strong>Local Processing:</strong> Since processing is local, data loss is limited to browser
							issues
						</li>
					</ul>
				</div>

				<!-- Modifications to Terms -->
				<div>
					<div class="mb-4 flex items-center gap-3">
						<FileText class="text-ferrari-600 h-6 w-6" />
						<h3 class="text-xl font-semibold text-gray-900">Modifications to Terms</h3>
					</div>
					<p class="mb-4 text-gray-700">How we handle changes to these terms:</p>
					<ul class="ml-4 list-inside list-disc space-y-2 text-gray-700">
						<li>
							<strong>Notice of Changes:</strong> We will notify account holding users of material changes to these terms
						</li>
						<li>
							<strong>Effective Date:</strong> Changes become effective 30 days after notification
						</li>
						<li>
							<strong>Continued Use:</strong> Using the service after changes constitutes acceptance
						</li>
						<li>
							<strong>Version History:</strong> Previous versions of terms are available on request
						</li>
					</ul>
				</div>

				<!-- Contact Information -->
				<div class="border-ferrari-500 rounded-lg border-l-4 bg-white p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">Questions About These Terms?</h3>
					<p class="mb-4 text-gray-700">
						If you have questions about these Terms of Service or need clarification on any points,
						please contact us via our contact page
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Navigation Links -->
	<section class="bg-white py-8">
		<div class="mx-auto max-w-4xl px-4 text-center md:px-6 lg:px-8">
			<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
				<a
					href="/info/privacy-policy"
					class="text-ferrari-600 hover:text-ferrari-700 hover:bg-ferrari-50 flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-sm"
				>
					<Shield class="h-4 w-4" />
					Privacy Policy
				</a>
				<button
					onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					class="text-ferrari-600 hover:text-ferrari-700 hover:bg-ferrari-50 inline-flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer"
				>
					<Scale class="h-4 w-4" />
					Back to Top
				</button>
			</div>
		</div>
	</section>
</div>