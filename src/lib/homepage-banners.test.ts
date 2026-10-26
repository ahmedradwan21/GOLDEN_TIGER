import { describe, it, expect } from 'bun:test';
import {
  getBannerStatus,
  selectLiveBanners,
  prioritiesFromOrder,
  normalizeBannerFields,
  fromLocalInputValue,
  toLocalInputValue,
} from './homepage-banners';

const now = new Date('2026-10-25T12:00:00Z');

describe('homepage banner visibility', () => {
  it('shows a banner with no start or end date', () => {
    expect(getBannerStatus({ is_homepage_banner: true, ad_starts_at: null, ad_ends_at: null }, now)).toBe('live');
  });

  it('hides products that are not flagged as homepage banners', () => {
    expect(getBannerStatus({ is_homepage_banner: false }, now)).toBe('off');
  });

  it('hides a banner whose start date is in the future', () => {
    expect(getBannerStatus({ is_homepage_banner: true, ad_starts_at: '2026-10-26T00:00:00Z' }, now)).toBe('scheduled');
  });

  it('hides a banner whose end date has passed', () => {
    expect(getBannerStatus({ is_homepage_banner: true, ad_ends_at: '2026-10-24T23:59:00Z' }, now)).toBe('expired');
  });

  it('shows a banner exactly at its start and end times', () => {
    expect(getBannerStatus({ is_homepage_banner: true, ad_starts_at: now.toISOString() }, now)).toBe('live');
    expect(getBannerStatus({ is_homepage_banner: true, ad_ends_at: now.toISOString() }, now)).toBe('live');
  });

  it('keeps only live banners ordered by ad_priority, highest first', () => {
    const rows = [
      { id: 'a', is_homepage_banner: true, ad_priority: 1 },
      { id: 'b', is_homepage_banner: true, ad_priority: 5 },
      { id: 'c', is_homepage_banner: true, ad_priority: 9, ad_ends_at: '2026-10-01T00:00:00Z' },
      { id: 'd', is_homepage_banner: false, ad_priority: 50 },
      { id: 'e', is_homepage_banner: true, ad_priority: 3 },
    ];
    expect(selectLiveBanners(rows, now).map((r) => r.id)).toEqual(['b', 'e', 'a']);
  });
});

describe('banner ordering', () => {
  it('gives the top row of the list the highest priority', () => {
    expect(prioritiesFromOrder(['x', 'y', 'z'])).toEqual([
      { id: 'x', ad_priority: 3 },
      { id: 'y', ad_priority: 2 },
      { id: 'z', ad_priority: 1 },
    ]);
  });
});

describe('banner field validation', () => {
  it('rejects an end date before the start date', () => {
    const { error } = normalizeBannerFields({ ad_starts_at: '2026-11-02T00:00:00Z', ad_ends_at: '2026-11-01T00:00:00Z' });
    expect(error).toBe('endBeforeStart');
  });

  it('stores empty optional text and dates as null', () => {
    const { fields, error } = normalizeBannerFields({ banner_headline: '  ', ad_ends_at: '' });
    expect(error).toBeNull();
    expect(fields).toEqual({ banner_headline: null, ad_ends_at: null });
  });

  it('round-trips the admin date picker value without shifting the time', () => {
    const iso = fromLocalInputValue('2026-11-01T09:30');
    expect(iso).not.toBeNull();
    expect(toLocalInputValue(iso)).toBe('2026-11-01T09:30');
  });
});
