import type { CSSProperties } from 'react';

export function Icon({
  name,
  size = 20,
  fill = false,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`icon ${className}`}
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : undefined, ...style }}
    >
      {name}
    </span>
  );
}
