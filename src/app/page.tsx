
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

  const getPluralKey = (count: number, zeroKey: string, oneKey: string, otherKey: string) => {
    if (count === 0) return zeroKey;
    if (count === 1) return oneKey;
    return otherKey;
  }
  
  // Simulated data for the new dashboard cards
  const newItemsCount = 2;
  const newItemsKey = getPluralKey(newItemsCount, 'new_items_zero', 'new_items_one', 'new_items_other');

  const topFarmers = [
    { name: 'Farmer Giles', location: 'Karnal, Haryana', value: 175000 },
    { name: 'Saanvi Patel', location: 'Nashik, Maharashtra', value: 120000 },
    { name: 'Arjun Reddy', location: 'Guntur, Andhra Pradesh', value: 95000 },
  ];

  const recentAdditions = [
      { crop: 'Cotton', farmer: 'Saanvi Patel', quantity: '20 quintal' },
      { crop: 'Mustard', farmer: 'Arjun Reddy', quantity: '15 quintal' },
  ];

  const stockByCategoryData = [
    { category: t('seeds'), value: 450 },
    { category: t('fertilizers'), value: 1200 },
    { category: t('pesticides'), value: 300 },
    { category: t('other'), value: 150 },
  ];


  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('buyer_dashboard')}
        </h1>
        <Link href="/market" passHref>
          <Button>
            <Store className="mr-2 h-4 w-4" /> {t('browse_marketplace')}
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('market_trend')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('slightly_up')}</div>
            <p className="text-xs text-muted-foreground">{t('market_trending_up')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('top_commodity')}</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('basmati_rice')}</div>
            <p className="text-xs text-muted-foreground">{t('highest_trading_volume')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('new_stock')}</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t(newItemsKey, { count: newItemsCount })}</div>
            <p className="text-xs text-muted-foreground">{t('new_rice_wheat_stock')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_listings')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">{t('active_listings_in_market')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('stock_by_category')}</CardTitle>
            <CardDescription>{t('stock_by_category_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByCategoryData}>
                <XAxis
                  dataKey="category"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
              <ul className="space-y-4">
                {topFarmers.map((farmer, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="text-sm">
                      <p className="font-medium">{farmer.name}</p>
                      <p className="text-xs text-muted-foreground">{farmer.location}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-mono text-sm font-medium">₹{farmer.value.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">{t('total_stock_value')}</p>
                    </div>
                  </li>
                ))}
              </ul>
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
              <ul className="space-y-3">
                 {recentAdditions.map((item, index) => (
                    <li key={index}>
                        <p className="font-medium">{t(item.crop.toLowerCase())}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('by')} <span className="font-medium text-foreground">{item.farmer}</span> - <span className="font-mono text-xs">{item.quantity}</span>
                        </p>
                    </li>
                 ))}
              </ul>
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
