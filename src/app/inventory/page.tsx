
'use client';

import InventoryClient from './inventory-client';
import { useI18n } from '@/hooks/use-i18n';
import { SignInRequired } from '@/components/auth/sign-in-required';

export default function InventoryPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('farm_inventory')}
        </h1>
      </div>
      <p className="text-muted-foreground">
        {t('track_inventory_description')}
      </p>
      <SignInRequired feature="Inventory tracking"><InventoryClient /></SignInRequired>
    </div>
  );
}
