<script lang="ts">
	import {
		Building2,
		Mail,
		Clock,
		Send,
		User,
		MessageSquare,
		Bug,
		AlertTriangle,
		CheckCircle
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { PUBLIC_FORMSPARK_ENDPOINT_ID, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

	// Form state management
	let selectedCategory = 'general';
	let formData = {
		name: '',
		email: '',
		message: '',
		category: 'general',
		bugType: ''
	};

	// Form validation
	let errors: Record<string, string> = {};
	let isSubmitting = false;
	let isSubmitted = false;

	// Enhanced validation states
	let isEmailValid = false;
	let isMessageValid = false;
	let isNameValid = false;
	let isTurnstileValid = false;

	// Turnstile integration
	let turnstileToken = '';
	let turnstileWidget: any = null;
	// let turnstileLoaded = $state(false);

	// Constants for validation
	const EMAIL_REGEX =
		/^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
	const MIN_MESSAGE_LENGTH = 10;
	const MAX_MESSAGE_LENGTH = 2000;
	const MIN_NAME_LENGTH = 2;

	// System detection
	let systemInfo = {
		browser: '',
		browserVersion: '',
		os: '',
		deviceType: '',
		screenResolution: '',
		cores: '',
		memory: '',
		webAssemblySupport: false,
		sharedArrayBufferSupport: false,
		crossOriginIsolation: false
	};

	// System detection function
	function detectSystemInfo() {
		if (typeof window === 'undefined') return;

		const nav = navigator;
		const userAgent = nav.userAgent;

		// Detect browser and version
		let browser = 'Unknown';
		let browserVersion = '';

		if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
			browser = 'Chrome';
			const match = userAgent.match(/Chrome\/([0-9.]+)/);
			browserVersion = match ? match[1] : '';
		} else if (userAgent.includes('Firefox')) {
			browser = 'Firefox';
			const match = userAgent.match(/Firefox\/([0-9.]+)/);
			browserVersion = match ? match[1] : '';
		} else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
			browser = 'Safari';
			const match = userAgent.match(/Version\/([0-9.]+)/);
			browserVersion = match ? match[1] : '';
		} else if (userAgent.includes('Edg')) {
			browser = 'Edge';
			const match = userAgent.match(/Edg\/([0-9.]+)/);
			browserVersion = match ? match[1] : '';
		}

		// Detect OS
		let os = 'Unknown';
		if (userAgent.includes('Windows')) {
			if (userAgent.includes('Windows NT 10.0')) os = 'Windows 11/10';
			else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
			else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
			else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
			else os = 'Windows';
		} else if (userAgent.includes('Mac OS X')) {
			const match = userAgent.match(/Mac OS X ([0-9_]+)/);
			if (match) {
				const version = match[1].replace(/_/g, '.');
				os = `macOS ${version}`;
			} else {
				os = 'macOS';
			}
		} else if (userAgent.includes('Linux')) {
			if (userAgent.includes('Android')) {
				os = 'Android';
			} else {
				os = 'Linux';
			}
		} else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
			os = 'iOS';
		}

		// Detect device type
		let deviceType = 'Desktop';
		if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
			deviceType = /iPad/i.test(userAgent) ? 'Tablet' : 'Mobile';
		} else if (/Tablet|PlayBook|Silk/i.test(userAgent)) {
			deviceType = 'Tablet';
		}

		// Screen resolution
		const screenResolution = `${screen.width}x${screen.height}`;

		// CPU cores (approximate)
		const cores = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cores` : 'Unknown';

		// Memory (approximate, in GB)
		let memory = 'Unknown';
		if ((nav as any).deviceMemory) {
			memory = `~${(nav as any).deviceMemory}GB`;
		}

		// WebAssembly support
		const webAssemblySupport = typeof WebAssembly !== 'undefined';

		// SharedArrayBuffer support
		const sharedArrayBufferSupport = typeof SharedArrayBuffer !== 'undefined';

		// Cross-Origin Isolation
		const crossOriginIsolation =
			typeof window !== 'undefined' && window.crossOriginIsolated === true;

		systemInfo = {
			browser,
			browserVersion,
			os,
			deviceType,
			screenResolution,
			cores,
			memory,
			webAssemblySupport,
			sharedArrayBufferSupport,
			crossOriginIsolation
		};
	}

	// Bug report types
	const bugTypes = {
		'wasm-loading': {
			label: 'WASM Loading Issues',
			template: `**Issue Description:**
