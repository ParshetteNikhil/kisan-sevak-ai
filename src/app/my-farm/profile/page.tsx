'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, LocateFixed, Minus, Plus } from 'lucide-react';
import { SignInRequired } from '@/components/auth/sign-in-required';
import { useFarmProfile, type FarmProfile, type SoilCard } from '@/hooks/use-farm-profile';
import { useI18n } from '@/hooks/use-i18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChoiceChips } from '@/components/farmer/choice-chips';
import { PhotoPicker } from '@/components/farmer/photo-picker';
import { MicButton } from '@/components/voice/mic-button';
import { CROPS } from '@/locales/farmer';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { readSoilCard } from '../actions';
import { track } from '@/lib/analytics';

const SOILS = [
  { value: 'alluvial', icon: '🟫' },
  { value: 'black', icon: '⬛' },
  { value: 'red', icon: '🟥' },
  { value: 'laterite', icon: '🟧' },
  { value: 'sandy', icon: '🟨' },
  { value: 'clay', icon: '⬜' },
  { value: 'unknown', icon: '❔' },
];
const WATER = [
  { value: 'rain', icon: '🌧️' },
  { value: 'canal', icon: '🏞️' },
  { value: 'borewell', icon: '🚰' },
  { value: 'pond', icon: '💧' },
  { value: 'drip', icon: '🪴' },
];
const SEASONS = [
  { value: 'kharif', icon: '🌧️' },
  { value: 'rabi', icon: '❄️' },
  { value: 'zaid', icon: '☀️' },
];
const CARD_FIELDS: { key: keyof SoilCard; label: string; unit: string }[] = [
  { key: 'n', label: 'N', unit: 'kg/ha' },
  { key: 'p', label: 'P', unit: 'kg/ha' },
  { key: 'k', label: 'K', unit: 'kg/ha' },
  { key: 's', label: 'S', unit: 'ppm' },
  { key: 'ph', label: 'pH', unit: '' },
  { key: 'ec', label: 'EC', unit: 'dS/m' },
  { key: 'oc', label: 'OC', unit: '%' },
  { key: 'zn', label: 'Zn', unit: 'ppm' },
  { key: 'fe', label: 'Fe', unit: 'ppm' },
  { key: 'cu', label: 'Cu', unit: 'ppm' },
  { key: 'mn', label: 'Mn', unit: 'ppm' },
  { key: 'b', label: 'B', unit: 'ppm' },
];

