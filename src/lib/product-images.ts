/** Accept only usable image URLs; database and API values are untrusted. */
export function normalizeProductImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== 'string') return [];
    const src = item.trim();
    if (!src || /[\s\\]/.test(src)) return [];
    if (src.startsWith('/') && !src.startsWith('//')) return [src];
    try {
      const url = new URL(src);
      return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname
        ? [src]
        : [];
    } catch {
      return [];
    }
  });
}