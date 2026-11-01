'use client';

import { useMemo, useState } from 'react';
import { Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { diagnoseCrop } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { withLocale } from '@/lib/with-locale';
import type { DiagnoseCropOutput } from '@/ai/flows/diagnose-crop-flow';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile, farmContext } from '@/hooks/use-farm-profile';
import { PhotoPicker } from '@/components/farmer/photo-picker';
import { MicButton } from '@/components/voice/mic-button';
import { ListenButton } from '@/components/voice/listen-button';
import { Feedback } from '@/components/farmer/feedback';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export default function CropHealthClient() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { profile } = useFarmProfile();
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseCropOutput | null>(null);

  const run = async () => {
    if (!photo) {
      toast({ variant: 'destructive', title: t('take_photo') });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await withLocale(diagnoseCrop, locale)(await getIdTokenOrThrow(), {
        photoDataUri: photo,
        problemDescription: description || undefined,
        farmContext: farmContext(profile) || undefined,
      });
      setResult(r);
      track('crop_diagnosis', { healthy: r.isHealthy, issues: r.possibleDiseases.length });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : t('analysis_failed_desc') });
    } finally {
      setLoading(false);
    }
  };

  const top = result?.possibleDiseases?.[0];
  const spoken = useMemo(() => {
    if (!result) return '';
    if (result.isHealthy) return `${t('healthy_title')}. ${result.generalAdvice}`;
    return [
      `${t('problem_title')}: ${top?.name || ''}`,
      top?.description,
      `${t('what_to_do')}: ${top?.recommendedTreatment || ''}`,
      result.generalAdvice,
    ]
      .filter(Boolean)
      .join('. ');
  }, [result, top, t]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <PhotoPicker onPhoto={(p) => { setPhoto(p); setResult(null); }} preview={photo} />
          <div>
            <p className="mb-2 text-lg font-medium">{t('describe_problem')}</p>
            <div className="flex gap-2">
              <Textarea className="min-h-[64px] text-lg" value={description} onChange={(e) => setDescription(e.target.value)} />
              <MicButton onText={(v) => setDescription((d) => (d ? `${d} ${v}` : v))} className="h-16 w-16" />
            </div>
          </div>
          <Button onClick={run} disabled={loading || !photo} size="lg" className="h-16 w-full gap-2 text-xl">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Stethoscope className="h-6 w-6" />} {loading ? t('checking') : t('check_crop')}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-3">
          <div className={cn('rounded-2xl border-2 p-4', result.isHealthy ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50')}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-bold">
                {result.isHealthy ? `🟢 ${t('healthy_title')}` : `🔴 ${t('problem_title')}`}
              </h2>
              <ListenButton text={spoken} size="lg" className="h-12" />
            </div>
            <p className="text-lg text-muted-foreground">{result.plantName}</p>
            {top && !result.isHealthy && <p className="mt-1 text-2xl font-bold">{top.name}</p>}
            {top && !result.isHealthy && <p className="mt-1 text-lg">{top.description}</p>}
          </div>

          {!result.isHealthy &&
            result.possibleDiseases.map((d, i) => (
              <Card key={i} className={i === 0 ? 'border-2 border-primary' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span>{i === 0 ? `✅ ${t('what_to_do')}` : d.name}</span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-sm',
                        d.probability === 'High' ? 'bg-red-100 text-red-800' : d.probability === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-muted'
                      )}
                    >
                      {d.probability === 'High' ? '●●●' : d.probability === 'Medium' ? '●●○' : '●○○'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-lg">
                  {i > 0 && <p className="text-muted-foreground">{d.description}</p>}
                  <p>{d.recommendedTreatment}</p>
                </CardContent>
              </Card>
            ))}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">💡 {t('general_advice')}</CardTitle>
            </CardHeader>
            <CardContent className="text-lg">{result.generalAdvice}</CardContent>
          </Card>
          <Feedback feature="crop_doctor" />
        </div>
      )}
    </div>
  );
}
