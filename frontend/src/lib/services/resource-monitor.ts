/**
 * Resource Monitoring Service
 * Comprehensive system resource tracking for memory, CPU, network, and storage
 */

import type { ResourceMonitoring, Alert } from '../types/performance.js';
import { trackCustomMetric } from './performance-monitor.js';
import { addErrorBreadcrumb } from './error-tracker.js';

/**
 * Resource thresholds for alerting
 */
export interface ResourceThresholds {
	memoryUsage: number; // Bytes
	heapUsage: number; // Bytes
	cpuUsage: number; // Percentage
	networkLatency: number; // Milliseconds
	storageUsage: number; // Bytes
}

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
	latency: number;
	downloadSpeed: number;
	uploadSpeed: number;
	connectionType: string;
	effectiveType: string;
	rtt: number;
	downlink: number;
}

/**
 * Memory performance metrics
 */
export interface MemoryMetrics {
	totalJSHeapSize: number;
	usedJSHeapSize: number;
	jsHeapSizeLimit: number;
	wasmMemoryUsage: number;
	estimatedDOMSize: number;
	localStorageUsage: number;
	sessionStorageUsage: number;
}

/**
 * CPU performance approximation
 */
export interface CPUMetrics {
	estimatedUsage: number;
	mainThreadBlocked: number;
	frameRate: number;
	taskQueueLength: number;
}

/**
 * Storage metrics
 */
export interface StorageMetrics {
	localStorage: number;
	sessionStorage: number;
	indexedDB: number;
	cacheStorage: number;
	total: number;
}

/**
 * Resource history entry
 */
export interface ResourceSnapshot {
	timestamp: number;
	memory: MemoryMetrics;
	cpu: CPUMetrics;
	network: NetworkMetrics;
	storage: StorageMetrics;
}

/**
 * Resource Monitor Class
 */
export class ResourceMonitor {
	private isMonitoring = false;
	private monitoringInterval?: number;
	private resourceHistory: ResourceSnapshot[] = [];
	private maxHistoryLength = 1000;
	private thresholds: ResourceThresholds;
	private networkObserver?: PerformanceObserver;
	private frameRateHistory: number[] = [];
	private taskStartTimes = new Map<string, number>();

	constructor(thresholds?: Partial<ResourceThresholds>) {
		this.thresholds = {
			memoryUsage: 512 * 1024 * 1024, // 512MB
			heapUsage: 256 * 1024 * 1024, // 256MB
			cpuUsage: 80, // 80%
			networkLatency: 1000, // 1 second
			storageUsage: 50 * 1024 * 1024, // 50MB
			...thresholds
		};

		this.initializeMonitoring();
	}

	/**
	 * Start resource monitoring
	 */
	startMonitoring(intervalMs = 5000): void {
		if (this.isMonitoring) {
			return;
		}

		this.isMonitoring = true;

		// Take initial snapshot
		this.takeSnapshot();

		// Set up periodic monitoring
		this.monitoringInterval = window.setInterval(() => {
			this.takeSnapshot();
		}, intervalMs);

		// Set up frame rate monitoring
		this.startFrameRateMonitoring();

		// Set up network monitoring
		this.startNetworkMonitoring();

		addErrorBreadcrumb('Resource monitoring started');
	}

	/**
	 * Stop resource monitoring
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) {
			return;
		}

		this.isMonitoring = false;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = undefined;
		}

		this.stopFrameRateMonitoring();
		this.stopNetworkMonitoring();

		addErrorBreadcrumb('Resource monitoring stopped');
	}

	/**
	 * Get current resource usage
	 */
	getCurrentResources(): ResourceMonitoring {
		const memory = this.getMemoryMetrics();
		const cpu = this.getCPUMetrics();
		const network = this.getNetworkMetrics();
		const storage = this.getStorageMetrics();

		return {
			heapUsage: memory.usedJSHeapSize,
			wasmMemoryUsage: memory.wasmMemoryUsage,
			cpuUsage: cpu.estimatedUsage,
			threadUtilization: {}, // Will be populated by WASM tracker
			networkLatency: network.latency,
			bandwidthUtilization: network.downlink,
			localStorageUsage: storage.localStorage,
			cacheUtilization: storage.cacheStorage
		};
	}

