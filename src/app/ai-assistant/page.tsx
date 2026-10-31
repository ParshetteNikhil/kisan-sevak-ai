'use client';

import { Suspense } from 'react';
import AiAssistantClient from './ai-assistant-client';
import { useI18n } from '@/hooks/use-i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { SignInRequired } from '@/components/auth/sign-in-required';

export default function AiAssistantPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('ai_assistant_title') || 'AI Farming & Agronomy Assistant'}
        </h1>
        <p className="text-muted-foreground">
          {t('ai_assistant_desc') || 'Multi-model farming AI with Google Search & Maps Grounding, powered by Gemini.'}
        </p>
      </div>
      <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Skeleton className="h-full w-full max-w-5xl rounded-xl" /></div>}>
        <SignInRequired feature="The AI assistant"><AiAssistantClient /></SignInRequired>
      </Suspense>
    </div>
  );
}
