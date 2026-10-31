
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
import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/context/tasks-provider';
import { isToday, parseISO } from 'date-fns';
import { useI18n } from '@/hooks/use-i18n';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useRecords } from '@/context/records-provider';
import { useAuth } from '@/context/auth-provider';
import { useListings, toQuintals, listingValue } from '@/hooks/use-listings';
import { SignInRequired } from '@/components/auth/sign-in-required';

type WeatherData = {
  temp: number;
  condition: string;
  location: string;
  timestamp: number;
};

function FarmerDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { t } = useI18n();

  const getPluralKey = (count: number, zeroKey: string, oneKey: string, otherKey: string) => {
    if (count === 0) return zeroKey;
    if (count === 1) return oneKey;
    return otherKey;
  }

  const dashboardData = useMemo(() => {
    if (tasksLoading) return null;

    const upcomingTasks = tasks.filter(t => t.status === 'Upcoming');
    const tasksToday = upcomingTasks.filter(t => isToday(parseISO(t.date)));
    const nextTask = upcomingTasks.length > 0 ? upcomingTasks[0] : null;

    const activeCrops = new Set(upcomingTasks.map(t => t.crop.replace(/\s*\(.*\)\s*/, '')));

    const tasksTodayCount = tasksToday.length;
    const tasksTodayKey = getPluralKey(tasksTodayCount, 'tasks_today_zero', 'tasks_today_one', 'tasks_today_other');

    const activeCropsCount = activeCrops.size;
    const activeCropsKey = getPluralKey(activeCropsCount, 'active_crops_zero', 'active_crops_one', 'active_crops_other');

    return {
      tasksTodayText: t(tasksTodayKey, { count: tasksTodayCount }),
      nextTask: nextTask ? `${nextTask.activity}: ${nextTask.crop}` : t('no_upcoming_tasks'),
      activeCropsText: t(activeCropsKey, { count: activeCropsCount }),
    };
  }, [tasks, tasksLoading, t]);

  const formatTimeAgo = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    let unit: 'minute' | 'hour' | 'day' = 'day';
    let value = 0;

    if (seconds < 60) return t('just_now');
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        unit = 'minute';
        value = minutes;
    } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            unit = 'hour';
            value = hours;
        } else {
            unit = 'day';
            value = Math.floor(hours / 24);
        }
    }
    const key = `time_ago_${unit}${value === 1 ? '' : 's'}`;
    return t(key, { count: value });
  };

  useEffect(() => {
    try {
      const cachedWeather = localStorage.getItem('weatherCache');
      if (cachedWeather) {
        setWeather(JSON.parse(cachedWeather));
      }
    } catch (e) {
      console.error("Failed to parse weather cache", e);
    }

    if (!navigator.geolocation) {
      if (!localStorage.getItem('weatherCache')) {
         setWeatherError(t('geolocation_not_supported'));
      } else {
         setWeatherError(t('could_not_update_forecast'));
      }
      return;
    }

    const fetchWeather = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        if (!response.ok) throw new Error('Failed to fetch location data');
        
        const data = await response.json();
        const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || t('your_location');
        
        const newWeather: WeatherData = {
          temp: 24, // Simulated temperature
          condition: t('sunny'), // Simulated condition
          location: locationName,
          timestamp: Date.now(),
        };
        
        setWeather(newWeather);
        setWeatherError(null);
        localStorage.setItem('weatherCache', JSON.stringify(newWeather));

      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setWeatherError(t('could_not_update_forecast'));
      }
    };
    
    const handleError = (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        if (!localStorage.getItem('weatherCache')) {
             setWeatherError(t('geolocation_denied'));
        } else {
             setWeatherError(t('could_not_update_forecast'));
        }
    };

    navigator.geolocation.getCurrentPosition(fetchWeather, handleError);
  }, [t]);


  const { user, signInWithGoogle } = useAuth();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {t('farmer_dashboard')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Smart farm management powered by Gemini AI, Google Search & Maps Grounding, and Bioscience intelligence.
          </p>
        </div>
        {!user ? (
          <Button
            size="sm"
            onClick={() => signInWithGoogle()}
            className="bg-[#4285F4] hover:bg-[#3367D6] text-white flex items-center gap-2 self-start sm:self-auto"
          >
            <ShieldCheck className="h-4 w-4" /> Sign In to Sync Cloud Data
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Synced to Firestore: {user.displayName || user.email}</span>
          </div>
        )}
      </div>

      {/* Feature Showcase Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Multi-Model Banner */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                <Bot className="h-4 w-4 text-emerald-600" />
                <span>Multi-Model Gemini Farming AI</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Chat with Gemini 4 Argon, 3.8 Flash & 3.1 Flash Lite. Features live Google Search & Maps Grounding for mandi prices & agricultural centers.
              </p>
            </div>
            <Link href="/ai-assistant">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Open Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Bioscience Intelligence Banner */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-500/10 to-blue-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                <Dna className="h-4 w-4 text-teal-600" />
                <span>Crop Bioscience & Chemistry</span>
              </div>
              <p className="text-xs text-muted-foreground">
                PubChem active ingredient analysis for fertilizers (Urea, NPK), biopesticides (Neem), fungicides, and chemical safety data.
              </p>
            </div>
            <Link href="/crop-science">
              <Button size="sm" variant="outline" className="border-teal-400 hover:bg-teal-50 text-teal-800 shrink-0">
                Explore Science
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('weather_forecast')}
            </CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {weather ? (
              <>
                <div className="text-2xl font-bold">{weather.temp}°C, {weather.condition}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                   <MapPin className="mr-1 h-3 w-3" /> {weather.location}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {weatherError ? `${t('update_failed')} ${formatTimeAgo(weather.timestamp)}` : `${t('updated')} ${formatTimeAgo(weather.timestamp)}`}
                </p>
              </>
            ) : weatherError ? (
              <div className="text-sm text-muted-foreground flex items-start gap-2 pt-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{weatherError}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-2">{t('fetching_weather')}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('upcoming_tasks')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardData ? (
                <>
                    <div className="text-2xl font-bold">{dashboardData.tasksTodayText}</div>
                    <p className="text-xs text-muted-foreground truncate">
                        {t('next_up')}: {dashboardData.nextTask}
                    </p>
                </>
            ) : (
                <div className="space-y-2 pt-1">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active_crops')}</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {dashboardData ? (
                <>
                    <div className="text-2xl font-bold">{dashboardData.activeCropsText}</div>
                    <p className="text-xs text-muted-foreground">
                        {t('across_all_tasks')}
                    </p>
                </>
            ) : (
                <div className="space-y-2 pt-1">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-3 w-4/5" />
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('quick_actions')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/ai-assistant" passHref>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Bot className="mr-2 h-4 w-4" /> AI Assistant
            </Button>
          </Link>
          <Link href="/crop-science" passHref>
            <Button className="w-full" variant="outline">
              <Dna className="mr-2 h-4 w-4 text-teal-600" /> Bioscience
            </Button>
          </Link>
          <Link href="/schedule" passHref>
            <Button className="w-full" variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> {t('view_schedule')}
            </Button>
          </Link>
          <Link href="/records" passHref>
            <Button className="w-full" variant="outline">
              <BookText className="mr-2 h-4 w-4" /> {t('manage_records')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

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
        {role === 'farmer' ? <FarmerDashboard /> : <BuyerDashboard />}
    </main>
  );
}
