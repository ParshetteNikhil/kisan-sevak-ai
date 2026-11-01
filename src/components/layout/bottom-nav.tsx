'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, IndianRupee, LayoutDashboard, Menu, Store, HeartPulse } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useRole } from '@/context/role-provider';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

const label = (t: (k: string) => string, key: string, fallback: string) => {
  const v = t(key);
  return v && v !== key ? v : fallback;
};

/** Phone bottom navigation for the most-used sections; "More" opens the full menu. */
export function BottomNav() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { role } = useRole();
  const { t } = useI18n();
  const pathname = usePathname();

  if (!isMobile) return null;

  const items =
    role === 'buyer'
      ? [
          { href: '/', label: label(t, 'home', 'Home'), icon: LayoutDashboard },
          { href: '/market', label: label(t, 'marketplace', 'Market'), icon: Store },
          { href: '/mandi', label: label(t, 'tile_mandi', 'Price'), icon: IndianRupee },
          { href: '/ai-assistant', label: label(t, 'tile_ask', 'Ask'), icon: Bot },
        ]
      : [
          { href: '/', label: label(t, 'home', 'Home'), icon: LayoutDashboard },
          { href: '/crop-health', label: label(t, 'tile_crop_doctor', 'Crop Doctor'), icon: HeartPulse },
          { href: '/ai-assistant', label: label(t, 'tile_ask', 'Ask'), icon: Bot },
          { href: '/mandi', label: label(t, 'tile_mandi', 'Price'), icon: IndianRupee },
          { href: '/market', label: label(t, 'tile_sell', 'Sell'), icon: Store },
        ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <ul className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[10px] font-medium leading-tight',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-6 w-6', active && 'stroke-[2.5]')} />
                <span className="line-clamp-2 max-w-full break-words">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium leading-tight text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
            <span>{label(t, 'more_tools', 'More')}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
