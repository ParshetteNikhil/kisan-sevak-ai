'use client';

import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Big "Listen" button that reads text aloud in the app language. */
export function ListenButton({ text, className, size = 'default', label }: { text: string; className?: string; size?: 'default' | 'lg' | 'sm'; label?: string }) {
  const { t, locale } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(canSpeak());
    return () => stopSpeaking();
  }, []);

  if (!supported || !text) return null;

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    track('listen', { length: text.length });
    speak(text, locale, () => setPlaying(false));
  };

  return (
    <Button type="button" variant="secondary" size={size} onClick={toggle} className={cn('gap-2', className)} aria-label={t('listen')}>
      {playing ? <Square className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      {label ?? (playing ? t('stop') : t('listen'))}
    </Button>
  );
}
