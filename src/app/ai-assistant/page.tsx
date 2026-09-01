
'use client';

import AiAssistantClient from './ai-assistant-client';
import { useI18n } from '@/hooks/use-i18n';

export default function AiAssistantPage() {
  const { t } = useI18n();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('ai_assistant_title')}
        </h1>
        <p className="text-muted-foreground">
          {t('ai_assistant_desc')}
        </p>
      </div>
      <AiAssistantClient />
    </div>
  );
}
