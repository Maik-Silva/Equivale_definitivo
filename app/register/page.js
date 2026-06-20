"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/back-button';
import { BrandInput, BrandField } from '@/components/brand/brand-input';
import { BrandButton } from '@/components/brand/brand-button';

const API_REGISTER_URL = 'https://backend-production-e77b.up.railway.app/api/auth/register';

const mensagensEspeciais = {
  'maikdk@teste.com': 'Fala, desenvolvedor! 🚀 Teste de transição funcionando 100%. Bora subir esse SaaS para o Netlify!',
  'lohanyrodrigues20@gmail.com': 'Conta criada! O código rodou perfeitamente para receber a pessoa que mais me inspira todos os dias. Ter você testando isso comigo faz tudo valer a pena. Obrigado por ser minha parceira de vida. Te amo!❤️🌟',
  'natalia_ribeiro_@outlook.com.br': 'Prontinho! O sistema avisou que uma usuária especial do banco de dados acabou de se cadastrar. Avisamos os desenvolvedores que a Natalia é uma exceção exclusiva por aqui. É um prazer ter você no site!. ps. não comente dessa tela kkk',
};

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mensagemSurpresa, setMensagemSurpresa] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!nome || !email || !senha || !chaveAcesso) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, chaveAcesso }),
      });

      const data = await response.json();

      if (!response.ok) {
        const backendError = data?.error || data?.message || 'Erro no cadastro. Tente novamente.';
        setErrorMessage(backendError);
        return;
      }

      const emailDigitado = email.toLowerCase().trim();
      const mensagemEspecial = mensagensEspeciais[emailDigitado];

      if (mensagemEspecial) {
        setMensagemSurpresa(mensagemEspecial);
        return;
      }

      setSuccessMessage(data?.message || 'Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => router.push('/login'), 1300);
    } catch (err) {
      setErrorMessage(err?.message || 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (mensagemSurpresa) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col justify-center items-center p-6 text-center" style={{ animation: 'fadeInOverlay 0.35s ease-out' }}>
        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-2xl" style={{ animation: 'fadeInCard 0.45s ease-out' }}>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Mensagem especial</h2>
          <p className="text-base leading-7 text-slate-700 mb-8">{mensagemSurpresa}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Entrar no Sistema
          </button>
        </div>
        <style jsx>{`
          @keyframes fadeInOverlay {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInCard {
            from { transform: translateY(16px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-soft">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-white shadow-lg">

        <div className="mb-4">
          <BackButton href="/" />
        </div>

        <div className="text-center mb-6">
          <img src="/logo.png" className="h-12 mx-auto" alt="Equivale" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <BrandField label="Nome Completo" htmlFor="nome">
            <BrandInput
              id="nome"
              placeholder="Nome Completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
            />
          </BrandField>

          <BrandField label="E-mail" htmlFor="email">
            <BrandInput
              id="email"
              type="email"
              placeholder="seu@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </BrandField>

          <BrandField label="Senha" htmlFor="senha">
            <BrandInput
              id="senha"
              type="password"
              placeholder="Crie uma senha segura"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
            />
          </BrandField>

          <BrandField label="Chave de Convite" htmlFor="chaveAcesso">
            <BrandInput
              id="chaveAcesso"
              placeholder="Coloque a chave de convite"
              value={chaveAcesso}
              onChange={(e) => setChaveAcesso(e.target.value)}
              disabled={loading}
            />
          </BrandField>

          {errorMessage && (
            <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-100">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl p-3 text-sm bg-green-50 text-green-800 border border-green-100">
              {successMessage}
            </div>
          )}

          <div>
            <BrandButton type="submit" disabled={loading} className="w-full">
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </BrandButton>
          </div>
        </form>
      </div>
    </div>
  );
}
