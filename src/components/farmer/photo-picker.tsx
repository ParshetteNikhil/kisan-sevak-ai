'use client';

import { useRef } from 'react';
import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { photoToDataUri } from '@/lib/image';
import { useToast } from '@/hooks/use-toast';

/** One big "Take photo" button (opens the back camera) plus a small gallery option. */
export function PhotoPicker({ onPhoto, preview, label }: { onPhoto: (dataUri: string) => void; preview?: string | null; label?: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handle = async (file?: File) => {
    if (!file) return;
    try {
      onPhoto(await photoToDataUri(file));
    } catch {
      toast({ variant: 'destructive', title: t('image_too_large_title') || 'Photo problem' });
    }
  };

  return (
    <div className="space-y-3">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mx-auto max-h-72 w-full rounded-2xl object-cover" />
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <Button type="button" size="lg" className="h-16 w-full gap-3 text-lg" onClick={() => cameraRef.current?.click()}>
        <Camera className="h-7 w-7" /> {preview ? t('retake_photo') : label || t('take_photo')}
      </Button>
      <button type="button" className="mx-auto flex items-center gap-2 text-base text-muted-foreground underline" onClick={() => galleryRef.current?.click()}>
        <ImageIcon className="h-5 w-5" /> {t('from_gallery')}
      </button>
    </div>
  );
}
