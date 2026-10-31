"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Globe, MapPin, Search, Loader2, BarChart3, Info, IndianRupee, Truck, Milestone } from 'lucide-react';
import { analyzeInterStatePrice } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import type { InterStatePriceOutput } from '@/ai/flows/inter-state-price-flow';
import { useI18n } from '@/hooks/use-i18n';

const formSchema = z.object({
  cropName: z.string().min(2, { message: 'Crop name is required.' }),
  quantity: z.coerce.number().gt(0, { message: 'Quantity must be positive.' }),
  unit: z.enum(['kg', 'quintal', 'tonnes']),
  origin: z.string().min(3, { message: 'Origin location is required.' }),
  destination: z.string().min(3, { message: 'Destination location is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AllIndiaMarketClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [result, setResult] = useState<InterStatePriceOutput | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        cropName: '',
        quantity: 10,
        unit: 'quintal' as const,
        origin: '',
        destination: ''
    }
  });

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
        toast({ variant: "destructive", title: t('geolocation_not_supported_title'), description: t('geolocation_not_supported_desc') });
        return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) throw new Error('Failed to fetch location data');
                const data = await response.json();
                const locationName = `${data.address?.city || data.address?.town || data.address?.village}, ${data.address?.state}`;
                form.setValue('origin', locationName, { shouldValidate: true });
                toast({ title: t('location_detected_title'), description: t('location_detected_desc', { location: locationName }) });
            } catch (error) {
                 console.error('Error fetching location:', error);
                 toast({ variant: "destructive", title: t('location_fetch_error_title'), description: t('location_fetch_error_desc') });
            } finally {
                setIsDetectingLocation(false);
            }
        },
        (error) => {
             console.error('Geolocation error:', error);
             toast({ variant: "destructive", title: t('geolocation_denied_title'), description: t('geolocation_denied_desc_settings') });
            setIsDetectingLocation(false);
        }
    );
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setResult(null);

    try {
      const analysisResult = await analyzeInterStatePrice(await getIdTokenOrThrow(), data);
      setResult(analysisResult);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('analysis_failed_title'),
        description: t('analysis_failed_desc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Globe className="mr-2 h-5 w-5" />{t('price_analyzer_title')}</CardTitle>
          <CardDescription>{t('price_analyzer_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('origin_location')}</FormLabel>
                        <div className="flex items-center gap-2">
                           <FormControl>
                             <Input placeholder={t('eg_bhalki_karnataka')} {...field} />
                           </FormControl>
                           <Button type="button" variant="outline" size="icon" onClick={handleDetectLocation} disabled={isDetectingLocation}>
                              {isDetectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                           </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('destination_market')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('eg_panchkula_haryana')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="cropName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('crop_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('eg_wheat_corn_soybeans')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                     <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('quantity')}</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('unit')}</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('unit')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">{t('kilograms')}</SelectItem>
                                <SelectItem value="quintal">{t('quintal')}</SelectItem>
                                <SelectItem value="tonnes">{t('tonnes')}</SelectItem>
                              </SelectContent>
                            </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {t('analyze_prices_button')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5" />{t('analysis_report')}</CardTitle>
          <CardDescription>{t('analysis_report_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('calculating_prices')}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="text-center text-muted-foreground px-4">
              {t('analysis_report_placeholder')}
            </div>
          )}
          {result && (
            <div className="w-full space-y-4">
              <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-primary">{t('potential_net_revenue')}: {result.potentialNetRevenue}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 text-sm">
                    <p className="text-muted-foreground">{t('potential_net_revenue_desc')}</p>
                  </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-sm">
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><IndianRupee className="h-4 w-4" />{t('market_price_at_destination')}:</span>
                            <span className="font-medium">{result.marketPriceAtDestination}</span>
                        </li>
                         <li className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Milestone className="h-4 w-4" />{t('estimated_distance')}:</span>
                            <span className="font-medium">{result.estimatedDistance}</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4" />{t('est_transport_cost')}:</span>
                            <span className="font-medium text-destructive">{result.estimatedTransportationCost}</span>
                        </li>
                        <li className="flex justify-between items-center font-semibold">
                            <span className="text-foreground flex items-center gap-2"><IndianRupee className="h-4 w-4" />{t('net_price_after_transport')}:</span>
                            <span className="font-bold text-primary">{result.netPricePerQuintalAfterTransport}</span>
                        </li>
                    </ul>
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{t('analysts_note')}</AlertTitle>
                <AlertDescription>
                  {result.analysis}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
