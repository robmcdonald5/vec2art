// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Node.js Timer types for browser compatibility
	namespace NodeJS {
		interface Timeout {
			id: number;
		}
		interface Immediate {
			id: number;
		}
		interface Timer {
			id: number;
		}
	}

	// WebGPU type definitions for TypeScript
	interface Navigator {
		gpu?: GPU;
	}

	interface GPU {
		requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
		getPreferredCanvasFormat(): GPUTextureFormat;
	}

	interface GPURequestAdapterOptions {
		powerPreference?: GPUPowerPreference;
		forceFallbackAdapter?: boolean;
	}

	type GPUPowerPreference = 'low-power' | 'high-performance';
	type GPUTextureFormat = string;

	interface GPUAdapter {
		readonly features: Iterable<string>;
		readonly limits: Record<string, number>;
		readonly info: GPUAdapterInfo;
		readonly isFallbackAdapter: boolean;
		requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
	}

	interface GPUAdapterInfo {
		readonly vendor: string;
		readonly architecture: string;
		readonly device: string;
		readonly description: string;
	}

	interface GPUDeviceDescriptor {
		label?: string;
		requiredFeatures?: Iterable<string>;
		requiredLimits?: Record<string, number>;
		defaultQueue?: GPUQueueDescriptor;
	}

	interface GPUQueueDescriptor {
		label?: string;
	}

	interface GPUDevice {
		readonly features: Iterable<string>;
		readonly limits: Record<string, number>;
		readonly queue: GPUQueue;
		readonly lost: Promise<GPUDeviceLostInfo>;

		destroy(): void;
		createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
		createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
		createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
		createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
		createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
		pushErrorScope(filter: GPUErrorFilter): void;
		popErrorScope(): Promise<GPUError | null>;
	}

	interface GPUDeviceLostInfo {
		readonly reason: 'destroyed' | 'unknown';
		readonly message: string;
	}

	interface GPUQueue {
		submit(commandBuffers: Iterable<GPUCommandBuffer>): void;
		writeBuffer(
			buffer: GPUBuffer,
			bufferOffset: number,
			data: BufferSource,
			dataOffset?: number,
			size?: number
		): void;
	}

	interface GPUBuffer {
		readonly size: number;
		readonly usage: number;
		readonly mapState: GPUBufferMapState;

		destroy(): void;
		mapAsync(mode: number, offset?: number, size?: number): Promise<void>;
		getMappedRange(offset?: number, size?: number): ArrayBuffer;
		unmap(): void;
	}

	type GPUBufferMapState = 'unmapped' | 'pending' | 'mapped';

	interface GPUBufferDescriptor {
		size: number;
		usage: number;
		mappedAtCreation?: boolean;
		label?: string;
	}

	enum GPUBufferUsage {
		MAP_READ = 0x0001,
		MAP_WRITE = 0x0002,
		COPY_SRC = 0x0004,
		COPY_DST = 0x0008,
		INDEX = 0x0010,
		VERTEX = 0x0020,
		UNIFORM = 0x0040,
		STORAGE = 0x0080,
		INDIRECT = 0x0100,
		QUERY_RESOLVE = 0x0200
	}

	type GPUBufferUsageFlags = number;

	enum GPUMapMode {
		READ = 0x0001,
		write = 0x0002
	}

	interface GPUShaderModule {
		readonly label: string | null;
		getCompilationInfo(): Promise<GPUCompilationInfo>;
	}

	interface GPUShaderModuleDescriptor {
		code: string;
		label?: string;
		sourceMap?: object;
	}

	interface GPUCompilationInfo {
		readonly messages: Iterable<GPUCompilationMessage>;
	}

	interface GPUCompilationMessage {
		readonly message: string;
		readonly type: GPUCompilationMessageType;
		readonly lineNum: number;
		readonly linePos: number;
		readonly offset: number;
		readonly length: number;
	}

	type GPUCompilationMessageType = 'error' | 'warning' | 'info';

	interface GPUComputePipeline {
		readonly label: string | null;
		getBindGroupLayout(index: number): GPUBindGroupLayout;
	}

	interface GPUComputePipelineDescriptor {
		compute: GPUProgrammableStage;
		layout?: GPUPipelineLayout | 'auto';
		label?: string;
	}

	interface GPUProgrammableStage {
		module: GPUShaderModule;
		entryPoint: string;
		constants?: Record<string, number>;
	}

	interface GPUPipelineLayout {
		readonly label: string | null;
	}

	interface GPUBindGroupLayout {
		readonly label: string | null;
	}

	interface GPUBindGroup {
		readonly label: string | null;
	}

	interface GPUBindGroupDescriptor {
		layout: GPUBindGroupLayout;
		entries: Iterable<GPUBindGroupEntry>;
		label?: string;
	}

	interface GPUBindGroupEntry {
		binding: number;
		resource: GPUBindingResource;
	}

	type GPUBindingResource = GPUBufferBinding | GPUTextureView | GPUSampler;

	interface GPUBufferBinding {
		buffer: GPUBuffer;
		offset?: number;
		size?: number;
	}

	interface GPUTextureView {
		readonly label: string | null;
	}

	interface GPUSampler {
		readonly label: string | null;
	}

	interface GPUCommandEncoder {
		readonly label: string | null;
		beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePass;
		copyBufferToBuffer(
			source: GPUBuffer,
			sourceOffset: number,
			destination: GPUBuffer,
			destinationOffset: number,
			size: number
		): void;
		finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
	}

	interface GPUCommandEncoderDescriptor {
		label?: string;
	}

	interface GPUComputePass {
		readonly label: string | null;
		setPipeline(pipeline: GPUComputePipeline): void;
		setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: Iterable<number>): void;
		dispatchWorkgroups(
			workgroupCountX: number,
			workgroupCountY?: number,
			workgroupCountZ?: number
		): void;
		end(): void;
	}

	interface GPUComputePassDescriptor {
		label?: string;
		timestampWrites?: GPUComputePassTimestampWrites;
	}

	interface GPUComputePassTimestampWrites {
		querySet: GPUQuerySet;
		beginningOfPassWriteIndex?: number;
		endOfPassWriteIndex?: number;
	}

	interface GPUQuerySet {
		readonly label: string | null;
	}

	interface GPUCommandBuffer {
		readonly label: string | null;
	}

	interface GPUCommandBufferDescriptor {
		label?: string;
	}

	type GPUErrorFilter = 'validation' | 'out-of-memory' | 'internal';

	interface GPUError {
		readonly message: string;
	}

	interface GPUValidationError extends GPUError {
		constructor(message: string): GPUValidationError;
	}

	interface GPUOutOfMemoryError extends GPUError {
		constructor(message: string): GPUOutOfMemoryError;
	}

	interface GPUInternalError extends GPUError {
		constructor(message: string): GPUInternalError;
	}





	// Algorithm stats global variable for gallery page
	var algorithmStats: any;

	// Cloudflare Turnstile integration
	interface Window {
		turnstile?: {
			render: (
				container: string | HTMLElement,
				options: {
					sitekey: string;
					callback?: (token: string) => void;
					'error-callback'?: () => void;
					'expired-callback'?: () => void;
					'timeout-callback'?: () => void;
					'before-interactive-callback'?: () => void;
					'after-interactive-callback'?: () => void;
					'unsupported-callback'?: () => void;
					theme?: 'light' | 'dark' | 'auto';
					size?: 'normal' | 'compact';
					tabindex?: number;
					'response-field'?: boolean;
					'response-field-name'?: string;
					retry?: 'auto' | 'never';
					'retry-interval'?: number;
					'refresh-expired'?: 'auto' | 'manual' | 'never';
				}
			) => string;
			reset: (widgetId?: string) => void;
			remove: (widgetId: string) => void;
			getResponse: (widgetId?: string) => string;
			isExpired: (widgetId?: string) => boolean;
		};
	}

}

export {};
