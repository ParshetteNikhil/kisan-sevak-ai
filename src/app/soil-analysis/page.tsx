"use client";

import SoilAnalysisClient from './soil-analysis-client';
import { useI18n } from '@/hooks/use-i18n';
import { SignInRequired } from '@/components/auth/sign-in-required';

export default function SoilAnalysisPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 pt-4 md:p-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('tile_soil')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('tile_soil_sub')}
        </p>
      </div>
      <SignInRequired feature="Soil analysis"><SoilAnalysisClient /></SignInRequired>
    </div>
  );
}
