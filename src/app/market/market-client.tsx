
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, ShoppingCart, IndianRupee, TrendingUp, TrendingDown, Minus, Trash2, Sprout, Bell, Pencil, MapPin, Loader2, User, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/context/role-provider';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';

type StockItem = {
  id: string;
  crop: string;
  quantity: number;
  unit: 'kg' | 'tonnes' | 'quintal';
  askingPrice: number;
  location: string;
  farmerName: string;
};

type MarketPrice = {
  crop: string;
  price: number;
  unit: 'kg' | 'tonnes' | 'quintal';
  trend: 'up' | 'down' | 'stable';
};

const initialStock: StockItem[] = [
  { id: 'STK001', crop: 'Basmati Rice', quantity: 50, unit: 'quintal', askingPrice: 3500, location: 'Karnal, Haryana', farmerName: 'Farmer Giles' },
  { id: 'STK002', crop: 'Wheat', quantity: 10, unit: 'tonnes', askingPrice: 21000, location: 'Ludhiana, Punjab', farmerName: 'Farmer Giles' },
];

const initialMarketPrices: MarketPrice[] = [
  { crop: 'Basmati Rice', price: 3650, unit: 'quintal', trend: 'up' },
  { crop: 'Wheat', price: 20500, unit: 'tonnes', trend: 'down' },
  { crop: 'Cotton', price: 7500, unit: 'quintal', trend: 'stable' },
  { crop: 'Sugarcane', price: 3500, unit: 'tonnes', trend: 'up' },
  { crop: 'Mustard', price: 5800, unit: 'quintal', trend: 'stable' },
];

const unitConversion: { [key in StockItem['unit']]: number } = {
  kg: 1,
  quintal: 100,
  tonnes: 1000,
};

