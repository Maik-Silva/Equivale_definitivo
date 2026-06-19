import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * BrandInput — input padrão do design system Equivale.
 * Estilo coerente com botões e cards (rounded-xl, focus verde).
 */
export const BrandInput = forwardRef(function BrandInput(
  { className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-brand-dark',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
        'transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

export function BrandLabel({ children, className, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-semibold text-brand-dark', className)}
    >
      {children}
    </label>
  );
}

export function BrandField({ label, htmlFor, hint, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <BrandLabel htmlFor={htmlFor}>{label}</BrandLabel>}
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
