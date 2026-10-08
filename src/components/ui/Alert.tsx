import type { ReactNode } from 'react';
import { Icon } from './Icon';

type AlertTone = 'danger' | 'warn' | 'ok' | 'info';

const map: Record<AlertTone, { box: string; icon: string; name: string }> = {
  danger: { box: 'bg-danger-bg border-danger-border text-danger-text', icon: 'text-danger', name: 'error' },
  warn: { box: 'bg-warn-bg border-warn-border text-warn-text', icon: 'text-warn', name: 'warning' },
  ok: { box: 'bg-ok-bg border-ok-border text-ok-text', icon: 'text-ok', name: 'check_circle' },
  info: { box: 'bg-info-bg border-info-border text-info-text', icon: 'text-info', name: 'info' },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = map[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={`flex gap-3 rounded-lg border px-4 py-3.5 text-sm leading-[1.45] ${t.box} ${className}`}
    >
      <Icon name={t.name} size={22} fill={tone === 'danger'} className={t.icon} />
      <div>
        {title && <strong>{title} </strong>}
        {children}
      </div>
    </div>
  );
}
