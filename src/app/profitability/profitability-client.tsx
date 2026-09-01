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
import { Calculator, Sprout, Loader2, BarChart3, Info } from 'lucide-react';
import { getProfitabilityForecast } from './actions';
import type { ProfitabilityForecastOutput } from '@/ai/flows/profitability-forecast-flow';
import { useI18n } from '@/hooks/use-i18n';

const formSchema = z.object({
  cropName: z.string().min(2, { message: 'Crop name is required.' }),
  fieldSize: z.coerce.number().gt(0, { message: 'Field size must be positive.' }),
  fieldUnit: z.enum(['acre', 'hectare']),
  totalCosts: z.coerce.number().gte(0, { message: 'Costs cannot be negative.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfitabilityClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProfitabilityForecastOutput | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        cropName: '',
        fieldSize: 1,
        fieldUnit: 'acre' as const,
        totalCosts: 0
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setResult(null);

    try {
      const forecastResult = await getProfitabilityForecast(data);
      setResult(forecastResult);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('forecast_failed_title'),
        description: t('forecast_failed_desc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Sprout className="mr-2 h-5 w-5" />{t('enter_crop_details')}</CardTitle>
          <CardDescription>{t('enter_crop_details_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      name="fieldSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('field_size')}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="fieldUnit"
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
                                <SelectItem value="acre">{t('acre')}</SelectItem>
                                <SelectItem value="hectare">{t('hectare')}</SelectItem>
                              </SelectContent>
                            </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              
                <FormField
                  control={form.control}
                  name="totalCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('total_estimated_costs_inr')}</FormLabel>
                       <FormControl>
                        <Input type="number" placeholder={t('eg_50000')} {...field} />
                       </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                {t('forecast_profitability_button')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5" />{t('forecast_report')}</CardTitle>
          <CardDescription>{t('forecast_report_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('calculating_forecast')}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="text-center text-muted-foreground px-4">
              {t('forecast_report_placeholder')}
            </div>
          )}
          {result && (
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('est_revenue')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">{result.estimatedRevenue}</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('est_net_profit')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{result.netProfit}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="pt-6 text-sm">
                    <ul className="space-y-2">
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">{t('estimated_yield')}:</span>
                            <span className="font-medium">{result.estimatedYield}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">{t('market_price_used')}:</span>
                            <span className="font-medium">{result.marketPrice}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">{t('break_even_price')}:</span>
                            <span className="font-medium">{result.breakEvenPrice}</span>
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
