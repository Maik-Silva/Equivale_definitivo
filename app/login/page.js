"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackButton from '@/components/back-button';

const API_LOGIN_URL = 'https://backend-production-e77b.up.railway.app/api/auth/login';
const API_PATIENT_LOGIN_URL = 'https://backend-production-e77b.up.railway.app/api/auth/login-paciente';

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

export default function LoginPage() {
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
  const [exibirBemVindo, setExibirBemVindo] = useState(false);
  const [mensagemBemVindo, setMensagemBemVindo] = useState('');
  const logoTimeoutRef = useRef(null);

  useEffect(() => {
    const usuario = searchParams?.get('usuario');
    if (usuario === 'paciente') {
      setTipoUsuario('paciente');
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (logoTimeoutRef.current) window.clearTimeout(logoTimeoutRef.current);
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

  function handleTelefoneChange(event) {
    setTelefone(formatPhone(event.target.value));
  }

  function handleDataNascimentoChange(event) {
    setDataNascimento(formatDateInput(event.target.value));
  }

  function toggleTipoUsuario() {
    const next = tipoUsuario === 'nutricionista' ? 'paciente' : 'nutricionista';
    setTipoUsuario(next);
    // limpar todos os campos para evitar mistura de valores
    setEmail('');
    setPassword('');
    setTelefone('');
    setDataNascimento('');
    setErrorMessage('');
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

      const { token } = data;
      if (!token) {
        setErrorMessage('Resposta inesperada do servidor. Tente novamente mais tarde.');
        return;
      }

        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', 'nutricionista');
        setMensagemBemVindo('Bem-vindo à ferramenta que facilita a vida de seus pacientes! Carregando sua plataforma...');
        setExibirBemVindo(true);
        setTimeout(() => {
          router.push('/nutricionista/dashboard');
        }, 2000);
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

              <input
                placeholder="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
      <style jsx>{`
        @keyframes frameShow1 {
          0%, 24.99% {
            opacity: 1;
          }
          25%, 100% {
            opacity: 0;
          }
        }

        @keyframes frameShow2 {
          25%, 49.99% {
            opacity: 1;
          }
          0%, 24.99%, 50%, 100% {
            opacity: 0;
          }
        }

        @keyframes frameShow3 {
          50%, 74.99% {
            opacity: 1;
          }
          0%, 49.99%, 75%, 100% {
            opacity: 0;
          }
        }

        @keyframes frameShow4 {
          75%, 99.99% {
            opacity: 1;
          }
          0%, 74.99%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
