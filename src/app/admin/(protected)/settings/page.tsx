'use client';

import { useI18n } from '@/context/I18nContext';
import { StoreNumbersCard } from '@/components/admin/StoreNumbersCard';
import { ShippingMethodsCard } from '@/components/admin/ShippingMethodsCard';

export default function AdminSettingsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.settings')}</h1>
        <p className="text-muted mt-1">{t('admin.settings.subtitle')}</p>
      </div>
      <StoreNumbersCard />
      <ShippingMethodsCard />
    </div>
  );
}
