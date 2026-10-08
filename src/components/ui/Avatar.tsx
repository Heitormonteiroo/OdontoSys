export function Avatar({ initials, size = 36, tone = 'brand' }: { initials: string; size?: number; tone?: 'brand' | 'neutral' }) {
  const c = tone === 'brand' ? 'bg-brand-soft text-brand-dark' : 'bg-surface-muted text-ink-700';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${c}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }}
    >
      {initials}
    </div>
  );
}
