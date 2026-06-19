import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * BrandLogo — usando logo real da marca (landing page)
 */
export function BrandLogo({
  href = '/',
  size = 'md',
  className,
}) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  const inner = (
    <img
      src="/logo.png"
      alt="Equivale"
      className={cn(sizes[size], 'w-auto', className)}
    />
  );

  if (!href) return inner;

  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}