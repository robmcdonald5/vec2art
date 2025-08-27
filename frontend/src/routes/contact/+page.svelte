<script lang="ts">
	import { MessageCircle, Bug, Lightbulb, Building2, Users, Mail, Github, ExternalLink, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Contact Us | vec2art</title>
	<meta name="description" content="Get help, report issues, or reach out for business inquiries. Multiple ways to connect with the vec2art team for technical support and partnerships." />
</svelte:head>

<div class="min-h-screen">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
					Contact Us
				</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					Get help with technical issues, explore business opportunities, or join our growing community. We're here to help with all your vectorization needs.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<div class="flex items-center gap-2 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
						<Clock class="h-4 w-4" />
						24-48h Response Time
					</div>
					<div class="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
						<Users class="h-4 w-4" />
						Active Community Support
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Quick Navigation -->
	<section class="bg-section-elevated py-8">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
				<a href="#technical-support" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<Bug class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">Technical</span>
				</a>
				<a href="#business-inquiries" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<Building2 class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">Business</span>
				</a>
				<a href="#bug-reports" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<AlertCircle class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">Bug Reports</span>
				</a>
				<a href="#feature-requests" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<Lightbulb class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">Features</span>
				</a>
				<a href="#community" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<Users class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">Community</span>
				</a>
				<a href="#general-contact" class="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center transition-colors hover:border-ferrari-300 hover:bg-ferrari-50">
					<Mail class="h-6 w-6 text-ferrari-600" />
					<span class="text-sm font-medium text-gray-900">General</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Technical Support Section -->
	<section id="technical-support" class="bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Bug class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Technical Support</h2>
				<p class="text-lg text-gray-600">
					Having trouble with processing, performance, or browser compatibility?
				</p>
			</div>

			<div class="space-y-8">
				<!-- Common Issues -->
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">Common Issues & Solutions</h3>
					<div class="space-y-4">
						<div class="flex gap-4">
							<CheckCircle class="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
							<div>
								<h4 class="font-medium text-gray-900">WASM Loading Failures</h4>
								<p class="text-sm text-gray-600">Enable Cross-Origin Isolation in your browser or try a different browser. Chrome and Firefox work best.</p>
							</div>
						</div>
						<div class="flex gap-4">
							<CheckCircle class="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
							<div>
								<h4 class="font-medium text-gray-900">Slow Processing</h4>
								<p class="text-sm text-gray-600">Reduce image size or enable multithreading. Large images (>2MB) may take longer to process.</p>
							</div>
						</div>
						<div class="flex gap-4">
							<CheckCircle class="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
							<div>
								<h4 class="font-medium text-gray-900">Poor Output Quality</h4>
								<p class="text-sm text-gray-600">Try different algorithms - Edge Detection works best for photos, Centerline for logos and text.</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Contact Methods -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-ferrari-200 bg-ferrari-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Github class="h-5 w-5 text-ferrari-600" />
							GitHub Issues
						</h3>
						<p class="mb-4 text-gray-700">
							For technical problems, bugs, or compatibility issues. Please include your browser version and system details.
						</p>
						<a
							href="https://github.com/vec2art/vec2art/issues"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-md bg-ferrari-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ferrari-700"
						>
							<ExternalLink class="h-4 w-4" />
							Open GitHub Issue
						</a>
					</div>

					<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<MessageCircle class="h-5 w-5 text-blue-600" />
							Community Support
						</h3>
						<p class="mb-4 text-gray-700">
							Get help from other users and share solutions in our community discussions.
						</p>
						<a
							href="https://github.com/vec2art/vec2art/discussions"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							<ExternalLink class="h-4 w-4" />
							Join Discussions
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Business Inquiries Section -->
	<section id="business-inquiries" class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Building2 class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Business Inquiries</h2>
				<p class="text-lg text-gray-600">
					Interested in partnerships, commercial licensing, or custom development?
				</p>
			</div>

			<div class="space-y-8">
				<!-- Business Opportunities -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="card-ferrari-interactive group rounded-3xl p-6">
						<div class="relative">
							<h3 class="mb-3 text-xl font-semibold text-gray-900">Commercial Licensing</h3>
							<p class="mb-4 text-gray-700">
								Enterprise licenses for commercial use, white-label solutions, and API integration opportunities.
							</p>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>Custom branding and deployment</li>
								<li>API access and documentation</li>
								<li>Priority support and SLA</li>
								<li>Custom algorithm development</li>
							</ul>
						</div>
						<div class="from-ferrari-25/0 to-ferrari-50/0 group-hover:from-ferrari-25/30 group-hover:to-ferrari-50/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"></div>
					</div>

					<div class="card-ferrari-interactive group rounded-3xl p-6">
						<div class="relative">
							<h3 class="mb-3 text-xl font-semibold text-gray-900">Partnership Opportunities</h3>
							<p class="mb-4 text-gray-700">
								Strategic partnerships, integration opportunities, and collaborative development projects.
							</p>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>Platform integrations</li>
								<li>Technology partnerships</li>
								<li>Research collaborations</li>
								<li>Distribution partnerships</li>
							</ul>
						</div>
						<div class="from-ferrari-25/0 to-ferrari-50/0 group-hover:from-ferrari-25/30 group-hover:to-ferrari-50/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"></div>
					</div>
				</div>

				<!-- Contact Information -->
				<div class="border-l-4 border-ferrari-500 bg-ferrari-50 p-6 rounded-r-lg">
					<div class="flex items-start gap-4">
						<Mail class="h-6 w-6 text-ferrari-600 mt-1 flex-shrink-0" />
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">Business Contact</h3>
							<p class="text-gray-700 mb-3">
								For business inquiries, partnerships, and commercial licensing, please reach out directly:
							</p>
							<div class="space-y-2 text-gray-700">
								<div>
									<span class="font-medium">Email:</span> 
									<a href="mailto:business@vec2art.com" class="text-ferrari-600 hover:text-ferrari-700">business@vec2art.com</a>
								</div>
								<div>
									<span class="font-medium">Response Time:</span> 
									<span class="text-green-700">1-2 business days</span>
								</div>
								<div>
									<span class="font-medium">Include:</span> 
									<span>Company name, use case, and project scope</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Bug Reports Section -->
	<section id="bug-reports" class="bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<AlertCircle class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Bug Reports</h2>
				<p class="text-lg text-gray-600">
					Found a bug? Help us fix it by providing detailed information.
				</p>
			</div>

			<div class="space-y-8">
				<!-- Bug Report Template -->
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">Bug Report Information</h3>
					<p class="mb-4 text-gray-700">When reporting a bug, please include the following information:</p>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="font-medium text-gray-900 mb-2">System Information</h4>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>Browser name and version</li>
								<li>Operating system</li>
								<li>Device type (desktop/mobile)</li>
								<li>Available memory/RAM</li>
							</ul>
						</div>
						<div>
							<h4 class="font-medium text-gray-900 mb-2">Bug Details</h4>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>Steps to reproduce the bug</li>
								<li>Expected vs actual behavior</li>
								<li>Image size and format</li>
								<li>Algorithm and settings used</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Reporting Methods -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-ferrari-200 bg-ferrari-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Github class="h-5 w-5 text-ferrari-600" />
							GitHub Issues (Preferred)
						</h3>
						<p class="mb-4 text-gray-700">
							Create a detailed issue report on GitHub with all the information above. Use our bug report template.
						</p>
						<a
							href="https://github.com/vec2art/vec2art/issues/new?template=bug_report.md"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-md bg-ferrari-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ferrari-700"
						>
							<AlertCircle class="h-4 w-4" />
							Report Bug on GitHub
						</a>
					</div>

					<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Mail class="h-5 w-5 text-gray-600" />
							Email Reports
						</h3>
						<p class="mb-4 text-gray-700">
							For sensitive issues or if you can't use GitHub, send bug reports via email.
						</p>
						<a
							href="mailto:bugs@vec2art.com?subject=Bug%20Report&body=Please%20include%20system%20info%20and%20steps%20to%20reproduce"
							class="inline-flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
						>
							<Mail class="h-4 w-4" />
							Email Bug Report
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature Requests Section -->
	<section id="feature-requests" class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Lightbulb class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Feature Requests</h2>
				<p class="text-lg text-gray-600">
					Have an idea for improving vec2art? We'd love to hear your suggestions!
				</p>
			</div>

			<div class="space-y-8">
				<!-- Feature Ideas -->
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">What Makes a Good Feature Request?</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h4 class="font-medium text-gray-900 mb-2">Clear Description</h4>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>What the feature does</li>
								<li>Why it would be useful</li>
								<li>Who would benefit from it</li>
								<li>How it fits with existing features</li>
							</ul>
						</div>
						<div>
							<h4 class="font-medium text-gray-900 mb-2">Implementation Details</h4>
							<ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
								<li>UI/UX mockups or descriptions</li>
								<li>Technical considerations</li>
								<li>Similar features in other tools</li>
								<li>Priority level and urgency</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Request Methods -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-ferrari-200 bg-ferrari-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Github class="h-5 w-5 text-ferrari-600" />
							GitHub Feature Request
						</h3>
						<p class="mb-4 text-gray-700">
							Submit a feature request on GitHub using our template. Track progress and join discussions.
						</p>
						<a
							href="https://github.com/vec2art/vec2art/issues/new?template=feature_request.md"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-md bg-ferrari-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ferrari-700"
						>
							<Lightbulb class="h-4 w-4" />
							Request Feature
						</a>
					</div>

					<div class="rounded-lg border border-green-200 bg-green-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Users class="h-5 w-5 text-green-600" />
							Community Discussion
						</h3>
						<p class="mb-4 text-gray-700">
							Discuss ideas with the community first. Get feedback and refine your proposal.
						</p>
						<a
							href="https://github.com/vec2art/vec2art/discussions/categories/feature-ideas"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
						>
							<MessageCircle class="h-4 w-4" />
							Discuss Ideas
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Community Section -->
	<section id="community" class="bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Users class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Community</h2>
				<p class="text-lg text-gray-600">
					Join our growing community of developers, designers, and vectorization enthusiasts.
				</p>
			</div>

			<div class="space-y-8">
				<!-- Community Platforms -->
				<div class="grid gap-6 md:grid-cols-3">
					<div class="text-center rounded-lg border border-gray-200 p-6">
						<Github class="mx-auto mb-4 h-8 w-8 text-ferrari-600" />
						<h3 class="mb-2 text-lg font-semibold text-gray-900">GitHub</h3>
						<p class="mb-4 text-sm text-gray-600">Contribute code, report issues, and track development</p>
						<a
							href="https://github.com/vec2art/vec2art"
							target="_blank"
							rel="noopener noreferrer"
							class="text-ferrari-600 hover:text-ferrari-700 text-sm font-medium"
						>
							Visit Repository
						</a>
					</div>

					<div class="text-center rounded-lg border border-gray-200 p-6">
						<MessageCircle class="mx-auto mb-4 h-8 w-8 text-ferrari-600" />
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Discussions</h3>
						<p class="mb-4 text-sm text-gray-600">Ask questions, share tips, and connect with users</p>
						<a
							href="https://github.com/vec2art/vec2art/discussions"
							target="_blank"
							rel="noopener noreferrer"
							class="text-ferrari-600 hover:text-ferrari-700 text-sm font-medium"
						>
							Join Discussions
						</a>
					</div>

					<div class="text-center rounded-lg border border-gray-200 p-6">
						<FileText class="mx-auto mb-4 h-8 w-8 text-ferrari-600" />
						<h3 class="mb-2 text-lg font-semibold text-gray-900">Documentation</h3>
						<p class="mb-4 text-sm text-gray-600">Learn about algorithms, APIs, and best practices</p>
						<a
							href="https://docs.vec2art.com"
							target="_blank"
							rel="noopener noreferrer"
							class="text-ferrari-600 hover:text-ferrari-700 text-sm font-medium"
						>
							Read Docs
						</a>
					</div>
				</div>

				<!-- Contributing -->
				<div class="border-l-4 border-ferrari-500 bg-ferrari-50 p-6 rounded-r-lg">
					<div class="flex items-start gap-4">
						<Users class="h-6 w-6 text-ferrari-600 mt-1 flex-shrink-0" />
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-2">Contributing to vec2art</h3>
							<p class="text-gray-700 mb-4">
								We welcome contributions from the community! Whether you're a developer, designer, or just passionate about vectorization.
							</p>
							<div class="space-y-2 text-gray-700">
								<div><span class="font-medium">Code Contributions:</span> Rust algorithms, frontend features, performance improvements</div>
								<div><span class="font-medium">Documentation:</span> Tutorials, API docs, best practices guides</div>
								<div><span class="font-medium">Testing:</span> Bug reports, algorithm testing, browser compatibility</div>
								<div><span class="font-medium">Design:</span> UI/UX improvements, icons, examples</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- General Contact Section -->
	<section id="general-contact" class="bg-section-elevated py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="mb-12 text-center">
				<Mail class="mx-auto mb-4 h-12 w-12 text-ferrari-600" />
				<h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">General Contact</h2>
				<p class="text-lg text-gray-600">
					For questions that don't fit the categories above, or just to say hello.
				</p>
			</div>

			<div class="space-y-8">
				<!-- Contact Options -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-ferrari-200 bg-ferrari-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Mail class="h-5 w-5 text-ferrari-600" />
							Email Us
						</h3>
						<p class="mb-4 text-gray-700">
							For general questions, media inquiries, or anything else not covered above.
						</p>
						<div class="space-y-2 text-gray-700">
							<div>
								<span class="font-medium">Email:</span> 
								<a href="mailto:hello@vec2art.com" class="text-ferrari-600 hover:text-ferrari-700">hello@vec2art.com</a>
							</div>
							<div>
								<span class="font-medium">Response Time:</span> 
								<span class="text-green-700">2-3 business days</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
						<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
							<ExternalLink class="h-5 w-5 text-blue-600" />
							Social Media
						</h3>
						<p class="mb-4 text-gray-700">
							Follow us for updates, tips, and community highlights.
						</p>
						<div class="flex gap-4">
							<a
								href="https://x.com/vec2art"
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white transition-all duration-200 hover:scale-105"
							>
								<svg class="h-5 w-5" fill="white" viewBox="0 0 24 24">
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
								</svg>
							</a>
							<a
								href="https://instagram.com/vec2art"
								target="_blank"
								rel="noopener noreferrer"
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
							>
								<svg class="h-5 w-5" fill="white" viewBox="0 0 24 24">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
								</svg>
							</a>
						</div>
					</div>
				</div>

				<!-- FAQ -->
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
					<h3 class="mb-4 text-xl font-semibold text-gray-900">Frequently Asked Questions</h3>
					<p class="mb-4 text-gray-700">Before contacting us, check if your question is answered in our FAQ:</p>
					<div class="space-y-3">
						<div>
							<h4 class="font-medium text-gray-900">Is vec2art free to use?</h4>
							<p class="text-sm text-gray-600">Yes! vec2art is completely free for personal and commercial use. No account required.</p>
						</div>
						<div>
							<h4 class="font-medium text-gray-900">Do my images get uploaded to a server?</h4>
							<p class="text-sm text-gray-600">No. All processing happens locally in your browser using WebAssembly. Your images never leave your device.</p>
						</div>
						<div>
							<h4 class="font-medium text-gray-900">Which image formats are supported?</h4>
							<p class="text-sm text-gray-600">PNG, JPG, JPEG, WebP, TIFF, BMP, and GIF formats are supported.</p>
						</div>
						<div>
							<h4 class="font-medium text-gray-900">Why is processing slow on my device?</h4>
							<p class="text-sm text-gray-600">Processing speed depends on your device's CPU and available memory. Try reducing image size or closing other browser tabs.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Back to Top -->
	<section class="bg-white py-8">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 text-center">
			<a href="#" class="inline-flex items-center gap-2 text-ferrari-600 hover:text-ferrari-700 transition-colors">
				<Mail class="h-4 w-4" />
				Back to Top
			</a>
		</div>
	</section>
</div>