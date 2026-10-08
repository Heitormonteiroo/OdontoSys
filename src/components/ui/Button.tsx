import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'tablet';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-line-soft disabled:text-ink-500',
  secondary: 'border border-line-strong bg-white text-ink hover:bg-surface-bg disabled:text-ink-500',
  ghost: 'bg-transparent text-brand hover:bg-brand-soft disabled:text-ink-500',
  danger: 'bg-danger text-white hover:bg-[#912018] disabled:bg-line-soft disabled:text-ink-500',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-[18px] text-sm rounded-md',
  lg: 'h-[52px] px-6 text-base rounded-lg',
  tablet: 'h-14 px-6 text-[17px] rounded-xl',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: string;
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : icon ? (
        <Icon name={icon} size={20} />
      ) : null}
      {children}
    </button>
  );
}
