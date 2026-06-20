"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/back-button';

const API_PACIENTES_URL = 'https://backend-production-e77b.up.railway.app/api/pacientes';

export default function PacientesPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    observacoes: '',
  });
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [dadosAcesso, setDadosAcesso] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPatientId, setCopiedPatientId] = useState(null);
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [userName, setUserName] = useState('Nutricionista');
  const [brandLogo, setBrandLogo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const raw = localStorage.getItem('equivale_brand');
      if (raw) {
        const brand = JSON.parse(raw);
        setUserName(brand?.nome || 'Nutricionista');
        setBrandLogo(brand?.logo_url || brand?.logo || null);
      }
    } catch (error) {
      // ignore malformed localStorage data
    }

    fetchPatients(token);
  }, [router]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function fetchPatients(token) {
    setLoadingPatients(true);
    setAlert({ type: '', message: '' });

    try {
      const response = await fetch(API_PACIENTES_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Não foi possível carregar os pacientes.');
      }

      setPatients(Array.isArray(data) ? data : data?.pacientes || []);
    } catch (error) {
      setAlert({ type: 'error', message: error?.message || 'Erro ao buscar pacientes.' });
    } finally {
      setLoadingPatients(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: '', message: '' });

    const missingField = ['nome', 'email', 'telefone', 'data_nascimento'].find(
      (field) => !form[field]
    );

    if (missingField) {
      setAlert({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (editingPatient) {
        // Update existing patient
        response = await fetch(`${API_PACIENTES_URL}/${editingPatient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      } else {
        // Create new patient
        response = await fetch(API_PACIENTES_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || (editingPatient ? 'Não foi possível atualizar o paciente.' : 'Não foi possível cadastrar o paciente.'));
      }

      if (editingPatient) {
        setAlert({ type: 'success', message: 'Paciente atualizado com sucesso!' });
        setEditingPatient(null);
      } else {
        setDadosAcesso(data?.acesso || null);
        setAlert({ type: 'success', message: 'Paciente cadastrado com sucesso!' });
      }

      setForm({ nome: '', email: '', telefone: '', data_nascimento: '', observacoes: '' });
      await fetchPatients(token);
    } catch (error) {
      setAlert({ type: 'error', message: error?.message || (editingPatient ? 'Erro ao atualizar paciente.' : 'Erro ao cadastrar paciente.') });
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditPatient(patient) {
    const dateValue = patient.data_nascimento ? new Date(patient.data_nascimento).toISOString().slice(0, 10) : '';
    setEditingPatient(patient);
    setForm({
      nome: patient.nome || '',
      email: patient.email || '',
      telefone: patient.telefone || '',
      data_nascimento: dateValue,
      observacoes: patient.observacoes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingPatient(null);
    setForm({ nome: '', email: '', telefone: '', data_nascimento: '', observacoes: '' });
  }

  async function handleCopyPatientLink(patient) {
const urlAcesso = `https://plataformaequivale.netlify.app/login?usuario=${encodeURIComponent(patient.email)}`;    const patientKey = patient.id || patient.email;

    try {
      await navigator.clipboard.writeText(urlAcesso);
      setCopiedPatientId(patientKey);
      toast({
        title: 'Link copiado',
        description: 'O link de acesso foi copiado para a área de transferência.',
      });
      window.setTimeout(() => setCopiedPatientId(null), 1500);
    } catch (error) {
      console.warn('Falha ao copiar o link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link de acesso.',
      });
    }
  }

  function handleTogglePatient(patient) {
    const patientKey = patient.id || patient.email;
    setExpandedPatientId((current) => (current === patientKey ? null : patientKey));
  }

  function openDeleteDialog(patient) {
    setDeleteCandidate(patient);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteCandidate) return;
    const id = deleteCandidate.id;
    const token = localStorage.getItem('authToken');
    if (!token) return router.push('/login');

    try {
      const res = await fetch(`${API_PACIENTES_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erro ao excluir paciente.');
      setAlert({ type: 'success', message: 'Paciente excluído com sucesso.' });
      await fetchPatients(token);
    } catch (err) {
      setAlert({ type: 'error', message: err?.message || 'Erro ao excluir paciente.' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteCandidate(null);
    }
  }

  async function handleCopyLink() {
    if (!dadosAcesso?.link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(dadosAcesso.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.warn('Falha ao copiar o link:', error);
    }
  }

  function handleResetAccess() {
    setDadosAcesso(null);
    setCopied(false);
    setAlert({ type: '', message: '' });
    setForm({ nome: '', email: '', telefone: '', data_nascimento: '', observacoes: '' });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BackButton href="/nutricionista/dashboard" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pacientes</h1>
            <p className="mt-2 text-slate-600">Cadastre e visualize a lista de pacientes.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">Olá, {userName}</span>
            {brandLogo ? (
              <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white">
                <img src={brandLogo} alt={`${userName} logo`} className="h-10 w-10 object-cover" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {userName?.charAt(0)?.toUpperCase() || 'N'}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Cadastro de Pacientes</CardTitle>
                <CardDescription>Insira os dados do paciente e envie para o backend.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {dadosAcesso ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-emerald-900">Credenciais do paciente geradas</h2>
                      <p className="mt-1 text-sm text-emerald-700">
                        Copie o link e envie ao paciente por WhatsApp.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAccess}
                      className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Cadastrar outro
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Usuário / Login</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-900 break-words">{dadosAcesso.usuario}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Senha inicial</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-900 break-words">{dadosAcesso.senha_inicial}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Link de acesso</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-900 break-words">{dadosAcesso.link}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Copiar Link de Acesso
                    </button>
                    {copied && <span className="text-sm font-medium text-emerald-900">Copiado!</span>}
                  </div>
                </div>
              ) : (
                alert.message && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      alert.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {alert.message}
                  </div>
                )
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="nome" className="text-sm font-medium text-slate-700">
                      Nome completo
                    </label>
                    <Input
                      id="nome"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Nome do paciente"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@exemplo.com"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="telefone" className="text-sm font-medium text-slate-700">
                      Telefone
                    </label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={form.telefone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="data_nascimento" className="text-sm font-medium text-slate-700">
                      Data de nascimento
                    </label>
                    <Input
                      id="data_nascimento"
                      name="data_nascimento"
                      type="date"
                      value={form.data_nascimento}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="observacoes" className="text-sm font-medium text-slate-700">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={form.observacoes}
                    onChange={handleChange}
                    placeholder="Informações extras sobre o paciente"
                    rows={4}
                    disabled={submitting}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={submitting} className="w-full lg:w-auto">
                    {submitting ? 'Salvando...' : editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                  </Button>
                  {editingPatient && (
                    <Button type="button" variant="ghost" onClick={handleCancelEdit} className="text-sm">
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Lista de pacientes</CardTitle>
                <CardDescription>Pacientes cadastrados.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPatients ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Carregando pacientes...
                </div>
              ) : patients.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Nenhum paciente encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-medium text-slate-600">Paciente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {patients.map((patient) => {
                        const patientKey = patient.id || patient.email;
                        const expanded = expandedPatientId === patientKey;

                        return (
                          <React.Fragment key={patientKey}>
                            <tr>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePatient(patient)}
                                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                                  aria-expanded={expanded}
                                >
                                  <span>{patient.nome}</span>
                                  {expanded ? (
                                    <ChevronUp className="h-4 w-4 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-500" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {expanded && (
                              <tr key={`${patientKey}-details`}>
                                <td className="px-4 py-4">
                                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">E-mail</p>
                                        <p className="mt-2 text-sm font-medium text-slate-900 break-words">{patient.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Telefone</p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">{patient.telefone || '—'}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nascimento</p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">{patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleEditPatient(patient)}
                                        className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyPatientLink(patient)}
                                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                      >
                                        Copiar Link
                                      </button>
                                      <Dialog open={deleteDialogOpen && deleteCandidate?.id === patient.id} onOpenChange={(open) => { if (!open) { setDeleteDialogOpen(false); setDeleteCandidate(null); } }}>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Confirmar exclusão</DialogTitle>
                                            <DialogDescription>Deseja mesmo excluir {patient.nome}?</DialogDescription>
                                          </DialogHeader>
                                          <div className="mt-4 flex justify-end gap-2">
                                            <DialogClose asChild>
                                              <button className="rounded-md border px-3 py-1 text-sm">Cancelar</button>
                                            </DialogClose>
                                            <button
                                              onClick={async () => { setDeleteCandidate(patient); await handleDeleteConfirm(); }}
                                              className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                                            >
                                              Excluir
                                            </button>
                                          </div>
                                        </DialogContent>
                                        <button
                                          type="button"
                                          onClick={() => { setDeleteCandidate(patient); setDeleteDialogOpen(true); }}
                                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                          Excluir
                                        </button>
                                      </Dialog>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
