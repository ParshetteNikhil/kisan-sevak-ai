'use client';

import { useEffect, useState } from 'react';
import ReactMarkdownLite from '@/components/farmer/simple-markdown';
import { IndianRupee, Loader2 } from 'lucide-react';
import { SignInRequired } from '@/components/auth/sign-in-required';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChoiceChips } from '@/components/farmer/choice-chips';
import { MicButton } from '@/components/voice/mic-button';
import { ListenButton } from '@/components/voice/listen-button';
import { Feedback } from '@/components/farmer/feedback';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { useToast } from '@/hooks/use-toast';
import { CROPS } from '@/locales/farmer';
import { askAI, type AskResult } from '@/lib/ask-ai';
import { track } from '@/lib/analytics';

function MandiPrice() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { profile } = useFarmProfile();
  const [crop, setCrop] = useState<string | undefined>();
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskResult | null>(null);

  useEffect(() => {
    if (profile?.mainCrop && !crop) setCrop(profile.mainCrop);
    if (profile && !place) setPlace([profile.district, profile.state].filter(Boolean).join(', '));
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const find = async () => {
    const c = CROPS.find((x) => x.key === crop);
    if (!c || !place.trim()) {
      toast({ variant: 'destructive', title: !c ? t('select_crop') : t('your_mandi') });
      return;
    }
    setLoading(true);
    setAnswer(null);
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
      track('mandi_price', { crop: c.key });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-xl font-semibold">{t('select_crop')}</p>
          <ChoiceChips columns={3} value={crop} onChange={setCrop} options={CROPS.map((c) => ({ value: c.key, label: t(`crop_${c.key}`), icon: c.emoji }))} />
          <p className="text-xl font-semibold">{t('your_mandi')}</p>
          <div className="flex gap-2">
            <Input className="h-14 text-lg" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Karnal, Haryana" />
            <MicButton onText={setPlace} className="h-14 w-14" />
          </div>
          <Button onClick={find} disabled={loading} size="lg" className="h-16 w-full gap-2 text-xl">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <IndianRupee className="h-6 w-6" />} {loading ? t('finding_price') : t('find_price')}
          </Button>
        </CardContent>
      </Card>

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
                  <li key={i}>
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
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">💰 {t('tile_mandi')}</h1>
        <p className="text-lg text-muted-foreground">{t('tile_mandi_sub')}</p>
      </div>
      <SignInRequired feature={t('tile_mandi')}>
        <MandiPrice />
      </SignInRequired>
    </div>
  );
}
