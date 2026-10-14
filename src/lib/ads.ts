/**
 * Shared advertising predicate.
 * Returns true when a product has an active ad placement,
 * meaning the sponsored/banner flag is on AND any date window is currently valid.
 */
export function isAdActive(product: {
  isSponsored?: boolean;
  isHomepageBanner?: boolean;
  adStartsAt?: string;
  adEndsAt?: string;
}): boolean {
  if (!product.isSponsored && !product.isHomepageBanner) return false;

  const now = new Date();
  const start = product.adStartsAt ? new Date(product.adStartsAt) : null;
  const end = product.adEndsAt ? new Date(product.adEndsAt) : null;

  if (start && now < start) return false;
  if (end && now > end) return false;

  return true;
}
