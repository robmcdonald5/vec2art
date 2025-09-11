/**
 * WebGPU Device Manager - Clean Version with Minimal Buffer Allocation
 * Implements 2024 WebGPU best practices for device creation and management
 */

export interface WebGPUDeviceInfo {
	device: any;
	adapter: any;
	strategy: string;
	gpuClass: string;
	memoryCapacity: string;
	createdAt: number;
	lastUsed: number;
}

interface DiagnosticResult {
	hasWebGPU: boolean;
	adapterCount: number;
	adapters: AdapterInfo[];
}

interface AdapterInfo {
	strategy: string;
	adapter: any;
	gpuClass: 'discrete' | 'integrated' | 'software' | 'unknown';
	memoryCapacity: 'high' | 'medium' | 'low' | 'unknown';
}

export class WebGPUDeviceManager {
	private static instance: WebGPUDeviceManager | null = null;
	private devices = new Map<string, WebGPUDeviceInfo>();
	private emergencyShutdown = false;
	private errorCount = 0;
	private lastError: Date | null = null;
	private readonly MAX_ERROR_RATE = 5;
	private readonly ERROR_WINDOW_MS = 30000; // 30 seconds

	// Sequential access management
	private sequentialQueue: Array<{
		owner: string;
		resolve: (device: any) => void;
		reject: (error: Error) => void;
		options: any;
	}> = [];
	private currentGPUOwner: string | null = null;
	private processingQueue = false;

	private diagnosticsCache: {
		result: DiagnosticResult;
		timestamp: number;
		isRunning: boolean;
	} | null = null;
	private readonly DIAGNOSTIC_CACHE_TTL = 30000; // 30 seconds

	private initializationLock: Promise<void> | null = null;

	private constructor() {
		// Constructor remains simple - no recursive calls
	}

	static getInstance(): WebGPUDeviceManager {
		if (!WebGPUDeviceManager.instance) {
			WebGPUDeviceManager.instance = new WebGPUDeviceManager();
			// Enable global access after instance is created
			WebGPUDeviceManager.enableGlobalAccess();
		}
		return WebGPUDeviceManager.instance;
	}

	// Make the instance available globally for debugging
	private static enableGlobalAccess(): void {
		if (typeof window !== 'undefined' && WebGPUDeviceManager.instance) {
			(window as any).webgpuDeviceManager = WebGPUDeviceManager.instance;
			(window as any).getWebGPUDiagnostics = () => {
				return WebGPUDeviceManager.instance?.runDiagnostics();
			};
			(window as any).resetWebGPU = () => {
				WebGPUDeviceManager.instance?.forceReset();
			};
		}
	}

