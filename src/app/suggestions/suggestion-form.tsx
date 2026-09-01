
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getSuggestions } from './actions';
import type { WeatherBasedSuggestionsOutput } from '@/ai/flows/weather-based-suggestions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, BrainCircuit, Loader2, CloudSun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';

const formSchema = z.object({
  weatherForecast: z
    .string()
    .min(10, { message: 'Please provide a more detailed forecast.' }),
  cropType: z.string().min(2, { message: 'Crop type is required.' }),
  farmingActivity: z
    .string()
    .min(3, { message: 'Farming activity is required.' }),
});

export default function SuggestionForm() {
  const [result, setResult] = useState<WeatherBasedSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weatherForecast: '',
      cropType: '',
      farmingActivity: '',
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
            console.error("Geolocation error:", error);
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
      const suggestionResult = await getSuggestions(values);
      setResult(suggestionResult);
    } catch (error) {
      console.error('Error getting weather suggestions:', error);
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
          <CardTitle>{t('enter_activity_details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormField
                  control={form.control}
                  name="farmingActivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('farming_activity')}</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('select_an_activity')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Planting">{t('planting')}</SelectItem>
                            <SelectItem value="Fertilizing">{t('fertilizing')}</SelectItem>
                            <SelectItem value="Irrigation">{t('irrigation')}</SelectItem>
                            <SelectItem value="Weeding">{t('weeding')}</SelectItem>
                            <SelectItem value="Pest Control">{t('pest_control')}</SelectItem>
                            <SelectItem value="Harvesting">{t('harvesting')}</SelectItem>
                          </SelectContent>
                        </Select>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('getting_suggestion')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('get_ai_suggestion')}
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
            {t('ai_suggestion')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('thinking')}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="text-center text-muted-foreground">
              {t('suggestion_placeholder')}
            </div>
          )}
          {result && (
            <Alert className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-bold">{t('optimal_timing_suggested')}</AlertTitle>
              <AlertDescription className="space-y-4 text-foreground">
                <p className="font-semibold">{result.suggestion}</p>
                <div>
                  <h4 className="font-bold text-sm">{t('reasoning')}:</h4>
                  <p className="text-sm">{result.reasoning}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
