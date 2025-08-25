import type { VectorizerConfig } from '$lib/types/vectorizer';

export interface HistoryEntry {
	config: VectorizerConfig;
	timestamp: Date;
	description: string;
}

class ParameterHistory {
	private history = $state<HistoryEntry[]>([]);
	private currentIndex = $state(-1);
	private maxHistorySize = 50;

	// Derived states - using getter methods for better access patterns
	get canUndo() {
		return this.currentIndex > 0;
	}

	get canRedo() {
		return this.currentIndex < this.history.length - 1;
	}

	// Get current entry
	get current() {
		if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
			return this.history[this.currentIndex];
		}
		return null;
	}

	// Add new entry to history
	push(config: VectorizerConfig, description: string = 'Parameter change') {
		// Use JSON parse/stringify for deep clone to avoid structuredClone issues
		const entry: HistoryEntry = {
			config: JSON.parse(JSON.stringify(config)), // Deep clone to prevent mutations
			timestamp: new Date(),
			description
		};

		// Remove any entries after current index (when undoing then making new changes)
		if (this.currentIndex < this.history.length - 1) {
			this.history = this.history.slice(0, this.currentIndex + 1);
		}

		// Add new entry
		this.history.push(entry);
		this.currentIndex = this.history.length - 1;

		// Trim history if too large
		if (this.history.length > this.maxHistorySize) {
			this.history = this.history.slice(-this.maxHistorySize);
			this.currentIndex = this.history.length - 1;
		}
	}

	// Undo to previous state
	undo(): VectorizerConfig | null {
		if (!this.canUndo) return null;

		this.currentIndex--;
		return this.current ? JSON.parse(JSON.stringify(this.current.config)) : null;
	}

	// Redo to next state
	redo(): VectorizerConfig | null {
		if (!this.canRedo) return null;

		this.currentIndex++;
		return this.current ? JSON.parse(JSON.stringify(this.current.config)) : null;
	}

	// Get history for display
	getHistory(): HistoryEntry[] {
		return this.history.map((entry) => ({ ...entry }));
	}

	// Clear all history
	clear() {
		this.history = [];
		this.currentIndex = -1;
	}

	// Initialize with initial config
	initialize(config: VectorizerConfig) {
		this.clear();
		this.push(config, 'Initial configuration');
	}

	// Get description for current state
	getCurrentDescription(): string {
		return this.current?.description || 'Initial state';
	}

	// Get preview of next undo/redo actions
	getUndoPreview(): string | null {
		if (!this.canUndo) return null;
		const prevEntry = this.history[this.currentIndex - 1];
		return prevEntry?.description || null;
	}

	getRedoPreview(): string | null {
		if (!this.canRedo) return null;
		const nextEntry = this.history[this.currentIndex + 1];
		return nextEntry?.description || null;
	}
}

export const parameterHistory = new ParameterHistory();
