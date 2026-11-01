'use client';

import { cn } from '@/lib/utils';

/** Big tappable chips for picking one option without typing. */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string; icon?: string }[];
  value?: T;
  onChange: (v: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn('grid gap-2', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 px-2 py-2 text-center text-base font-medium leading-tight active:scale-[0.98]',
            value === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
          )}
        >
          {o.icon && <span className="text-2xl">{o.icon}</span>}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
