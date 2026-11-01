'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-provider';
import { useI18n } from '@/hooks/use-i18n';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

/** "Was this helpful?" with big thumbs. Saved to Firestore `feedback` for the field test. */
export function Feedback({ feature }: { feature: string }) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [sent, setSent] = useState<null | boolean>(null);

  const send = async (helpful: boolean) => {
    setSent(helpful);
    track('feedback', { feature, helpful });
    if (!user) return;
    try {
      await addDoc(collection(db, 'feedback'), {
        uid: user.uid,
        feature,
        helpful,
        locale,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('feedback not saved', e);
    }
  };

  if (sent !== null) {
    return <p className="text-center text-base font-medium text-primary">{t('thanks_feedback')}</p>;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-base">{t('was_helpful')}</span>
      <Button type="button" variant="outline" size="lg" className="h-14 w-14 p-0" onClick={() => send(true)} aria-label="Yes">
        <ThumbsUp className="h-7 w-7 text-green-700" />
      </Button>
      <Button type="button" variant="outline" size="lg" className="h-14 w-14 p-0" onClick={() => send(false)} aria-label="No">
        <ThumbsDown className="h-7 w-7 text-red-700" />
      </Button>
    </div>
  );
}
