import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
	it('should merge class names', () => {
		const result = cn('px-2', 'py-1');
		expect(result).toBe('px-2 py-1');
	});

	it('should handle conditional classes', () => {
		const result = cn('base', false && 'hidden', true && 'visible');
		expect(result).toBe('base visible');
	});

	it('should merge tailwind classes correctly', () => {
		const result = cn('px-2 py-1', 'px-4');
		expect(result).toBe('py-1 px-4');
	});

	it('should handle arrays', () => {
		const result = cn(['px-2', 'py-1'], 'mt-2');
		expect(result).toBe('px-2 py-1 mt-2');
	});

	it('should handle undefined and null', () => {
		const result = cn('base', undefined, null, 'end');
		expect(result).toBe('base end');
	});
});