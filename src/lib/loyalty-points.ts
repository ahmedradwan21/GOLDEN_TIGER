export const POINTS_PER_DOLLAR = 10;
export const POINTS_TIER_1 = 500;
export const POINTS_TIER_2 = 1000;
export const POINTS_TIER_3 = 2500;

export function calculatePoints(priceCents: number): number {
  return Math.floor((priceCents / 100) * POINTS_PER_DOLLAR);
}
