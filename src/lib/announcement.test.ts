import { describe, it, expect } from 'bun:test';
import {
  pickAnnouncementMessage,
  toAnnouncementSettings,
  announcementDismissKey,
  validateAnnouncementInput,
} from './announcement';

const settings = { message_en: 'Free shipping this week', message_ar: 'شحن مجاني هذا الأسبوع', is_active: true };

describe('announcement bar', () => {
  it('shows message_ar when the locale is Arabic', () => {
    expect(pickAnnouncementMessage(settings, 'ar')).toBe('شحن مجاني هذا الأسبوع');
  });

  it('shows message_en when the locale is English', () => {
    expect(pickAnnouncementMessage(settings, 'en')).toBe('Free shipping this week');
  });

  it('is hidden when is_active is false', () => {
    expect(pickAnnouncementMessage({ ...settings, is_active: false }, 'en')).toBeNull();
  });

  it('falls back to English in Arabic when message_ar is empty', () => {
    expect(pickAnnouncementMessage({ ...settings, message_ar: '' }, 'ar')).toBe('Free shipping this week');
  });

  it('reads is_active from the table row', () => {
    expect(toAnnouncementSettings({ id: 1, message_en: 'Hi', message_ar: 'أهلا', is_active: true })).toEqual({
      message_en: 'Hi',
      message_ar: 'أهلا',
      is_active: true,
    });
  });

  it('shows again after closing when the message changes', () => {
    expect(announcementDismissKey(settings)).not.toBe(
      announcementDismissKey({ ...settings, message_en: 'New sale' })
    );
  });

  it('rejects admin input without the active flag', () => {
    expect(validateAnnouncementInput({ message_en: 'a', message_ar: 'b' })).toBeNull();
  });
});
