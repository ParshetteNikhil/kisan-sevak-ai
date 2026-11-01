
'use client';

import MarketClient from './market-client';
import { useI18n } from '@/hooks/use-i18n';
import { useRole } from '@/context/role-provider';
import { SignInRequired } from '@/components/auth/sign-in-required';

export default function MarketPage() {
  const { t } = useI18n();
  const { role } = useRole();
  return (
    <div className="flex-1 space-y-4 p-4 pt-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {role === 'buyer' ? t('marketplace') : t('tile_sell')}
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        {t('tile_sell_sub')}
      </p>
      <SignInRequired feature="The marketplace"><MarketClient /></SignInRequired>
    </div>
  );
}
