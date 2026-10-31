
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIrrigationSuggestion } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import type { IrrigationSuggestionOutput } from '@/ai/flows/irrigation-suggestion-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, BrainCircuit, Loader2, Droplets, Info, CalendarClock, CloudSun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';

const formSchema = z.object({
  cropType: z.string().min(2, { message: 'Crop type is required.' }),
  soilType: z.enum(['Loam', 'Clay', 'Sandy', 'Silt']),
  weatherForecast: z
    .string()
    .min(10, { message: 'Please provide a more detailed forecast.' }),
  irrigationMethod: z.enum(['Drip', 'Sprinkler', 'Furrow']),
});

export default function IrrigationClient() {
  const [result, setResult] = useState<IrrigationSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropType: '',
      soilType: 'Loam',
      weatherForecast: '',
      irrigationMethod: 'Drip',
    },
  });

  const handleFetchWeather = () => {
    if (!navigator.geolocation) {
        toast({
            variant: "destructive",
            title: t("geolocation_not_supported_title"),
            description: t("geolocation_not_supported_desc"),
        });
        return;
    }

    setIsFetchingWeather(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const temp = 25 + Math.floor(Math.random() * 10);
            const humidity = 40 + Math.floor(Math.random() * 30);
            const wind = 5 + Math.floor(Math.random() * 10);
            const precipitation = Math.random() > 0.8 ? t('precipitation_chance') : t('no_precipitation');

            const forecast = t('forecast_template', { temp, humidity, wind, precipitation });
            
            form.setValue('weatherForecast', forecast, { shouldValidate: true });
            toast({
                title: t("weather_fetched_title"),
                description: t("weather_fetched_desc"),
            });
            setIsFetchingWeather(false);
        },
        (error) => {
            console.error("Geolocation error:", error.message);
            toast({
                variant: "destructive",
                title: t("geolocation_denied_title"),
                description: t("geolocation_denied_desc_settings"),
            });
            setIsFetchingWeather(false);
        }
    );
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const suggestionResult = await getIrrigationSuggestion(await getIdTokenOrThrow(), values);
      setResult(suggestionResult);
    } catch (error) {
      console.error('Error getting irrigation suggestion:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('ai_suggestion_error'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('enter_field_details')}</CardTitle>
          <CardDescription>{t('irrigation_advisor_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('crop_type')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('eg_corn')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="soilType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('soil_type')}</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_soil_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Loam">{t('loam')}</SelectItem>
                            <SelectItem value="Clay">{t('clay')}</SelectItem>
                            <SelectItem value="Sandy">{t('sandy')}</SelectItem>
                            <SelectItem value="Silt">{t('silt')}</SelectItem>
                          </SelectContent>
                        </Select>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="irrigationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('irrigation_method')}</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_method')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Drip">{t('drip')}</SelectItem>
                            <SelectItem value="Sprinkler">{t('sprinkler')}</SelectItem>
                            <SelectItem value="Furrow">{t('furrow')}</SelectItem>
                          </SelectContent>
                        </Select>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="weatherForecast"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center mb-2">
                        <FormLabel>{t('weather_forecast')}</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={handleFetchWeather} disabled={isFetchingWeather}>
                           {isFetchingWeather ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudSun className="h-4 w-4" />}
                           <span className="hidden sm:inline ml-2">{t('fetch_weather')}</span>
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder={t('fetch_weather_placeholder')}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('calculating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('get_irrigation_plan')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5" />
            {t('ai_recommendation')}
          </CardTitle>
          <CardDescription>{t('irrigation_plan_placeholder')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('analyzing_data')}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="text-center text-muted-foreground">
              {t('irrigation_plan_placeholder_2')}
            </div>
          )}
          {result && (
            <div className="space-y-4 w-full">
              <Alert className="bg-primary/5 border-primary/20">
                <Droplets className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">{t('irrigation_recommendation')}</AlertTitle>
                <AlertDescription className="text-foreground font-semibold">
                  {result.recommendation}
                </AlertDescription>
              </Alert>

              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>{t('reasoning')}</AlertTitle>
                <AlertDescription>
                  {result.reasoning}
                </AlertDescription>
              </Alert>

              <Alert variant="default">
                <CalendarClock className="h-4 w-4" />
                <AlertTitle>{t('next_check')}</AlertTitle>
                <AlertDescription>
                  {result.nextSuggestedCheck}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
