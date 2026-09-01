
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  CalendarDays,
  BookText,
  BrainCircuit,
  Settings,
  Beaker,
  Store,
  Globe,
  LogOut,
  HeartPulse,
  Calculator,
  Droplets,
  Package,
  Bot,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useI18n } from '@/hooks/use-i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Logo } from '../ui/logo';
import { useRole } from '@/context/role-provider';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton } from '../ui/skeleton';

export function SidebarNav() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { role, setRole } = useRole();
  const { profile, isLoading: isProfileLoading } = useProfile();

  const farmerMenuItems = [
    { href: '/', key: 'dashboard', icon: LayoutDashboard },
    { href: '/schedule', key: 'schedule', icon: CalendarDays },
    { href: '/records', key: 'records', icon: BookText },
    { href: '/inventory', key: 'inventory', icon: Package },
    { href: '/ai-assistant', key: 'ai_assistant', icon: Bot },
    { href: '/soil-analysis', key: 'soil_analysis', icon: Beaker },
    { href: '/crop-health', key: 'crop_health', icon: HeartPulse },
    { href: '/suggestions', key: 'ai_suggestions', icon: BrainCircuit },
    { href: '/irrigation', key: 'irrigation_advisor', icon: Droplets },
    { href: '/profitability', key: 'profitability_forecaster', icon: Calculator },
    { href: '/market', key: 'marketplace', icon: Store },
    { href: '/all-india-market', key: 'all_india_market', icon: Globe },
  ];
  
  const buyerMenuItems = [
    { href: '/', key: 'dashboard', icon: LayoutDashboard },
    { href: '/market', key: 'marketplace', icon: Store },
    { href: '/ai-assistant', key: 'ai_assistant', icon: Bot },
  ];

  const menuItems = role === 'farmer' ? farmerMenuItems : buyerMenuItems;

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/">
          <Logo />
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="w-full"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-headline">{t(item.key)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="p-4 flex flex-col gap-4">
        {isProfileLoading ? (
          <div className="flex items-center gap-3">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>{profile.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm truncate">{profile.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {profile.email}
              </span>
            </div>
            <div className="ml-auto flex items-center">
              <Link href="/profile" passHref>
                <Button variant="ghost" size="icon" asChild>
                  <div>
                    <Settings className="h-5 w-5" />
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}
         <div>
          <Button variant="outline" className="w-full" onClick={() => setRole(null)}>
            <LogOut className="mr-2 h-4 w-4" /> {t('switch_role')}
          </Button>
        </div>
        <div>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <SelectValue placeholder={t('language')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('english')}</SelectItem>
              <SelectItem value="hi">{t('hindi')}</SelectItem>
              <SelectItem value="bn">{t('bengali')}</SelectItem>
              <SelectItem value="ta">{t('tamil')}</SelectItem>
              <SelectItem value="te">{t('telugu')}</SelectItem>
              <SelectItem value="mr">{t('marathi')}</SelectItem>
              <SelectItem value="pa">{t('punjabi')}</SelectItem>
              <SelectItem value="gu">{t('gujarati')}</SelectItem>
              <SelectItem value="kn">{t('kannada')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SidebarFooter>
    </>
  );
}

    
