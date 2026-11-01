'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, IndianRupee, Loader2, MapPin, Phone, PlusCircle, RotateCcw, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/context/role-provider';
import { useListings, type Listing, type ListingUnit } from '@/hooks/use-listings';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { useI18n } from '@/hooks/use-i18n';
import { ChoiceChips } from '@/components/farmer/choice-chips';
import { MicButton } from '@/components/voice/mic-button';
import { getIdTokenOrThrow } from '@/lib/firebase';
import { parseListing } from './actions';
import { CROPS } from '@/locales/farmer';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Draft = { crop: string; quantity: string; unit: ListingUnit | ''; askingPrice: string; location: string };
const EMPTY: Draft = { crop: '', quantity: '', unit: 'quintal', askingPrice: '', location: '' };

/** Shows a crop in the user's language when it is one of the common crops. */
function useCropLabel() {
  const { t } = useI18n();
  return (name: string) => {
    const first = name.toLowerCase().split(' ')[0];
    const c = CROPS.find((x) => x.en.toLowerCase().startsWith(first));
    return c ? `${c.emoji} ${t(`crop_${c.key}`)}` : name;
  };
}

export default function MarketClient() {
  const { role, isLoading: isRoleLoading } = useRole();
  const { listings, loading, error, addListing, setListingStatus, deleteListing } = useListings(role === 'buyer' ? 'market' : 'mine');
  const { profile } = useFarmProfile();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const cropLabel = useCropLabel();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [cropFilter, setCropFilter] = useState<string>('all');

  useEffect(() => {
    if (open && !draft.location && profile?.district) setDraft((d) => ({ ...d, location: profile.district || '' }));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = role === 'farmer' ? listings : listings.filter((l) => l.status === 'active');
  const visible = cropFilter === 'all' ? rows : rows.filter((l) => l.crop.toLowerCase().includes(cropFilter.toLowerCase()));

  const fromVoice = async (text: string) => {
    setParsing(true);
    try {
      const r = await parseListing(await getIdTokenOrThrow(), { text }, locale);
      setDraft({
        crop: r.crop || '',
        quantity: r.quantity ? String(r.quantity) : '',
        unit: r.unit || 'quintal',
        askingPrice: r.askingPrice ? String(r.askingPrice) : '',
        location: r.location || profile?.district || '',
      });
      setOpen(true);
      track('listing_voice_parsed', { complete: Boolean(r.crop && r.quantity && r.askingPrice) });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setParsing(false);
    }
  };

  const submit = async () => {
    const quantity = Number(draft.quantity);
    const askingPrice = Number(draft.askingPrice);
    if (!draft.crop.trim() || !draft.unit || !(quantity > 0) || !(askingPrice > 0) || !draft.location.trim()) {
      toast({ variant: 'destructive', title: t('missing_info_title') });
      return;
    }
    setSaving(true);
    try {
      await addListing({ crop: draft.crop, quantity, unit: draft.unit, askingPrice, location: draft.location });
      track('listing_created', { crop: draft.crop });
      setOpen(false);
      setDraft(EMPTY);
      toast({ title: t('saved') });
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSold = async (l: Listing) => {
    try {
      await setListingStatus(l, l.status === 'sold' ? 'active' : 'sold');
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteListing(id);
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Error' });
    }
  };

  if (isRoleLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {role === 'farmer' && (
        <Card className="border-2 border-primary/40">
          <CardContent className="space-y-3 pt-6 text-center">
            <MicButton onText={fromVoice} size="lg" label={t('speak_to_list')} className="h-16 w-full text-xl" />
            {parsing && (
              <p className="flex items-center justify-center gap-2 text-lg">
                <Loader2 className="h-5 w-5 animate-spin" /> {t('checking')}
              </p>
            )}
            <p className="text-base text-muted-foreground">{t('speak_example')}</p>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 text-base"
              onClick={() => {
                setDraft(EMPTY);
                setOpen(true);
              }}
            >
              <PlusCircle className="h-5 w-5" /> {t('add_stock')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Link href="/mandi" className="flex items-center gap-3 rounded-2xl border bg-amber-50 p-4 text-lg font-medium text-amber-900">
        <IndianRupee className="h-7 w-7" /> {t('tile_mandi')} · {t('tile_mandi_sub')}
      </Link>

      {role === 'buyer' && (
        <ChoiceChips
          columns={3}
          value={cropFilter}
          onChange={setCropFilter}
          options={[{ value: 'all', label: '✱' }, ...CROPS.slice(0, 8).map((c) => ({ value: c.en.split(' ')[0], label: t(`crop_${c.key}`), icon: c.emoji }))]}
        />
      )}

      <h2 className="text-2xl font-bold">{role === 'farmer' ? t('my_stock_for_sale') : t('available_stock')}</h2>
      {error && <p className="text-destructive">{error}</p>}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-lg text-muted-foreground">
          {role === 'farmer' ? t('no_stock_added') : t('no_stock_to_display')}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((l) => (
            <Card key={l.id} className={cn(l.status === 'sold' && 'opacity-60')}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-xl">
                  <span>{cropLabel(l.crop)}</span>
                  {l.status === 'sold' && <span className="rounded bg-muted px-2 py-1 text-sm">✓</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                <p>
                  <span className="font-bold">
                    {l.quantity.toLocaleString('en-IN')} {t(l.unit)}
                  </span>{' '}
                  · ₹{l.askingPrice.toLocaleString('en-IN')} / {t(l.unit)}
                </p>
                <p className="text-muted-foreground">= ₹{(l.quantity * l.askingPrice).toLocaleString('en-IN')}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" /> {l.location}
                </p>
                {role === 'buyer' && (
                  <>
                    <p className="flex items-center gap-2">
                      <User className="h-5 w-5" /> {l.farmerName}
                    </p>
                    {l.contact ? (
                      <Button asChild size="lg" className="h-14 w-full gap-2 text-lg">
                        <a href={`tel:${l.contact.replace(/[^+\d]/g, '')}`} onClick={() => track('buyer_call', { crop: l.crop })}>
                          <Phone className="h-6 w-6" /> {l.contact}
                        </a>
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('no_contact_provided')}</p>
                    )}
                  </>
                )}
                {role === 'farmer' && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="lg" className="h-12 flex-1 gap-2" onClick={() => toggleSold(l)}>
                      {l.status === 'sold' ? <RotateCcw className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                      {l.status === 'sold' ? '↺' : '✓'}
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 w-14" onClick={() => remove(l.id)} aria-label={t('delete')}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('add_new_stock')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-lg">{t('crop')}</Label>
              <Input className="h-14 text-lg" value={draft.crop} onChange={(e) => setDraft({ ...draft, crop: e.target.value })} />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {CROPS.slice(0, 8).map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className="rounded-lg border p-1 text-2xl"
                    onClick={() => setDraft({ ...draft, crop: c.en.split(' (')[0] })}
                    aria-label={t(`crop_${c.key}`)}
                  >
                    {c.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-lg">{t('quantity')}</Label>
              <Input type="number" inputMode="decimal" className="h-14 text-lg" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
              <div className="mt-2">
                <ChoiceChips
                  columns={3}
                  value={draft.unit || undefined}
                  onChange={(u) => setDraft({ ...draft, unit: u })}
                  options={(['kg', 'quintal', 'tonnes'] as const).map((u) => ({ value: u, label: t(u) }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-lg">₹ / {draft.unit ? t(draft.unit) : ''}</Label>
              <Input type="number" inputMode="decimal" className="h-14 text-lg" value={draft.askingPrice} onChange={(e) => setDraft({ ...draft, askingPrice: e.target.value })} />
            </div>
            <div>
              <Label className="text-lg">{t('location')}</Label>
              <div className="flex gap-2">
                <Input className="h-14 text-lg" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
                <MicButton onText={(v) => setDraft((d) => ({ ...d, location: v }))} className="h-14 w-14" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="lg">
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button type="button" size="lg" onClick={submit} disabled={saving} className="gap-2 text-lg">
              {saving && <Loader2 className="h-5 w-5 animate-spin" />} {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
