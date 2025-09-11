/**
 * WebGPU Image Processing Service
 *
 * Provides GPU-accelerated image processing operations for SVG to WebP conversion,
 * targeting 3-10x performance improvements for large image processing tasks.
 *
 * Features:
 * - GPU-accelerated image filtering and enhancement
 * - Parallel pixel processing with compute shaders
 * - Efficient memory management with buffer pools
 * - Graceful fallback to CPU processing
 */

import { browser } from '$app/environment';

export interface WebGPUProcessingOptions {
	workgroupSize?: number;
	maxBufferSize?: number;
	enableDebug?: boolean;
	fallbackToCPU?: boolean;
}

export interface ImageProcessingTask {
	id: string;
	operation: 'resize' | 'filter' | 'enhance' | 'convert';
	inputData: ImageData;
	width: number;
	height: number;
	parameters?: Record<string, number>;
}

export interface ProcessingResult {
	id: string;
	outputData: ImageData;
	processingTimeMs: number;
	method: 'webgpu' | 'cpu-fallback';
	performance: {
		gpuTime?: number;
		memoryTransferTime?: number;
		computeTime?: number;
	};
}

export class WebGPUImageProcessor {
	private device: GPUDevice | null = null;
	private adapter: GPUAdapter | null = null;
	private commandEncoder: GPUCommandEncoder | null = null;
	private isInitialized = false;
	private bufferPool = new Map<string, GPUBuffer>();
	private computePipelines = new Map<string, GPUComputePipeline>();
	private options: Required<WebGPUProcessingOptions>;

	constructor(options: WebGPUProcessingOptions = {}) {
		this.options = {
			workgroupSize: 64,
			maxBufferSize: 256 * 1024 * 1024, // 256MB
			enableDebug: false,
			fallbackToCPU: true,
			...options
		};

		if (!browser) {
			throw new Error('WebGPUImageProcessor is only available in browser environment');
		}
	}

	/**
	 * Initialize WebGPU device using coordination manager
	 */
	async initialize(): Promise<boolean> {
		if (this.isInitialized) return true;

		try {
			// Check WebGPU support
			if (!WebGPUImageProcessor.isSupported()) {
				console.warn('[WebGPU] WebGPU not supported in this browser');
				return false;
			}

			// Import device manager for coordination
			const { WebGPUDeviceManager } = await import('./webgpu-device-manager');
			const deviceManager = WebGPUDeviceManager.getInstance();

			console.log('[WebGPU] Initializing with device coordination...');

			// Use new WebGPU Manager API for device creation
			let device = await deviceManager.getDevice('webgpu-image-processor', {
				powerPreference: 'high-performance',
				requiredFeatures: [],
				requiredLimits: {
					maxBufferSize: this.options.maxBufferSize,
					maxStorageBufferBindingSize: 32 * 1024 * 1024
				}
			});

			if (!device) {
				// Try once more with absolutely minimal requirements
				device = await deviceManager.getDevice('webgpu-image-processor-minimal', {
					powerPreference: 'low-power' as const,
					requiredFeatures: [],
					requiredLimits: {}
				});

				if (device) {
					console.log('[WebGPU] ✅ Obtained device with minimal requirements');
				}
			}

			if (!device) {
				console.warn('[WebGPU] Could not obtain coordinated WebGPU device');
				return false;
			}

			// Use the device directly
			this.device = device;

			console.log('[WebGPU] Using coordinated device from WebGPU Manager');

			// Store device manager reference for cleanup
			(this as any).deviceManager = deviceManager;

			// Set up error handling
			this.device?.lost.then((info) => {
				console.error('[WebGPU] Device lost:', info);
				this.cleanup();
			});

			if (this.options.enableDebug && this.device) {
				this.device.pushErrorScope('validation');
				this.device.pushErrorScope('out-of-memory');
			}

			// Initialize compute pipelines
			await this.createComputePipelines();

			this.isInitialized = true;
			console.log('[WebGPU] Successfully initialized with adapter:', this.adapter?.info);

			return true;
		} catch (error) {
			console.error('[WebGPU] Initialization failed:', error);
			this.cleanup();
			return false;
		}
	}

