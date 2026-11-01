'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Droplets, FlaskConical, Leaf, Loader2, Sprout, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSoilAnalysis } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { withLocale } from '@/lib/with-locale';
import type { SoilAnalysisOutput } from '@/ai/flows/soil-analysis-flow';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile, farmContext } from '@/hooks/use-farm-profile';
import { PhotoPicker } from '@/components/farmer/photo-picker';
import { ListenButton } from '@/components/voice/listen-button';
import { Feedback } from '@/components/farmer/feedback';
import { weatherContext } from '@/lib/weather-context';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export default function SoilAnalysisClient() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { profile } = useFarmProfile();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisOutput | null>(null);

  const hasCard = Boolean(profile?.soilCard && Object.keys(profile.soilCard).length);
  const location = [profile?.district, profile?.state].filter(Boolean).join(', ');

  const run = async () => {
    if (!photo && !hasCard) {
      toast({ variant: 'destructive', title: t('soil_photo') });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const weather = await weatherContext(profile?.lat, profile?.lon);
      const r = await withLocale(getSoilAnalysis, locale)(await getIdTokenOrThrow(), {
        soilPhotoDataUri: photo || undefined,
        location: location || 'India',
        farmContext: farmContext(profile) || undefined,
        weatherContext: weather || undefined,
      });
      setResult(r);
      track('soil_advice', { photo: Boolean(photo), card: hasCard, health: r.soilHealth });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : t('soil_analysis_failed_desc') });
    } finally {
      setLoading(false);
    }
  };

  const spoken = useMemo(() => {
    if (!result) return '';
    return [
      result.soilStatus,
      `${t('fertilizer_plan')}: ${result.fertilizerPlan.map((f) => `${f.name} ${f.amountPerAcre}, ${f.when}`).join('. ')}`,
      `${t('best_crops')}: ${result.bestCrops.join(', ')}`,
      `${t('water_advice')}: ${result.waterAdvice}`,
      `${t('yield_tips')}: ${result.yieldTips.join('. ')}`,
    ].join('. ');
  }, [result, t]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {!profile?.district && (
        <Link href="/my-farm/profile" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 p-4 text-lg font-medium text-primary">
          <Sprout className="h-7 w-7 shrink-0" /> {t('complete_profile')}
        </Link>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">📷 {t('soil_photo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoPicker onPhoto={setPhoto} preview={photo} />
        </CardContent>
      </Card>

      <Link href="/my-farm/profile" className="flex items-center justify-between rounded-2xl border bg-card p-4 text-lg">
        <span>🧾 {t('soil_card')}</span>
        <span className={cn('font-semibold', hasCard ? 'text-primary' : 'text-muted-foreground')}>{hasCard ? '✓' : t('not_set')}</span>
      </Link>

      <Button onClick={run} disabled={loading} size="lg" className="h-16 w-full gap-2 text-xl">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FlaskConical className="h-6 w-6" />} {loading ? t('checking') : t('get_soil_advice')}
      </Button>

      {result && (
        <div className="space-y-3">
          <div
            className={cn(
              'rounded-2xl border-2 p-4',
              result.soilHealth === 'good' && 'border-emerald-400 bg-emerald-50',
              result.soilHealth === 'average' && 'border-amber-400 bg-amber-50',
              result.soilHealth === 'poor' && 'border-red-400 bg-red-50'
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-bold">
                {result.soilHealth === 'good' ? '🟢' : result.soilHealth === 'average' ? '🟡' : '🔴'} {t('soil_status')}
              </h2>
              <ListenButton text={spoken} size="lg" className="h-12" />
            </div>
            <p className="text-lg font-semibold">{result.soilType}</p>
            <p className="text-lg">{result.soilStatus}</p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FlaskConical className="h-6 w-6 text-primary" /> {t('fertilizer_plan')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.fertilizerPlan.map((f, i) => (
                <div key={i} className="rounded-xl bg-muted/60 p-3 text-lg">
                  <p className="font-bold">
                    {f.name}: {f.amountPerAcre}
                  </p>
                  <p className="text-muted-foreground">{f.when}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Leaf className="h-6 w-6 text-primary" /> {t('organic_options')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-6 text-lg">
                {result.organicOptions.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sprout className="h-6 w-6 text-primary" /> {t('best_crops')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.bestCrops.map((c, i) => (
                <span key={i} className="rounded-full bg-primary/10 px-4 py-2 text-lg font-medium text-primary">
                  {c}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Droplets className="h-6 w-6 text-sky-600" /> {t('water_advice')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-lg">{result.waterAdvice}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" /> {t('yield_tips')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-6 text-lg">
                {result.yieldTips.map((y, i) => (
                  <li key={i}>{y}</li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            {t('data_used')}: {result.basis.join(' · ')}
          </p>
          <Feedback feature="soil" />
        </div>
      )}
    </div>
  );
}
