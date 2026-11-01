'use client';

import Link from 'next/link';
import { BookText, CalendarDays, ChevronRight, Package, Pencil, Sprout } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { useAuth } from '@/context/auth-provider';
import { CROPS } from '@/locales/farmer';
import { Button } from '@/components/ui/button';

export default function MyFarmPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile } = useFarmProfile();
  const crop = CROPS.find((c) => c.key === profile?.mainCrop);

  const rows: [string, string | undefined][] = [
    [t('district'), profile?.district],
    [t('land_area'), profile?.landArea ? `${profile.landArea} ${t(`unit_${profile.areaUnit || 'acre'}`)}` : undefined],
    [t('main_crop'), crop ? `${crop.emoji} ${t(`crop_${crop.key}`)}` : undefined],
    [t('soil_type'), profile?.soilType ? t(`soil_${profile.soilType}`) : undefined],
    [t('water_source'), profile?.waterSource ? t(`water_${profile.waterSource}`) : undefined],
    [t('soil_card'), profile?.soilCard && Object.keys(profile.soilCard).length ? '✓' : undefined],
  ];

  const links = [
    { href: '/schedule', label: t('my_work'), icon: CalendarDays },
    { href: '/records', label: t('records'), icon: BookText },
    { href: '/inventory', label: t('inventory'), icon: Package },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="font-headline text-3xl font-bold">{t('tile_farm')}</h1>

      <div className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sprout className="h-6 w-6 text-primary" /> {t('farm_profile')}
          </h2>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/my-farm/profile">
              <Pencil className="h-5 w-5" /> {t('edit')}
            </Link>
          </Button>
        </div>
        {user ? (
          <dl className="divide-y">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2 text-lg">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v || <span className="text-muted-foreground">{t('not_set')}</span>}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-lg text-muted-foreground">{t('sign_in_needed')}</p>
        )}
      </div>

      <div className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-xl font-semibold active:scale-[0.99]">
            <Icon className="h-8 w-8 text-primary" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
