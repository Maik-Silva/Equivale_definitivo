'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calculator } from 'lucide-react';
import { ProfileHeader } from '@/components/profile-header';

export default function CalculadoraPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Link href="/nutricionista/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
            <BrandLogo href={null} size="sm" className="w-20" />
          </div>
          <ProfileHeader />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Calculadora de Equivalências</h1>
              <p className="text-slate-600">Ferramenta para cálculo de porções equivalentes.</p>
            </div>
          </div>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Calculator className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Módulo pronto para migração</h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Esta página está reservada para receber a calculadora de equivalências.
                A lógica será migrada nesta rota.
              </p>
              <Link href="/nutricionista/dashboard" className="mt-6">
                <Button variant="outline">Voltar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
