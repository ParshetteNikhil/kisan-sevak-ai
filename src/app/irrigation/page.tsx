"use client";

import IrrigationClient from './irrigation-client';
import { useI18n } from '@/hooks/use-i18n';
import { SignInRequired } from '@/components/auth/sign-in-required';

export default function IrrigationPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('irrigation_advisor_title')}
        </h1>
        <p className="text-muted-foreground">
          {t('irrigation_advisor_page_desc')}
        </p>
      </div>
      <SignInRequired feature="Irrigation advice"><IrrigationClient /></SignInRequired>
    </div>
  );
}
