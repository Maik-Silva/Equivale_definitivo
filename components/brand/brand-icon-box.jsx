import { cn } from '@/lib/utils';

/**
 * BrandIconBox — caixa quadrada arredondada para ícones (verde transparente).
 * Padrão Equivale: w-11 h-11 rounded-xl bg-brand/10 + icon text-brand.
 * size: 'sm' | 'md' | 'lg'
 * variant: 'soft' (default), 'solid', 'dark'
 */
export function BrandIconBox({
  icon: Icon,
  size = 'md',
  variant = 'soft',
  className,
  iconClassName,
}) {
  const sizes = {
    sm: 'w-9 h-9 [&_svg]:size-4',
    md: 'w-11 h-11 [&_svg]:size-5',
    lg: 'w-14 h-14 [&_svg]:size-6',
  };
  const variants = {
    soft: 'bg-brand/10 text-brand',
    solid: 'bg-brand text-white',
    dark: 'bg-brand-dark text-white',
    soft_dark: 'bg-brand-dark/5 text-brand-dark',
  };
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl shrink-0',
        sizes[size],
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className={iconClassName} />}
    </div>
  );
}