	/**
	 * Get detailed memory metrics
	 */
	getMemoryMetrics(): MemoryMetrics {
		const memory = this.getPerformanceMemory();

		return {
			totalJSHeapSize: memory.totalJSHeapSize,
			usedJSHeapSize: memory.usedJSHeapSize,
			jsHeapSizeLimit: memory.jsHeapSizeLimit,
			wasmMemoryUsage: this.getWASMMemoryUsage(),
			estimatedDOMSize: this.estimateDOMSize(),
			localStorageUsage: this.getLocalStorageUsage(),
			sessionStorageUsage: this.getSessionStorageUsage()
		};
	}

	/**
	 * Get CPU performance metrics (approximated)
	 */
	getCPUMetrics(): CPUMetrics {
		return {
			estimatedUsage: this.estimateCPUUsage(),
			mainThreadBlocked: this.getMainThreadBlockedTime(),
			frameRate: this.getAverageFrameRate(),
			taskQueueLength: this.estimateTaskQueueLength()
		};
	}

	/**
	 * Get network performance metrics
	 */
	getNetworkMetrics(): NetworkMetrics {
		const connection = this.getNetworkConnection();

		return {
			latency: this.measureNetworkLatency(),
			downloadSpeed: this.getDownloadSpeed(),
			uploadSpeed: this.getUploadSpeed(),
			connectionType: connection.type,
			effectiveType: connection.effectiveType,
			rtt: connection.rtt,
			downlink: connection.downlink
		};
	}

	/**
	 * Get storage usage metrics
	 */
	getStorageMetrics(): StorageMetrics {
		const localStorage = this.getLocalStorageUsage();
		const sessionStorage = this.getSessionStorageUsage();
		const indexedDB = this.getIndexedDBUsage();
		const cacheStorage = this.getCacheStorageUsage();

		return {
			localStorage,
			sessionStorage,
			indexedDB,
			cacheStorage,
			total: localStorage + sessionStorage + indexedDB + cacheStorage
		};
	}

	/**
	 * Get resource usage history
	 */
	getResourceHistory(limit?: number): ResourceSnapshot[] {
		const history = [...this.resourceHistory].reverse();
		return limit ? history.slice(0, limit) : history;
	}

	/**
	 * Get resource usage trends
	 */
	getResourceTrends(): {
		memory: { trend: 'increasing' | 'decreasing' | 'stable'; rate: number };
		cpu: { trend: 'increasing' | 'decreasing' | 'stable'; rate: number };
		network: { trend: 'improving' | 'degrading' | 'stable'; rate: number };
	} {
		if (this.resourceHistory.length < 10) {
			return {
				memory: { trend: 'stable', rate: 0 },
				cpu: { trend: 'stable', rate: 0 },
				network: { trend: 'stable', rate: 0 }
			};
		}

		const recent = this.resourceHistory.slice(-10);
		const older = this.resourceHistory.slice(-20, -10);

		const memoryTrend = this.calculateTrend(
			older.map((s) => s.memory.usedJSHeapSize),
			recent.map((s) => s.memory.usedJSHeapSize)
		);

		const cpuTrend = this.calculateTrend(
			older.map((s) => s.cpu.estimatedUsage),
			recent.map((s) => s.cpu.estimatedUsage)
		);

		const networkTrend = this.calculateTrend(
			older.map((s) => s.network.latency),
			recent.map((s) => s.network.latency),
			true // Lower is better for latency
		);

		return {
			memory: memoryTrend,
			cpu: cpuTrend,
			network: networkTrend
		};
	}

