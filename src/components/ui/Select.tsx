import type { SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  /** 'field' = campo de formulário (44 px); 'filter' = botão de filtro compacto (36 px). */
  variant?: 'field' | 'filter';
  /** Rótulo exibido antes do valor no modo filtro (ex.: "Dentista:"). */
  prefix?: string;
};

export function Select({ variant = 'field', prefix, className = '', children, ...rest }: Props) {
  if (variant === 'filter') {
    return (
      <label className="relative inline-flex h-9 items-center rounded-md border border-line-strong bg-white text-sm font-medium text-ink-700">
        {prefix && <span className="pointer-events-none pl-3">{prefix}&nbsp;</span>}
        <select
          className={`h-full cursor-pointer appearance-none bg-transparent pr-8 outline-none ${prefix ? 'pl-0' : 'pl-3'} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <Icon name="expand_more" size={18} className="pointer-events-none absolute right-2" />
      </label>
    );
  }
  return (
    <span className="relative flex">
      <select
        className={`h-11 w-full cursor-pointer appearance-none rounded-md border border-line-strong bg-white px-3 pr-10 text-[15px] font-normal text-ink outline-none focus:border-2 focus:border-brand focus:shadow-field ${className}`}
        {...rest}
      >
        {children}
      </select>
      <Icon name="expand_more" size={20} className="pointer-events-none absolute right-3 top-3 text-ink-600" />
    </span>
  );
}
