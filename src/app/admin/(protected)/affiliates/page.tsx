'use client';

import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { AffiliatesCard } from '@/components/admin/AffiliatesCard';
import { AffiliateEarningsCard } from '@/components/admin/AffiliateEarningsCard';

export default function AdminAffiliatesPage() {
  const { t } = useI18n();
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.nav.affiliates')}</h1>
        <p className="text-muted mt-1">{t('admin.affiliates.subtitle')}</p>
      </div>
      <AffiliatesCard onChange={() => setRefreshKey((k) => k + 1)} />
      <AffiliateEarningsCard refreshKey={refreshKey} />
    </div>
  );
}
