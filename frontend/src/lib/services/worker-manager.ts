/**
 * Web Worker Manager for vectorizer worker communication
 * Provides a clean interface for interacting with the vectorizer worker
 */

import { browser } from '$app/environment';
import type {
  WorkerMessageType,
  WorkerInitMessage,
  WorkerProcessMessage,
  WorkerProgressMessage,
  WorkerResultMessage,
  WorkerErrorMessage,
  WorkerCapabilitiesMessage,
  VectorizerConfig,
  ProcessingResult,
  ProcessingProgress,
  VectorizerError,
  WasmCapabilityReport
} from '$lib/types/vectorizer';

export class WorkerManager {
  private static instance: WorkerManager | null = null;
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: VectorizerError) => void;
    onProgress?: (progress: ProcessingProgress) => void;
  }>();

  private constructor() {}

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  /**
   * Initialize the worker (browser-only)
   */
  async initialize(): Promise<WasmCapabilityReport> {
    if (!browser) {
      throw new Error('WorkerManager can only be initialized in the browser');
    }

    if (this.worker) {
      // Already initialized
      return this.checkCapabilities();
    }

    try {
      // Create the worker
      this.worker = new Worker(
        new URL('../workers/vectorizer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up message handling
      this.worker.onmessage = (event: MessageEvent<WorkerMessageType>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.rejectAllPending({
          type: 'unknown',
          message: 'Worker error',
          details: error.message
        });
      };

      // Initialize the worker
      const initResult = await this.sendMessage<{ initialized: boolean; capabilities: WasmCapabilityReport }>({
        id: this.generateMessageId(),
        type: 'init'
      });

      return initResult.capabilities;

    } catch (error) {
      const workerError: VectorizerError = {
        type: 'unknown',
        message: 'Failed to initialize worker',
        details: error instanceof Error ? error.message : String(error)
      };
      throw workerError;
    }
  }

  /**
   * Check WASM capabilities
   */
  async checkCapabilities(): Promise<WasmCapabilityReport> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const message: WorkerCapabilitiesMessage = {
      id: this.generateMessageId(),
      type: 'capabilities',
      capabilities: {} as WasmCapabilityReport // Will be filled by worker
    };

    return this.sendMessage<WasmCapabilityReport>(message);
  }

  /**
   * Process an image using the worker
   */
  async processImage(
    imageData: ImageData,
    config: VectorizerConfig,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const message: WorkerProcessMessage = {
      id: this.generateMessageId(),
      type: 'process',
      image_data: imageData,
      config
    };

    return this.sendMessage<ProcessingResult>(message, onProgress);
  }

  /**
   * Cleanup the worker
   */
  cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.rejectAllPending({
      type: 'unknown',
      message: 'Worker terminated'
    });
    this.pendingMessages.clear();
  }

  /**
   * Check if worker is initialized
   */
  isInitialized(): boolean {
    return this.worker !== null;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  private sendMessage<T>(
    message: WorkerMessageType,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject({
          type: 'unknown',
          message: 'Worker not initialized'
        } as VectorizerError);
        return;
      }

      // Store the pending message handlers
      this.pendingMessages.set(message.id, {
        resolve,
        reject,
        onProgress
      });

      // Send the message
      this.worker.postMessage(message);
    });
  }

  private handleWorkerMessage(message: WorkerMessageType): void {
    const pending = this.pendingMessages.get(message.id);
    if (!pending) {
      console.warn('Received message for unknown ID:', message.id);
      return;
    }

    switch (message.type) {
      case 'result':
        const resultMessage = message as WorkerResultMessage;
        pending.resolve(resultMessage.result);
        this.pendingMessages.delete(message.id);
        break;

      case 'error':
        const errorMessage = message as WorkerErrorMessage;
        pending.reject(errorMessage.error);
        this.pendingMessages.delete(message.id);
        break;

      case 'progress':
        const progressMessage = message as WorkerProgressMessage;
        if (pending.onProgress) {
          pending.onProgress(progressMessage.progress);
        }
        // Don't delete - we're still waiting for the final result
        break;

      case 'capabilities':
        const capabilitiesMessage = message as WorkerCapabilitiesMessage;
        pending.resolve(capabilitiesMessage.capabilities);
        this.pendingMessages.delete(message.id);
        break;

      default:
        console.warn('Unknown message type:', (message as any).type);
    }
  }

  private rejectAllPending(error: VectorizerError): void {
    for (const pending of this.pendingMessages.values()) {
      pending.reject(error);
    }
    this.pendingMessages.clear();
  }
}

// Export singleton instance
export const workerManager = WorkerManager.getInstance();