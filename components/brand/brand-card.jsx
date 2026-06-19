import { cn } from '@/lib/utils';

/**
 * BrandCard — card padrão do design system.
 * variant: 'default' | 'soft' | 'dark' | 'dashed'
 * interactive: aplica hover lift + border verde
 */
export function BrandCard({
  children,
  className,
  variant = 'default',
  interactive = false,
  as: Comp = 'div',
  ...props
}) {
  const variants = {
    default: 'bg-white border border-gray-100',
    soft: 'bg-brand-soft/40 border border-gray-100',
    dark: 'bg-brand-dark text-white border border-white/10',
    dashed: 'bg-white border-2 border-dashed border-gray-200',
  };

  const interactiveClasses = interactive
    ? 'transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-dark/5 hover:border-brand/30 cursor-pointer'
    : '';

  return (
    <Comp
      className={cn(
        'rounded-2xl p-6 sm:p-7',
        variants[variant],
        interactiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function BrandCardHeader({ children, className }) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>;
}

export function BrandCardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-bold tracking-tight text-brand-dark', className)}>
      {children}
    </h3>
  );
}

export function BrandCardDescription({ children, className }) {
  return (
    <p className={cn('text-sm text-gray-600 leading-relaxed', className)}>
      {children}
    </p>
  );
}

export function BrandCardContent({ children, className }) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}
