import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * BrandButton — botão padrão do design system Equivale.
 * Variants: primary (verde), secondary (outline escuro), ghost, dark (verde-escuro CTA).
 * Sizes: sm, md (default), lg.
 * Pill-style (rounded-full), com hover -translate-y, conforme identidade Equivale.
 */
const variants = {
  primary:
    'bg-brand text-white shadow-brand hover:bg-brand-hover hover:-translate-y-0.5',
  secondary:
    'border-2 border-brand-dark/15 text-brand-dark bg-transparent hover:bg-brand-dark hover:text-white hover:border-brand-dark',
  dark:
    'bg-brand-dark text-white hover:bg-brand hover:-translate-y-0.5 shadow-dark-soft',
  ghost:
    'bg-transparent text-brand-dark hover:bg-brand-dark/5',
  outline:
    'border border-brand-dark/15 text-brand-dark bg-white hover:border-brand/40 hover:text-brand',
};

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
  xl: 'h-14 px-10 text-base',
};

export const BrandButton = forwardRef(function BrandButton(
  {
    as: Comp = 'button',
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    children,
    ...props
  },
  ref
) {
  return (
    <Comp
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});
