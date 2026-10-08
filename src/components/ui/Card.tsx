import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-line bg-white shadow-card ${className}`} {...rest} />;
}

/** Seção maior (raio 14 px), usada em blocos de página. */
export function Section({ className = '', ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-2xl border border-line bg-white ${className}`} {...rest} />;
}