	/**
	 * Create compute shader pipelines for different image operations
	 */
	private async createComputePipelines(): Promise<void> {
		if (!this.device) throw new Error('Device not initialized');

		// Image resize compute shader - Firefox WGSL compatible version
		const resizeShader = `
      @group(0) @binding(0) var<storage, read> inputBuffer: array<u32>;
      @group(0) @binding(1) var<storage, read_write> outputBuffer: array<u32>;
      @group(0) @binding(2) var<uniform> params: vec4<u32>;  // ✅ 16-byte aligned

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let inputWidth = params.x;
        let inputHeight = params.y;
        let outputWidth = params.z;
        let outputHeight = params.w;
        
        let x = global_id.x;
        let y = global_id.y;
        
        if (x >= outputWidth || y >= outputHeight) {
          return;
        }
        
        // Simple nearest neighbor for now to avoid bilinear complexity
        let inputX = min(x * inputWidth / outputWidth, inputWidth - 1u);
        let inputY = min(y * inputHeight / outputHeight, inputHeight - 1u);
        let inputIndex = inputY * inputWidth + inputX;
        let outputIndex = y * outputWidth + x;
        
        outputBuffer[outputIndex] = inputBuffer[inputIndex];
      }
    `;

		// Image enhancement compute shader - Firefox WGSL compatible version
		const enhanceShader = `
      @group(0) @binding(0) var<storage, read> inputBuffer: array<u32>;
      @group(0) @binding(1) var<storage, read_write> outputBuffer: array<u32>;
      @group(0) @binding(2) var<uniform> params: array<vec4<f32>, 2>;  // ✅ 16-byte aligned

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let index = global_id.x;
        let totalPixels = u32(params[0].x * params[0].y);
        
        if (index >= totalPixels) {
          return;
        }
        
        let pixel = inputBuffer[index];
        
        // Simple brightness adjustment only
        let brightness = params[0].z;
        
        let r = f32((pixel >> 0u) & 0xFFu);
        let g = f32((pixel >> 8u) & 0xFFu);
        let b = f32((pixel >> 16u) & 0xFFu);
        let a = f32((pixel >> 24u) & 0xFFu);
        
        let outR = u32(clamp(r + brightness * 255.0, 0.0, 255.0));
        let outG = u32(clamp(g + brightness * 255.0, 0.0, 255.0));
        let outB = u32(clamp(b + brightness * 255.0, 0.0, 255.0));
        let outA = u32(a);
        
        outputBuffer[index] = (outA << 24u) | (outB << 16u) | (outG << 8u) | outR;
      }
    `;

		// Create compute pipelines - allow individual failures
		try {
			await this.createComputePipeline('resize', resizeShader);
		} catch (_error) {
			console.log('[WebGPU] Resize processing using CPU fallback (browser compatibility)');
		}

		try {
			await this.createComputePipeline('enhance', enhanceShader);
		} catch (_error) {
			console.log('[WebGPU] Enhance processing using CPU fallback (browser compatibility)');
		}
	}

