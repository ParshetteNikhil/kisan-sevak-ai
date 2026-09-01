
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

export function Header({ children }: { children?: React.ReactNode }) {
  const { isMobile } = useSidebar();
  
  if (!isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
      <SidebarTrigger />
      {children}
    </header>
  );
}
