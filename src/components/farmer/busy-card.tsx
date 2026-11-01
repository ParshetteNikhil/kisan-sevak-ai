'use client';

import { Hourglass, Phone, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';

/** Shown in place of an answer when the AI or price service fails, in the farmer's language. */
export function BusyCard({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950">
      <p className="flex items-start gap-2 text-lg font-semibold leading-snug">
        <Hourglass className="mt-1 h-5 w-5 shrink-0" /> {t('busy_title')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {onRetry && (
          <Button size="lg" className="h-14 gap-2 text-base" onClick={onRetry}>
            <RotateCw className="h-5 w-5" /> {t('try_again')}
          </Button>
        )}
        <Button asChild size="lg" variant="outline" className={onRetry ? 'h-14 gap-2 text-base' : 'col-span-2 h-14 gap-2 text-base'}>
          <a href="tel:18001801551">
            <Phone className="h-5 w-5" /> {t('call_helpline')}
          </a>
        </Button>
      </div>
    </div>
  );
}