[Describe what happens when you try to load vec2art]

**Error Messages:**
[Any error messages you see in the console or on screen]

**Steps to Reproduce:**
1. Go to vec2art.com
2. [What did you do next?]
3. [When did the error occur?]

**Expected Behavior:**
[What should have happened?]

**Console Errors:**
[Open browser dev tools (F12), check console for red errors and paste them here]

**Additional Context:**
[Any other relevant information about when this started happening]`
		},
		'processing-errors': {
			label: 'Processing Errors',
			template: `**Image Details:**
• File format: [PNG/JPG/WebP/etc.]
• File size: [e.g., 2.5MB]
• Image dimensions: [e.g., 1920x1080]

**Processing Settings:**
• Algorithm used: [Edge Detection/Centerline/Superpixel/Dots]
• Settings changed: [List any non-default settings]

**Error Description:**
[What went wrong during processing?]

**Error Messages:**
[Any error messages displayed]

**Steps to Reproduce:**
1. Upload image: [describe the image]
2. Select algorithm: [which one?]
3. Adjust settings: [what changes?]
4. Click process
5. [What happened?]

**Expected Output:**
[What should the SVG look like?]

**Additional Context:**
[Was this working before? Any patterns you've noticed?]`
		},
		'poor-quality': {
			label: 'Poor Output Quality',
			template: `**Image Information:**
• Original image type: [Photo/Logo/Drawing/etc.]
• File format: [PNG/JPG/WebP/etc.]
• Image characteristics: [High contrast/Low contrast/Detailed/Simple/etc.]

**Processing Details:**
• Algorithm used: [Edge Detection/Centerline/Superpixel/Dots]
• Settings used: [List all settings]
• Processing time: [How long did it take?]

**Quality Issues:**
[Describe what's wrong with the output]
• Missing details: [What's missing?]
• Incorrect lines: [What looks wrong?]
• Artifacts: [Any unwanted elements?]

**Expected Quality:**
[Describe what you expected the output to look like]

**Comparison:**
[If you've tried other tools, how do they compare?]

**Sample Files:**
[Can you share the original image? Yes/No]
[Can you share the SVG output? Yes/No]`
		},
		'ui-bugs': {
			label: 'UI/Interface Issues',
			template: `**Interface Problem:**
[Describe what's wrong with the user interface]

**Location:**
[Which page or section has the problem?]

**Visual Issues:**
• Layout problems: [Describe any layout issues]
• Missing elements: [What's not showing up?]
• Overlapping content: [Any content overlapping?]
• Responsive issues: [Problems on mobile/tablet?]

**Steps to Reproduce:**
1. Navigate to: [which page?]
2. [What actions did you take?]
3. [When did the issue appear?]

**Expected Appearance:**
[How should it look?]

**Screenshots:**
[Can you provide screenshots? Yes/No]

**Browser Zoom:**
• Zoom level: [e.g., 100%, 150%]

**Additional Notes:**
[Any other relevant information]`
		},
		performance: {
			label: 'Performance Issues',
			template: `**Performance Problem:**
[Describe the performance issue]
• Slow processing: [How slow?]
• Browser freezing: [For how long?]
• High memory usage: [How much RAM used?]
• Fan spinning: [CPU overheating?]

**Image Details:**
• File size: [e.g., 5MB]
• Dimensions: [e.g., 4K, 8000x6000]
• Format: [PNG/JPG/WebP/etc.]
• Complexity: [Simple/Detailed/Very complex]

**Processing Settings:**
• Algorithm: [Which one?]
• Threading: [Single/Multi-threaded - check browser console]
• Settings: [Any custom settings?]

**Performance Metrics:**
• Processing time: [How long did it take?]
• Expected time: [How long should it take?]
• Memory usage: [If you can check in Task Manager/Activity Monitor]
• CPU usage: [If you can check]

**Other Applications:**
• Other apps running: [Any heavy applications?]

**Comparison:**
[Have you tried with smaller images? Different browsers?]`
		},
		other: {
			label: 'Other Technical Issue',
			template: `**Issue Summary:**
[Brief description of the problem]

**Detailed Description:**
[Explain what's happening in detail]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Continue as needed]

**Expected Behavior:**
[What should happen instead?]

**Actual Behavior:**
[What actually happens?]

**Error Messages:**
[Any error messages you see]

**Browser Console Errors:**
[Open browser dev tools (F12), check console for red errors]

**Workarounds:**
[Have you found any ways to avoid this issue?]

**Additional Context:**
[Any other relevant information]`
		}
	};

	// Category configurations
	const categories = {
		bug: {
			id: 'bug',
			title: 'Bug Report',
			description: 'Report technical issues with structured details',
			icon: Bug,
			placeholder:
				'Select a bug type above and the message field will auto-populate with a template to help you provide all the necessary details.',
			color: 'ferrari'
		},
		business: {
			id: 'business',
			title: 'Business Inquiry',
			description: 'Partnerships, commercial licensing, or enterprise solutions',
			icon: Building2,
			placeholder:
				'Tell us about your business needs:\n• Company name and size\n• Intended use case for vec2art\n• Timeline and requirements\n• Contact preferences',
			color: 'blue'
		},
		general: {
			id: 'general',
			title: 'General Contact',
			description: 'Questions, feedback, or anything else',
			icon: Mail,
			placeholder:
				'What can we help you with? Feel free to ask questions, share feedback, or just say hello!',
			color: 'green'
		}
	};

	function selectCategory(categoryId: string) {
		selectedCategory = categoryId;
		formData.category = categoryId;
		formData.message = ''; // Clear message when switching categories
		formData.bugType = ''; // Clear bug type when switching categories
		errors = {}; // Clear errors
	}

	function selectBugType(bugTypeId: string) {
		formData.bugType = bugTypeId;
		if (bugTypeId && bugTypes[bugTypeId as keyof typeof bugTypes]) {
			formData.message = bugTypes[bugTypeId as keyof typeof bugTypes].template;
		}
		// Clear message error if it exists
		if (errors.message) {
			delete errors.message;
			errors = { ...errors };
		}
	}

	// Initialize system detection and Turnstile on mount
	onMount(() => {
		// Scroll to top of page when contact page loads
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}

		detectSystemInfo();

		// Initialize Turnstile widget
		if (typeof window !== 'undefined' && (window as any).turnstile) {
			initTurnstile();
		} else {
			// Wait for Turnstile to load
			const checkTurnstile = setInterval(() => {
				if ((window as any).turnstile) {
					clearInterval(checkTurnstile);
					initTurnstile();
				}
			}, 100);
		}
	});

	function initTurnstile() {
		const turnstileContainer = document.getElementById('turnstile-container');
		if (turnstileContainer && (window as any).turnstile) {
			turnstileWidget = (window as any).turnstile.render('#turnstile-container', {
				sitekey: PUBLIC_TURNSTILE_SITE_KEY,
				callback: (token: string) => {
					turnstileToken = token;
					isTurnstileValid = true;
					turnstileLoaded = true;
					// Clear any turnstile errors
					if (errors.turnstile) {
						delete errors.turnstile;
						errors = { ...errors };
					}
				},
				'error-callback': () => {
					turnstileToken = '';
					isTurnstileValid = false;
					turnstileLoaded = true;
					errors.turnstile = 'Verification failed. Please try again.';
					errors = { ...errors };
				},
				'expired-callback': () => {
					turnstileToken = '';
					isTurnstileValid = false;
					errors.turnstile = 'Verification expired. Please verify again.';
					errors = { ...errors };
				},
				'timeout-callback': () => {
					turnstileToken = '';
					isTurnstileValid = false;
					errors.turnstile = 'Verification timed out. Please try again.';
					errors = { ...errors };
				}
			});
			turnstileLoaded = true;
		}
	}

	function resetTurnstile() {
		if (turnstileWidget && (window as any).turnstile) {
			(window as any).turnstile.reset(turnstileWidget);
			turnstileToken = '';
			isTurnstileValid = false;
		}
	}

	// Real-time validation functions
	function validateName(name: string): boolean {
		const trimmed = name.trim();
		isNameValid = trimmed.length >= MIN_NAME_LENGTH;
		return isNameValid;
	}

	function validateEmail(email: string): boolean {
		const trimmed = email.trim();
		isEmailValid = trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
		return isEmailValid;
	}

	function validateMessage(message: string): boolean {
		const trimmed = message.trim();
		isMessageValid = trimmed.length >= MIN_MESSAGE_LENGTH && trimmed.length <= MAX_MESSAGE_LENGTH;
		return isMessageValid;
	}

	// Reactive validation - runs whenever form data changes
	$: validateName(formData.name);
	$: validateEmail(formData.email);
	$: validateMessage(formData.message);

	// Overall form validity
	$: isFormValid =
		isNameValid &&
		isEmailValid &&
		isMessageValid &&
		isTurnstileValid &&
		(selectedCategory !== 'bug' || formData.bugType);

	// Disable submit button only when submitting or form is invalid
	$: isSubmitDisabled = isSubmitting || !isFormValid;

	function validateForm() {
		errors = {};

		// Name validation
		if (!formData.name.trim()) {
			errors.name = 'Name is required';
		} else if (formData.name.trim().length < MIN_NAME_LENGTH) {
			errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters long`;
		}

		// Email validation
		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!EMAIL_REGEX.test(formData.email.trim())) {
			errors.email = 'Please enter a valid email address';
		}

		// Bug type validation
		if (formData.category === 'bug' && !formData.bugType) {
			errors.bugType = 'Please select a bug type';
		}

		// Message validation
		const messageLength = formData.message.trim().length;
		if (!formData.message.trim()) {
			errors.message = 'Message is required';
		} else if (messageLength < MIN_MESSAGE_LENGTH) {
			errors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters long`;
		} else if (messageLength > MAX_MESSAGE_LENGTH) {
			errors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`;
		}

		// Turnstile validation
		if (!turnstileToken || !isTurnstileValid) {
			errors.turnstile = 'Please complete the verification challenge';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		try {
			// First: Server-side validation with Turnstile verification
			const serverValidationData = new FormData();
			serverValidationData.append('name', formData.name);
			serverValidationData.append('email', formData.email);
			serverValidationData.append('message', formData.message);
			serverValidationData.append('category', formData.category);
			serverValidationData.append('bugType', formData.bugType);
			serverValidationData.append('cf-turnstile-response', turnstileToken);

			const serverValidationResponse = await fetch('/contact', {
				method: 'POST',
				body: serverValidationData
			});

			if (!serverValidationResponse.ok) {
				const serverErrors = await serverValidationResponse.json();
				if (serverErrors.errors) {
					errors = serverErrors.errors;
					errors = { ...errors };
					resetTurnstile();
					return;
				}
				throw new Error(`Server validation failed: ${serverValidationResponse.status}`);
			}

			// Second: If server validation passes, proceed with Formspark submission
			const submissionData = {
				name: formData.name,
				email: formData.email,
				message: formData.message,
				category: formData.category,
				categoryTitle: currentCategory.title,
				bugType: formData.bugType || 'N/A',
				bugTypeLabel: formData.bugType
					? bugTypes[formData.bugType as keyof typeof bugTypes]?.label
					: 'N/A',
				'cf-turnstile-response': turnstileToken,

				// Auto-detected system information
				browser: `${systemInfo.browser} ${systemInfo.browserVersion}`,
				operatingSystem: systemInfo.os,
				deviceType: systemInfo.deviceType,
				screenResolution: systemInfo.screenResolution,
				cpuCores: systemInfo.cores,
				deviceMemory: systemInfo.memory,
				webAssemblySupport: systemInfo.webAssemblySupport,
				sharedArrayBufferSupport: systemInfo.sharedArrayBufferSupport,
				crossOriginIsolation: systemInfo.crossOriginIsolation,

				// Submission metadata
				submittedAt: new Date().toISOString(),
				userAgent: navigator.userAgent,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				language: navigator.language
			};

			// Submit to Formspark
			const response = await fetch(`https://submit-form.com/${PUBLIC_FORMSPARK_ENDPOINT_ID}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(submissionData)
			});

			if (!response.ok) {
				throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			console.log('Form submitted successfully:', result);

			isSubmitted = true;

			// Reset form after successful submission
			setTimeout(() => {
				formData = { name: '', email: '', message: '', category: 'general', bugType: '' };
				selectedCategory = 'general';
				isSubmitted = false;
				resetTurnstile();
			}, 5000);
		} catch (error) {
			console.error('Submission error:', error);

			if (error instanceof Error) {
				if (error.message.includes('Turnstile')) {
					errors.turnstile = 'Verification failed. Please try again.';
					resetTurnstile();
				} else if (error.message.includes('400')) {
					errors.submit = 'Invalid form data. Please check your input and try again.';
				} else if (error.message.includes('429')) {
					errors.submit = 'Too many requests. Please wait a moment and try again.';
				} else if (error.message.includes('500')) {
					errors.submit = 'Server error. Please try again later.';
				} else {
					errors.submit = 'Failed to send message. Please check your connection and try again.';
				}
			} else {
				errors.submit = 'Network error. Please check your connection and try again.';
			}

			errors = { ...errors };
		} finally {
			isSubmitting = false;
		}
	}

	$: currentCategory = categories[selectedCategory as keyof typeof categories];
