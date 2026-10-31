'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useRole } from '@/context/role-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Pencil, Save, Mail, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { SignInRequired } from '@/components/auth/sign-in-required';

type FormState = { displayName: string; contact: string; bio: string };

function ProfileForm() {
  const { user, profile, updateUserProfile } = useAuth();
  const { role } = useRole();
  const { t } = useI18n();
  const [formData, setFormData] = useState<FormState>({ displayName: '', contact: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      displayName: profile?.displayName || user?.displayName || '',
      contact: profile?.contact || '',
      bio: profile?.bio || '',
    });
  }, [profile, user]);

  if (!profile || !user) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: formData.displayName.trim().slice(0, 100) || 'Farmer',
        contact: formData.contact.trim().slice(0, 30),
        bio: formData.bio.trim().slice(0, 500),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const avatar = profile.photoURL || user.photoURL || undefined;

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatar} alt={formData.displayName} />
            <AvatarFallback>{formData.displayName.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4">{formData.displayName}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
          <span className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
            {role === 'buyer' ? 'Buyer / Business' : 'Farmer'}
          </span>
        </CardHeader>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t('edit_details')}</CardTitle>
          <CardDescription>{t('edit_details_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('full_name')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="displayName" name="displayName" value={formData.displayName} onChange={handleInputChange} maxLength={100} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email_address')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" value={profile.email} disabled className="pl-9" />
            </div>
            <p className="text-xs text-muted-foreground">Comes from your Google account.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">{t('contact_number')}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="contact" name="contact" type="tel" value={formData.contact} onChange={handleInputChange} maxLength={30} placeholder="e.g., +91 98765 43210" className="pl-9" />
            </div>
            {role === 'farmer' && (
              <p className="text-xs text-muted-foreground">
                Shown to buyers on your marketplace listings so they can call you. Applies to listings you add after saving.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{t('short_bio')}</Label>
            <div className="relative">
              <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} maxLength={500} className="pl-9" placeholder={t('short_bio_placeholder')} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('save_changes')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileClient() {
  return (
    <SignInRequired feature="Your profile">
      <ProfileForm />
    </SignInRequired>
  );
}
