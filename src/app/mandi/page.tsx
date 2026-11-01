'use client';

import { useEffect, useState } from 'react';
import ReactMarkdownLite from '@/components/farmer/simple-markdown';
import { Globe, IndianRupee, Landmark, Loader2, MapPin } from 'lucide-react';
import { SignInRequired } from '@/components/auth/sign-in-required';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChoiceChips } from '@/components/farmer/choice-chips';
import { MicButton } from '@/components/voice/mic-button';
import { ListenButton } from '@/components/voice/listen-button';
import { Feedback } from '@/components/farmer/feedback';
import { BusyCard } from '@/components/farmer/busy-card';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { useToast } from '@/hooks/use-toast';
import { CROPS } from '@/locales/farmer';
import { askAI, type AskResult } from '@/lib/ask-ai';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { track } from '@/lib/analytics';
import { mandiPrices, type MandiResult } from '@/lib/agmarknet';

const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

function MandiPrice() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { profile } = useFarmProfile();
  const [crop, setCrop] = useState<string | undefined>();
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<null | (() => void)>(null);
  const [govt, setGovt] = useState<MandiResult | null>(null);
  const [answer, setAnswer] = useState<AskResult | null>(null);

  useEffect(() => {
    if (profile?.mainCrop && !crop) setCrop(profile.mainCrop);
    if (profile && !place) setPlace([profile.district, profile.state].filter(Boolean).join(', '));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = CROPS.find((x) => x.key === crop);
  const cropName = c ? t(`crop_${c.key}`) : '';

  const findGovt = async () => {
    if (!c || !place.trim()) {
      toast({ variant: 'destructive', title: !c ? t('select_crop') : t('your_mandi') });
      return;
    }
    setLoading(true);
    setBusy(null);
    setGovt(null);
    setAnswer(null);
    try {
      const cacheKey = `mandi:${c.key}:${place.trim().toLowerCase()}:${new Date().toISOString().slice(0, 13)}`;
      let r: MandiResult | null = null;
      try {
        r = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      } catch {}
      if (!r) {
        const keyRes = await fetch('/api/mandi', { headers: { Authorization: `Bearer ${await getIdTokenOrThrow()}` } });
        if (!keyRes.ok) throw new Error('busy');
        const { key } = await keyRes.json();
        r = await mandiPrices(key, c.key, place, profile?.state);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(r));
        } catch {}
      }
      setGovt(r);
      track('mandi_price', { crop: c.key, source: 'agmarknet', level: r.level });
    } catch {
      setBusy(() => findGovt);
    } finally {
      setLoading(false);
    }
  };

  const findAI = async () => {
    if (!c) return;
    setLoading(true);
    setBusy(null);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const r = await askAI({
        locale,
        role: 'market_strategist',
        grounding: 'search',
        message: `Today is ${today}. Find the latest wholesale mandi (APMC) price of ${c.en} for ${place}, India, and 2 to 3 nearby mandis. Prefer Agmarknet / eNAM / state agriculture department data.
Answer in this format, short:
- one line per mandi: mandi name — modal price ₹ per quintal (min–max if known) — date of the price
- one line: the current MSP for this crop if one exists
- one line of advice: sell now or wait, and why
If you cannot find a price from the last 7 days, say so clearly and give the most recent one with its date.`,
      });
      setAnswer(r);
      track('mandi_price', { crop: c.key, source: 'ai' });
    } catch {
      setBusy(() => findAI);
    } finally {
      setLoading(false);
    }
  };

  const rows = govt?.rows || [];
  const common = rows.length ? median(rows.map((r) => r.modal)) : 0;
  const low = rows.length ? Math.min(...rows.map((r) => r.min || r.modal)) : 0;
  const high = rows.length ? Math.max(...rows.map((r) => r.max || r.modal)) : 0;
  const areaLabel = govt?.level === 'district' ? t('area_district') : govt?.level === 'state' ? t('area_state') : t('area_other');
  const spoken = rows.length
    ? `${cropName}. ${t('price_common')}: ${Math.round(common)} ₹ ${t('per_quintal')}. ${t('price_low')} ${Math.round(low)}, ${t('price_high')} ${Math.round(high)}. ${rows
        .slice(0, 3)
        .map((r) => `${r.market}: ${Math.round(r.modal)}`)
        .join('. ')}`
    : '';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-xl font-semibold">{t('select_crop')}</p>
          <ChoiceChips columns={3} value={crop} onChange={setCrop} options={CROPS.map((x) => ({ value: x.key, label: t(`crop_${x.key}`), icon: x.emoji }))} />
          <p className="text-xl font-semibold">{t('your_mandi')}</p>
          <div className="flex gap-2">
            <Input className="h-14 min-w-0 text-lg" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Karnal, Haryana" />
            <MicButton onText={setPlace} className="h-14 w-14 shrink-0" />
          </div>
          <Button onClick={findGovt} disabled={loading} size="lg" className="h-16 w-full gap-2 text-xl">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <IndianRupee className="h-6 w-6" />} {loading ? t('finding_price') : t('find_price')}
          </Button>
        </CardContent>
      </Card>

      {busy && <BusyCard onRetry={busy} />}

      {govt && rows.length > 0 && (
        <Card className="border-2 border-primary">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-xl font-bold">
                {c?.emoji} {cropName}
              </p>
              <ListenButton text={spoken} size="lg" className="h-12 shrink-0" />
            </div>
            <p className="flex items-center gap-1 text-base text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" /> {areaLabel}
            </p>
            <div>
              <p className="text-base text-muted-foreground">{t('price_common')}</p>
              <p className="text-4xl font-bold text-primary">
                {rupee(common)} <span className="text-lg font-medium text-muted-foreground">/ {t('quintal')}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-muted p-2">
                <p className="text-sm text-muted-foreground">{t('price_low')}</p>
                <p className="text-xl font-bold">{rupee(low)}</p>
              </div>
              <div className="rounded-xl bg-muted p-2">
                <p className="text-sm text-muted-foreground">{t('price_high')}</p>
                <p className="text-xl font-bold">{rupee(high)}</p>
              </div>
            </div>
            <ul className="divide-y">
              {rows.map((r, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-base">
                  <span className="min-w-0">
                    <span className="block font-medium">{r.market}</span>
                    <span className="block text-sm text-muted-foreground">
                      {r.district}, {r.state} · {r.date}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{rupee(r.modal)}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0" /> {t('price_source_govt')}
            </p>
            <Feedback feature="mandi_price" />
          </CardContent>
        </Card>
      )}

      {govt && rows.length === 0 && !answer && (
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <p className="text-lg">{t('no_govt_price')}</p>
            <Button onClick={findAI} disabled={loading} size="lg" variant="outline" className="h-14 w-full gap-2 text-lg">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />} {t('search_ai')}
            </Button>
          </CardContent>
        </Card>
      )}

      {answer && (
        <Card className="border-2 border-amber-400">
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-end">
              <ListenButton text={answer.text} size="lg" className="h-12" />
            </div>
            <ReactMarkdownLite text={answer.text} />
            <p className="rounded-lg bg-amber-50 p-3 text-base text-amber-900">⚠️ {t('prices_note')}</p>
            {answer.searchCitations.length > 0 && (
              <ul className="space-y-1 text-sm">
                {answer.searchCitations.slice(0, 4).map((s, i) => (
                  <li key={i} className="break-words">
                    <a href={s.uri} target="_blank" rel="noreferrer" className="text-primary underline">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Feedback feature="mandi_price" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MandiPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-8">
      <h1 className="hidden font-headline text-3xl font-bold md:block">💰 {t('tile_mandi')}</h1>
      <p className="text-lg text-muted-foreground">{t('tile_mandi_sub')}</p>
      <SignInRequired feature={t('tile_mandi')}>
        <MandiPrice />
      </SignInRequired>
    </div>
  );
}
