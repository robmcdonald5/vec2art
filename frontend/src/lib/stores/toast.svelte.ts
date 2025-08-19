/**
 * Toast notification store for displaying user feedback
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

class ToastStore {
	private toasts = $state<Toast[]>([]);
	private nextId = 1;

	get all() {
		return this.toasts;
	}

	show(options: Omit<Toast, 'id'>) {
		const toast: Toast = {
			id: `toast-${this.nextId++}`,
			duration: 5000, // Default 5 seconds
			...options
		};

		this.toasts = [...this.toasts, toast];

		// Auto-dismiss after duration
		if (toast.duration && toast.duration > 0) {
			setTimeout(() => {
				this.dismiss(toast.id);
			}, toast.duration);
		}

		return toast.id;
	}

	success(message: string, duration?: number) {
		return this.show({ type: 'success', message, duration });
	}

	error(message: string, duration?: number) {
		return this.show({ type: 'error', message, duration: duration || 7000 }); // Errors stay longer
	}

	info(message: string, duration?: number) {
		return this.show({ type: 'info', message, duration });
	}

	warning(message: string, duration?: number) {
		return this.show({ type: 'warning', message, duration });
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}

	dismissAll() {
		this.toasts = [];
	}
}

export const toastStore = new ToastStore();