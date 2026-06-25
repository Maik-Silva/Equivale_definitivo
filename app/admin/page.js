"use client";

import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, Users, Clock, UserCheck, ShieldAlert, MoreHorizontal, Edit3, Eye, Slash } from 'lucide-react';
import { BetaLimitAlert } from '@/components/admin/beta-limit-alert';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import EditNutriModal from '@/components/admin/EditNutriModal';

function ProgressBar({ value, max }) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200/80">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function getTokenFromStorageOrCookie() {
  try {
    if (typeof localStorage !== 'undefined') {
      const possibleKeys = ['adminToken', 'token', 'accessToken'];
      for (const k of possibleKeys) {
        const t = localStorage.getItem(k);
        if (t) return t;
      }
    }

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )(?:adminToken|token)=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function normalizeName(value) {
  if (!value && value !== 0) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const candidate = value.nome || value.name || value.fullName || value.displayName || value.nutricionista || value.patient || value.paciente;
    if (candidate && typeof candidate !== 'object') return String(candidate);
    if (candidate) return normalizeName(candidate);
    return JSON.stringify(value);
  }
  return '';
}

export default function AdminDashboardPage() {
  const [cards, setCards] = useState({ totalNutris: 0, totalPacientes: 0, totalAcessos: 0 });
  const [nutricionistas, setNutricionistas] = useState([]);
  const [acessosRecentes, setAcessosRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);

      const token = getTokenFromStorageOrCookie();
      if (!token) {
        setError('Token não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const backend = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-e77b.up.railway.app';
      const url = `${backend.replace(/\/$/, '')}/api/admin/metrics`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) return;

        if (res.status === 401) {
          setError('Token inválido. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError('Erro ao carregar dados do painel.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        // suporte para { data: { ... } } ou retorno direto
        const payload = data?.data || data || {};

        if (payload.cards) setCards(payload.cards);
        if (Array.isArray(payload.nutricionistas)) {
          // map API fields to local shape: id, nome, email, totalPacientes
          setNutricionistas(
            payload.nutricionistas.map((n) => ({
              id: n.id ?? n._id ?? n.email,
              nome: n.nome || n.name || n.nome_completo || n.fullName || n.email,
              email: n.email,
              totalPacientes: Number(n.totalPacientes ?? n.patients ?? 0),
            }))
          );
        }

        if (Array.isArray(payload.acessosRecentes)) {
          setAcessosRecentes(
            payload.acessosRecentes.map((a) => ({
              id: a.id ?? a._id ?? `${normalizeName(a.patient)}-${a.data_acesso}`,
              patient: normalizeName(a.patient || a.nome_paciente || a.nomePaciente || a.paciente),
              nutritionist: normalizeName(a.nutricionista || a.nome_nutricionista || a.nomeNutri),
              date: a.data_acesso || a.date || a.createdAt || '',
            }))
          );
        }

        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError('Erro de rede ao consultar o backend.');
        setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const [selectedNutri, setSelectedNutri] = useState(null);

  const handleViewPatients = (nutri) => {
    if (!nutri?.id) return;
    window.location.href = `/admin/usuarios?nutri=${encodeURIComponent(nutri.id)}`;
  };

  const handleSuspend = (nutri) => {
    window.alert(`Suspender ${nutri.nome} ainda não está disponível. Use as configurações de administração para aplicar alterações em massa.`);
  };

  const handleNutriSaved = (updatedNutri) => {
    setNutricionistas((current) =>
      current.map((item) =>
        item.id === updatedNutri.id ? { ...item, nome: updatedNutri.nome, email: updatedNutri.email, status: updatedNutri.status } : item
      )
    );
    setSelectedNutri(null);
  };

  const metrics = [
    {
      label: 'Nutricionistas Cadastrados',
      value: cards.totalNutris ?? 0,
      icon: Users,
      accent: 'bg-sky-500/10 text-sky-700',
    },
    {
      label: 'Pacientes na Plataforma',
      value: cards.totalPacientes ?? 0,
      icon: UserCheck,
      accent: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      label: 'Acessos Gerais',
      value: cards.totalAcessos ?? 0,
      icon: Activity,
      accent: 'bg-violet-500/10 text-violet-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Área Administrativa</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Painel de Controle - Admin</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Visão geral do SaaS de nutrição, métricas principais e monitoramento do plano Beta.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900 px-5 py-4 text-white shadow-xl shadow-slate-900/10">
              <ShieldAlert className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold">Administrador</p>
                <p className="text-xs text-slate-200">Acesso total ao painel</p>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-[1rem] border border-slate-200 bg-white p-6 text-slate-700">Carregando dados do painel...</div>
        ) : error ? (
          <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))]">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.label}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                        <p className="mt-4 text-3xl font-semibold text-slate-900">{metric.value}</p>
                      </div>
                      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${metric.accent}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Nutricionistas Beta</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Monitoramento de limite</h2>
                  </div>
                  <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Meta: até 5 pacientes por nutricionista</div>
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600">Nutricionista</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">E-mail</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Pacientes</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Progresso</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {nutricionistas.map((nutri) => {
                        const patients = nutri.totalPacientes ?? 0;
                        const isLimitReached = patients >= 5;
                        return (
                          <tr key={nutri.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{nutri.nome}</td>
                            <td className="px-6 py-4 text-slate-600">{nutri.email}</td>
                            <td className="px-6 py-4 text-slate-700">{`${patients}/5`}</td>
                            <td className="px-6 py-4">
                              <ProgressBar value={patients} max={5} />
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {isLimitReached ? (
                                  <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-700">Limite Atingido</span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">Espaço disponível</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    aria-label={`Abrir ações para ${nutri.nome}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[12rem]">
                                  <DropdownMenuItem onSelect={() => setSelectedNutri(nutri)} className="gap-3">
                                    <Edit3 className="h-4 w-4 text-slate-500" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleViewPatients(nutri)} className="gap-3">
                                    <Eye className="h-4 w-4 text-slate-500" />
                                    Ver Pacientes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleSuspend(nutri)} className="gap-3 text-rose-600">
                                    <Slash className="h-4 w-4 text-rose-500" />
                                    Suspender
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Acessos Recentes</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Últimos pacientes ativos</h2>
                  </div>
                  <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Histórico real</span>
                </div>

                <div className="space-y-4">
                  {acessosRecentes.map((access) => (
                    <article key={access.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{access.patient}</p>
                          <p className="text-sm text-slate-600">Nutricionista: {access.nutritionist}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                          {formatDateBR(access.date)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <BetaLimitAlert variant="nutri" />
              <BetaLimitAlert variant="paciente" />
            </div>

            <EditNutriModal
              open={Boolean(selectedNutri)}
              onOpenChange={(open) => {
                if (!open) setSelectedNutri(null);
              }}
              nutricionista={selectedNutri}
              onSaved={handleNutriSaved}
            />
          </>
        )}
      </div>
    </main>
  );
}
