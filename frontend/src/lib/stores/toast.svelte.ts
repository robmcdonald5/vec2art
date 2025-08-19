/**
 * Toast notification store for displaying user feedback
 * Implements reliable auto-dismiss functionality using store-based approach
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
	action?: {
		label: string;
		onclick: () => void;
	};
}

class ToastManager {
	private toasts = $state<Toast[]>([]);
	private timeoutMap = new Map<string, any>();
	private nextId = 1;

	get all() {
		return this.toasts;
	}

	add(message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
		const toast: Toast = {
			id: `toast-${this.nextId++}`,
			message,
			type: 'info',
			duration: options.duration !== undefined ? options.duration : 5000, // Ensure default 5 seconds
			...options
		};

		this.toasts = [...this.toasts, toast];

		// Store-based auto-dismiss - this works reliably with Svelte 5
		if (toast.duration && toast.duration > 0) {
			const timeoutId = setTimeout(() => {
				this.remove(toast.id);
			}, toast.duration);

			this.timeoutMap.set(toast.id, timeoutId);
		}

		return toast.id;
	}

	remove(id: string) {
		// Clear any pending timeout
		const timeoutId = this.timeoutMap.get(id);
		if (timeoutId) {
			clearTimeout(timeoutId);
			this.timeoutMap.delete(id);
		}

		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	// Convenience methods
	success(message: string, duration?: number) {
		return this.add(message, { type: 'success', duration: duration || 5000 });
	}

	error(message: string, duration?: number) {
		return this.add(message, { type: 'error', duration: duration || 7000 }); // Errors stay longer
	}

	info(message: string, duration?: number) {
		return this.add(message, { type: 'info', duration: duration || 5000 });
	}

	warning(message: string, duration?: number) {
		return this.add(message, { type: 'warning', duration: duration || 5000 });
	}

	// Legacy methods for backward compatibility
	show(options: Omit<Toast, 'id'>) {
		return this.add(options.message, options);
	}

	dismiss(id: string) {
		this.remove(id);
	}

	dismissAll() {
		// Clear all timeouts
		this.timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId));
		this.timeoutMap.clear();
		this.toasts = [];
	}
}

export const toastStore = new ToastManager();
