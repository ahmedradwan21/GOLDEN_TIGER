import { revalidatePath } from 'next/cache';

/**
 * Refresh the cached homepage after banner-related changes. Never fails the
 * admin save: outside a Next request (tests, scripts) revalidation is skipped,
 * and the homepage still refreshes on its regular interval.
 */
export function revalidateHomepage(): void {
  try {
    revalidatePath('/');
  } catch {
    // ignore
  }
}
