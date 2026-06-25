'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
];

function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin Área</p>
              <p className="text-lg font-semibold text-slate-900">Equivale | Painel Administrativo</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10">
            <ShieldAlert className="h-5 w-5" />
            <span>Administrador</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
          <div className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Navegação Admin
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-4 text-sm text-slate-700 shadow-inner shadow-slate-200/60">
            <p className="font-semibold text-slate-900">Acesso rápido</p>
            <p className="mt-2 leading-6 text-slate-600">
              Esta área usa um layout administrativo próprio para separar o painel do restante da plataforma.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          {children}
        </section>
      </div>
    </div>
  );
}

export default AdminLayout;
