'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-provider';
import { useI18n } from '@/hooks/use-i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PAGE_TITLES: [string, string][] = [
  ['/crop-health', 'tile_crop_doctor'],
  ['/ai-assistant', 'tile_ask'],
  ['/mandi', 'tile_mandi'],
  ['/market', 'tile_sell'],
  ['/soil-analysis', 'tile_soil'],
  ['/my-farm', 'tile_farm'],
];

/** Mobile app bar: menu, logo with the page name, and account shortcut. Hidden on desktop. */
export function Header() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname() || '/';

  if (!isMobile) return null;

  const key = PAGE_TITLES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1];
  const title = key ? t(key) : 'Kisaan Sevak';

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-1 bg-primary px-1.5 pb-1.5 text-primary-foreground shadow-md"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.375rem)' }}
    >
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl hover:bg-white/15 active:bg-white/25"
        aria-label="Open menu"
      >
        <Menu className="h-7 w-7" strokeWidth={2.6} />
        <span className="text-[0.7rem] font-semibold leading-none">Menu</span>
      </button>

      <Link href="/" className="flex min-w-0 flex-1 items-center justify-center gap-2" aria-label="Kisaan Sevak home">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <Leaf className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <span className="truncate font-headline text-[clamp(1.1rem,5.2vw,1.5rem)] font-bold leading-tight">{title}</span>
      </Link>

      <Link href="/profile" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full hover:bg-white/15" aria-label="Profile">
        <Avatar className="h-10 w-10 border-2 border-white/80">
          <AvatarImage src={user?.photoURL || undefined} alt="" />
          <AvatarFallback className="bg-white/20 text-sm text-primary-foreground">
            {(user?.displayName || 'K').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
