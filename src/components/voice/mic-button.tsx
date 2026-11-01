'use client';

import { useEffect, useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { canListen, listenOnce, stopSpeaking } from '@/lib/speech';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Mic button: listens once in the app language and returns the words. */
export function MicButton({
  onText,
  className,
  size = 'icon',
  label,
}: {
  onText: (text: string) => void;
  className?: string;
  size?: 'icon' | 'lg' | 'default';
  label?: string;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => setSupported(canListen()), []);
  if (!supported) return null;

  const start = async () => {
    stopSpeaking();
    setBusy(true);
    try {
      const text = await listenOnce(locale);
      if (text) {
        track('voice_input', { length: text.length });
        onText(text);
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: e?.message === 'not-allowed' ? t('mic_permission') : t('voice_not_supported'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={start}
      disabled={busy}
      size={size}
      className={cn(busy && 'animate-pulse', 'gap-2', className)}
      aria-label={t('speak')}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
      {size !== 'icon' && (busy ? t('listening') : label ?? t('speak'))}
    </Button>
  );
}