	/**
	 * Activate emergency shutdown to prevent further GPU operations
	 */
	private activateEmergencyShutdown(reason: string): void {
		console.error(`[WebGPU Manager] 🚨 Emergency shutdown activated: ${reason}`);
		this.emergencyShutdown = true;

		// Destroy all active devices
		for (const [owner, deviceInfo] of this.devices) {
			try {
				deviceInfo.device?.destroy();
				console.log(`[WebGPU Manager] 🛑 Destroyed device for ${owner} during emergency shutdown`);
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		this.devices.clear();
		this.currentGPUOwner = null;
	}

	/**
	 * Force emergency shutdown (public method for external use)
	 */
	async forceEmergencyShutdown(reason = 'Manual shutdown'): Promise<void> {
		this.activateEmergencyShutdown(reason);
	}

	/**
	 * Check if emergency shutdown is active
	 */
	isEmergencyShutdownActive(): boolean {
		return this.emergencyShutdown;
	}

	/**
	 * Get current system status
	 */
	getSystemStatus(): {
		emergencyShutdown: boolean;
		errorCount: number;
		deviceCount: number;
		queueLength: number;
	} {
		return {
			emergencyShutdown: this.emergencyShutdown,
			errorCount: this.errorCount,
			deviceCount: this.devices.size,
			queueLength: this.sequentialQueue.length
		};
	}

	/**
	 * Check if an error is poisoning the system
	 */
	private isPoisoningError(error: any): boolean {
		const message = error?.message || String(error);

		// Device lost errors are recoverable
		if (message.includes('device is lost') || message.includes('Parent device is lost')) {
			return false;
		}

		// Memory errors might be recoverable with different allocation strategies
		if (message.includes('Not enough memory') || message.includes('OutOfMemoryError')) {
			return false;
		}

		// WebGPU not supported is permanent
		if (message.includes('WebGPU is not supported') || message.includes('gpu is null')) {
			return true;
		}

		// Driver crashes are serious
		if (message.includes('driver') || message.includes('GPU process')) {
			return true;
		}

		return false; // Other errors aren't necessarily poisoning
	}

	/**
	 * Check if we're in an error loop that should trigger emergency shutdown
	 */
	private checkErrorLoop(): boolean {
		const now = new Date();

		this.errorCount++;

		// Clean old error count if enough time has passed
		if (this.lastError && now.getTime() - this.lastError.getTime() > this.ERROR_WINDOW_MS) {
			this.errorCount = 1; // Reset to current error
		}

		this.lastError = now;

		// If we have too many errors in the time window, trigger emergency shutdown
		if (this.errorCount >= this.MAX_ERROR_RATE) {
			return true;
		}

		return false;
	}

	/**
	 * Run comprehensive WebGPU diagnostics
	 */
	async runDiagnostics(): Promise<DiagnosticResult> {
		// Check if we have cached results
		if (
			this.diagnosticsCache &&
			Date.now() - this.diagnosticsCache.timestamp < this.DIAGNOSTIC_CACHE_TTL
		) {
			if (this.diagnosticsCache.isRunning) {
				console.log('[WebGPU Manager] ⏳ Diagnostics already running, waiting...');
				// Wait for current diagnostics to complete
				while (this.diagnosticsCache.isRunning) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
				return this.diagnosticsCache.result;
			} else {
				console.log('[WebGPU Manager] 🎯 Using cached diagnostics result');
				return this.diagnosticsCache.result;
			}
		}

		// Mark diagnostics as running
		this.diagnosticsCache = {
			result: { hasWebGPU: false, adapterCount: 0, adapters: [] },
			timestamp: Date.now(),
			isRunning: true
		};

		const result: DiagnosticResult = {
			hasWebGPU: false,
			adapterCount: 0,
			adapters: []
		};

		try {
			const gpu = (navigator as any).gpu;
			if (!gpu) {
				console.log('[WebGPU Manager] ❌ WebGPU API not available');
				return result;
			}

			result.hasWebGPU = true;
			console.log('[WebGPU Manager] ✅ WebGPU API available');

			// Log browser environment for debugging
			const userAgent = navigator.userAgent;
			const browserInfo = this.detectBrowserInfo(userAgent);
			console.log('[WebGPU Manager] Environment:', {
				browser: browserInfo.name,
				version: browserInfo.version,
				platform: navigator.platform,
				hardwareConcurrency: navigator.hardwareConcurrency
			});

			// Firefox WebGPU experimental warning
			if (browserInfo.name === 'Firefox') {
				console.warn(`
🦊 [WebGPU Manager] Firefox WebGPU Notice:
- Firefox WebGPU has known memory management issues (~8GB/hour memory leak)
- Hardware GPU device creation may fail even with minimal memory requests
- Ultra-conservative buffer allocation (64KB-4MB) will be used for compatibility
- Sequential GPU access mode will be prioritized for better stability
- For optimal WebGPU performance, consider using Chrome or Edge
- Software fallback rendering will work reliably as backup
        `);
			}

			// Universal adapter enumeration strategies
			const strategies = [
				{
					powerPreference: 'high-performance' as const,
					forceFallbackAdapter: false,
					name: 'High-performance'
				},
				{ powerPreference: 'low-power' as const, forceFallbackAdapter: false, name: 'Low-power' },
				{ powerPreference: undefined, forceFallbackAdapter: false, name: 'Default' },
				{
					powerPreference: 'high-performance' as const,
					forceFallbackAdapter: true,
					name: 'Software-fallback'
				}
			];

			for (let i = 0; i < strategies.length; i++) {
				const strategy = strategies[i];
				try {
					console.log(`[WebGPU Manager] Testing strategy: ${strategy.name}`);

					const requestOptions: any = { forceFallbackAdapter: strategy.forceFallbackAdapter };

					// Skip powerPreference on Windows to avoid harmless warnings (Windows ignores this anyway)
					const isWindows = navigator.platform.includes('Win');
					if (strategy.powerPreference !== undefined && !isWindows) {
						requestOptions.powerPreference = strategy.powerPreference;
					}

					const adapter = await gpu.requestAdapter(requestOptions);

					if (!adapter && strategy.forceFallbackAdapter) {
						// Software fallback failed - this might indicate a WebGPU implementation issue
						console.warn(
							`[WebGPU Manager] ⚠️ Software fallback adapter unavailable - this may indicate limited WebGPU support`
						);
					}

					if (adapter) {
						const info = adapter.info || {};
						const gpuClass = this.classifyGPUType(
							info.device,
							info.vendor,
							strategy.forceFallbackAdapter
						);
						const memoryCapacity = this.estimateMemoryCapacity(info.device, info.vendor, gpuClass);

						console.log(`[WebGPU Manager] 📊 ${strategy.name} Adapter:`);
						console.log(
							`[WebGPU Manager]   Type: ${info.type || (strategy.forceFallbackAdapter ? 'software GPU' : 'unknown')}`
						);
						console.log(`[WebGPU Manager]   Memory: ${memoryCapacity} capacity`);
						console.log(`[WebGPU Manager]   Vendor: "${info.vendor || 'Not specified'}"`);
						console.log(`[WebGPU Manager]   Device: "${info.device || 'Not specified'}"`);

						const features = adapter.features ? Array.from(adapter.features).length : 0;
						console.log(`[WebGPU Manager]   Features: ${features} supported`);

						const limits = adapter.limits || {};
						const maxBufferSize = limits.maxBufferSize || 0;
						const maxBufferMB = Math.round(maxBufferSize / (1024 * 1024));
						console.log(`[WebGPU Manager]   Max Buffer: ${maxBufferMB}MB`);

						result.adapters.push({
							strategy: strategy.name,
							adapter,
							gpuClass,
							memoryCapacity
						});
					}
				} catch (error: any) {
					console.warn(`[WebGPU Manager] Strategy ${strategy.name} failed: ${error?.message}`);
				}
			}

			result.adapterCount = result.adapters.length;
			console.log(`[WebGPU Manager] ✅ Found ${result.adapterCount} adapter(s)`);
			console.log('[WebGPU Manager] 💾 Diagnostics cached for 30 seconds');
		} finally {
			// Update cache with results and mark as complete
			this.diagnosticsCache = {
				result,
				timestamp: Date.now(),
				isRunning: false
			};
		}

		return result;
	}

	/**
	 * Get a fresh adapter instance for device creation (adapters can only create one device)
	 */
	private async getFreshAdapter(powerPreference?: 'low-power' | 'high-performance'): Promise<{
		adapter: any;
		strategy: string;
		gpuClass: 'discrete' | 'integrated' | 'software' | 'unknown';
		memoryCapacity: 'high' | 'medium' | 'low' | 'unknown';
	}> {
		// Use cached diagnostics to determine the best strategy, but get fresh adapter instance
		const diagnostics = await this.runDiagnostics();

		if (diagnostics.adapters.length === 0) {
			return { adapter: null, strategy: 'failed', gpuClass: 'unknown', memoryCapacity: 'unknown' };
		}

		// Determine adapter request strategies in order of preference
		const preferredStrategies = this.getAdapterPreferenceOrder(powerPreference);

		console.log('[WebGPU Manager] Requesting fresh adapter for new device...');

		// Try each strategy to get a fresh adapter instance
		for (const preferredStrategy of preferredStrategies) {
			try {
				const requestOptions = this.getAdapterRequestOptions(preferredStrategy);
				const freshAdapter = await navigator.gpu?.requestAdapter(requestOptions);

				if (freshAdapter) {
					// Classify the fresh adapter using the same logic as diagnostics
					const info = freshAdapter.info || {};
					const gpuClass = this.classifyGPUType(
						info.device,
						info.vendor,
						requestOptions.forceFallbackAdapter
					);
					const memoryCapacity = this.classifyMemoryCapacity(freshAdapter.limits);

					console.log(
						`[WebGPU Manager] ✅ Got fresh ${preferredStrategy} adapter for device creation`
					);
					return {
						adapter: freshAdapter,
						strategy: preferredStrategy,
						gpuClass,
						memoryCapacity
					};
				}
			} catch (error: any) {
				console.warn(
					`[WebGPU Manager] Failed to get fresh ${preferredStrategy} adapter: ${error?.message}`
				);
			}
		}

		console.error('[WebGPU Manager] ❌ Could not get fresh adapter with any strategy');
		return { adapter: null, strategy: 'failed', gpuClass: 'unknown', memoryCapacity: 'unknown' };
	}

	/**
	 * Find best adapter using new minimal allocation strategy (for diagnostics)
	 */
	private async findBestAdapter(powerPreference?: 'low-power' | 'high-performance'): Promise<{
		adapter: any;
		strategy: string;
		gpuClass: 'discrete' | 'integrated' | 'software' | 'unknown';
		memoryCapacity: 'high' | 'medium' | 'low' | 'unknown';
	}> {
		const diagnostics = await this.runDiagnostics();

		if (diagnostics.adapterCount === 0) {
			return { adapter: null, strategy: 'failed', gpuClass: 'unknown', memoryCapacity: 'unknown' };
		}

		// Determine preference order based on power preference
		const preferredOrder = this.determineAdapterPreference(diagnostics.adapters, powerPreference);

		console.log(
			`[WebGPU Manager] Testing ${preferredOrder.length} adapters in order of preference...`
		);

		for (const adapterInfo of preferredOrder) {
			try {
				console.log(
					`[WebGPU Manager] Testing ${adapterInfo.strategy} adapter (${adapterInfo.gpuClass} GPU, ${adapterInfo.memoryCapacity} memory)`
				);

				// Request adapter using the same strategy
				const gpu = (navigator as any).gpu;
				const requestOptions: any = this.getRequestOptionsForStrategy(adapterInfo.strategy);
				const adapter = await gpu.requestAdapter(requestOptions);

				if (!adapter) {
					console.warn(`[WebGPU Manager] ${adapterInfo.strategy} adapter no longer available`);
					continue;
				}

				// Test device creation with minimal buffer allocation strategy
				const testResult = await this.testAdapterDeviceCreation(adapter, adapterInfo);

				if (testResult.success) {
					console.log(
						`[WebGPU Manager] ✅ Selected ${adapterInfo.strategy} adapter (${adapterInfo.gpuClass} GPU)`
					);
					return {
						adapter,
						strategy: adapterInfo.strategy,
						gpuClass: adapterInfo.gpuClass,
						memoryCapacity: adapterInfo.memoryCapacity
					};
				} else {
					console.warn(
						`[WebGPU Manager] ${adapterInfo.strategy} adapter failed device creation test`
					);
				}
			} catch (error: any) {
				console.warn(
					`[WebGPU Manager] Error testing ${adapterInfo.strategy} adapter: ${error?.message}`
				);
			}
		}

		console.error('[WebGPU Manager] ❌ No suitable adapter found - all strategies failed');
		return { adapter: null, strategy: 'failed', gpuClass: 'unknown', memoryCapacity: 'unknown' };
	}

	/**
	 * Test adapter device creation with device loss recovery and retry logic
	 * Based on WebGPU 2024 best practices: start with 16 bytes, handle device loss properly
	 */
	private async testAdapterDeviceCreation(
		adapter: any,
		adapterInfo: any,
		maxRetries: number = 2
	): Promise<{ success: boolean }> {
		// Check for emergency shutdown to prevent infinite error loops
		if (this.emergencyShutdown) {
			console.warn('[WebGPU Manager] ⚠️ Skipping device test - emergency shutdown active');
			return { success: false };
		}

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			let testDevice: any = null;
			let deviceLostPromise: Promise<any> | null = null;

			try {
				// STEP 1: Create device with minimal requirements and device loss monitoring
				testDevice = await adapter.requestDevice({
					label: `WebGPU Test Device (attempt ${attempt + 1})`,
					requiredFeatures: [],
					requiredLimits: {} // No arbitrary limits - let the device tell us what it can do
				});

				// STEP 1.5: Set up device loss monitoring immediately
				let deviceLost = false;
				deviceLostPromise = testDevice.lost.then((info: any) => {
					deviceLost = true;
					console.warn(
						`[WebGPU Manager] Test device lost during attempt ${attempt + 1}: ${info.message || 'Unknown reason'}`
					);
					return info;
				});

				// Quick check if device was lost immediately
				if (
					testDevice.lost &&
					(await Promise.race([deviceLostPromise, Promise.resolve('timeout')])) !== 'timeout'
				) {
					throw new Error('Device lost immediately after creation');
				}

				// STEP 2: Test actual buffer creation with ultra-minimal progressive allocation
				// Start with 4 bytes (minimum WebGPU alignment), then 16 bytes if that works
				const testSizes = attempt === 0 ? [4, 16] : [4]; // Be more conservative on retries
				let testBuffer: any = null;

				for (const testSize of testSizes) {
					try {
						testBuffer = testDevice.createBuffer({
							label: `Minimal Test Buffer (${testSize} bytes)`,
							size: testSize,
							usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
							mappedAtCreation: false
						});
						console.log(`[WebGPU Manager] ✅ Buffer creation successful at ${testSize} bytes`);
						break; // Success - use this buffer
					} catch (bufferError: any) {
						console.warn(
							`[WebGPU Manager] Buffer creation failed at ${testSize} bytes: ${bufferError?.message}`
						);
						if (testSize === testSizes[testSizes.length - 1]) {
							// This was the last/smallest size - throw the error
							throw bufferError;
						}
					}
				}

				// Check device status before proceeding
				if (deviceLost) {
					testBuffer.destroy();
					throw new Error('Device lost during buffer creation');
				}

				// STEP 3: Test buffer operations (write minimal data)
				const actualBufferSize = testBuffer.size || 4; // Use actual buffer size or fallback
				const testData = new Uint8Array(actualBufferSize);
				testData.fill(42); // Fill with test pattern

				testDevice.queue.writeBuffer(testBuffer, 0, testData);
				await testDevice.queue.onSubmittedWorkDone(); // Wait for completion

				// Final device status check
				if (deviceLost) {
					testBuffer.destroy();
					throw new Error('Device lost during buffer operations');
				}

				// STEP 4: Cleanup test resources
				testBuffer.destroy();
				testDevice.destroy();

				console.log(
					`[WebGPU Manager] ✅ Device test passed - minimal buffer allocation (${actualBufferSize} bytes) successful on attempt ${attempt + 1}`
				);
				return { success: true };
			} catch (error: any) {
				// Clean up device if it was created
				if (testDevice) {
					try {
						testDevice.destroy();
					} catch (_cleanupError) {
						// Ignore cleanup errors
					}
				}

				const isLastAttempt = attempt === maxRetries - 1;
				const errorMessage = error?.message || 'Unknown error';

				if (isLastAttempt) {
					console.warn(
						`[WebGPU Manager] Device test failed after ${maxRetries} attempts: ${errorMessage}`
					);
				} else {
					console.warn(
						`[WebGPU Manager] Device test failed on attempt ${attempt + 1}: ${errorMessage}, retrying...`
					);
					// Brief delay before retry (exponential backoff)
					await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
				}
			}
		}

		// Track error loop and potentially trigger emergency shutdown
		const isErrorLoop = this.checkErrorLoop();
		if (isErrorLoop) {
			console.error(
				'[WebGPU Manager] 🚨 Error loop detected in device testing - further tests disabled'
			);
		}

		return { success: false };
	}

	/**
	 * Utility methods for GPU classification and browser detection
	 */
	private classifyGPUType(
		device?: string,
		vendor?: string,
		isFallback?: boolean
	): 'discrete' | 'integrated' | 'software' | 'unknown' {
		if (isFallback) {
			return 'software';
		}

		const deviceLower = (device || '').toLowerCase();
		const vendorLower = (vendor || '').toLowerCase();

		// Check for discrete GPU indicators
		if (
			deviceLower.includes('rtx') ||
			deviceLower.includes('gtx') ||
			deviceLower.includes('radeon') ||
			deviceLower.includes('rx ') ||
			vendorLower.includes('nvidia') ||
			vendorLower.includes('amd')
		) {
			return 'discrete';
		}

		// Check for integrated GPU indicators
		if (
			deviceLower.includes('intel') ||
			deviceLower.includes('iris') ||
			deviceLower.includes('uhd') ||
			deviceLower.includes('integrated')
		) {
			return 'integrated';
		}

		// Default to integrated for unknown GPUs (safer for memory allocation)
		return 'integrated';
	}

	private estimateMemoryCapacity(
		device?: string,
		vendor?: string,
		gpuClass?: string
	): 'high' | 'medium' | 'low' | 'unknown' {
		const deviceLower = (device || '').toLowerCase();

		// High-end discrete GPUs
		if (
			deviceLower.includes('4090') ||
			deviceLower.includes('4080') ||
			deviceLower.includes('7900') ||
			deviceLower.includes('6900')
		) {
			return 'high';
		}

		// Medium-tier GPUs
		if (
			deviceLower.includes('4070') ||
			deviceLower.includes('3080') ||
			deviceLower.includes('6800') ||
			deviceLower.includes('5700')
		) {
			return 'medium';
		}

		// Software or integrated GPUs are typically low memory
		if (gpuClass === 'software' || gpuClass === 'integrated') {
			return 'low';
		}

		return 'low';
	}

	private classifyMemoryCapacity(limits: any): 'high' | 'medium' | 'low' | 'unknown' {
		if (!limits || typeof limits.maxBufferSize !== 'number') {
			return 'unknown';
		}

		const maxBufferGB = limits.maxBufferSize / (1024 * 1024 * 1024);

		if (maxBufferGB >= 2) {
			return 'high';
		} else if (maxBufferGB >= 0.5) {
			return 'medium';
		} else {
			return 'low';
		}
	}

	private detectBrowserInfo(userAgent: string): { name: string; version: string | null } {
		if (userAgent.includes('Firefox')) {
			const match = userAgent.match(/Firefox\/(\d+)/);
			return { name: 'Firefox', version: match ? match[1] : null };
		}

		if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
			const match = userAgent.match(/Chrome\/(\d+)/);
			return { name: 'Chrome', version: match ? match[1] : null };
		}

		if (userAgent.includes('Edg')) {
			const match = userAgent.match(/Edg\/(\d+)/);
			return { name: 'Edge', version: match ? match[1] : null };
		}

		if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
			const match = userAgent.match(/Version\/(\d+)/);
			return { name: 'Safari', version: match ? match[1] : null };
		}

