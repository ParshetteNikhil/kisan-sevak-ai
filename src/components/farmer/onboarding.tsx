'use client';

import { useEffect, useState } from 'react';
import { Leaf, Sprout, Store, Volume2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { LANGUAGE_CHOICES, farmerStrings } from '@/locales/farmer';
import { speak } from '@/lib/speech';
import { track } from '@/lib/analytics';

/** First launch: pick language (spoken), then farmer or buyer (pictures). */
export function Onboarding({ onDone }: { onDone: (role: 'farmer' | 'buyer') => void }) {
  const { t, locale, setLocale } = useI18n();
  const [step, setStep] = useState<'lang' | 'role'>('lang');

  useEffect(() => {
    if (step === 'role') speak(t('who_are_you'), locale);
  }, [step, t, locale]);

  const pickLanguage = (code: string) => {
    setLocale(code);
    const s = farmerStrings[code];
    speak(`${s.greeting_guest} ${s.app_tagline}`, code);
    track('onboarding_language', { language: code });
    setTimeout(() => setStep('role'), 900);
  };

  const pickRole = (role: 'farmer' | 'buyer') => {
    track('onboarding_role', { role });
    onDone(role);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>
      <div className="mb-6 flex items-center justify-center gap-3 text-primary">
        <div className="rounded-2xl bg-primary/15 p-3">
          <Leaf className="h-9 w-9" />
        </div>
        <div>
          <p className="font-headline text-2xl font-bold">Kisaan Sevak</p>
          <p className="text-base text-muted-foreground">{t('app_tagline')}</p>
        </div>
      </div>

      {step === 'lang' ? (
        <>
          <h1 className="mb-1 text-center text-2xl font-bold">{t('choose_language')}</h1>
          <p className="mb-5 text-center text-base text-muted-foreground">भाषा चुनें · Choose language</p>
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            {LANGUAGE_CHOICES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => pickLanguage(l.code)}
                className={`flex h-20 items-center justify-center gap-2 rounded-2xl border-2 text-2xl font-semibold shadow-sm active:scale-[0.98] ${
                  locale === l.code ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                {l.name}
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-6 text-center text-3xl font-bold">{t('who_are_you')}</h1>
          <div className="mx-auto grid w-full max-w-md gap-4">
            <button
              type="button"
              onClick={() => pickRole('farmer')}
              className="flex items-center gap-5 rounded-3xl border-2 border-primary bg-primary/10 p-6 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="rounded-2xl bg-primary p-4 text-primary-foreground">
                <Sprout className="h-12 w-12" />
              </span>
              <span className="text-2xl font-bold">{t('i_am_farmer')}</span>
            </button>
            <button
              type="button"
              onClick={() => pickRole('buyer')}
              className="flex items-center gap-5 rounded-3xl border-2 border-border bg-card p-6 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="rounded-2xl bg-amber-500 p-4 text-white">
                <Store className="h-12 w-12" />
              </span>
              <span className="text-2xl font-bold">{t('i_am_buyer')}</span>
            </button>
            <button type="button" onClick={() => setStep('lang')} className="mt-2 text-base text-muted-foreground underline">
              {t('choose_language')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