function ProfileForm() {
  const { profile, loading, save } = useFarmProfile();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState<FarmProfile>({ areaUnit: 'acre', landArea: 1 });
  const [cardPhoto, setCardPhoto] = useState<string | null>(null);
  const [readingCard, setReadingCard] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, ...profile }));
  }, [profile]);

  const set = <K extends keyof FarmProfile>(k: K, v: FarmProfile[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setCard = (k: keyof SoilCard, v: string) =>
    setForm((f) => ({ ...f, soilCard: { ...(f.soilCard || {}), [k]: v === '' ? undefined : Number(v) } }));

  const detect = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${locale}`);
          const j = await r.json();
          const a = j.address || {};
          setForm((f) => ({
            ...f,
            lat: latitude,
            lon: longitude,
            district: [a.village || a.town || a.city, a.state_district || a.county].filter(Boolean).join(', '),
            state: a.state,
          }));
        } catch {
          setForm((f) => ({ ...f, lat: latitude, lon: longitude }));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast({ variant: 'destructive', title: t('geolocation_denied_title') });
      },
      { timeout: 15000 }
    );
  };

  const scanCard = async (dataUri: string) => {
    setCardPhoto(dataUri);
    setReadingCard(true);
    try {
      const r = await readSoilCard(await getIdTokenOrThrow(), { photoDataUri: dataUri }, locale);
      if (!r.isSoilCard) {
        toast({ variant: 'destructive', title: t('soil_card'), description: '✗' });
        return;
      }
      const card: SoilCard = {};
      CARD_FIELDS.forEach(({ key }) => {
        const v = (r as unknown as Record<string, unknown>)[key];
        if (typeof v === 'number') Object.assign(card, { [key]: v });
      });
      if (r.testDate) card.testDate = r.testDate;
      setForm((f) => ({ ...f, soilCard: { ...(f.soilCard || {}), ...card } }));
      track('soil_card_read', { fields: Object.keys(card).length });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setReadingCard(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save(form);
      track('farm_profile_saved', { has_card: Boolean(form.soilCard) });
      toast({ title: t('saved') });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">📍 {t('district')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input className="h-14 text-lg" value={form.district || ''} onChange={(e) => set('district', e.target.value)} placeholder="Karnal, Haryana" />
            <MicButton onText={(v) => set('district', v)} className="h-14 w-14" />
          </div>
          <Button type="button" variant="outline" className="h-12 w-full gap-2 text-base" onClick={detect} disabled={locating}>
            {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />} {t('detect_location')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">📐 {t('land_area')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Button type="button" variant="outline" className="h-14 w-14" onClick={() => set('landArea', Math.max(0.5, (form.landArea || 1) - 0.5))}>
              <Minus className="h-6 w-6" />
            </Button>
            <Input
              type="number"
              inputMode="decimal"
              className="h-14 w-28 text-center text-2xl font-bold"
              value={form.landArea ?? ''}
              onChange={(e) => set('landArea', e.target.value === '' ? undefined : Number(e.target.value))}
            />
            <Button type="button" variant="outline" className="h-14 w-14" onClick={() => set('landArea', (form.landArea || 0) + 0.5)}>
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <ChoiceChips
            columns={3}
            value={form.areaUnit}
            onChange={(v) => set('areaUnit', v)}
            options={(['acre', 'bigha', 'hectare'] as const).map((u) => ({ value: u, label: t(`unit_${u}`) }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t('main_crop')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChoiceChips columns={3} value={form.mainCrop} onChange={(v) => set('mainCrop', v)} options={CROPS.map((c) => ({ value: c.key, label: t(`crop_${c.key}`), icon: c.emoji }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t('season')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChoiceChips columns={3} value={form.season} onChange={(v) => set('season', v)} options={SEASONS.map((s) => ({ value: s.value, label: t(`season_${s.value}`), icon: s.icon }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t('soil_type')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChoiceChips value={form.soilType} onChange={(v) => set('soilType', v)} options={SOILS.map((s) => ({ value: s.value, label: t(`soil_${s.value}`), icon: s.icon }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{t('water_source')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChoiceChips value={form.waterSource} onChange={(v) => set('waterSource', v)} options={WATER.map((w) => ({ value: w.value, label: t(`water_${w.value}`), icon: w.icon }))} />
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">🧾 {t('soil_card')}</CardTitle>
          <CardDescription className="text-base">{t('soil_card_sub')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PhotoPicker onPhoto={scanCard} preview={cardPhoto} label={t('scan_card')} />
          {readingCard && (
            <p className="flex items-center justify-center gap-2 text-lg">
              <Loader2 className="h-5 w-5 animate-spin" /> {t('reading_card')}
            </p>
          )}
          <div>
            <p className="mb-2 font-semibold">{t('card_values')}</p>
            <div className="grid grid-cols-3 gap-2">
              {CARD_FIELDS.map(({ key, label, unit }) => (
                <label key={key} className="rounded-lg border p-2 text-sm">
                  <span className="block font-semibold">
                    {label} <span className="font-normal text-muted-foreground">{unit}</span>
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="mt-1 w-full bg-transparent text-lg outline-none"
                    value={(form.soilCard?.[key] as number | undefined) ?? ''}
                    onChange={(e) => setCard(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={submit} disabled={saving} size="lg" className="sticky bottom-24 h-16 w-full gap-2 text-xl shadow-lg md:bottom-4">
        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />} {t('save')}
      </Button>
    </div>
  );
}

export default function FarmProfilePage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <Link href="/my-farm" className="inline-flex items-center gap-2 text-base text-muted-foreground">
        <ArrowLeft className="h-5 w-5" /> {t('tile_farm')}
      </Link>
      <div>
        <h1 className="font-headline text-3xl font-bold">{t('farm_profile')}</h1>
        <p className="text-lg text-muted-foreground">{t('farm_profile_sub')}</p>
      </div>
      <SignInRequired feature={t('farm_profile')}>
        <ProfileForm />
      </SignInRequired>
    </div>
  );
}
