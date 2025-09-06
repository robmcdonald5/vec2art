/**
 * DISABLED - Testing if scroll locks are the problem
 */

import { browser } from '$app/environment';

/**
 * NO-OP for testing - does nothing
 */
export function lockBodyScroll(): () => void {
  // DISABLED - just return a no-op function
  return () => {};
}