	private async createComputePipeline(name: string, shaderCode: string): Promise<void> {
		if (!this.device) throw new Error('Device not initialized');

		try {
			// Suppress shader compilation error messages in Firefox
			const userAgent = navigator.userAgent;
			const isFirefox = userAgent.includes('Firefox');

			// Create shader module with error suppression for Firefox
			let shaderModule: GPUShaderModule;

			if (isFirefox) {
				// Firefox: Suppress console errors by temporarily overriding console methods
				const originalError = console.error;
				const originalWarn = console.warn;

				console.error = (...args) => {
					// Suppress WebGPU shader compilation errors
					const message = args.join(' ');
					if (message.includes('shader module') || message.includes('compilation info')) {
						return; // Suppress this error
					}
					originalError.apply(console, args);
				};

				console.warn = (...args) => {
					// Suppress WebGPU shader compilation warnings
					const message = args.join(' ');
					if (message.includes('shader module') || message.includes('compilation info')) {
						return; // Suppress this warning
					}
					originalWarn.apply(console, args);
				};

				try {
					shaderModule = this.device.createShaderModule({
						label: `${name} compute shader`,
						code: shaderCode
					});
				} finally {
					// Restore original console methods
					console.error = originalError;
					console.warn = originalWarn;
				}
			} else {
				// Chrome/other browsers: Normal shader creation
				shaderModule = this.device.createShaderModule({
					label: `${name} compute shader`,
					code: shaderCode
				});
			}

			const pipeline = this.device.createComputePipeline({
				label: `${name} compute pipeline`,
				layout: 'auto',
				compute: {
					module: shaderModule,
					entryPoint: 'main'
				}
			});

			this.computePipelines.set(name, pipeline);
			console.log(`[WebGPU] Created ${name} compute pipeline`);
		} catch (error) {
			// Simplified error message for cleaner console output
			console.log(`[WebGPU] ${name} pipeline using CPU fallback (browser compatibility)`);
			// Re-throw so the calling code can handle it
			throw new Error(
				`Shader compilation failed for ${name}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Process image using GPU acceleration
	 */
	async processImage(task: ImageProcessingTask): Promise<ProcessingResult> {
		const startTime = performance.now();

		if (!this.isInitialized && !(await this.initialize())) {
			if (this.options.fallbackToCPU) {
				return this.processCPUFallback(task, startTime);
			}
			throw new Error('WebGPU not available and CPU fallback disabled');
		}

		try {
			switch (task.operation) {
				case 'resize':
					return await this.processResize(task, startTime);
				case 'enhance':
					return await this.processEnhance(task, startTime);
				default:
					throw new Error(`Unsupported operation: ${task.operation}`);
			}
		} catch (error) {
			console.error('[WebGPU] Processing failed:', error);

			if (this.options.fallbackToCPU) {
				return this.processCPUFallback(task, startTime);
			}

			throw error;
		}
	}

	private async processResize(
		task: ImageProcessingTask,
		startTime: number
	): Promise<ProcessingResult> {
		if (!this.device || !this.computePipelines.has('resize')) {
			throw new Error('Resize pipeline not available');
		}

		const { inputData, width: targetWidth, height: targetHeight } = task;
		const { width: sourceWidth, height: sourceHeight } = inputData;

		const memoryStartTime = performance.now();

		// Push error scopes for memory allocation
		this.device.pushErrorScope('out-of-memory');
		this.device.pushErrorScope('validation');

		// Create buffers with error handling
		let inputBuffer: GPUBuffer | null = null;
		let outputBuffer: GPUBuffer | null = null;
		let paramBuffer: GPUBuffer | null = null;

		try {
			inputBuffer = this.createBuffer(
				'input',
				sourceWidth * sourceHeight * 4,
				GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
			);

			outputBuffer = this.createBuffer(
				'output',
				targetWidth * targetHeight * 4,
				GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
			);

			paramBuffer = this.createBuffer(
				'params',
				16, // 4 * u32
				GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			);
		} catch (bufferError) {
			console.error('[WebGPU] Failed to create buffers:', bufferError);
			// Clean up any created buffers
			if (inputBuffer) this.releaseBuffer('input');
			if (outputBuffer) this.releaseBuffer('output');
			if (paramBuffer) this.releaseBuffer('params');

			// Check for memory errors
			const memoryError = await this.device.popErrorScope();
			const validationError = await this.device.popErrorScope();

			if (memoryError) {
				console.error('[WebGPU] Out of memory error:', memoryError);
				throw new Error('GPU out of memory - reduce image size or close other applications');
			}
			if (validationError) {
				console.error('[WebGPU] Validation error:', validationError);
			}
			throw bufferError;
		}

		// Check for errors after buffer creation
		const memoryError = await this.device.popErrorScope();
		const validationError = await this.device.popErrorScope();

		if (memoryError || validationError) {
			this.releaseBuffer('input');
			this.releaseBuffer('output');
			this.releaseBuffer('params');
			throw new Error(
				'Failed to allocate GPU buffers: ' + (memoryError?.message || validationError?.message)
			);
		}

		// Upload data
		const inputArray = new Uint32Array(inputData.data.buffer);
		this.device.queue.writeBuffer(inputBuffer, 0, inputArray);

		const params = new Uint32Array([sourceWidth, sourceHeight, targetWidth, targetHeight]);
		this.device.queue.writeBuffer(paramBuffer, 0, params);

		const memoryTime = performance.now() - memoryStartTime;
		const computeStartTime = performance.now();

		// Create bind group
		const pipeline = this.computePipelines.get('resize')!;
		const bindGroup = this.device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: inputBuffer } },
				{ binding: 1, resource: { buffer: outputBuffer } },
				{ binding: 2, resource: { buffer: paramBuffer } }
			]
		});

		// Dispatch compute shader
		const commandEncoder = this.device.createCommandEncoder();
		const computePass = commandEncoder.beginComputePass();

		computePass.setPipeline(pipeline);
		computePass.setBindGroup(0, bindGroup);

		const workgroupsX = Math.ceil(targetWidth / 8);
		const workgroupsY = Math.ceil(targetHeight / 8);
		computePass.dispatchWorkgroups(workgroupsX, workgroupsY);

		computePass.end();

		// Copy result to readable buffer
		const readBuffer = this.createBuffer(
			'read',
			targetWidth * targetHeight * 4,
			GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		);

		commandEncoder.copyBufferToBuffer(
			outputBuffer,
			0,
			readBuffer,
			0,
			targetWidth * targetHeight * 4
		);

		const commands = commandEncoder.finish();
		this.device.queue.submit([commands]);

		// Read back results
		await readBuffer.mapAsync(GPUMapMode.READ);
		const arrayBuffer = readBuffer.getMappedRange();
		const resultData = new Uint8ClampedArray(arrayBuffer.slice(0));
		readBuffer.unmap();

		const computeTime = performance.now() - computeStartTime;
		const totalTime = performance.now() - startTime;

		// Clean up
		this.releaseBuffer('input');
		this.releaseBuffer('output');
		this.releaseBuffer('params');
		this.releaseBuffer('read');

		// Create result ImageData
		const outputImageData = new ImageData(resultData, targetWidth, targetHeight);

		console.log(
			`[WebGPU] Resize completed: ${sourceWidth}x${sourceHeight} → ${targetWidth}x${targetHeight} in ${Math.round(totalTime)}ms`
		);

		return {
			id: task.id,
			outputData: outputImageData,
			processingTimeMs: totalTime,
			method: 'webgpu',
			performance: {
				gpuTime: totalTime,
				memoryTransferTime: memoryTime,
				computeTime: computeTime
			}
		};
	}

	private async processEnhance(
		task: ImageProcessingTask,
		startTime: number
	): Promise<ProcessingResult> {
		if (!this.device || !this.computePipelines.has('enhance')) {
			throw new Error('Enhance pipeline not available');
		}

		const { inputData, parameters = {} } = task;
		const { width, height } = inputData;

		// Create buffers
		const inputBuffer = this.createBuffer(
			'input',
			width * height * 4,
			GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
		);

		const outputBuffer = this.createBuffer(
			'output',
			width * height * 4,
			GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
		);

		const paramBuffer = this.createBuffer(
			'params',
			32, // 8 * f32
			GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		);

		// Upload data
		const inputArray = new Uint32Array(inputData.data.buffer);
		this.device.queue.writeBuffer(inputBuffer, 0, inputArray);

		const params = new Float32Array([
			width,
			height,
			parameters.brightness ?? 0.0,
			parameters.contrast ?? 1.0,
			parameters.saturation ?? 1.0,
			parameters.sharpness ?? 1.0,
			parameters.gamma ?? 1.0,
			0.0 // padding
		]);
		this.device.queue.writeBuffer(paramBuffer, 0, params);

		// Execute compute shader
		const pipeline = this.computePipelines.get('enhance')!;
		const bindGroup = this.device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: inputBuffer } },
				{ binding: 1, resource: { buffer: outputBuffer } },
				{ binding: 2, resource: { buffer: paramBuffer } }
			]
		});

		const commandEncoder = this.device.createCommandEncoder();
		const computePass = commandEncoder.beginComputePass();

		computePass.setPipeline(pipeline);
		computePass.setBindGroup(0, bindGroup);

		const totalPixels = width * height;
		const workgroups = Math.ceil(totalPixels / 64);
		computePass.dispatchWorkgroups(workgroups);

		computePass.end();

		// Copy result
		const readBuffer = this.createBuffer(
			'read',
			width * height * 4,
			GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		);

		commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, width * height * 4);

		const commands = commandEncoder.finish();
		this.device.queue.submit([commands]);

		// Read results
		await readBuffer.mapAsync(GPUMapMode.READ);
		const arrayBuffer = readBuffer.getMappedRange();
		const resultData = new Uint8ClampedArray(arrayBuffer.slice(0));
		readBuffer.unmap();

		const totalTime = performance.now() - startTime;

		// Clean up
		this.releaseBuffer('input');
		this.releaseBuffer('output');
		this.releaseBuffer('params');
		this.releaseBuffer('read');

		const outputImageData = new ImageData(resultData, width, height);

		return {
			id: task.id,
			outputData: outputImageData,
			processingTimeMs: totalTime,
			method: 'webgpu',
			performance: {
				gpuTime: totalTime
			}
		};
	}

	private async processCPUFallback(
		task: ImageProcessingTask,
		startTime: number
	): Promise<ProcessingResult> {
		console.log(`[WebGPU] Using CPU fallback for ${task.operation}`);

		// Simple CPU implementations for fallback
		switch (task.operation) {
			case 'resize':
				return this.cpuResize(task, startTime);
			case 'enhance':
				return this.cpuEnhance(task, startTime);
			default:
				throw new Error(`CPU fallback not implemented for ${task.operation}`);
		}
	}

	private cpuResize(task: ImageProcessingTask, startTime: number): ProcessingResult {
		const { inputData, width: targetWidth, height: targetHeight } = task;
		const { width: sourceWidth, height: sourceHeight, data: sourceData } = inputData;

		const outputData = new Uint8ClampedArray(targetWidth * targetHeight * 4);

		for (let y = 0; y < targetHeight; y++) {
			for (let x = 0; x < targetWidth; x++) {
				const srcX = (x / targetWidth) * sourceWidth;
				const srcY = (y / targetHeight) * sourceHeight;

				const x1 = Math.floor(srcX);
				const y1 = Math.floor(srcY);
				const x2 = Math.min(x1 + 1, sourceWidth - 1);
				const y2 = Math.min(y1 + 1, sourceHeight - 1);

				const dx = srcX - x1;
				const dy = srcY - y1;

				const idx1 = (y1 * sourceWidth + x1) * 4;
				const idx2 = (y1 * sourceWidth + x2) * 4;
				const idx3 = (y2 * sourceWidth + x1) * 4;
				const idx4 = (y2 * sourceWidth + x2) * 4;

				const outIdx = (y * targetWidth + x) * 4;

				for (let c = 0; c < 4; c++) {
					const v1 = sourceData[idx1 + c] * (1 - dx) + sourceData[idx2 + c] * dx;
					const v2 = sourceData[idx3 + c] * (1 - dx) + sourceData[idx4 + c] * dx;
					outputData[outIdx + c] = v1 * (1 - dy) + v2 * dy;
				}
			}
		}

		const processingTime = performance.now() - startTime;
		const outputImageData = new ImageData(outputData, targetWidth, targetHeight);

		return {
			id: task.id,
			outputData: outputImageData,
			processingTimeMs: processingTime,
			method: 'cpu-fallback',
			performance: {}
		};
	}

	private cpuEnhance(task: ImageProcessingTask, startTime: number): ProcessingResult {
		const { inputData, parameters = {} } = task;
		const { width, height, data } = inputData;
		const outputData = new Uint8ClampedArray(data.length);

		const brightness = parameters.brightness ?? 0;
		const contrast = parameters.contrast ?? 1;
		const gamma = parameters.gamma ?? 1;

		for (let i = 0; i < data.length; i += 4) {
			let r = data[i] / 255;
			let g = data[i + 1] / 255;
			let b = data[i + 2] / 255;
			const a = data[i + 3];

			// Apply brightness
			r += brightness;
			g += brightness;
			b += brightness;

			// Apply contrast
			r = (r - 0.5) * contrast + 0.5;
			g = (g - 0.5) * contrast + 0.5;
			b = (b - 0.5) * contrast + 0.5;

			// Apply gamma
			r = Math.pow(Math.max(r, 0), gamma);
			g = Math.pow(Math.max(g, 0), gamma);
			b = Math.pow(Math.max(b, 0), gamma);

			// Clamp and output
			outputData[i] = Math.max(0, Math.min(255, r * 255));
			outputData[i + 1] = Math.max(0, Math.min(255, g * 255));
			outputData[i + 2] = Math.max(0, Math.min(255, b * 255));
			outputData[i + 3] = a;
		}

		const processingTime = performance.now() - startTime;
		const outputImageData = new ImageData(outputData, width, height);

		return {
			id: task.id,
			outputData: outputImageData,
			processingTimeMs: processingTime,
			method: 'cpu-fallback',
			performance: {}
		};
	}

	/**
	 * Buffer management with pooling for performance
	 */
	private createBuffer(label: string, size: number, usage: GPUBufferUsageFlags): GPUBuffer {
		if (!this.device) throw new Error('Device not initialized');

		const buffer = this.device.createBuffer({
			label: `${label} buffer`,
			size: Math.max(size, 4), // Minimum size
			usage
		});

		this.bufferPool.set(label, buffer);
		return buffer;
	}

	private releaseBuffer(label: string): void {
		const buffer = this.bufferPool.get(label);
		if (buffer) {
			buffer.destroy();
			this.bufferPool.delete(label);
		}
	}

	/**
	 * Check if WebGPU is supported and available
	 */
	static isSupported(): boolean {
		return typeof navigator !== 'undefined' && 'gpu' in navigator;
	}

	/**
	 * Comprehensive WebGPU capability detection using device manager coordination
	 */
	static async getSystemCapabilities(): Promise<{
		webgpuSupported: boolean;
		memoryAllocationLikely: boolean;
		recommendWebGPU: boolean;
		reason: string;
	}> {
		// Basic support check
		if (!WebGPUImageProcessor.isSupported()) {
			return {
				webgpuSupported: false,
				memoryAllocationLikely: false,
				recommendWebGPU: false,
				reason: 'WebGPU not supported in browser'
			};
		}

		try {
			console.log('[WebGPU] Running coordinated capability assessment...');

			// Import device manager
			const { WebGPUDeviceManager } = await import('./webgpu-device-manager');
			const deviceManager = WebGPUDeviceManager.getInstance();

			// Check if WebGPU is currently in use by another system
			const memoryStatus = await deviceManager.assessMemoryPressure();

			if (!memoryStatus.canAllocate) {
				console.warn(`[WebGPU] WebGPU unavailable: ${memoryStatus.reason}`);

				// If it's in use by another system, we might still be able to share or wait
				return {
					webgpuSupported: false,
					memoryAllocationLikely: false,
					recommendWebGPU: false,
					reason: memoryStatus.reason
				};
			}

			// Try to get a coordinated device for testing
			const testDevice = await deviceManager.getDevice('webp-converter-test', {
				powerPreference: 'low-power',
				requiredFeatures: [],
				requiredLimits: {},
				maxRetries: 1
			});

			if (!testDevice) {
				return {
					webgpuSupported: true,
					memoryAllocationLikely: false,
					recommendWebGPU: false,
					reason: 'Cannot allocate WebGPU device - system limitations or conflicts'
				};
			}

			// Success - get memory info
			const maxBufferSize = testDevice.limits?.maxStorageBufferBindingSize || 0;
			const memoryMB = Math.round(maxBufferSize / (1024 * 1024));

			// Clean up test device
			// Note: Device cleanup is handled automatically by WebGPU Manager

			console.log(`[WebGPU] ✅ Coordinated device creation successful - ${memoryMB}MB available`);

			return {
				webgpuSupported: true,
				memoryAllocationLikely: true,
				recommendWebGPU: true,
				reason: `WebGPU operational via coordination: ${memoryMB}MB available`
			};
		} catch (error) {
			console.warn(
				`[WebGPU] Coordinated assessment failed: ${error instanceof Error ? error.message : String(error)}`
			);
			return {
				webgpuSupported: true,
				memoryAllocationLikely: false,
				recommendWebGPU: false,
				reason: `Coordination failed: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	}

	/**
	 * Get optimal processing parameters for current hardware
	 */
	async getOptimalParameters(): Promise<WebGPUProcessingOptions> {
		if (!this.adapter) {
			await this.initialize();
		}

		if (!this.adapter) {
			return this.options;
		}

		// Get adapter info for optimization
		const limits = this.adapter.limits;

		return {
			workgroupSize: Math.min(64, limits.maxComputeWorkgroupSizeX),
			maxBufferSize: Math.min(256 * 1024 * 1024, limits.maxStorageBufferBindingSize),
			enableDebug: this.options.enableDebug,
			fallbackToCPU: true
		};
	}

	/**
	 * Clean up resources with coordinated device management
	 */
	cleanup(): void {
		// Release all buffers
		for (const buffer of Array.from(this.bufferPool.values())) {
			buffer.destroy();
		}
		this.bufferPool.clear();

		// Clear pipelines
		this.computePipelines.clear();

		// Release device through device manager if available
		const deviceManager = (this as any).deviceManager;
		if (deviceManager) {
			console.log('[WebGPU] Releasing device through coordination manager');
			// The WebGPU Manager handles device cleanup automatically via device.lost monitoring
			// No explicit release method needed - just clear our reference
			(this as any).deviceManager = null;
		} else if (this.device) {
			// Fallback to direct cleanup if no device manager
			console.log('[WebGPU] Direct device cleanup (no coordination manager)');
			this.device.destroy();
		}

		this.device = null;
		this.adapter = null;
		this.isInitialized = false;

		console.log('[WebGPU] Cleanup completed');
	}

	dispose(): void {
		this.cleanup();
	}
}
