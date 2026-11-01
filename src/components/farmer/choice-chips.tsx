'use client';

import { cn } from '@/lib/utils';

/**
 * Big tappable chips for picking one option without typing.
 * Columns adapt to the screen width; with a picture, the picture sits above the name
 * so long names (in any language) stay inside the chip.
 */
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
    <div
      className={cn(
        'grid gap-2',
        columns === 3
          ? 'grid-cols-[repeat(auto-fill,minmax(min(5.75rem,100%),1fr))]'
          : 'grid-cols-[repeat(auto-fill,minmax(min(8.5rem,100%),1fr))]'
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'flex min-w-0 items-center justify-center rounded-xl border-2 px-1.5 py-2 text-center font-medium leading-tight active:scale-[0.98]',
            o.icon ? 'min-h-[4.75rem] flex-col gap-1 text-[0.95rem]' : 'min-h-[3.5rem] gap-2 text-base',
            value === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
          )}
        >
          {o.icon && <span className="text-[1.75rem] leading-none">{o.icon}</span>}
          <span className="min-w-0 max-w-full hyphens-auto">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
