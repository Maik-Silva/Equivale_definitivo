'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './brand-logo';
import { ProfileHeader } from '@/components/profile-header';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Replace,
  Calculator,
  Users,
  FileText,
  Settings,
} from 'lucide-react';

/**
 * AppShell — wrapper de páginas logadas (dashboard + tools).
 * Header com logo + avatar, sidebar com navegação.
 */
export function AppShell({ children, title, description }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/nutricionista/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/tools/substituicao', icon: Replace, label: 'Substituição' },
    { href: '/tools/calculadora', icon: Calculator, label: 'Calculadora' },
  ];

  const futureItems = [
    { icon: Users, label: 'Pacientes' },
    { icon: FileText, label: 'Planos' },
    { icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-brand-soft/30">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <BrandLogo size="md" />
          <ProfileHeader />
        </div>
      </header>

      <div className="container mx-auto flex gap-8 px-4 py-8">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-brand/10 text-brand-accent'
                      : 'text-gray-600 hover:bg-white hover:text-brand-dark'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-3 border-t border-gray-200" />

            {futureItems.map((item, i) => (
              <span
                key={i}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  em breve
                </span>
              </span>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {(title || description) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-brand-dark">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-gray-600">{description}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
