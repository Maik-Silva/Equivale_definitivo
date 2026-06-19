"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BrandLogo } from '@/components/brand';
import BackButton from '@/components/back-button';
import { Apple, LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import { ProfileHeader } from '@/components/profile-header';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    nome: '',
    crn: '',
    especialidade: '',
    whatsapp: '',
    instagram: '',
    logo_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileAlert, setProfileAlert] = useState({ type: '', message: '' });
  const [pwForm, setPwForm] = useState({ nova_senha: '', confirmar_senha: '' });
  const [pwAlert, setPwAlert] = useState({ type: '', message: '' });
  const [confirmHover, setConfirmHover] = useState(false);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);

    (async function loadProfile() {
      const PROFILE_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/perfil';
      try {
        const res = await fetch(PROFILE_URL, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProfileForm((p) => ({
            ...p,
            nome: data?.nome || p.nome,
            crn: data?.crn || p.crn,
            especialidade: data?.especialidade || p.especialidade,
            whatsapp: data?.whatsapp || p.whatsapp,
            instagram: data?.instagram || p.instagram,
            logo_url: data?.logo_url || data?.logo || p.logo_url,
          }));
        }
      } catch (err) {
        // ignore
      } finally {
        setProfileLoading(false);
      }
    })();

    return () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('auth');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('patientToken');
    localStorage.removeItem('nutricionista');
    router.push('/');
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((cur) => ({ ...cur, [name]: value }));
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileAlert({ type: '', message: '' });
    const token = localStorage.getItem('authToken');
    if (!token) return router.push('/login');
    setProfileLoading(true);
    try {
      const PROFILE_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/perfil';
      const res = await fetch(PROFILE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erro ao atualizar perfil');
      // update localStorage equivale_brand for header consistency
      const updatedBrand = {
        nome: data?.nome || profileForm.nome,
        crn: data?.crn || profileForm.crn || '',
        especialidade: data?.especialidade || profileForm.especialidade || '',
        whatsapp: data?.whatsapp || profileForm.whatsapp || '',
        instagram: data?.instagram || profileForm.instagram || '',
        logo: data?.logo || profileForm.logo_url || '',
        logo_url: data?.logo_url || data?.logo || profileForm.logo_url || '',
      };
      localStorage.setItem('equivale_brand', JSON.stringify(updatedBrand));
      setProfileAlert({ type: 'success', message: 'Perfil atualizado com sucesso.' });
    } catch (err) {
      setProfileAlert({ type: 'error', message: err?.message || 'Erro ao salvar perfil.' });
    } finally {
      setProfileLoading(false);
    }
  }

  function handlePwChange(e) {
    const { name, value } = e.target;
    setPwForm((cur) => ({ ...cur, [name]: value }));
  }

  async function handlePwSave(e) {
    e.preventDefault();
    setPwAlert({ type: '', message: '' });
    if (!pwForm.nova_senha || pwForm.nova_senha !== pwForm.confirmar_senha) {
      setPwAlert({ type: 'error', message: 'Senhas não conferem.' });
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) return router.push('/login');
    try {
      const PW_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/alterar-senha';
      const res = await fetch(PW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nova_senha: pwForm.nova_senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erro ao alterar senha');
      setPwAlert({ type: 'success', message: 'Senha alterada com sucesso.' });
      setPwForm({ nova_senha: '', confirmar_senha: '' });
    } catch (err) {
      setPwAlert({ type: 'error', message: err?.message || 'Erro ao alterar senha.' });
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo href={null} size="md" className="w-24" />
          </Link>
          <div className="flex items-center gap-3">
            <ProfileHeader />
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 px-4 py-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            <SidebarLink href="/nutricionista/dashboard" icon={LayoutDashboard} label="Home" active />
            <SidebarLink href="/equivale" icon={Apple} label="Equivale" />
            <SidebarLink href="/pacientes" icon={Users} label="Pacientes" />
            <SidebarLink href="/personalizar" icon={Settings} label="Personalizar" />
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="mb-8">
            <BackButton href="/login" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Central do Equivale</h1>
            <p className="mt-1 text-slate-600">Acesse a ferramenta de equivalências, gerencie seus pacientes e personalize sua versão do aplicativo.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition hover:shadow-md h-full flex flex-col">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Apple className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Equivale</CardTitle>
                <CardDescription>Acesse a ferramenta de equivalências alimentares.</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/equivale">
                  <Button variant="outline" size="sm" className="w-full">
                    Acessar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="transition hover:shadow-md h-full flex flex-col">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Pacientes</CardTitle>
                <CardDescription>Gerencie seus pacientes e acompanhe acessos.</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/pacientes">
                  <Button variant="outline" size="sm" className="w-full">
                    Acessar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 'Trocar senha' card removed from here and will be added after Personalizar for ordering */}

            <Card className="transition hover:shadow-md h-full flex flex-col">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Settings className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Personalizar</CardTitle>
                <CardDescription>Configure sua marca, logo e informações profissionais.</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link href="/personalizar">
                  <Button variant="outline" size="sm" className="w-full">
                    Acessar
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="transition hover:shadow-md h-full flex flex-col">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Settings className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Trocar senha</CardTitle>
                <CardDescription>Altere sua senha de acesso.</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">Trocar senha</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Trocar senha</DialogTitle>
                      <DialogDescription>Altere sua senha de acesso.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePwSave} className="space-y-3">
                      {pwAlert.message && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm ${pwAlert.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                          {pwAlert.message}
                        </div>
                      )}
                      <Input name="nova_senha" type="password" value={pwForm.nova_senha} onChange={handlePwChange} placeholder="Nova senha" />
                      <Input name="confirmar_senha" type="password" value={pwForm.confirmar_senha} onChange={handlePwChange} placeholder="Confirmar nova senha" />
                      <div className="relative flex items-center gap-2 justify-end">
                        {confirmHover && (
                          <div className="absolute -top-24 left-1/2 z-10 flex -translate-x-1/2 h-[60px] w-[240px] items-center justify-center gap-2 rounded-[6px] border border-black bg-[#f7f7f7] px-3 text-center font-mono text-[12px] uppercase text-[#535353] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="whitespace-nowrap">ERROR: AI MEU JOELHO!</span>
                            <span className="ml-2 inline-block text-xl animate-runner">🏃‍♀️</span>
                          </div>
                        )}
                        <Button
                          type="submit"
                          size="sm"
                          className="w-full"
                          onMouseEnter={() => {
                            if (hoverTimerRef.current) {
                              window.clearTimeout(hoverTimerRef.current);
                            }
                            hoverTimerRef.current = window.setTimeout(() => {
                              setConfirmHover(true);
                              hoverTimerRef.current = null;
                            }, 15000);
                          }}
                          onMouseLeave={() => {
                            if (hoverTimerRef.current) {
                              window.clearTimeout(hoverTimerRef.current);
                              hoverTimerRef.current = null;
                            }
                            setConfirmHover(false);
                          }}
                        >
                          Alterar senha
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <style jsx>{`
        .animate-runner {
          animation: runSwing 0.35s steps(2, end) infinite;
          transform-origin: center;
        }

        @keyframes runSwing {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(1px) translateY(-1px);
          }
          50% {
            transform: translateX(0) translateY(0);
          }
          75% {
            transform: translateX(1px) translateY(-1px);
          }
        }
      `}</style>
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, active }) {
  const base = 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition';
  return (
    <Link
      href={href}
      className={`${base} ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
