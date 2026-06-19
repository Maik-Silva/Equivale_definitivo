import { cn } from '@/lib/utils';

/**
 * BrandBadge — pill/eyebrow do design system.
 * variant: 'soft' (verde transparente), 'solid' (verde sólido), 'dark', 'outline'
 */
export function BrandBadge({ children, icon: Icon, variant = 'soft', className }) {
  const variants = {
    soft:
      'bg-brand/10 border border-brand/20 text-brand-accent',
    solid: 'bg-brand text-white',
    dark: 'bg-brand-dark/5 border border-brand-dark/10 text-brand-dark',
    outline: 'border border-gray-200 bg-white text-brand-dark',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

/**
 * EyebrowLabel — uppercase small label usado acima de títulos de seção.
 * Padrão Equivale: text-xs uppercase tracking-[0.2em] text-brand mb-3.
 */
export function EyebrowLabel({ children, className }) {
  return (
    <p
      className={cn(
        'text-xs font-semibold uppercase tracking-[0.2em] text-brand',
        className
      )}
    >
      {children}
    </p>
  );
}
