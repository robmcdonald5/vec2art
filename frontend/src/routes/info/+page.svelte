<script lang="ts">
	import {
		Shield,
		Scale,
		ArrowRight,
		FileText,
		Users
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>Legal Information | vec2art</title>
	<meta
		name="description"
		content="Privacy Policy and Terms of Service for vec2art - Complete local processing, zero data collection, and transparent practices."
	/>
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
					Legal Information
				</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					Learn about our privacy practices and terms of service. Built on privacy-first principles with complete transparency.
				</p>
			</div>
		</div>
	</section>

	<!-- Legal Information Cards -->
	<section class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Privacy Policy Card -->
				<a
					href="/info/privacy-policy"
					class="group block rounded-2xl bg-white p-8 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
				>
					<div class="text-center">
						<div class="text-ferrari-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100">
							<Shield class="h-8 w-8" />
						</div>
						<h2 class="mb-4 text-2xl font-bold text-gray-900">Privacy Policy</h2>
						<p class="mb-6 text-gray-600">
							Learn about our privacy-first approach. Your images never leave your device with complete local processing.
						</p>
						<div class="flex flex-wrap justify-center gap-2 mb-6">
							<span class="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
								100% Local Processing
							</span>
							<span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
								Zero Data Collection
							</span>
						</div>
						<div class="text-ferrari-600 group-hover:text-ferrari-700 flex items-center justify-center gap-2 font-medium transition-colors">
							Read Privacy Policy
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</div>
					</div>
				</a>

				<!-- Terms of Service Card -->
				<a
					href="/info/terms-of-service"
					class="group block rounded-2xl bg-white p-8 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
				>
					<div class="text-center">
						<div class="text-ferrari-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100">
							<Scale class="h-8 w-8" />
						</div>
						<h2 class="mb-4 text-2xl font-bold text-gray-900">Terms of Service</h2>
						<p class="mb-6 text-gray-600">
							Understand your rights and our service terms. Free for personal and commercial use with clear guidelines.
						</p>
						<div class="flex flex-wrap justify-center gap-2 mb-6">
							<span class="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
								Free Commercial Use
							</span>
							<span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
								No Account Required
							</span>
						</div>
						<div class="text-ferrari-600 group-hover:text-ferrari-700 flex items-center justify-center gap-2 font-medium transition-colors">
							Read Terms of Service
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</div>
					</div>
				</a>
			</div>
		</div>
	</section>

	<!-- Summary Section -->
	<section class="bg-white py-16">
		<div class="mx-auto max-w-4xl px-4 text-center md:px-6 lg:px-8">
			<div class="mb-8">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">Privacy-First by Design</h2>
				<p class="mx-auto max-w-2xl text-lg text-gray-600">
					vec2art is built with your privacy as the top priority. Every design decision prioritizes keeping your data secure and under your control.
				</p>
			</div>
			
			<div class="grid gap-6 sm:grid-cols-3">
				<div class="rounded-lg bg-green-50 p-6">
					<Shield class="text-ferrari-600 mx-auto mb-3 h-8 w-8" />
					<h3 class="mb-2 font-semibold text-gray-900">Local Processing</h3>
					<p class="text-sm text-gray-600">All image processing happens in your browser</p>
				</div>
				<div class="rounded-lg bg-blue-50 p-6">
					<FileText class="text-ferrari-600 mx-auto mb-3 h-8 w-8" />
					<h3 class="mb-2 font-semibold text-gray-900">Open Source</h3>
					<p class="text-sm text-gray-600">Transparent code you can review and verify</p>
				</div>
				<div class="rounded-lg bg-purple-50 p-6">
					<Users class="text-ferrari-600 mx-auto mb-3 h-8 w-8" />
					<h3 class="mb-2 font-semibold text-gray-900">Your Rights</h3>
					<p class="text-sm text-gray-600">Complete control over your data and privacy</p>
				</div>
			</div>
		</div>
	</section>
</div>
