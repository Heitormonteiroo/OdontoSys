import type { ReactNode } from 'react';

export type Tone = 'info' | 'brand' | 'warn' | 'ok' | 'neutral' | 'danger' | 'dangerSolid';

const tones: Record<Tone, { box: string; dot: string }> = {
  info: { box: 'bg-info-bg text-info', dot: 'bg-info' },
  brand: { box: 'bg-brand-soft text-brand-dark', dot: 'bg-brand-dark' },
  warn: { box: 'bg-warn-bg text-warn', dot: 'bg-warn' },
  ok: { box: 'bg-ok-bg text-ok', dot: 'bg-ok' },
  neutral: { box: 'bg-surface-chip text-ink-600', dot: 'bg-ink-600' },
  danger: { box: 'bg-danger-bg text-danger border border-danger-border', dot: 'bg-danger' },
  dangerSolid: { box: 'bg-danger text-white', dot: 'bg-white' },
};

/** Chip de status (pílula de 28 px, com ponto opcional). */
export function Chip({
  tone = 'neutral',
  dot = false,
  size = 'md',
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${
        size === 'sm' ? 'h-[26px] px-2.5 text-xs' : 'h-7 px-[11px] text-[13px]'
      } ${tones[tone].box}`}>
      {dot && <span className={`h-[7px] w-[7px] rounded-full ${tones[tone].dot}`} />}
      {children}
    </span>
  );
}