</script>

<svelte:head>
	<title>Contact Us | vec2art</title>
	<meta
		name="description"
		content="Get in touch with the vec2art team. Report bugs, discuss business opportunities, or ask general questions through our contact form."
	/>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<section class="relative bg-white py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">Contact Us</h1>
				<p class="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
					We'd love to hear from you. Send us a message and we'll respond as soon as possible.
				</p>
				<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
					<div
						class="flex items-center gap-2 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
					>
						<Clock class="h-4 w-4" />
						24-48h Response Time
					</div>
					<div
						class="bg-ferrari-50 text-ferrari-700 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
					>
						<CheckCircle class="h-4 w-4" />
						Secure & Private
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact Form Section -->
	<section class="py-16 md:py-20">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="overflow-hidden rounded-3xl bg-white shadow-xl">
				<!-- Category Selection -->
				<div class="bg-section-elevated border-b border-gray-200 px-8 py-6">
					<h2 class="mb-6 text-2xl font-bold text-gray-900">What can we help you with?</h2>
					<div class="grid gap-4 md:grid-cols-3">
						{#each Object.values(categories) as category (category.id)}
							<button
								type="button"
								class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 {selectedCategory ===
								category.id
									? 'border-ferrari-500 bg-ferrari-50 shadow-md'
									: 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}"
								onclick={() => selectCategory(category.id)}
							>
								<svelte:component
									this={category.icon}
									class="h-8 w-8 {selectedCategory === category.id
										? 'text-ferrari-600'
										: 'text-gray-600 group-hover:text-gray-700'}"
								/>
								<div>
									<h3
										class="font-semibold {selectedCategory === category.id
											? 'text-gray-900'
											: 'text-gray-900'}"
									>
										{category.title}
									</h3>
									<p
										class="mt-1 text-sm {selectedCategory === category.id
											? 'text-gray-700'
											: 'text-gray-600'}"
									>
										{category.description}
									</p>
								</div>
								{#if selectedCategory === category.id}
									<div
										class="from-ferrari-500 to-ferrari-600 absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-20"
									></div>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Contact Form -->
				<div class="p-8">
					{#if isSubmitted}
						<!-- Success Message -->
						<div class="py-12 text-center">
							<CheckCircle class="mx-auto mb-4 h-16 w-16 text-green-600" />
							<h3 class="mb-2 text-2xl font-bold text-gray-900">Message Sent Successfully!</h3>
							<p class="mb-4 text-gray-600">
								Thank you for contacting us. We'll get back to you within 24-48 hours.
							</p>
							<div
								class="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
							>
								<CheckCircle class="h-4 w-4" />
								Confirmation sent to {formData.email}
							</div>
						</div>
					{:else}
						<!-- Contact Form -->
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleSubmit();
							}}
							class="space-y-6"
						>
							<!-- Selected Category Display -->
							<div
								class="border-ferrari-200 bg-ferrari-50 flex items-center gap-3 rounded-lg border p-4"
							>
								<svelte:component this={currentCategory.icon} class="text-ferrari-600 h-6 w-6" />
								<div>
									<h3 class="font-semibold text-gray-900">{currentCategory.title}</h3>
									<p class="text-sm text-gray-700">{currentCategory.description}</p>
								</div>
							</div>

							<!-- Bug Type Selector (only for bug reports) -->
							{#if selectedCategory === 'bug'}
								<div>
									<label for="bugType" class="mb-2 block text-sm font-medium text-gray-700">
										<AlertTriangle class="mr-1 inline h-4 w-4" />
										Bug Type <span class="text-red-500">*</span>
									</label>
									<select
										id="bugType"
										bind:value={formData.bugType}
										onchange={(e) => selectBugType((e.target as HTMLSelectElement).value)}
										class="focus:border-ferrari-500 focus:ring-ferrari-500/20 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 transition-colors focus:ring-2 focus:outline-none {errors.bugType
											? 'border-red-500'
											: ''}"
										required
									>
										<option value="">Select the type of bug you're reporting...</option>
										{#each Object.entries(bugTypes) as [key, bugType] (key)}
											<option value={key}>{bugType.label}</option>
										{/each}
									</select>
									{#if errors.bugType}
										<p class="mt-1 text-sm text-red-600">{errors.bugType}</p>
									{/if}
									<p class="mt-2 text-sm text-gray-600">
										<CheckCircle class="mr-1 inline h-4 w-4 text-green-600" />
										Selecting a bug type will auto-fill the message with a helpful template
									</p>

									<!-- System Detection Info -->
									<div class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
										<h4 class="mb-2 text-sm font-medium text-green-800">
											🔍 Auto-detected system information:
										</h4>
										<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700">
											<div>
												<strong>Browser:</strong>
												{systemInfo.browser}
												{systemInfo.browserVersion}
											</div>
											<div><strong>OS:</strong> {systemInfo.os}</div>
											<div><strong>Device:</strong> {systemInfo.deviceType}</div>
											<div><strong>Screen:</strong> {systemInfo.screenResolution}</div>
											<div><strong>CPU Cores:</strong> {systemInfo.cores}</div>
											<div><strong>Memory:</strong> {systemInfo.memory}</div>
											<div>
												<strong>WebAssembly:</strong>
												{systemInfo.webAssemblySupport ? '✅ Supported' : '❌ Not supported'}
											</div>
											<div>
												<strong>SharedArrayBuffer:</strong>
												{systemInfo.sharedArrayBufferSupport ? '✅ Supported' : '❌ Not supported'}
											</div>
											<div class="col-span-2">
												<strong>Cross-Origin Isolation:</strong>
												{systemInfo.crossOriginIsolation ? '✅ Enabled' : '❌ Disabled'}
											</div>
										</div>
										<p class="mt-2 text-xs text-green-600">
											💡 This information will be automatically included in your bug report template
										</p>
									</div>
								</div>
							{/if}

							<!-- Name and Email Row -->
							<div class="grid gap-6 md:grid-cols-2">
								<!-- Name Field -->
								<div>
									<label for="name" class="mb-2 block text-sm font-medium text-gray-700">
										<User class="mr-1 inline h-4 w-4" />
										Full Name
										<span class="text-red-500">*</span>
									</label>
									<div class="relative">
										<input
											id="name"
											type="text"
											bind:value={formData.name}
											class="focus:border-ferrari-500 focus:ring-ferrari-500/20 w-full rounded-lg border px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 transition-colors focus:ring-2 focus:outline-none {errors.name
												? 'border-red-500'
												: isNameValid && formData.name.length > 0
													? 'border-green-500'
													: 'border-gray-300'}"
											placeholder="Enter your full name"
											required
										/>
										{#if formData.name.length > 0}
											<div class="absolute inset-y-0 right-0 flex items-center pr-3">
												{#if isNameValid}
													<CheckCircle class="h-5 w-5 text-green-500" />
												{:else}
													<AlertTriangle class="h-5 w-5 text-red-500" />
												{/if}
											</div>
										{/if}
									</div>
									{#if errors.name}
										<p class="mt-1 text-sm text-red-600">{errors.name}</p>
									{/if}
								</div>

								<!-- Email Field -->
								<div>
									<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
										<Mail class="mr-1 inline h-4 w-4" />
										Email Address
										<span class="text-red-500">*</span>
									</label>
									<div class="relative">
										<input
											id="email"
											type="email"
											bind:value={formData.email}
											class="focus:border-ferrari-500 focus:ring-ferrari-500/20 w-full rounded-lg border px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 transition-colors focus:ring-2 focus:outline-none {errors.email
												? 'border-red-500'
												: isEmailValid && formData.email.length > 0
													? 'border-green-500'
													: 'border-gray-300'}"
											placeholder="Enter your email address"
											required
										/>
										{#if formData.email.length > 0}
											<div class="absolute inset-y-0 right-0 flex items-center pr-3">
												{#if isEmailValid}
													<CheckCircle class="h-5 w-5 text-green-500" />
												{:else}
													<AlertTriangle class="h-5 w-5 text-red-500" />
												{/if}
											</div>
										{/if}
									</div>
									{#if errors.email}
										<p class="mt-1 text-sm text-red-600">{errors.email}</p>
									{/if}
								</div>
							</div>

							<!-- Message Field -->
							<div>
								<label for="message" class="mb-2 block text-sm font-medium text-gray-700">
									<MessageSquare class="mr-1 inline h-4 w-4" />
									Message
								</label>
								<textarea
									id="message"
									bind:value={formData.message}
									rows="8"
									class="focus:border-ferrari-500 focus:ring-ferrari-500/20 resize-vertical w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:ring-2 focus:outline-none {errors.message
										? 'border-red-500'
										: ''}"
									placeholder={currentCategory.placeholder}
									required
								></textarea>
								{#if errors.message}
									<p class="mt-1 text-sm text-red-600">{errors.message}</p>
								{/if}
								<div class="mt-2 flex justify-between text-sm">
									<span
										class={isMessageValid
											? 'text-green-600'
											: formData.message.length > 0
												? 'text-red-600'
												: 'text-gray-500'}
									>
										{#if formData.message.length === 0}
											Enter at least {MIN_MESSAGE_LENGTH} characters
										{:else if !isMessageValid}
											{#if formData.message.trim().length < MIN_MESSAGE_LENGTH}
												Need {MIN_MESSAGE_LENGTH - formData.message.trim().length} more characters
											{:else}
												{formData.message.trim().length - MAX_MESSAGE_LENGTH} characters over limit
											{/if}
										{:else}
											✓ Message length is good
										{/if}
									</span>
									<span
										class={formData.message.length > MAX_MESSAGE_LENGTH
											? 'font-medium text-red-600'
											: formData.message.length > MAX_MESSAGE_LENGTH * 0.9
												? 'text-amber-600'
												: 'text-gray-500'}
									>
										{formData.message.length}/{MAX_MESSAGE_LENGTH}
									</span>
								</div>
							</div>

							<!-- Turnstile Verification -->
							<div>
								<label class="mb-3 block text-sm font-medium text-gray-700">
									<CheckCircle class="mr-1 inline h-4 w-4" />
									Verification <span class="text-red-500">*</span>
								</label>
								<div id="turnstile-container" class="flex justify-center"></div>
								{#if errors.turnstile}
									<p class="mt-2 text-center text-sm text-red-600">{errors.turnstile}</p>
								{/if}
								<p class="mt-2 text-center text-xs text-gray-500">
									This verification helps us prevent spam and protect your privacy
								</p>
							</div>

							<!-- Submit Button -->
							<div class="flex flex-col gap-4 pt-4">
								{#if errors.submit}
									<p class="text-center text-sm text-red-600">{errors.submit}</p>
								{/if}

								<!-- Form Validation Status -->
								{#if !isFormValid && !isSubmitting}
									<div class="text-center">
										<div
											class="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700"
										>
											<AlertTriangle class="h-4 w-4" />
											Please complete all required fields and verification
										</div>
									</div>
								{/if}

								<button
									type="submit"
									disabled={isSubmitDisabled}
									class="flex items-center justify-center gap-2 rounded-lg px-8 py-4 font-medium text-white transition-all duration-200 focus:ring-2 focus:outline-none {isSubmitDisabled
										? 'cursor-not-allowed bg-gray-400 opacity-50'
										: 'bg-ferrari-600 hover:bg-ferrari-700 focus:ring-ferrari-500/50 hover:scale-[1.02] hover:shadow-lg'}"
									title={isSubmitDisabled && !isSubmitting
										? 'Please complete all fields and verification'
										: ''}
								>
									{#if isSubmitting}
										<div
											class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
										></div>
										Sending Message...
									{:else}
										<Send class="h-5 w-5" />
										Send Email
									{/if}
								</button>

								<p class="text-center text-sm text-gray-600">
									We'll respond to your {currentCategory.title.toLowerCase()} within 24-48 hours
								</p>
							</div>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Additional Information -->
	<section class="bg-section-elevated py-16">
		<div class="mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
			<div class="grid gap-8 md:grid-cols-2">
				<!-- Privacy Notice -->
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<CheckCircle class="h-8 w-8 text-green-600" />
						<h3 class="text-xl font-semibold text-gray-900">Your Privacy Matters</h3>
					</div>
					<div class="space-y-3 text-gray-700">
						<p>Your contact information is kept completely private and secure.</p>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>We never share your email with third parties</li>
							<li>Messages are encrypted in transit</li>
							<li>We only use your info to respond to your inquiry</li>
							<li>You can request data deletion at any time</li>
						</ul>
					</div>
				</div>

				<!-- Response Times -->
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<Clock class="text-ferrari-600 h-8 w-8" />
						<h3 class="text-xl font-semibold text-gray-900">Response Times</h3>
					</div>
					<div class="space-y-3">
						<div class="bg-ferrari-50 flex items-center justify-between rounded-lg p-3">
							<div class="flex items-center gap-2">
								<Bug class="text-ferrari-600 h-5 w-5" />
								<span class="font-medium text-gray-900">Bug Reports</span>
							</div>
							<span class="text-ferrari-700 text-sm font-medium">12-24 hours</span>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-blue-50 p-3">
							<div class="flex items-center gap-2">
								<Building2 class="h-5 w-5 text-blue-600" />
								<span class="font-medium text-gray-900">Business Inquiries</span>
							</div>
							<span class="text-sm font-medium text-blue-700">24-48 hours</span>
						</div>
						<div class="flex items-center justify-between rounded-lg bg-green-50 p-3">
							<div class="flex items-center gap-2">
								<Mail class="h-5 w-5 text-green-600" />
								<span class="font-medium text-gray-900">General Contact</span>
							</div>
							<span class="text-sm font-medium text-green-700">24-72 hours</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
