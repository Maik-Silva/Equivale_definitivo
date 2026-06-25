"use client";

import React, { useEffect, useState } from 'react';
import { Users, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import EditNutriModal from '@/components/admin/EditNutriModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-e77b.up.railway.app';

function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('adminToken');
}

function normalizeNutri(nutri) {
  return {
    id: nutri.id ?? nutri._id ?? nutri.email,
    nome: nutri.nome || nutri.name || nutri.fullName || nutri.email || 'Sem nome',
    email: nutri.email || 'sem-email@exemplo.com',
    totalPacientes: Number(nutri.totalPacientes ?? nutri.patients ?? 0),
    status: String(nutri.status || nutri.estado || 'ativo').toLowerCase(),
  };
}

export default function AdminUsuariosPage() {
  const [nutricionistas, setNutricionistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNutri, setSelectedNutri] = useState(null);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNutricionistas();
  }, []);

  async function loadNutricionistas() {
    setLoading(true);
    setError('');

    const token = getAdminToken();
    if (!token) {
      setError('adminToken não encontrado em localStorage.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/api/admin/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao carregar nutricionistas.');
      }

      const list = Array.isArray(data?.nutricionistas)
        ? data.nutricionistas
        : Array.isArray(data?.data?.nutricionistas)
        ? data.data.nutricionistas
        : [];

      setNutricionistas(list.map(normalizeNutri));
    } catch (err) {
      setError(err?.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(nutri, checked) {
    const nextStatus = checked ? 'ativo' : 'inativo';
    if (!nutri?.id) return;

    setSavingStatusId(nutri.id);

    const token = getAdminToken();
    if (!token) {
      toast({ title: 'Token ausente', description: 'Faça login novamente para atualizar o status.' });
      setSavingStatusId(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE.replace(/\/$/, '')}/api/admin/nutricionistas/${encodeURIComponent(nutri.id)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao alterar o status.');
      }

      setNutricionistas((current) =>
        current.map((item) =>
          item.id === nutri.id ? { ...item, status: nextStatus } : item
        )
      );

      toast({
        title: 'Status atualizado',
        description: `${nutri.nome} está agora ${nextStatus}.`,
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.message || 'Não foi possível atualizar o status.',
      });
    } finally {
      setSavingStatusId(null);
    }
  }

  function handleSaved(updatedNutri) {
    setNutricionistas((current) =>
      current.map((item) =>
        item.id === updatedNutri.id
          ? {
              ...item,
              nome: updatedNutri.nome || item.nome,
              email: updatedNutri.email || item.email,
              status: updatedNutri.status || item.status,
            }
          : item
      )
    );

    setSelectedNutri(null);
    toast({
      title: 'Nutricionista salvo',
      description: 'As alterações foram registradas com sucesso.',
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-3 py-2 text-slate-700">
                <Users className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.25em]">Admin / Usuários</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">Nutricionistas</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Veja a lista de nutricionistas registrados, edite dados e altere o status diretamente do painel.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-inner shadow-slate-200/40">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Nome</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">E-mail</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Total de Pacientes</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Carregando nutricionistas...
                    </td>
                  </tr>
                ) : nutricionistas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Nenhum nutricionista encontrado.
                    </td>
                  </tr>
                ) : (
                  nutricionistas.map((nutri) => (
                    <tr key={nutri.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{nutri.nome}</td>
                      <td className="px-6 py-4 text-slate-600">{nutri.email}</td>
                      <td className="px-6 py-4 text-slate-700">{nutri.totalPacientes}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-3 py-2"
                            onClick={() => setSelectedNutri(nutri)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </Button>
                          <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm shadow-slate-200/40">
                            <span className="text-sm font-medium text-slate-700">
                              {nutri.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </span>
                            <Switch
                              checked={nutri.status === 'ativo'}
                              onCheckedChange={(checked) => handleToggleStatus(nutri, checked)}
                              disabled={savingStatusId === nutri.id}
                              aria-label={`Alterar status de ${nutri.nome}`}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <EditNutriModal
        open={Boolean(selectedNutri)}
        onOpenChange={(open) => {
          if (!open) setSelectedNutri(null);
        }}
        nutricionista={selectedNutri}
        onSaved={handleSaved}
      />

      <Toaster />
    </main>
  );
}
