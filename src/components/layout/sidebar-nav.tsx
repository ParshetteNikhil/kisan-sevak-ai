
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
  useSidebar,
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
  Dna,
  LogIn,
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
import { useAuth } from '@/context/auth-provider';
import { Skeleton } from '../ui/skeleton';

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const { t, locale, setLocale } = useI18n();
  const { role, setRole } = useRole();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { user, signInWithGoogle, signOut, loading: isAuthLoading } = useAuth();

  const farmerMenuItems = [
    { href: '/', key: 'home', label: 'Home', icon: LayoutDashboard },
    { href: '/crop-health', key: 'tile_crop_doctor', label: 'Crop Doctor', icon: HeartPulse },
    { href: '/ai-assistant', key: 'tile_ask', label: 'Ask Expert', icon: Bot },
    { href: '/mandi', key: 'tile_mandi', label: 'Mandi Price', icon: Calculator },
    { href: '/market', key: 'tile_sell', label: 'Sell Produce', icon: Store },
    { href: '/soil-analysis', key: 'tile_soil', label: 'Soil Check', icon: Beaker },
    { href: '/my-farm', key: 'tile_farm', label: 'My Farm', icon: Package },
    { href: '/schedule', key: 'my_work', label: 'This week', icon: CalendarDays },
    { href: '/records', key: 'records', label: 'Farm Records', icon: BookText },
    { href: '/irrigation', key: 'irrigation_advisor', label: 'Irrigation Advisor', icon: Droplets },
    { href: '/suggestions', key: 'ai_suggestions', label: 'AI Suggestions', icon: BrainCircuit },
    { href: '/profitability', key: 'profitability_forecaster', label: 'Profitability', icon: Calculator },
    { href: '/all-india-market', key: 'all_india_market', label: 'All India Market', icon: Globe },
    { href: '/crop-science', key: 'crop_science', label: 'Crop Bioscience', icon: Dna },
  ];
  
  const buyerMenuItems = [
    { href: '/', key: 'home', label: 'Home', icon: LayoutDashboard },
    { href: '/market', key: 'marketplace', label: 'Marketplace', icon: Store },
    { href: '/mandi', key: 'tile_mandi', label: 'Mandi Price', icon: Calculator },
    { href: '/ai-assistant', key: 'tile_ask', label: 'Ask Expert', icon: Bot },
    { href: '/crop-science', key: 'crop_science', label: 'Crop Bioscience', icon: Dna },
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
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={item.href}>
              {role === 'farmer' && index === 9 && (
                <p className="mb-1 mt-3 px-2 text-xs font-semibold uppercase text-muted-foreground">{t('more_tools')}</p>
              )}
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="w-full"
              >
                <Link href={item.href} onClick={closeOnMobile}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-headline">{t(item.key) && t(item.key) !== item.key ? t(item.key) : item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="p-4 flex flex-col gap-3">
        {user ? (
          <div className="flex flex-col gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-emerald-400">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-xs truncate flex items-center gap-1">
                  {user.displayName || 'Verified Farmer'}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 text-muted-foreground hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-2">
            <div className="text-xs font-medium text-foreground">Cloud Sync & Persistence</div>
            <p className="text-[11px] text-muted-foreground">Sign in with Google to securely persist your records, tasks, and chat history in Firestore.</p>
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] text-white"
              onClick={() => signInWithGoogle()}
              disabled={isAuthLoading}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}

        <div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setRole(null)}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> {t('switch_role')}
          </Button>
        </div>
        <div>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger className="w-full text-xs h-8">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
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
        <div className="flex justify-center gap-3 text-[11px] text-muted-foreground">
          <Link href="/privacy" className="hover:underline" onClick={closeOnMobile}>Privacy</Link>
          <span aria-hidden>·</span>
          <Link href="/account/delete" className="hover:underline" onClick={closeOnMobile}>Delete account</Link>
        </div>
      </SidebarFooter>
    </>
  );
}

    
