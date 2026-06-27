"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackButton from '@/components/back-button';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-e77b.up.railway.app';
const API_LOGIN_URL = `${BACKEND_URL}/api/auth/login`;
const API_ADMIN_LOGIN_URL = `${BACKEND_URL}/api/auth/login-admin`;
const API_PATIENT_LOGIN_URL = `${BACKEND_URL}/api/auth/login-paciente`;

function onlyNumbers(value) {
  return value.replace(/\D/g, '');
}

function formatPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);
  if (numbers.length <= 2) return numbers ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatDateInput(value) {
  const numbers = value.replace(/\D/g, '').slice(0, 8);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
}

function brazilianToIsoDate(value) {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map((part) => part.padStart(2, '0'));
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  return `${year}-${month}-${day}`;
}

// Componente interno que roda as funções e hooks com segurança
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tipoUsuario, setTipoUsuario] = useState('nutricionista');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [exibirBemVindo, setExibirBemVindo] = useState(false);
  const [mensagemBemVindo, setMensagemBemVindo] = useState('');
  const logoTimeoutRef = useRef(null);
  const logoClickTimeoutRef = useRef(null);

  useEffect(() => {
    const usuario = searchParams?.get('usuario');
    if (usuario === 'paciente') {
      setTipoUsuario('paciente');
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (logoTimeoutRef.current) window.clearTimeout(logoTimeoutRef.current);
      if (logoClickTimeoutRef.current) window.clearTimeout(logoClickTimeoutRef.current);
    };
  }, []);

  function resetLogoEasterEgg() {
    if (logoTimeoutRef.current) {
      window.clearTimeout(logoTimeoutRef.current);
      logoTimeoutRef.current = null;
    }
    setShowEasterEgg(false);
  }

  function handleLogoMouseEnter() {
    resetLogoEasterEgg();

    logoTimeoutRef.current = window.setTimeout(() => {
      setShowEasterEgg(true);
    }, 15000);
  }

  function handleLogoMouseLeave() {
    resetLogoEasterEgg();
  }

  function handleLogoClick() {
    setLogoClickCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= 3) {
        setShowAdminLogin(true);
        setAdminError('');
        setLogoClickCount(0);
        if (logoClickTimeoutRef.current) {
          window.clearTimeout(logoClickTimeoutRef.current);
          logoClickTimeoutRef.current = null;
        }
        return 0;
      }

      if (logoClickTimeoutRef.current) {
        window.clearTimeout(logoClickTimeoutRef.current);
      }

      logoClickTimeoutRef.current = window.setTimeout(() => {
        setLogoClickCount(0);
        logoClickTimeoutRef.current = null;
      }, 2000);

      return nextCount;
    });
  }

  function handleTelefoneChange(event) {
    setTelefone(formatPhone(event.target.value));
  }

  function handleDataNascimentoChange(event) {
    setDataNascimento(formatDateInput(event.target.value));
  }

  function toggleTipoUsuario() {
    const next = tipoUsuario === 'nutricionista' ? 'paciente' : 'nutricionista';
    setTipoUsuario(next);
    setEmail('');
    setPassword('');
    setTelefone('');
    setDataNascimento('');
    setErrorMessage('');
  }

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    try {
      if (!adminEmail || !adminPassword) {
        throw new Error('Por favor, preencha email e senha do administrador.');
      }

      const response = await fetch(API_ADMIN_LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail, senha: adminPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Admin login failed', response.status, data);
        const message = data?.error || data?.message || `Erro de backend ${response.status}`;
        throw new Error(message);
      }

      const { token, user } = data;
      if (!token) {
        throw new Error('Resposta inesperada do servidor. Tente novamente.');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', 'admin');
      setMensagemBemVindo('Bem-vindo, Administrador! Redirecionando para o painel...');
      setExibirBemVindo(true);

      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (error) {
      setAdminError(error?.message || 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      let response;
      let data;

      if (tipoUsuario === 'paciente') {
        const rawPhone = onlyNumbers(telefone);
        const formattedDate = brazilianToIsoDate(dataNascimento);

        if (!rawPhone || !formattedDate) {
          setErrorMessage('Por favor, preencha telefone e data de nascimento no formato DD/MM/AAAA.');
          setLoading(false);
          return;
        }

        response = await fetch(API_PATIENT_LOGIN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telefone: rawPhone, data_nascimento: formattedDate }),
        });
        data = await response.json();

        if (!response.ok) {
          const backendError = data?.error || data?.message || 'Credenciais inválidas. Tente novamente.';
          setErrorMessage(backendError);
          return;
        }

        const { token } = data;
        if (!token) {
          setErrorMessage('Resposta inesperada do servidor. Tente novamente mais tarde.');
          return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.setItem('patientToken', token);
        localStorage.setItem('authUser', 'paciente');
        setMensagemBemVindo('Bem-vindo ao seu portal de saúde! 🌟 Preparando suas substituições alimentares...');
        setExibirBemVindo(true);
        setTimeout(() => {
          router.push('/paciente/dashboard');
        }, 2000);
        return;
      }

      if (!email || !password) {
        setErrorMessage('Por favor, preencha o email e a senha.');
        return;
      }

      response = await fetch(API_LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha: password }),
      });
      data = await response.json();

      if (!response.ok) {
        const backendError = data?.error || data?.message || 'Credenciais inválidas. Tente novamente.';
        setErrorMessage(backendError);
        return;
      }

      const { token, user } = data;
      if (!token) {
        setErrorMessage('Resposta inesperada do servidor. Tente novamente mais tarde.');
        return;
      }

      // Salva token no localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);

      // Tenta determinar o role: primeiro pelo objeto user retornado, depois pelo payload do JWT
      let role = user?.role || user?.tipo || user?.roleName;
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          role = role || payload.role || payload?.roles || payload?.roleName;
        }
      } catch (e) {
        // não crítico — seguimos com o que temos
      }

      const isAdmin = role && String(role).toLowerCase() === 'admin';
      const isNataliaFlow = String(email).trim().toLowerCase() === 'natalia@gmail.com' || String(user?.email || '').trim().toLowerCase() === 'natalia@gmail.com';

      if (isAdmin) {
        localStorage.setItem('authUser', 'admin');
        setMensagemBemVindo('Bem-vindo, Administrador! Redirecionando para o painel...');
        setExibirBemVindo(true);
        setTimeout(() => {
          router.push('/admin');
        }, 1200);
        return;
      }

      if (isNataliaFlow) {
        localStorage.setItem('authUser', 'natalia');
        setMensagemBemVindo('Bem-vinda, Natália! Preparando a captura automática...');
        setExibirBemVindo(true);
        setTimeout(() => {
          router.push('/capture');
        }, 1200);
        return;
      }

      // default: nutricionista
      localStorage.setItem('authUser', 'nutricionista');
      setMensagemBemVindo('Bem-vindo à ferramenta que facilita a vida de seus pacientes! Carregando sua plataforma...');
      setExibirBemVindo(true);
      setTimeout(() => {
        router.push('/nutricionista/dashboard');
      }, 1200);
      return;
    } catch (error) {
      setErrorMessage(error?.message || 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (exibirBemVindo) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3AAB59 0%, #2d8a47 100%)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>

        <p
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 450,
            lineHeight: 1.5,
          }}
        >
          {mensagemBemVindo}
        </p>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#ffffff,#f5f5f5)',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 30,
          borderRadius: 20,
          border: '1px solid #ddd',
          background: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <BackButton href="/" />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            onClick={handleLogoClick}
            onMouseEnter={handleLogoMouseEnter}
            onMouseLeave={handleLogoMouseLeave}
            className="relative inline-flex items-center justify-center"
            style={{ display: 'inline-flex' }}
          >
            {showEasterEgg && (
              <div className="fixed top-1/4 left-1/2 z-50 -translate-x-1/2 flex h-[160px] w-[160px] items-center justify-center">
                <div className="w-28 h-28 flex items-center justify-center overflow-hidden relative">
                  <img
                    src="/BEBE/frame1.png"
                    alt="bebê"
                    className="w-full h-full object-contain"
                    style={{ animation: 'frameShow1 6s steps(4, end) infinite' }}
                  />
                  <img
                    src="/BEBE/frame2.png"
                    alt="bebê"
                    className="absolute w-full h-full object-contain"
                    style={{ animation: 'frameShow2 6s steps(4, end) infinite' }}
                  />
                  <img
                    src="/BEBE/frame3.png"
                    alt="bebê"
                    className="absolute w-full h-full object-contain"
                    style={{ animation: 'frameShow3 6s steps(4, end) infinite' }}
                  />
                  <img
                    src="/BEBE/frame4.png"
                    alt="bebê"
                    className="absolute w-full h-full object-contain"
                    style={{ animation: 'frameShow4 6s steps(4, end) infinite' }}
                  />
                </div>
              </div>
            )}
            <img src="/logo.png" style={{ height: 50, cursor: 'pointer' }} alt="Equivale" />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          {tipoUsuario === 'nutricionista' ? (
            <>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                }}
                disabled={loading}
              />

              <div style={{ position: 'relative', marginBottom: 20 }}>
                <input
                  placeholder="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 80px 12px 12px',
                    borderRadius: 10,
                    border: '1px solid #ccc',
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#2563EB',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '4px 8px',
                  }}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                placeholder="Telefone"
                type="tel"
                value={telefone}
                onChange={handleTelefoneChange}
                style={{
                  width: '100%',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                }}
                disabled={loading}
              />

              <input
                placeholder="Data de nascimento"
                type="text"
                value={dataNascimento}
                onChange={handleDataNascimentoChange}
                maxLength={10}
                style={{
                  width: '100%',
                  padding: 12,
                  marginBottom: 20,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                }}
                disabled={loading}
              />
            </>
          )}

          {errorMessage && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 10,
                background: '#FFEAEA',
                color: '#A41C1C',
                border: '1px solid #F5C2C2',
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              background: loading ? '#96D6A5' : '#3AAB59',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            onClick={toggleTipoUsuario}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              cursor: 'pointer',
              fontSize: 14,
              textDecoration: 'underline',
            }}
          >
            {tipoUsuario === 'nutricionista' ? 'É paciente? Entre aqui' : 'Acesso profissional'}
          </button>
        </div>
      </div>

      {showAdminLogin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 30px 75px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Login Admin</p>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#555' }}>
                  Clique 3 vezes na logo para abrir este acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdminSubmit}>
              <input
                placeholder="Email do Administrador"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 10,
                  border: '1px solid #ccc',
                }}
                disabled={adminLoading}
              />
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input
                  placeholder="Senha do Administrador"
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 110px 12px 12px',
                    borderRadius: 10,
                    border: '1px solid #ccc',
                  }}
                  disabled={adminLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#2563EB',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '4px 8px',
                  }}
                >
                  {showAdminPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {adminError && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 10,
                    background: '#FFEAEA',
                    color: '#A41C1C',
                    border: '1px solid #F5C2C2',
                  }}
                >
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  background: adminLoading ? '#96D6A5' : '#3AAB59',
                  color: '#fff',
                  border: 'none',
                  cursor: adminLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {adminLoading ? 'Autenticando admin...' : 'Entrar como Administrador'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes frameShow1 {
          0%, 24.99% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }
        @keyframes frameShow2 {
          25%, 49.99% { opacity: 1; }
          0%, 24.99%, 50%, 100% { opacity: 0; }
        }
        @keyframes frameShow3 {
          50%, 74.99% { opacity: 1; }
          0%, 49.99%, 75%, 100% { opacity: 0; }
        }
        @keyframes frameShow4 {
          75%, 99.99% { opacity: 1; }
          0%, 74.99%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Export principal envelopado no Suspense exigido pelo Next.js e pela Vercel
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#666' }}>
        Carregando formulário...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