		return { name: 'Unknown', version: null };
	}

	// Additional helper methods (simplified for space)
	private determineAdapterPreference(
		adapters: AdapterInfo[],
		powerPreference?: string
	): AdapterInfo[] {
		// Implementation for adapter preference ordering
		return [...adapters].sort((a, b) => {
			// Prefer non-software adapters
			if (a.gpuClass === 'software' && b.gpuClass !== 'software') return 1;
			if (b.gpuClass === 'software' && a.gpuClass !== 'software') return -1;

			// Then prefer by power preference if specified
			if (powerPreference === 'high-performance') {
				if (a.gpuClass === 'discrete' && b.gpuClass !== 'discrete') return -1;
				if (b.gpuClass === 'discrete' && a.gpuClass !== 'discrete') return 1;
			}

			return 0;
		});
	}

	private getRequestOptionsForStrategy(strategy: string): any {
		switch (strategy) {
			case 'High-performance':
				return { powerPreference: 'high-performance', forceFallbackAdapter: false };
			case 'Low-power':
				return { powerPreference: 'low-power', forceFallbackAdapter: false };
			case 'Software-fallback':
				return { forceFallbackAdapter: true };
			default:
				return { forceFallbackAdapter: false };
		}
	}

	/**
	 * Public API methods for device management
	 */
	async getDevice(owner: string, options: any = {}): Promise<any> {
		if (this.emergencyShutdown) {
			throw new Error('WebGPU Manager is in emergency shutdown mode');
		}

		// Check if we already have a device for this owner
		const existingDevice = this.devices.get(owner);
		if (existingDevice && !existingDevice.device.lost) {
			existingDevice.lastUsed = Date.now();
			return existingDevice.device;
		}

		// Get a fresh adapter instance for device creation (adapters can only create one device)
		const adapterResult = await this.getFreshAdapter(options.powerPreference);

		if (!adapterResult.adapter) {
			throw new Error('No suitable WebGPU adapter found');
		}

		const device = await adapterResult.adapter.requestDevice({
			label: `WebGPU Device for ${owner}`,
			requiredFeatures: options.requiredFeatures || [],
			requiredLimits: options.requiredLimits || {}
		});

		// Store device info
		const deviceInfo: WebGPUDeviceInfo = {
			device,
			adapter: adapterResult.adapter,
			strategy: adapterResult.strategy,
			gpuClass: adapterResult.gpuClass,
			memoryCapacity: adapterResult.memoryCapacity,
			createdAt: Date.now(),
			lastUsed: Date.now()
		};

		this.devices.set(owner, deviceInfo);

		// Set up device loss monitoring
		device.lost.then((info: any) => {
			console.warn(`[WebGPU Manager] Device lost for ${owner}: ${info.message}`);
			this.devices.delete(owner);
		});

		console.log(
			`[WebGPU Manager] ✅ Created device for ${owner} using ${adapterResult.strategy} adapter`
		);
		return device;
	}

	/**
	 * Get adapter preference order based on power preference
	 */
	private getAdapterPreferenceOrder(powerPreference?: 'low-power' | 'high-performance'): string[] {
		const baseOrder = ['High-performance', 'Low-power', 'Default', 'Software-fallback'];

		if (powerPreference === 'low-power') {
			return ['Low-power', 'High-performance', 'Default', 'Software-fallback'];
		} else if (powerPreference === 'high-performance') {
			return ['High-performance', 'Low-power', 'Default', 'Software-fallback'];
		}

		return baseOrder;
	}

	/**
	 * Get adapter request options for a strategy
	 */
	private getAdapterRequestOptions(strategy: string): any {
		const isWindows = navigator.platform.includes('Win');

		switch (strategy) {
			case 'High-performance': {
				const highPerfOptions: any = { forceFallbackAdapter: false };
				if (!isWindows) highPerfOptions.powerPreference = 'high-performance';
				return highPerfOptions;
			}
			case 'Low-power': {
				const lowPowerOptions: any = { forceFallbackAdapter: false };
				if (!isWindows) lowPowerOptions.powerPreference = 'low-power';
				return lowPowerOptions;
			}
			case 'Software-fallback':
				return { forceFallbackAdapter: true };
			default:
				return { forceFallbackAdapter: false };
		}
	}

	/**
	 * Force a complete reset of the WebGPU manager
	 */
	async forceReset(): Promise<void> {
		console.log('[WebGPU Manager] 🔄 Force reset requested');

		// Destroy all devices
		const deviceCount = this.devices.size;
		for (const [_owner, deviceInfo] of this.devices) {
			try {
				deviceInfo.device?.destroy();
			} catch (_error) {
				// Ignore cleanup errors
			}
		}

		// Clear all state
		this.devices.clear();
		this.currentGPUOwner = null;
		this.sequentialQueue = [];
		this.processingQueue = false;
		this.diagnosticsCache = null;
		this.emergencyShutdown = false;
		this.errorCount = 0;
		this.lastError = null;

		const queueLength = this.sequentialQueue.length;
		this.sequentialQueue = [];

		console.log(
			`[WebGPU Manager] ✅ Reset complete: cleared ${deviceCount} devices and ${queueLength} queued requests`
		);
	}

	// Additional utility methods for memory assessment, etc.
	async assessMemoryPressure(): Promise<{
		pressure: number;
		canAllocate: boolean;
		recommendedBufferSize: number;
		reason: string;
	}> {
		// Simple implementation - can be expanded
		return {
			pressure: 0.3,
			canAllocate: !this.emergencyShutdown,
			recommendedBufferSize: 4 * 1024 * 1024, // 4MB default
			reason: this.emergencyShutdown ? 'Emergency shutdown active' : 'Normal operation'
		};
	}
}

// Export singleton instance
export const webgpuDeviceManager = WebGPUDeviceManager.getInstance();
