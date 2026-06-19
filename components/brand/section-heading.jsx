import { cn } from '@/lib/utils';
import { EyebrowLabel } from './brand-badge';

/**
 * SectionHeading — título de seção padrão (eyebrow + h2 + subtitle).
 * Replica o padrão usado por toda a landing de referência.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  highlight, // palavra opcional a ser destacada em verde dentro do título
}) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center mx-auto items-center';

  // Permite highlight simples: substitui {highlight} no título por <span text-brand>
  const renderTitle = () => {
    if (!title) return null;
    if (highlight && typeof title === 'string' && title.includes(highlight)) {
      const parts = title.split(highlight);
      return (
        <>
          {parts[0]}
          <span className="text-brand">{highlight}</span>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  return (
    <div className={cn('flex flex-col gap-3 max-w-2xl', alignment, className)}>
      {eyebrow && <EyebrowLabel>{eyebrow}</EyebrowLabel>}
      {title && (
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-brand-dark leading-[1.1]">
          {renderTitle()}
        </h2>
      )}
      {subtitle && (
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
