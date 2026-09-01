"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, Wheat, Beaker, MapPin, FlaskConical, AlertTriangle, Upload, Camera } from 'lucide-react';
import { getSoilAnalysis } from './actions';
import type { SoilAnalysisOutput } from '@/ai/flows/soil-analysis-flow';
import { useI18n } from '@/hooks/use-i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function SoilAnalysisClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [location, setLocation] = useState('');
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (isCameraActive) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setIsCameraActive(false);
          toast({
            variant: 'destructive',
            title: t('camera_access_denied_title'),
            description: t('camera_access_denied_desc'),
          });
        }
      };
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraActive, t, toast]);


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
        setAnalysisResult(null);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectLocation = () => {
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
                setLocation(locationName);
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
  
  const handleOpenCamera = () => {
    setImagePreview(null);
    setImageData(null);
    setIsCameraActive(true);
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const dataUri = canvas.toDataURL('image/jpeg');
        setImageData(dataUri);
        setImagePreview(dataUri);
        setIsCameraActive(false);
    }
  }


  const handleAnalysis = async () => {
    if (!imageData || !location) {
        toast({
            variant: 'destructive',
            title: t('missing_info_title'),
            description: t('location_and_photo_required_for_analysis'),
        });
        return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await getSoilAnalysis({ soilPhotoDataUri: imageData, location: location });
      setAnalysisResult(result);
    } catch (error) {
      console.error('Soil analysis error:', error);
      toast({
        variant: 'destructive',
        title: t('analysis_failed_title'),
        description: t('soil_analysis_failed_desc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Beaker className="mr-2 h-5 w-5" />{t('soil_lab')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label>{t('soil_photo')}</Label>
             <div className="relative aspect-video bg-muted rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground overflow-hidden">
                <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraActive && "hidden")} autoPlay muted playsInline />
                {!isCameraActive && imagePreview && (
                    <Image src={imagePreview} alt={t('soil_photo_alt')} layout="fill" objectFit="contain" />
                )}
                {!isCameraActive && !imagePreview && (
                    <span className="text-center p-4">{t('image_preview_placeholder')}</span>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/png, image/jpeg"
            />
            <div className="grid grid-cols-2 gap-2">
                {isCameraActive ? (
                    <>
                        <Button variant="destructive" className="w-full" onClick={handleCapture}>
                            <Camera className="mr-2 h-4 w-4" /> {t('capture')}
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={() => setIsCameraActive(false)}>
                            {t('cancel')}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" className="w-full" onClick={handleOpenCamera}>
                            <Camera className="mr-2 h-4 w-4" /> {t('use_camera')}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> {t('upload_image')}
                        </Button>
                    </>
                )}
            </div>
           </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t('location_of_sample')}</Label>
            <div className="flex items-center gap-2">
                <Input 
                    id="location" 
                    placeholder={t('detect_or_enter_location')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={handleDetectLocation} 
                    disabled={isDetectingLocation || isLoading}
                >
                    {isDetectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </Button>
            </div>
          </div>
          
          <Button onClick={handleAnalysis} disabled={isLoading || !imageData || !location} className="w-full">
            {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <FlaskConical className="mr-2" />}
            {t('analyze_soil')}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{t('analysis_result')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
           {isLoading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t('analyzing_soil')}</p>
            </div>
          )}
          {!isLoading && !analysisResult && (
            <div className="text-center text-muted-foreground px-4">
              {t('soil_analysis_placeholder_location')}
            </div>
          )}
          {analysisResult && (
             <div className="w-full space-y-4">
              {analysisResult.soilType === 'Invalid Image' ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('analysis_failed_title')}</AlertTitle>
                  <AlertDescription>
                    {analysisResult.description}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>{t('soil_type')}: {analysisResult.soilType}</AlertTitle>
                    <AlertDescription>
                      {analysisResult.description}
                    </AlertDescription>
                  </Alert>

                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-lg flex items-center">
                          <FlaskConical className="mr-2 h-5 w-5" />
                          {t('soil_amendments')}
                       </CardTitle>
                     </CardHeader>
                      <CardContent>
                       <p className="text-sm text-muted-foreground">{analysisResult.soilAmendments}</p>
                      </CardContent>
                   </Card>

                   <Card>
                     <CardHeader className="pb-2">
                       <CardTitle className="text-lg flex items-center">
                          <Wheat className="mr-2 h-5 w-5" />
                          {t('suggested_crops')}
                       </CardTitle>
                     </CardHeader>
                      <CardContent>
                       <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                         {analysisResult.suggestedCrops.map((crop, index) => (
                           <li key={index}>{crop}</li>
                         ))}
                       </ul>
                      </CardContent>
                   </Card>
                </>
              )}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
