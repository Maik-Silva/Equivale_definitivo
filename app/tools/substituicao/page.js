'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Replace, CheckCircle, AlertCircle } from 'lucide-react';
import { ProfileHeader } from '@/components/profile-header';
import { EquivalenciaSecurityModal } from '@/components/equivalencia-security-modal';
import { AlimentoSearchInput } from '@/components/alimento-search-input';
import { verificarEquivalencia, formatarQuantidade } from '@/lib/api-equivalencia';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function SubstituicaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [baseFood, setBaseFood] = useState('');
  const [substituteFood, setSubstituteFood] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [historico, setHistorico] = useState([]);

  // Estados para o modal de segurança
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [pendingData, setPendingData] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }

    // Carrega histórico do localStorage
    try {
      const saved = localStorage.getItem('historicoSubstituicao');
      if (saved) {
        setHistorico(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico:', error);
    }
  }, [router]);

  async function handleCalculate(e) {
    e.preventDefault();

    if (!baseFood.trim() || !substituteFood.trim() || !quantity.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha alimento base, substituto e quantidade.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await verificarEquivalencia(
        baseFood.trim(),
        substituteFood.trim(),
        quantity.trim()
      );

      const isBlocked = response.permitido === false || response.bloqueado === true;
      if (isBlocked) {
        setPendingData({
          baseFood: baseFood.trim(),
          substituteFood: substituteFood.trim(),
          quantity: quantity.trim(),
          response,
        });
        setSecurityMessage(
          response.mensagem || response.message || 'Substituição bloqueada pelo nutricionista.'
        );
        setSecurityModalOpen(true);
        setLoading(false);
        return;
      }

      // Processa resultado normalmente
      processResult(response);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível verificar a substituição.',
      });
    } finally {
      setLoading(false);
    }
  }

  function processResult(response) {
    const amount = response.equivalencia?.quantidade;
    const substitute = response.equivalencia?.alimento_substituto;

    const avisos = Array.isArray(response.avisos) ? [...response.avisos] : [];
    if (
      response.gruposDiferentes === true ||
      response.equivalencia?.grupos_diferentes === true ||
      response.equivalencia?.gruposDiferentes === true ||
      response.raw?.gruposDiferentes === true ||
      response.raw?.grupos_diferentes === true ||
      response.raw?.grupo_diferente === true ||
      response.raw?.data?.gruposDiferentes === true ||
      response.raw?.data?.grupos_diferentes === true
    ) {
      avisos.unshift('Essa troca pode não ser ideal para grupos diferentes.');
    }

    const resultData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      alimentoBase: baseFood.trim(),
      quantidade: quantity.trim(),
      alimentoSubstituto: substitute || substituteFood.trim(),
      quantidadeEquivalente: amount ? formatarQuantidade(amount) : 'N/A',
      permitido: response.permitido,
      mensagem: response.mensagem,
      avisos,
    };

    setResult(resultData);

    // Salva no histórico
    const novoHistorico = [resultData, ...historico].slice(0, 20);
    setHistorico(novoHistorico);
    try {
      localStorage.setItem('historicoSubstituicao', JSON.stringify(novoHistorico));
    } catch (error) {
      console.warn('Erro ao salvar histórico:', error);
    }

    toast({
      title: 'Equivalência calculada',
      description: `${quantity.trim()}g de ${baseFood.trim()} equivale a ${resultData.quantidadeEquivalente} de ${substitute || substituteFood.trim()}`,
    });
  }

  async function handleSecurityConfirm() {
    if (!pendingData) return;

    setConfirming(true);
    try {
      const response = await verificarEquivalencia(
        pendingData.baseFood,
        pendingData.substituteFood,
        pendingData.quantidade,
        true
      );

      processResult(response);
      setSecurityModalOpen(false);
      setPendingData(null);
      
      toast({
        title: 'Substituição confirmada',
        description: 'A substituição foi registrada e a dieta será atualizada.',
      });
    } catch (error) {
      console.error('Erro ao confirmar substituição no servidor:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível confirmar a substituição.',
      });
    } finally {
      setConfirming(false);
    }
  }

  function handleClear() {
    setBaseFood('');
    setSubstituteFood('');
    setQuantity('100');
    setResult(null);
  }

  function handleRemoveHistorico(id) {
    const novoHistorico = historico.filter((item) => item.id !== id);
    setHistorico(novoHistorico);
    try {
      localStorage.setItem('historicoSubstituicao', JSON.stringify(novoHistorico));
    } catch (error) {
      console.warn('Erro ao salvar histórico:', error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <EquivalenciaSecurityModal
        open={securityModalOpen}
        onOpenChange={setSecurityModalOpen}
        message={securityMessage}
        onConfirm={handleSecurityConfirm}
        isLoading={confirming}
        alimentoBase={pendingData?.baseFood}
        alimentoSubstituto={pendingData?.substituteFood}
      />

      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Link
              href="/nutricionista/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
            <BrandLogo href={null} size="sm" className="w-20" />
          </div>
          <ProfileHeader />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Replace className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Substituição de Alimentos</h1>
              <p className="text-slate-600">
                Ferramenta para encontrar alternativas equivalentes com base na tabela banco_equivale.
              </p>
            </div>
          </div>

          {/* Formulário */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Calcular equivalência</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-1">
                    <AlimentoSearchInput
                      id="alimento-base"
                      label="Alimento base"
                      value={baseFood}
                      onChange={(e) => setBaseFood(e.target.value)}
                      placeholder="Ex: arroz"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-1">
                    <label htmlFor="quantidade" className="text-sm font-semibold text-slate-700">
                      Quantidade (g)
                    </label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-1">
                    <AlimentoSearchInput
                      id="alimento-substituto"
                      label="Alimento substituto"
                      value={substituteFood}
                      onChange={(e) => setSubstituteFood(e.target.value)}
                      placeholder="Ex: batata"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="default" disabled={loading}>
                    {loading ? 'Verificando...' : 'Calcular substituição'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Resultado */}
          {result && (
            <Card className="mb-8 border-emerald-200 bg-emerald-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 flex-shrink-0 text-emerald-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-900">Equivalência calculada</p>
                      <p className="mt-2 text-sm text-emerald-800">
                        <span className="font-semibold">{result.quantidade}g</span> de{' '}
                        <span className="font-semibold">{result.alimentoBase}</span> equivale a{' '}
                        <span className="font-semibold text-emerald-700">{result.quantidadeEquivalente}</span>{' '}
                        de <span className="font-semibold">{result.alimentoSubstituto}</span>
                      </p>
                    </div>
                  </div>

                  {result.avisos?.length > 0 && (
                    <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">Avisos:</p>
                      <ul className="mt-2 space-y-1">
                        {result.avisos.map((aviso, idx) => (
                          <li key={idx} className="text-sm text-amber-800">
                            • {aviso}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          {historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de substituições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {historico.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
                    >
                      <div>
                        <p className="text-xs text-slate-500">{item.timestamp}</p>
                        <p className="font-medium text-slate-900">
                          {item.quantidade}g de {item.alimentoBase}{' '}
                          <span className="text-slate-400">→</span> {item.quantidadeEquivalente} de{' '}
                          {item.alimentoSubstituto}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHistorico(item.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
