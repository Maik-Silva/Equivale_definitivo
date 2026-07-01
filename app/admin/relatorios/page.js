"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Users, UserCheck, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const { getAdminToken, getAdminApiBaseUrl, getAdminHeaders } = require('@/lib/admin-auth');
const { normalizeAccess } = require('@/lib/admin-data-normalizers');

function formatDateBR(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '—');
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminRelatoriosPage() {
  const [metrics, setMetrics] = useState({ totalNutris: 0, totalPacientes: 0, totalAcessos: 0 });
  const [acessosRecentes, setAcessosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      setError('');

      const token = getAdminToken();
      if (!token) {
        setError('adminToken não encontrado no localStorage.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getAdminApiBaseUrl()}/api/admin/metrics`, {
          method: 'GET',
          headers: getAdminHeaders(),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.message || 'Falha ao carregar métricas.');
        }

        const payload = body?.data || body || {};
        setMetrics({
          totalNutris:
            payload.totalNutris ?? payload.totalNutricionistas ?? payload.nutricionistas?.length ?? 0,
          totalPacientes: payload.totalPacientes ?? payload.totalPacientes ?? payload.pacientes?.length ?? 0,
          totalAcessos: payload.totalAcessos ?? payload.acessos ?? 0,
        });

        const logs = Array.isArray(payload.acessosRecentes)
          ? payload.acessosRecentes
          : Array.isArray(payload.acessos)
          ? payload.acessos
          : Array.isArray(payload.data?.acessosRecentes)
          ? payload.data.acessosRecentes
          : Array.isArray(payload.data?.acessos)
          ? payload.data.acessos
          : [];

        setAcessosRecentes(logs.map(normalizeAccess));
      } catch (err) {
        setError(err?.message || 'Erro ao carregar dados de relatórios.');
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  const chartData = useMemo(() => {
    const grouped = new Map();

    acessosRecentes.forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;
      const dayTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      grouped.set(dayTimestamp, {
        label,
        count: (grouped.get(dayTimestamp)?.count ?? 0) + 1,
      });
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, entry]) => ({ ...entry, timestamp }));
  }, [acessosRecentes]);

  const handleExportCsv = () => {
    if (!acessosRecentes.length) {
      toast({ title: 'Sem dados', description: 'Não há logs de acesso para exportar.' });
      return;
    }

    const rows = [
      ['Data', 'Paciente', 'Nutricionista'],
      ...acessosRecentes.map((item) => [formatDateBR(item.date), item.patient, item.nutritionist]),
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorios_acessos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exportado', description: 'O CSV de logs de acesso foi baixado.' });
  };

  const cards = [
    {
      label: 'Nutricionistas ativos',
      value: metrics.totalNutris,
      icon: Users,
      accent: 'bg-sky-500/10 text-sky-700',
    },
    {
      label: 'Pacientes na plataforma',
      value: metrics.totalPacientes,
      icon: UserCheck,
      accent: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      label: 'Acessos gerais',
      value: metrics.totalAcessos,
      icon: Activity,
      accent: 'bg-violet-500/10 text-violet-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-3 py-2 text-slate-700">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.25em]">Admin / Relatórios</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">Dashboard Analítica</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Visão geral das métricas do SaaS com painel de acessos e auditoria para os últimos movimentos.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-full px-4 py-3">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {error ? (
            <div className="mb-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                      <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value.toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${card.accent}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Acessos recentes</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tendência de acessos</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                  Últimos {chartData.length || 7} dias
                </span>
              </div>
              <div className="h-[320px]">
                {chartData.length > 0 ? (
                  <ChartContainer className="h-full rounded-[1.75rem] bg-slate-50 p-4" id="admin-relatorios-acessos" config={{ count: { color: '#0f766e' } }}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#475569' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#475569' }} />
                      <Tooltip contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} labelFormatter={(value) => `Dia ${value}`} />
                      <Area type="monotone" dataKey="count" stroke="#0f766e" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="grid h-full place-items-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 text-slate-500">
                    Sem dados suficientes para gerar um gráfico.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Tabela de auditoria</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Logs de acesso</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={handleExportCsv} className="rounded-full px-4 py-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Data</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Paciente</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Nutricionista</th>
                    </tr>
                  </thead>
                  <tbody className="max-h-96 divide-y divide-slate-200 bg-white text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          Carregando logs de auditoria...
                        </td>
                      </tr>
                    ) : acessosRecentes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                          Nenhum registro de acesso encontrado.
                        </td>
                      </tr>
                    ) : (
                      acessosRecentes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4 text-slate-600">{formatDateBR(item.date)}</td>
                          <td className="px-4 py-4">{item.patient}</td>
                          <td className="px-4 py-4">{item.nutritionist}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>

      <Toaster />
    </main>
  );
}