	/**
	 * Check for resource threshold violations
	 */
	checkThresholds(): Alert[] {
		const alerts: Alert[] = [];
		const current = this.getCurrentResources();

		if (current.heapUsage > this.thresholds.heapUsage) {
			alerts.push({
				id: `memory_threshold_${Date.now()}`,
				type: 'resource-limit',
				severity: current.heapUsage > this.thresholds.heapUsage * 1.5 ? 'critical' : 'warning',
				title: 'Memory Usage High',
				description: `Heap usage (${Math.round(current.heapUsage / 1024 / 1024)}MB) exceeds threshold`,
				threshold: this.thresholds.heapUsage,
				currentValue: current.heapUsage,
				timestamp: new Date(),
				resolved: false
			});
		}

		if (current.cpuUsage > this.thresholds.cpuUsage) {
			alerts.push({
				id: `cpu_threshold_${Date.now()}`,
				type: 'resource-limit',
				severity: current.cpuUsage > this.thresholds.cpuUsage * 1.2 ? 'critical' : 'warning',
				title: 'CPU Usage High',
				description: `CPU usage (${current.cpuUsage.toFixed(1)}%) exceeds threshold`,
				threshold: this.thresholds.cpuUsage,
				currentValue: current.cpuUsage,
				timestamp: new Date(),
				resolved: false
			});
		}

		if (current.networkLatency > this.thresholds.networkLatency) {
			alerts.push({
				id: `network_threshold_${Date.now()}`,
				type: 'resource-limit',
				severity: 'warning',
				title: 'Network Latency High',
				description: `Network latency (${current.networkLatency}ms) exceeds threshold`,
				threshold: this.thresholds.networkLatency,
				currentValue: current.networkLatency,
				timestamp: new Date(),
				resolved: false
			});
		}

		return alerts;
	}

	/**
	 * Estimate resource impact of an operation
	 */
	estimateResourceImpact(operation: {
		type: 'image-processing' | 'file-upload' | 'wasm-loading';
		size?: number;
		complexity?: 'low' | 'medium' | 'high';
	}): {
		estimatedMemoryIncrease: number;
		estimatedCPUUsage: number;
		estimatedDuration: number;
		recommendations: string[];
	} {
		const baseMemory = this.getMemoryMetrics().usedJSHeapSize;
		const baseCPU = this.getCPUMetrics().estimatedUsage;

		let memoryIncrease = 0;
		let cpuUsage = 0;
		let duration = 0;
		const recommendations: string[] = [];

		switch (operation.type) {
			case 'image-processing':
				memoryIncrease = (operation.size || 1024 * 1024) * 2; // Estimate 2x image size
				cpuUsage =
					operation.complexity === 'high' ? 80 : operation.complexity === 'medium' ? 60 : 40;
				duration = (operation.size || 1024 * 1024) / 1000; // Rough estimate

				if (baseMemory + memoryIncrease > this.thresholds.memoryUsage) {
					recommendations.push('Consider reducing image size before processing');
					recommendations.push('Close other browser tabs to free memory');
				}
				break;

			case 'file-upload':
				memoryIncrease = operation.size || 0;
				cpuUsage = 20;
				duration = (operation.size || 0) / 100000; // Network dependent

				if (operation.size && operation.size > 10 * 1024 * 1024) {
					recommendations.push('Large file upload may impact performance');
				}
				break;

			case 'wasm-loading':
				memoryIncrease = 10 * 1024 * 1024; // Estimate 10MB
				cpuUsage = 50;
				duration = 1000; // 1 second estimate

				if (baseMemory + memoryIncrease > this.thresholds.memoryUsage) {
					recommendations.push('Ensure sufficient memory before loading WASM module');
				}
				break;
		}

		return {
			estimatedMemoryIncrease: memoryIncrease,
			estimatedCPUUsage: cpuUsage,
			estimatedDuration: duration,
			recommendations
		};
	}

	// Private methods

	private initializeMonitoring(): void {
		// Check if performance monitoring is available
		if (!('performance' in window)) {
			console.warn('Performance API not available');
			return;
		}

		// Check if memory monitoring is available
		if (!('memory' in performance)) {
			console.warn('Memory monitoring not available');
		}

		addErrorBreadcrumb('Resource monitor initialized');
	}

