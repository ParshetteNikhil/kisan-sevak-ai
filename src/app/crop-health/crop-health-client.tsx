"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Sparkles, Loader2, Leaf, HeartPulse, ShieldCheck, Stethoscope, Microscope, TestTube2, AlertTriangle } from 'lucide-react';
import { diagnoseCrop } from './actions';
import { getIdTokenOrThrow } from '@/lib/firebase';
import type { DiagnoseCropOutput } from '@/ai/flows/diagnose-crop-flow';
import { useI18n } from '@/hooks/use-i18n';

export default function CropHealthClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseCropOutput | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: t('image_too_large_title'),
          description: t('image_too_large_desc_4mb'),
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(URL.createObjectURL(file));
        setImageData(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageData || !description) {
      toast({
        variant: 'destructive',
        title: t('missing_info_title'),
        description: t('missing_info_desc_image_and_desc'),
      });
      return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      const diagnosisResult = await diagnoseCrop(await getIdTokenOrThrow(), {
        photoDataUri: imageData,
        problemDescription: description,
      });
      setResult(diagnosisResult);
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
  
  const probabilityColors: { [key in 'High' | 'Medium' | 'Low' ]: 'destructive' | 'default' | 'secondary'} = {
      High: 'destructive',
      Medium: 'default',
      Low: 'secondary',
    };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Stethoscope className="mr-2 h-5 w-5" />{t('submit_case')}</CardTitle>
          <CardDescription>{t('submit_case_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label>{t('crop_photo')}</Label>
            <div className="relative aspect-video bg-muted rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground">
              {imagePreview ? (
                <Image src={imagePreview} alt="Crop preview" layout="fill" objectFit="contain" />
              ) : (
                <span>{t('image_preview_placeholder')}</span>
              )}
            </div>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/png, image/jpeg"
              />
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {t('upload_image')}
              </Button>
           </div>
           <div className="space-y-2">
              <Label htmlFor="description">{t('problem_description')}</Label>
              <Textarea 
                id="description" 
                rows={5}
                placeholder={t('problem_description_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
           </div>
           <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> {t('get_diagnosis')}
              </>
            )}
           </Button>
        </CardContent>
      </Card>
      
       <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center"><Microscope className="mr-2 h-5 w-5" />{t('diagnosis_report')}</CardTitle>
          <CardDescription>{t('diagnosis_report_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
           {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('performing_analysis')}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="text-center text-muted-foreground px-4">
              {t('diagnosis_report_placeholder')}
            </div>
          )}
          {result && (
             <div className="w-full space-y-4">
                <Alert variant={result.isHealthy ? 'default' : 'destructive'}>
                  {result.isHealthy ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>{result.plantName}: {result.isHealthy ? t('appears_healthy') : t('health_issues_detected')}</AlertTitle>
                  <AlertDescription>
                    {result.isHealthy ? t('no_major_issues_detected') : t('suffering_from_issues', {plantName: result.plantName})}
                  </AlertDescription>
                </Alert>
                
                {result.possibleDiseases?.map((disease, index) => (
                    <Card key={index}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                           <CardTitle className="text-lg">{disease.name}</CardTitle>
                           <Badge variant={probabilityColors[disease.probability]}>
                            {t(disease.probability.toLowerCase() as 'high'|'medium'|'low')} {t('probability')}
                           </Badge>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="text-muted-foreground">{disease.description}</p>
                            <div>
                                <h4 className="font-semibold text-foreground flex items-center"><TestTube2 className="mr-2 h-4 w-4" />{t('recommended_treatment')}</h4>
                                <p className="text-muted-foreground">{disease.recommendedTreatment}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center"><HeartPulse className="mr-2 h-5 w-5" />{t('general_advice')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{result.generalAdvice}</p>
                    </CardContent>
                </Card>

             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
