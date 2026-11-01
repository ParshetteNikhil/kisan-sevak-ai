
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Sun,
  Calendar,
  Sprout,
  BookText,
  Store,
  TrendingUp,
  PackageSearch,
  MapPin,
  AlertTriangle,
  User,
  Package,
  History,
  Bot,
  Dna,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useRole } from '@/context/role-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from '@/context/auth-provider';
import { FarmerHome } from '@/components/farmer/farmer-home';
import { useListings, toQuintals, listingValue } from '@/hooks/use-listings';
import { SignInRequired } from '@/components/auth/sign-in-required';

function BuyerDashboard() {
  const { t } = useI18n();
  const { user, loading: isAuthLoading } = useAuth();
  const { listings, loading, error } = useListings('market');

  const stats = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newItemsCount = listings.filter((l) => Date.parse(l.createdAt) > dayAgo).length;
    const farmerCount = new Set(listings.map((l) => l.farmerId)).size;

    const byCrop = new Map<string, { crop: string; quintals: number }>();
    for (const l of listings) {
      const key = l.crop.trim().toLowerCase();
      const entry = byCrop.get(key) || { crop: l.crop.trim(), quintals: 0 };
      entry.quintals += toQuintals(l);
      byCrop.set(key, entry);
    }
    const stockByCrop = [...byCrop.values()]
      .sort((x, y) => y.quintals - x.quintals)
      .slice(0, 6)
      .map((c) => ({ crop: c.crop, value: Math.round(c.quintals * 10) / 10 }));

    const byFarmer = new Map<string, { name: string; location: string; value: number }>();
    for (const l of listings) {
      const entry = byFarmer.get(l.farmerId) || { name: l.farmerName, location: l.location, value: 0 };
      entry.value += listingValue(l);
      byFarmer.set(l.farmerId, entry);
    }
    const topFarmers = [...byFarmer.values()].sort((x, y) => y.value - x.value).slice(0, 3);

    return {
      newItemsCount,
      farmerCount,
      topCommodity: stockByCrop[0],
      stockByCrop,
      topFarmers,
      recentAdditions: listings.slice(0, 3),
    };
  }, [listings]);

  const getPluralKey = (count: number, zeroKey: string, oneKey: string, otherKey: string) => {
    if (count === 0) return zeroKey;
    if (count === 1) return oneKey;
    return otherKey;
  };
  const newItemsKey = getPluralKey(stats.newItemsCount, 'new_items_zero', 'new_items_one', 'new_items_other');
  const cropLabel = (crop: string) => t(crop.toLowerCase().replace(/ /g, '_')) || crop;

  const header = (
    <div className="flex items-center justify-between space-y-2">
      <h1 className="text-3xl font-bold tracking-tight font-headline">{t('buyer_dashboard')}</h1>
      <Link href="/market" passHref>
        <Button>
          <Store className="mr-2 h-4 w-4" /> {t('browse_marketplace')}
        </Button>
      </Link>
    </div>
  );

  if (!isAuthLoading && !user) {
    return (
      <>
        {header}
        <SignInRequired feature="Live marketplace data">{null}</SignInRequired>
      </>
    );
  }

  if (isAuthLoading || loading) {
    return (
      <>
        {header}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </>
    );
  }

  const emptyText = 'No produce listed yet. Listings appear here as soon as farmers add them.';

  return (
    <>
      {header}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmers selling</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.farmerCount}</div>
            <p className="text-xs text-muted-foreground">With produce currently listed.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('top_commodity')}</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topCommodity ? cropLabel(stats.topCommodity.crop) : '—'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.topCommodity
                ? `${stats.topCommodity.value.toLocaleString('en-IN')} quintal available — the most of any crop.`
                : 'No listings yet.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('new_stock')}</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t(newItemsKey, { count: stats.newItemsCount })}</div>
            <p className="text-xs text-muted-foreground">Listed in the last 24 hours.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_listings')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings.length.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">{t('active_listings_in_market')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock by crop</CardTitle>
            <CardDescription>Quintals of produce currently listed, for the top crops.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {stats.stockByCrop.length === 0 ? (
              <p className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.stockByCrop.map((c) => ({ ...c, crop: cropLabel(c.crop) }))}>
                  <XAxis dataKey="crop" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} q`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    formatter={(value: number) => [`${value.toLocaleString('en-IN')} quintal`, 'Available']}
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                {t('top_farmers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topFarmers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              ) : (
                <ul className="space-y-4">
                  {stats.topFarmers.map((farmer, index) => (
                    <li key={index} className="flex items-center gap-4">
                      <div className="text-sm">
                        <p className="font-medium">{farmer.name}</p>
                        <p className="text-xs text-muted-foreground">{farmer.location}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-mono text-sm font-medium">₹{Math.round(farmer.value).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">{t('total_stock_value')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                {t('recent_additions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentAdditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.recentAdditions.map((item) => (
                    <li key={item.id}>
                      <p className="font-medium">{cropLabel(item.crop)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('by')} <span className="font-medium text-foreground">{item.farmerName}</span> -{' '}
                        <span className="font-mono text-xs">
                          {item.quantity.toLocaleString('en-IN')} {t(item.unit)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role, isLoading } = useRole();
  
  if (isLoading) {
    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-40" />
        </main>
    );
  }
  
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {role === 'farmer' ? <FarmerHome /> : <BuyerDashboard />}
    </main>
  );
}
