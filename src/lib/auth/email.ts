/** Canonical email form used for every lookup, insert and comparison. */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}
