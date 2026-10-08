import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  big?: boolean; // 48 px (login/tablet)
  right?: ReactNode; // ex.: botão "mostrar senha"
};

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, error, hint, big, right, className = '', ...rest },
  ref,
) {
  const h = big ? 'h-12 text-base' : 'h-11 text-[15px]';
  const border = error
    ? 'border-2 border-danger-strong'
    : 'border border-line-strong focus:border-2 focus:border-brand focus:shadow-field';
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <span className="relative flex">
        <input
          ref={ref}
          className={`w-full rounded-md bg-white px-3 font-normal text-ink outline-none disabled:border-line disabled:bg-surface-bg disabled:text-ink-500 ${h} ${border} ${right ? 'pr-12' : ''} ${className}`}
          {...rest}
        />
        {right && <span className="absolute right-1 top-1 flex">{right}</span>}
      </span>
      {error && (
        <span className="flex items-center gap-1 text-[13px] font-medium text-danger">
          <Icon name="error" size={16} />
          {error}
        </span>
      )}
      {!error && hint && <span className="text-[13px] font-normal text-ink-500">{hint}</span>}
    </label>
  );
});