export default function MarketClient() {
  const { role, isLoading: isRoleLoading } = useRole();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(initialMarketPrices);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [isUpdatePricesDialogOpen, setIsUpdatePricesDialogOpen] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'tonnes' | 'quintal' | ''>('');
  const [location, setLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [notifiedStockIds, setNotifiedStockIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (role === 'farmer') {
      const alertsToFire = stock
        .map(stockItem => {
          if (notifiedStockIds.includes(stockItem.id)) {
            return null;
          }
          const marketInfo = marketPrices.find(
            price => price.crop.toLowerCase() === stockItem.crop.toLowerCase()
          );

          if (marketInfo) {
            const stockPricePerKg = stockItem.askingPrice / unitConversion[stockItem.unit];
            const marketPricePerKg = marketInfo.price / unitConversion[marketInfo.unit];

            if (marketPricePerKg > stockPricePerKg) {
                return { stockItem, marketInfo };
            }
          }
          return null;
        })
        .filter((item): item is { stockItem: StockItem; marketInfo: MarketPrice } => item !== null);

      if (alertsToFire.length > 0) {
        alertsToFire.forEach(({ stockItem, marketInfo }) => {
          toast({
            title: t('price_alert_for', { crop: stockItem.crop }),
            description: t('price_alert_desc'),
          });
        });
        setNotifiedStockIds(prev => [...prev, ...alertsToFire.map(({ stockItem }) => stockItem.id)]);
      }
    }
  }, [stock, marketPrices, toast, notifiedStockIds, role, t]);


  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
        toast({
            variant: "destructive",
            title: t('geolocation_not_supported'),
            description: t('geolocation_not_supported_desc'),
        });
        return;
    }

    setIsDetectingLocation(true);

    const success = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (!response.ok) throw new Error('Failed to fetch location data');
            
            const data = await response.json();
            const locationName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
            if (!locationName) throw new Error('Could not determine location name from API response.');
            setLocation(locationName);
             toast({
                title: t('location_detected_title'),
                description: t('location_detected_desc', { location: locationName }),
            });
        } catch (error) {
            console.error("Error fetching location name:", error);
            toast({
                variant: "destructive",
                title: t('location_fetch_error_title'),
                description: t('location_fetch_error_desc'),
            });
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const error = (err: GeolocationPositionError) => {
        console.error("Geolocation error:", err);
        toast({
            variant: "destructive",
            title: t('geolocation_denied_title'),
            description: t('geolocation_denied_desc_settings'),
        });
        setIsDetectingLocation(false);
    };

    navigator.geolocation.getCurrentPosition(success, error);
  };


  const handleAddStock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newStockItem: StockItem = {
      id: `STK${String(stock.length + 1).padStart(3, '0')}`,
      crop: formData.get('crop') as string,
      quantity: Number(formData.get('quantity')),
      unit: unit as StockItem['unit'],
      askingPrice: Number(formData.get('askingPrice')),
      location: location,
      farmerName: profile.name,
    };
    setStock([newStockItem, ...stock]);
    setIsAddStockDialogOpen(false);
    event.currentTarget.reset();
    setUnit('');
    setLocation('');
  };

  const handleUpdatePrices = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newMarketPrices = marketPrices.map(item => {
      const newPriceValue = formData.get(item.crop);
      if (newPriceValue === null) return item;

      const newPrice = Number(newPriceValue);
      let newTrend: MarketPrice['trend'] = 'stable';
      if (newPrice > item.price) {
        newTrend = 'up';
      } else if (newPrice < item.price) {
        newTrend = 'down';
      }

      return {
        ...item,
        price: newPrice,
        trend: newTrend,
      };
    });

    setMarketPrices(newMarketPrices);
    setIsUpdatePricesDialogOpen(false);
    toast({
      title: t('prices_updated_title'),
      description: t('prices_updated_desc'),
    });
  };

  const handleDeleteStock = (id: string) => {
    setStock(stock.filter(item => item.id !== id));
    setNotifiedStockIds(ids => ids.filter(notifiedId => notifiedId !== id));
  };
  
  const TrendIcon = ({ trend }: { trend: MarketPrice['trend'] }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isRoleLoading || isProfileLoading) {
    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-28" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
                {role === 'farmer' ? <ShoppingCart className="mr-2 h-5 w-5" /> : <PackageSearch className="mr-2 h-5 w-5" />}
                {role === 'farmer' ? t('my_stock_for_sale') : t('available_stock')}
            </CardTitle>
            <CardDescription>
                {role === 'farmer' ? t('my_stock_for_sale_desc') : t('available_stock_desc')}
            </CardDescription>
          </div>
          {role === 'farmer' && (
            <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('add_stock')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddStock}>
                  <DialogHeader>
                    <DialogTitle>{t('add_new_stock')}</DialogTitle>
                    <DialogDescription>
                      {t('add_new_stock_desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="crop" className="text-right">{t('crop')}</Label>
                      <Input id="crop" name="crop" className="col-span-3" placeholder={t('eg_basmati_rice')} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantity" className="text-right">{t('quantity')}</Label>
                      <Input id="quantity" name="quantity" type="number" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unit" className="text-right">{t('unit')}</Label>
                      <Select required onValueChange={(value) => setUnit(value as StockItem['unit'])} value={unit}>
                        <SelectTrigger id="unit" className="col-span-3">
                          <SelectValue placeholder={t('select_a_unit')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">{t('kilograms')}</SelectItem>
                          <SelectItem value="quintal">{t('quintal')}</SelectItem>
                          <SelectItem value="tonnes">{t('tonnes')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="askingPrice" className="text-right">{t('asking_price_inr')}</Label>
                      <Input id="askingPrice" name="askingPrice" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">{t('location')}</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <Input 
                          id="location" 
                          name="location" 
                          className="flex-grow" 
                          placeholder={t('eg_nashik_maharashtra')} 
                          required 
                          value={location} 
                          onChange={(e) => setLocation(e.target.value)} 
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                onClick={handleDetectLocation}
                                disabled={isDetectingLocation}
                              >
                                {isDetectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                <span className="sr-only">{t('detect_location')}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('detect_my_current_location')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('add_to_stock')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {role === 'buyer' && <TableHead><User className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('farmer')}</TableHead>}
                <TableHead><Sprout className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('crop')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('asking_price_inr_short')}</TableHead>
                <TableHead className="text-right">{t('total_asking_value_inr')}</TableHead>
                <TableHead><MapPin className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('location')}</TableHead>
                {role === 'farmer' && <TableHead className="text-right">{t('actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.length > 0 ? stock.map((item) => {
                const marketInfo = marketPrices.find(
                  (price) => price.crop.toLowerCase() === item.crop.toLowerCase()
                );
                
                let hasPriceAlert = false;
                let potentialValue = 0;
                if (marketInfo && role === 'farmer') {
                    const stockPricePerKg = item.askingPrice / unitConversion[item.unit];
                    const marketPricePerKg = marketInfo.price / unitConversion[marketInfo.unit];
                    hasPriceAlert = marketPricePerKg > stockPricePerKg;
                    if(hasPriceAlert) {
                      const totalKgs = item.quantity * unitConversion[item.unit];
                      potentialValue = totalKgs * marketPricePerKg;
                    }
                }

                return (
                <TableRow key={item.id} className={cn(hasPriceAlert && 'bg-primary/10')}>
                  {role === 'buyer' && <TableCell className="font-medium">{item.farmerName}</TableCell>}
                  <TableCell className="font-medium flex items-center gap-2">
                    {t(item.crop.toLowerCase().replace(/ /g, '_')) || item.crop}
                    {hasPriceAlert && (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger>
                              <Bell className="h-4 w-4 text-primary" />
                           </TooltipTrigger>
                           <TooltipContent className="space-y-1 p-2">
                             <p>{t('market_price_higher_alert')}</p>
                             <p className="font-semibold">
                               {t('potential_value')}: ₹{potentialValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                             </p>
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>{item.quantity.toLocaleString()} {t(item.unit)}</TableCell>
                  <TableCell>₹{item.askingPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})} / {t(item.unit)}</TableCell>
                  <TableCell className="text-right font-medium">₹{(item.quantity * item.askingPrice).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  {role === 'farmer' && (
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('delete')}</span>
                        </Button>
                    </TableCell>
                  )}
                </TableRow>
              )}) : (
                <TableRow>
                  <TableCell colSpan={role === 'farmer' ? 6: 7} className="h-24 text-center">
                    {role === 'farmer' ? t('no_stock_added') : t('no_stock_to_display')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><IndianRupee className="mr-2 h-5 w-5" />{t('live_market_prices')}</CardTitle>
            <CardDescription>{t('live_market_prices_desc')}</CardDescription>
          </div>
           {role === 'buyer' && (
            <Dialog open={isUpdatePricesDialogOpen} onOpenChange={setIsUpdatePricesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> {t('update_prices')}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('update_market_prices')}</DialogTitle>
                  <DialogDescription>
                    {t('update_market_prices_desc')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdatePrices}>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    {marketPrices.map((item) => (
                      <div key={item.crop} className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor={`price-${item.crop}`} className="text-right truncate">
                          {t(item.crop.toLowerCase().replace(/ /g, '_')) || item.crop} <span className="text-muted-foreground">({t(item.unit)})</span>
                        </Label>
                        <Input
                          id={`price-${item.crop}`}
                          name={item.crop}
                          type="number"
                          step="0.01"
                          defaultValue={item.price}
                          className="col-span-2"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('save_changes')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
           )}
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Sprout className="inline-block mr-2 h-4 w-4 text-muted-foreground" />{t('crop')}</TableHead>
                <TableHead>{t('market_price_inr')}</TableHead>
                <TableHead>{t('trend')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketPrices.map((item) => (
                <TableRow key={item.crop}>
                  <TableCell className="font-medium">{t(item.crop.toLowerCase().replace(/ /g, '_')) || item.crop}</TableCell>
                  <TableCell>₹{item.price.toFixed(2)} / {t(item.unit)}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <TrendIcon trend={item.trend} />
                    <span className="capitalize">{t(item.trend)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
