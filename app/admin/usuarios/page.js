"use client";

import React, { useEffect, useState } from 'react';
import { Users, Edit3, MoreHorizontal, Trash2, Slash, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import EditNutriModal from '@/components/admin/EditNutriModal';
import { getAdminToken, getAdminApiBaseUrl, getAdminHeaders } from '@/lib/admin-auth';
import { normalizeUser, normalizePaciente, extractList } from '@/lib/admin-data-normalizers';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editNutri, setEditNutri] = useState(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTargetNutri, setPlanTargetNutri] = useState(null);
  const [planChoice, setPlanChoice] = useState('beta');
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [changingPlanId, setChangingPlanId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    setError('');

    const token = getAdminToken();
    if (!token) {
      setError('Token não encontrado. Faça login novamente.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getAdminApiBaseUrl()}/api/admin/nutricionistas`, {
        method: 'GET',
        headers: getAdminHeaders(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao carregar nutricionistas.');
      }

      let list = extractList(data, 'nutricionistas', 'users', 'data', 'results');
      if (list.length === 0 && Array.isArray(data?.data)) {
        list = data.data;
      }
      if (list.length === 0 && Array.isArray(data?.data?.nutricionistas)) {
        list = data.data.nutricionistas;
      }

      setUsuarios(list.map(normalizeUser));
    } catch (err) {
      setError(err?.message || 'Erro ao carregar nutricionistas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNutri(nutri) {
    if (!nutri?.id) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${nutri.nome}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(nutri.id);
    const token = getAdminToken();
    if (!token) {
      toast({ title: 'Token ausente', description: 'Faça login novamente para excluir nutricionista.' });
      setDeletingId(null);
      return;
    }

    try {
      const response = await fetch(`${getAdminApiBaseUrl()}/api/admin/nutricionistas/${encodeURIComponent(nutri.id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao excluir nutricionista.');
      }
      setUsuarios((current) => current.filter((item) => item.id !== nutri.id));
      toast({ title: 'Nutricionista excluído', description: `${nutri.nome} foi removido do sistema.` });
    } catch (err) {
      toast({ title: 'Erro ao excluir', description: err?.message || 'Não foi possível excluir o nutricionista.' });
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenPlanModal(nutri) {
    setPlanTargetNutri(nutri);
    const currentPlan = (nutri.plano || 'beta').toLowerCase();
    setPlanChoice(currentPlan === 'premium' || currentPlan === 'plus' ? 'beta' : currentPlan);
    setPlanModalOpen(true);
  }

  async function handleChangePlan(event) {
    event.preventDefault();
    if (!planTargetNutri?.id) return;

    setChangingPlanId(planTargetNutri.id);
    const token = getAdminToken();
    if (!token) {
      toast({ title: 'Token ausente', description: 'Faça login novamente para alterar o plano.' });
      setChangingPlanId(null);
      return;
    }

    const endpoint = `${getAdminApiBaseUrl()}/api/admin/nutricionistas/${encodeURIComponent(planTargetNutri.id)}`;
    const bodyPayload = JSON.stringify({ plano: planChoice, plan: planChoice });

    try {
      let response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: bodyPayload,
      });
      let data = await response.json().catch(() => ({}));

      if (!response.ok && (response.status === 404 || response.status === 405)) {
        response = await fetch(endpoint, {
          method: 'PUT',
          headers: getAdminHeaders(),
          body: bodyPayload,
        });
        data = await response.json().catch(() => ({}));
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao atualizar o plano.');
      }

      setUsuarios((current) =>
        current.map((item) =>
          item.id === planTargetNutri.id ? { ...item, plano: planChoice } : item
        )
      );
      setPlanModalOpen(false);
      toast({ title: 'Plano atualizado', description: `Plano de ${planTargetNutri.nome} alterado para ${planChoice}.` });
    } catch (err) {
      toast({ title: 'Erro ao alterar plano', description: err?.message || 'Não foi possível alterar o plano.' });
    } finally {
      setChangingPlanId(null);
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
        `${getAdminApiBaseUrl()}/api/admin/nutricionistas/${encodeURIComponent(nutri.id)}/status`,
        {
          method: 'PATCH',
          headers: getAdminHeaders(),
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Falha ao alterar o status.');
      }

      setUsuarios((current) => current.map((item) => (item.id === nutri.id ? { ...item, status: nextStatus } : item)));

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
    setUsuarios((current) =>
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

    toast({
      title: 'Usuário salvo',
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
                <span className="text-xs uppercase tracking-[0.25em]">Admin / Nutricionistas</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">Nutricionistas ativos</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Gerencie nutricionistas, confira pacientes vinculados e atualize planos diretamente do painel.
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
                  <th className="px-6 py-4 font-semibold text-slate-600">Perfil</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Pacientes</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{usuario.nome}</td>
                      <td className="px-6 py-4 text-slate-600">{usuario.email}</td>
                      <td className="px-6 py-4 text-slate-700 capitalize">{usuario.role}</td>
                      <td className="px-6 py-4 text-slate-700">{usuario.totalPacientes}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full px-3 py-2"
                            onClick={() => setEditNutri(usuario)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-full px-3 py-2">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleToggleStatus(usuario, usuario.status !== 'ativo')}>
                                <Slash className="h-4 w-4" />
                                {usuario.status === 'ativo' ? 'Suspender' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleOpenPlanModal(usuario)}>
                                <CreditCard className="h-4 w-4" />
                                Mudar plano
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteNutri(usuario)} className="text-rose-600">
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {planModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-900/10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Mudar plano</h2>
                <p className="mt-1 text-sm text-slate-600">Atualize o plano do nutricionista selecionado.</p>
              </div>
              <Button variant="ghost" onClick={() => setPlanModalOpen(false)}>
                Fechar
              </Button>
            </div>
            <form onSubmit={handleChangePlan} className="space-y-6">
              <div>
                <Label htmlFor="planChoice">Plano</Label>
                <select
                  id="planChoice"
                  value={planChoice}
                  onChange={(event) => setPlanChoice(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="beta">Beta (disponível)</option>
                  <option value="premium" disabled>Premium (não disponível)</option>
                  <option value="plus" disabled>Plus (não disponível)</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setPlanModalOpen(false)} type="button">
                  Cancelar
                </Button>
                <Button type="submit" disabled={changingPlanId === planTargetNutri?.id}>
                  {changingPlanId === planTargetNutri?.id ? 'Atualizando...' : 'Salvar plano'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <EditNutriModal
        open={Boolean(editNutri)}
        onOpenChange={(open) => {
          if (!open) setEditNutri(null);
        }}
        nutricionista={editNutri}
        onSaved={handleSaved}
      />

      <Toaster />
    </main>
  );
}
