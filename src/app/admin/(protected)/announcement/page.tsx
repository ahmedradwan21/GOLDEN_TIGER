'use client';

import { useI18n } from '@/context/I18nContext';
import { AnnouncementSettingsCard } from '@/components/admin/AnnouncementSettingsCard';

export default function AdminAnnouncementPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.announcement')}</h1>
        <p className="text-muted mt-1">{t('admin.announcement.subtitle')}</p>
      </div>
      <AnnouncementSettingsCard />
    </div>
  );
}
