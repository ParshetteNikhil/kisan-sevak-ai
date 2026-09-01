"use client";

import ProfileClient from './profile-client';
import { useI18n } from '@/hooks/use-i18n';

export default function ProfilePage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('user_profile_title')}
        </h1>
      </div>
      <p className="text-muted-foreground">
        {t('user_profile_desc')}
      </p>
      <ProfileClient />
    </div>
  );
}
