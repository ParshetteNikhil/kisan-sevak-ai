'use client';

import Link from 'next/link';
import { Leaf, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** Mobile app bar: clear menu button, app name, and account shortcut. Hidden on desktop. */
export function Header() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();

  if (!isMobile) return null;

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 bg-primary px-2 text-primary-foreground shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(3.5rem + env(safe-area-inset-top))' }}
    >
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-white/15 active:bg-white/25"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" strokeWidth={2.5} />
        <span>Menu</span>
      </button>

      <Link href="/" className="flex flex-1 items-center justify-center gap-2 font-headline text-lg font-bold">
        <Leaf className="h-5 w-5" />
        Kisaan Sevak
      </Link>

      <Link href="/profile" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15" aria-label="Profile">
        <Avatar className="h-8 w-8 border-2 border-white/70">
          <AvatarImage src={user?.photoURL || undefined} alt="" />
          <AvatarFallback className="bg-white/20 text-xs text-primary-foreground">
            {(user?.displayName || 'K').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
