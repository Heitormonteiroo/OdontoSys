import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';

export function EmptyState({
  icon,
  title,
  children,
  actions,
  tone = 'neutral',
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: 'neutral' | 'brand';
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          tone === 'brand' ? 'bg-brand-soft text-brand' : 'bg-surface-muted text-ink-600'
        }`}
      >
        <Icon name={icon} size={32} />
      </div>
      <div className="text-lg font-semibold">{title}</div>
      {children && <div className="max-w-[460px] text-[15px] leading-normal text-ink-600">{children}</div>}
      {actions && <div className="mt-1.5 flex gap-2.5">{actions}</div>}
    </div>
  );
}
