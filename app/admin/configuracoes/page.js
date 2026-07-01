"use client";

import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminConfiguracoesPage() {
  const [settings, setSettings] = useState({
    plataforma: 'Equivale',
    suporteEmail: 'suporte@equivale.app',
    limitePadrao: '5',
    betaAtiva: true,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    window.alert('Configurações salvas localmente no estado da tela. Integre com o backend quando a API de settings estiver disponível.');
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-3 py-2 text-slate-700">
                <Settings className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.25em]">Admin / Configurações</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">Configurações gerais</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Ajuste as definições principais da plataforma e mantenha o painel alinhado com o comportamento do SaaS.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="plataforma">Nome da plataforma</Label>
                  <Input
                    id="plataforma"
                    value={settings.plataforma}
                    onChange={(event) => setSettings((current) => ({ ...current, plataforma: event.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="suporteEmail">E-mail de suporte</Label>
                  <Input
                    id="suporteEmail"
                    type="email"
                    value={settings.suporteEmail}
                    onChange={(event) => setSettings((current) => ({ ...current, suporteEmail: event.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="limitePadrao">Limite padrão de pacientes</Label>
                  <Input
                    id="limitePadrao"
                    type="number"
                    min="1"
                    value={settings.limitePadrao}
                    onChange={(event) => setSettings((current) => ({ ...current, limitePadrao: event.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-inner shadow-slate-200/40">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Modo Beta</p>
                    <p className="mt-1 text-sm text-slate-600">Ative ou desative recursos experimentais para a equipe.</p>
                  </div>
                  <Switch
                    checked={settings.betaAtiva}
                    onCheckedChange={(checked) => setSettings((current) => ({ ...current, betaAtiva: checked }))}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">Resumo rápido</p>
                <p className="mt-2">A plataforma ficará com limite padrão de {settings.limitePadrao} pacientes por nutricionista.</p>
                <p className="mt-2">Atenção ao e-mail de suporte para respostas de contato e onboarding.</p>
              </div>

              <Button type="submit" className="mt-6 rounded-full px-5 py-3">
                <Save className="mr-2 h-4 w-4" />
                Salvar configurações
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
