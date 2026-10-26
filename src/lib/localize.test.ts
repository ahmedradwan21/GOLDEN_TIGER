import { describe, it, expect } from 'bun:test';
import { pickLocalized, productTitle, productDescription, categoryName } from './localize';

describe('bilingual fallback', () => {
  it('uses Arabic when locale is ar and Arabic is set', () => {
    expect(productTitle({ title: 'Watch', titleAr: 'ساعة' }, 'ar')).toBe('ساعة');
  });

  it('falls back to English when Arabic is an empty string', () => {
    expect(productTitle({ title: 'Watch', titleAr: '' }, 'ar')).toBe('Watch');
    expect(productDescription({ description: 'Nice', descriptionAr: '' }, 'ar')).toBe('Nice');
    expect(categoryName({ name: 'Electronics', nameAr: '' }, 'ar')).toBe('Electronics');
  });

  it('falls back to English when Arabic is whitespace, null or missing', () => {
    expect(pickLocalized('Watch', '   ', 'ar')).toBe('Watch');
    expect(pickLocalized('Watch', null, 'ar')).toBe('Watch');
    expect(categoryName({ name: 'Fashion' }, 'ar')).toBe('Fashion');
  });

  it('always uses English when locale is en', () => {
    expect(categoryName({ name: 'Electronics', nameAr: 'إلكترونيات' }, 'en')).toBe('Electronics');
  });
});
