
'use client';

import MarketClient from './market-client';
import { useI18n } from '@/hooks/use-i18n';

export default function MarketPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('marketplace')}
        </h1>
      </div>
      <p className="text-muted-foreground">
        {t('marketplace_description')}
      </p>
      <MarketClient />
    </div>
  );
}
