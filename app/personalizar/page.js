"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import BackButton from '@/components/back-button';

const API_PERFIL_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/perfil';
const API_UPLOAD_SIGNATURE_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/upload-signature';
const CLOUDINARY_UPLOAD_FOLDER = 'equivale_logos';

export default function PersonalizarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    crn: '',
    especialidade: '',
    whatsapp: '',
    instagram: '',
    logo_url: '',
    bloquear_grupos_diferentes: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchPerfil(token);
  }, [router]);

  async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const preview = text.trim().slice(0, 200);
    const snippet = preview ? `Início da resposta: ${preview}` : 'Resposta vazia.';
    const statusInfo = `status ${response.status} ${response.statusText} ${response.url}`;

    if (!contentType.includes('application/json')) {
      throw new Error(
        `Resposta inesperada do servidor: não é JSON (${statusInfo}). ${snippet}`
      );
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(
        `Falha ao analisar JSON da resposta do servidor (${statusInfo}). ${snippet}`
      );
    }
  }

  async function fetchPerfil(token) {
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const response = await fetch(API_PERFIL_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Não foi possível carregar o perfil.');
      }

      const initialForm = {
        nome: data?.nome || '',
        crn: data?.crn || '',
        especialidade: data?.especialidade || '',
        whatsapp: data?.whatsapp || '',
        instagram: data?.instagram || '',
        logo_url: data?.logo_url || '',
        bloquear_grupos_diferentes: !!data?.bloquear_grupos_diferentes,
      };
      setForm(initialForm);
      localStorage.setItem(
        'equivale_brand',
        JSON.stringify({
          nome: initialForm.nome,
          crn: initialForm.crn,
          especialidade: initialForm.especialidade,
          whatsapp: initialForm.whatsapp,
          instagram: initialForm.instagram,
          logo: initialForm.logo_url,
          logo_url: initialForm.logo_url,
          bloquear_grupos_diferentes: initialForm.bloquear_grupos_diferentes,
        })
      );
    } catch (error) {
      setAlert({ type: 'error', message: error?.message || 'Erro ao carregar o perfil.' });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function triggerFileSelect() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function syncEquivaleBrand(updatedForm) {
    if (!updatedForm) return;
    localStorage.setItem(
      'equivale_brand',
      JSON.stringify({
        nome: updatedForm.nome || '',
        crn: updatedForm.crn || '',
        especialidade: updatedForm.especialidade || '',
        whatsapp: updatedForm.whatsapp || '',
        instagram: updatedForm.instagram || '',
        logo: updatedForm.logo_url || updatedForm.logo || '',
        logo_url: updatedForm.logo_url || updatedForm.logo || '',
        bloquear_grupos_diferentes: updatedForm.bloquear_grupos_diferentes ?? false,
      })
    );
  }

  // 1. Primeiro: Obtenha a assinatura (chama seu backend)
  const getUploadSignature = async (token) => {
    const response = await fetch(API_UPLOAD_SIGNATURE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Falha ao obter assinatura do servidor');
    }
    return response.json();
  };

  // 2. Depois: Upload direto para Cloudinary (corrigido para bater com o backend)
  const uploadToCloudinary = async (file, token) => {
    try {
      console.log('[UPLOAD] Obtendo assinatura...');
      const { signature, timestamp, api_key, cloud_name } = await getUploadSignature(token);

      console.log('[UPLOAD] Enviando direto para Cloudinary...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', api_key);

      // Enviar apenas os campos básicos que o backend assina
      formData.append('folder', CLOUDINARY_UPLOAD_FOLDER);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload falhou');
      }

      console.log('[UPLOAD] ✅ Sucesso no Cloudinary!');

      const logoUrl = data.secure_url.includes('/upload/')
        ? data.secure_url.replace('/upload/', '/upload/w_500,h_500,c_limit/')
        : data.secure_url;

      return logoUrl;
    } catch (error) {
      console.error('[UPLOAD] ❌ Erro no processo de upload:', error);
      throw error;
    }
  };

  async function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setUploading(true);
    setAlert({ type: '', message: '' });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      // Faz upload direto para Cloudinary e obtém a URL transformada
      const logoUrl = await uploadToCloudinary(file, token);

      // Atualiza o estado local imediatamente
      const updatedForm = { ...form, logo_url: logoUrl };
      setForm(updatedForm);
      syncEquivaleBrand(updatedForm);

      // Salva a URL e os demais campos do formulário no backend da Railway
      const resp = await fetch(API_PERFIL_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedForm),
      });

      const data = await parseJsonResponse(resp);
      if (!resp.ok) {
        throw new Error(data?.error || data?.message || 'Erro ao salvar a URL no perfil.');
      }

      setForm((current) => ({ ...current, ...data }));
      setAlert({ type: 'success', message: 'Imagem enviada e URL salva no perfil com sucesso.' });
      window.location.reload();
    } catch (error) {
      if (error?.name === 'AbortError') {
        setAlert({ type: 'error', message: 'Tempo limite de upload excedido. Tente novamente.' });
      } else {
        setAlert({ type: 'error', message: error?.message || 'Erro ao enviar a imagem.' });
      }
    } finally {
      window.clearTimeout(timeoutId);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: '', message: '' });

    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!form.nome || !form.especialidade) {
      setAlert({ type: 'error', message: 'Preencha nome e especialidade.' });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_PERFIL_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          bloquear_grupos_diferentes: !!form.bloquear_grupos_diferentes,
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Não foi possível salvar o perfil.');
      }

      const savedForm = {
        ...form,
        ...data,
        nome: data?.nome || form.nome,
        crn: data?.crn || form.crn,
        especialidade: data?.especialidade || form.especialidade,
        whatsapp: data?.whatsapp || form.whatsapp,
        instagram: data?.instagram || form.instagram,
        logo_url: data?.logo_url || form.logo_url,
        bloquear_grupos_diferentes: data?.bloquear_grupos_diferentes ?? !!form.bloquear_grupos_diferentes,
      };

      setForm(savedForm);
      syncEquivaleBrand(savedForm);
      setAlert({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setAlert({ type: 'error', message: error?.message || 'Erro ao salvar o perfil.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <BackButton href="/nutricionista/dashboard" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Personalizar Perfil</h1>
          <p className="mt-2 text-slate-600">Construa a sua identidade visual e deixe a plataforma com a sua cara.</p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Dados do Nutricionista</CardTitle>
                <CardDescription>Edite seu perfil.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {alert.message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    alert.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {alert.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="nome" className="text-sm font-medium text-slate-700">
                      Nome completo
                    </label>
                    <Input
                      id="nome"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Nome completo"
                      disabled={loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="crn" className="text-sm font-medium text-slate-700">
                      CRN
                    </label>
                    <Input
                      id="crn"
                      name="crn"
                      value={form.crn}
                      onChange={handleChange}
                      placeholder="CRN"
                      disabled={loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="especialidade" className="text-sm font-medium text-slate-700">
                      Especialidade
                    </label>
                    <Input
                      id="especialidade"
                      name="especialidade"
                      value={form.especialidade}
                      onChange={handleChange}
                      placeholder="Especialidade"
                      disabled={loading || saving}
                    />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">
                      WhatsApp
                    </label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      disabled={loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="instagram" className="text-sm font-medium text-slate-700">
                      Instagram
                    </label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={form.instagram}
                      onChange={handleChange}
                      placeholder="@seunome"
                      disabled={loading || saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Bloquear substituições de grupos diferentes para meus pacientes</p>
                      <p className="text-sm text-slate-500">Quando ativo, o paciente será avisado ou bloqueado conforme sua configuração.</p>
                    </div>
                    <Switch
                      checked={form.bloquear_grupos_diferentes}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          bloquear_grupos_diferentes: checked,
                        }))
                      }
                      disabled={loading || saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="logo_file" className="text-sm font-medium text-slate-700">
                    Logo
                  </label>
                  <input
                    id="logo_file"
                    name="logo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || saving || uploading}
                  />
                  <div className="flex items-center gap-3">
                    <Button type="button" onClick={triggerFileSelect} disabled={loading || saving || uploading}>
                      {uploading ? 'Enviando imagem...' : 'Enviar imagem'}
                    </Button>
                    <span className="text-sm text-slate-500 break-words">{form.logo_url ? 'Imagem pronta' : 'Nenhuma imagem selecionada'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={loading || saving} className="w-full sm:w-auto">
                    {saving ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
                <CardDescription>Como os dados do seu perfil serão apresentados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="space-y-4 text-slate-700">
                    <div className="space-y-1 text-center">
                      <p className="text-2xl font-semibold text-slate-900">{form.nome || 'Seu nome'}</p>
                      <p className="text-sm text-emerald-700">{form.especialidade || 'Especialidade'}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="space-y-3 text-sm text-slate-700">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">WhatsApp</p>
                          <p className="font-medium text-slate-900">{form.whatsapp || '---'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Instagram</p>
                          <p className="font-medium text-slate-900">{form.instagram || '---'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Logo</p>
                          {form.logo_url ? (
                            <div className="flex justify-center">
                              <img src={form.logo_url} alt="Logo" className="h-20 object-contain rounded-md" />
                            </div>
                          ) : (
                            <p className="font-medium text-slate-900">URL da logo</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