	private takeSnapshot(): void {
		const timestamp = Date.now();
		const memory = this.getMemoryMetrics();
		const cpu = this.getCPUMetrics();
		const network = this.getNetworkMetrics();
		const storage = this.getStorageMetrics();

		const snapshot: ResourceSnapshot = {
			timestamp,
			memory,
			cpu,
			network,
			storage
		};

		this.resourceHistory.push(snapshot);

		// Trim history if too long
		if (this.resourceHistory.length > this.maxHistoryLength) {
			this.resourceHistory.shift();
		}

		// Track metrics
		this.trackResourceMetrics(snapshot);

		// Check thresholds
		const alerts = this.checkThresholds();
		if (alerts.length > 0) {
			addErrorBreadcrumb(`Resource threshold violations: ${alerts.length} alerts`);
		}
	}

	private getPerformanceMemory(): {
		totalJSHeapSize: number;
		usedJSHeapSize: number;
		jsHeapSizeLimit: number;
	} {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			return {
				totalJSHeapSize: memory.totalJSHeapSize || 0,
				usedJSHeapSize: memory.usedJSHeapSize || 0,
				jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
			};
		}

		return {
			totalJSHeapSize: 0,
			usedJSHeapSize: 0,
			jsHeapSizeLimit: 0
		};
	}

	private getWASMMemoryUsage(): number {
		// This would be populated by the WASM performance tracker
		return 0;
	}

	private estimateDOMSize(): number {
		try {
			const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);

			let nodeCount = 0;
			while (walker.nextNode()) {
				nodeCount++;
			}

			return nodeCount * 100; // Rough estimate of memory per node
		} catch {
			return 0;
		}
	}

	private getLocalStorageUsage(): number {
		try {
			let total = 0;
			for (const key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					total += localStorage[key].length;
				}
			}
			return total * 2; // UTF-16 encoding
		} catch {
			return 0;
		}
	}

	private getSessionStorageUsage(): number {
		try {
			let total = 0;
			for (const key in sessionStorage) {
				if (sessionStorage.hasOwnProperty(key)) {
					total += sessionStorage[key].length;
				}
			}
			return total * 2; // UTF-16 encoding
		} catch {
			return 0;
		}
	}

	private getIndexedDBUsage(): number {
		// Complex to calculate, would need specific implementation
		return 0;
	}

	private getCacheStorageUsage(): number {
		// Would need Cache API implementation
		return 0;
	}

	private estimateCPUUsage(): number {
		// Approximate CPU usage based on frame rate and task timing
		const frameRate = this.getAverageFrameRate();
		const targetFrameRate = 60;

		if (frameRate <= 0) return 0;

		const usage = Math.max(0, 100 - (frameRate / targetFrameRate) * 100);
		return Math.min(100, usage);
	}

	private getMainThreadBlockedTime(): number {
		// Would use Performance Observer to track long tasks
		return 0;
	}

	private getAverageFrameRate(): number {
		if (this.frameRateHistory.length === 0) return 60; // Assume 60fps if no data

		const sum = this.frameRateHistory.reduce((a, b) => a + b, 0);
		return sum / this.frameRateHistory.length;
	}

	private estimateTaskQueueLength(): number {
		// Approximate based on requestAnimationFrame timing
		return 0;
	}

	private startFrameRateMonitoring(): void {
		let lastTime = performance.now();
		let frameCount = 0;

		const measureFrameRate = (currentTime: number) => {
			frameCount++;

			if (currentTime - lastTime >= 1000) {
				const fps = frameCount;
				this.frameRateHistory.push(fps);

				// Keep only last 10 measurements
				if (this.frameRateHistory.length > 10) {
					this.frameRateHistory.shift();
				}

				frameCount = 0;
				lastTime = currentTime;
			}

			if (this.isMonitoring) {
				requestAnimationFrame(measureFrameRate);
			}
		};

		requestAnimationFrame(measureFrameRate);
	}

	private stopFrameRateMonitoring(): void {
		// Frame rate monitoring stops when isMonitoring becomes false
	}

	private startNetworkMonitoring(): void {
		try {
			this.networkObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
						// Track network timing
					}
				});
			});

			this.networkObserver.observe({ entryTypes: ['navigation', 'resource'] });
		} catch (error) {
			console.warn('Network monitoring not available:', error);
		}
	}

	private stopNetworkMonitoring(): void {
		if (this.networkObserver) {
			this.networkObserver.disconnect();
			this.networkObserver = undefined;
		}
	}

	private getNetworkConnection(): {
		type: string;
		effectiveType: string;
		rtt: number;
		downlink: number;
	} {
		const connection =
			(navigator as any).connection ||
			(navigator as any).mozConnection ||
			(navigator as any).webkitConnection;

		if (connection) {
			return {
				type: connection.type || 'unknown',
				effectiveType: connection.effectiveType || 'unknown',
				rtt: connection.rtt || 0,
				downlink: connection.downlink || 0
			};
		}

		return {
			type: 'unknown',
			effectiveType: 'unknown',
			rtt: 0,
			downlink: 0
		};
	}

	private measureNetworkLatency(): number {
		// Would implement network latency measurement
		return 0;
	}

	private getDownloadSpeed(): number {
		const connection = this.getNetworkConnection();
		return connection.downlink;
	}

	private getUploadSpeed(): number {
		// Would need specific measurement implementation
		return 0;
	}

	private calculateTrend(
		older: number[],
		recent: number[],
		lowerIsBetter = false
	): { trend: 'increasing' | 'decreasing' | 'stable'; rate: number } {
		const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
		const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;

		const change = recentAvg - olderAvg;
		const changePercent = (Math.abs(change) / olderAvg) * 100;

		if (changePercent < 5) {
			return { trend: 'stable', rate: 0 };
		}

		if (lowerIsBetter) {
			return {
				trend: change > 0 ? ('degrading' as any) : ('improving' as any),
				rate: changePercent
			};
		}

		return {
			trend: change > 0 ? 'increasing' : 'decreasing',
			rate: changePercent
		};
	}

	private trackResourceMetrics(snapshot: ResourceSnapshot): void {
		trackCustomMetric('memory_heap_used', snapshot.memory.usedJSHeapSize);
		trackCustomMetric('memory_heap_total', snapshot.memory.totalJSHeapSize);
		trackCustomMetric('memory_wasm', snapshot.memory.wasmMemoryUsage);
		trackCustomMetric('cpu_estimated_usage', snapshot.cpu.estimatedUsage);
		trackCustomMetric('frame_rate', snapshot.cpu.frameRate);
		trackCustomMetric('network_latency', snapshot.network.latency);
		trackCustomMetric('network_downlink', snapshot.network.downlink);
		trackCustomMetric('storage_total', snapshot.storage.total);
	}
}

