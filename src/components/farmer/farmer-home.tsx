'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CloudRain, LogIn, MessageCircleQuestion, Phone, Sprout, Store, Sun, ThermometerSun, Tractor, Stethoscope, IndianRupee, Mountain,
} from 'lucide-react';
import { useAuth } from '@/context/auth-provider';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { ListenButton } from '@/components/voice/listen-button';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Forecast = { days: { date: string; rainChance: number; maxTemp: number }[]; nowTemp?: number; place?: string };

const TILES = [
  { href: '/crop-health', key: 'tile_crop_doctor', icon: Stethoscope, color: 'bg-red-600' },
  { href: '/ai-assistant', key: 'tile_ask', icon: MessageCircleQuestion, color: 'bg-sky-600' },
  { href: '/mandi', key: 'tile_mandi', icon: IndianRupee, color: 'bg-amber-600' },
  { href: '/market', key: 'tile_sell', icon: Store, color: 'bg-emerald-700' },
  { href: '/soil-analysis', key: 'tile_soil', icon: Mountain, color: 'bg-orange-800' },
  { href: '/my-farm', key: 'tile_farm', icon: Tractor, color: 'bg-lime-700' },
];

function useForecast(lat?: number, lon?: number) {
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    const load = async (la: number, lo: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m&daily=precipitation_probability_max,temperature_2m_max&forecast_days=3&timezone=auto`
        );
        const j = await res.json();
        setForecast({
          nowTemp: Math.round(j.current?.temperature_2m),
          days: (j.daily?.time || []).map((d: string, i: number) => ({
            date: d,
            rainChance: j.daily.precipitation_probability_max?.[i] ?? 0,
            maxTemp: Math.round(j.daily.temperature_2m_max?.[i] ?? 0),
          })),
        });
      } catch {
        setForecast(null);
      }
    };
    if (lat && lon) {
      load(lat, lon);
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => load(p.coords.latitude, p.coords.longitude), () => setForecast(null), {
        maximumAge: 3600_000,
        timeout: 10_000,
      });
    }
  }, [lat, lon]);

  return forecast;
}

export function FarmerHome() {
  const { user, profile: account, signInWithGoogle, loading } = useAuth();
  const { profile } = useFarmProfile();
  const { t } = useI18n();
  const forecast = useForecast(profile?.lat, profile?.lon);

  const name = (account?.displayName || user?.displayName || '').split(' ')[0];
  const greeting = name ? t('greeting', { name }) : t('greeting_guest');

  const alert = useMemo(() => {
    if (!forecast?.days?.length) return null;
    const dayWord = (i: number) => [t('today'), t('tomorrow'), t('day_after')][i] || '';
    const rainIdx = forecast.days.findIndex((d) => d.rainChance >= 60);
    if (rainIdx >= 0) return { kind: 'rain' as const, text: t('weather_rain_alert', { day: dayWord(rainIdx) }) };
    const heatIdx = forecast.days.findIndex((d) => d.maxTemp >= 40);
    if (heatIdx >= 0) return { kind: 'heat' as const, text: t('weather_heat_alert', { day: dayWord(heatIdx), temp: forecast.days[heatIdx].maxTemp }) };
    return { kind: 'ok' as const, text: t('weather_ok') };
  }, [forecast, t]);

  const spoken = [greeting, alert?.text, t('tap_picture')].filter(Boolean).join('. ');
  const profileIncomplete = user && profile && !(profile.district && profile.mainCrop);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-headline text-[clamp(1.3rem,6vw,1.6rem)] font-bold leading-tight">{greeting} 🙏</h1>
          <p className="text-base text-muted-foreground">{t('tap_picture')}</p>
        </div>
        <ListenButton text={spoken} size="lg" label="" className="h-14 w-14 shrink-0 rounded-full p-0 [&_svg]:h-6 [&_svg]:w-6" />
      </div>

      {alert && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border p-4 text-lg',
            alert.kind === 'rain' && 'border-sky-300 bg-sky-50 text-sky-900',
            alert.kind === 'heat' && 'border-orange-300 bg-orange-50 text-orange-900',
            alert.kind === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-900'
          )}
        >
          {alert.kind === 'rain' ? <CloudRain className="h-8 w-8 shrink-0" /> : alert.kind === 'heat' ? <ThermometerSun className="h-8 w-8 shrink-0" /> : <Sun className="h-8 w-8 shrink-0" />}
          <div className="flex-1">
            {forecast?.nowTemp !== undefined && <span className="mr-2 text-2xl font-bold">{forecast.nowTemp}°C</span>}
            <span>{alert.text}</span>
          </div>
        </div>
      )}

      {!user && !loading && (
        <Button onClick={() => signInWithGoogle()} size="lg" className="h-16 w-full gap-3 text-lg">
          <LogIn className="h-6 w-6" /> {t('sign_in_google')}
        </Button>
      )}

      {profileIncomplete && (
        <Link href="/my-farm/profile" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 p-4 text-lg font-medium text-primary">
          <Sprout className="h-7 w-7 shrink-0" />
          {t('complete_profile')}
        </Link>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(8.5rem,100%),1fr))] gap-3">
        {TILES.map(({ href, key, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            onClick={() => track('home_tile', { tile: key })}
            className="flex min-h-[9rem] min-w-0 flex-col items-center justify-center gap-2 rounded-3xl border bg-card p-3 text-center shadow-sm active:scale-[0.98]"
          >
            <span className={cn('rounded-2xl p-[clamp(0.75rem,3.5vw,1rem)] text-white', color)}>
              <Icon className="h-[clamp(2rem,9vw,2.5rem)] w-[clamp(2rem,9vw,2.5rem)]" strokeWidth={2.2} />
            </span>
            <span className="text-[clamp(1.05rem,4.8vw,1.25rem)] font-bold leading-tight">{t(key)}</span>
            <span className="text-sm leading-tight text-muted-foreground">{t(`${key}_sub`)}</span>
          </Link>
        ))}
      </div>

      <a
        href="tel:18001801551"
        onClick={() => track('helpline_call')}
        className="flex items-center gap-4 rounded-2xl bg-primary p-4 text-primary-foreground shadow-md active:scale-[0.99]"
      >
        <span className="rounded-full bg-white/20 p-3">
          <Phone className="h-7 w-7" />
        </span>
        <span>
          <span className="block text-lg font-bold">{t('helpline')}</span>
          <span className="block text-base opacity-90">{t('helpline_sub')}</span>
        </span>
      </a>
    </div>
  );
}
