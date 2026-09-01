
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { useRole } from '@/context/role-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Pencil, Save, Camera, Mail, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';

export default function ProfileClient() {
  const { profile, setProfile, isLoading, otherProfile } = useProfile();
  const { role } = useRole();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const [formData, setFormData] = useState(profile);
  
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: t('image_too_large_title'),
          description: t('image_too_large_desc_2mb'),
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ avatar: reader.result as string });
        toast({
          title: t('profile_pic_updated_title'),
          description: t('profile_pic_updated_desc'),
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    setProfile(formData);
    toast({
        title: t('profile_saved_title'),
        description: t('profile_saved_desc'),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader className="items-center text-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-40 mt-2" />
            </CardHeader>
          </Card>
          <Card className="md:col-span-2">
             <CardHeader>
               <Skeleton className="h-8 w-40" />
               <Skeleton className="h-4 w-64" />
             </CardHeader>
             <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-20 w-full" />
                  </div>
             </CardContent>
          </Card>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <div className="relative">
               <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar} alt={formData.name} />
                  <AvatarFallback>{formData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
               </Avatar>
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
               <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute bottom-0 right-0 rounded-full bg-background hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
               >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">{t('change_profile_picture')}</span>
               </Button>
            </div>
            <CardTitle className="mt-4">{formData.name}</CardTitle>
            <CardDescription>{formData.email}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('edit_details')}</CardTitle>
            <CardDescription>{t('edit_details_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('full_name')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email_address')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., yourname@example.com" className="pl-9" />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="contact">{t('contact_number')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="contact" name="contact" type="tel" value={formData.contact} onChange={handleInputChange} placeholder="e.g., +91 98765 43210" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t('short_bio')}</Label>
              <div className="relative">
                <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className="pl-9" placeholder={t('short_bio_placeholder')} />
              </div>
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {t('save_changes')}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {otherProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {role === 'farmer' ? (
                  <Building className="mr-2 h-5 w-5" />
                ) : (
                  <User className="mr-2 h-5 w-5" />
                )}
                {role === 'farmer' ? t('business_contact') : t('farmer_contact')}
              </CardTitle>
              <CardDescription>
                {role === 'farmer' ? t('business_contact_desc') : t('farmer_contact_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={otherProfile.avatar} alt={otherProfile.name} />
                <AvatarFallback>{otherProfile.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-xl font-semibold">{otherProfile.name}</p>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{otherProfile.email || t('no_email_provided')}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{otherProfile.contact || t('no_contact_provided')}</span>
                </div>
                 <p className="text-muted-foreground pt-1 italic">
                  {otherProfile.bio}
                </p>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