// Create singleton instance
export const resourceMonitor = new ResourceMonitor();

// Export helper functions
export function startResourceMonitoring(intervalMs?: number): void {
	resourceMonitor.startMonitoring(intervalMs);
}

export function stopResourceMonitoring(): void {
	resourceMonitor.stopMonitoring();
}

export function getCurrentResources(): ResourceMonitoring {
	return resourceMonitor.getCurrentResources();
}

export function getMemoryMetrics(): MemoryMetrics {
	return resourceMonitor.getMemoryMetrics();
}

export function getCPUMetrics(): CPUMetrics {
	return resourceMonitor.getCPUMetrics();
}

export function getNetworkMetrics(): NetworkMetrics {
	return resourceMonitor.getNetworkMetrics();
}

export function getStorageMetrics(): StorageMetrics {
	return resourceMonitor.getStorageMetrics();
}

export function getResourceHistory(limit?: number): ResourceSnapshot[] {
	return resourceMonitor.getResourceHistory(limit);
}

export function getResourceTrends() {
	return resourceMonitor.getResourceTrends();
}

export function checkResourceThresholds(): Alert[] {
	return resourceMonitor.checkThresholds();
}

export function estimateResourceImpact(operation: {
	type: 'image-processing' | 'file-upload' | 'wasm-loading';
	size?: number;
	complexity?: 'low' | 'medium' | 'high';
}) {
	return resourceMonitor.estimateResourceImpact(operation);
}
