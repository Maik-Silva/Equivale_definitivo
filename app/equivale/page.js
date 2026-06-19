"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import BackButton from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNutriPerfil } from '@/hooks/use-nutri-perfil';
import { Toaster } from '@/components/ui/toaster';

const defaultBrand = {
  nome: 'Nutricionista',
  crn: '',
  especialidade: 'Especialidade',
  whatsapp: '',
  instagram: '',
  logo: '',
};

function normalizeSuggestions(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const items = payload.sugestoes || payload.results || payload.data || payload.items;
  if (Array.isArray(items)) return items;
  return [];
}

function formatSuggestionItem(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return item.nome || item.name || item.alimento || item.label || item.value || '';
  }
  return '';
}

function formatCrn(crn) {
  const value = crn?.toString().trim();
  if (!value) return '';
  const normalized = value.replace(/^CRN\s*/i, '').trim();
  return normalized ? `CRN ${normalized}` : '';
}

const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/1FAIpQLSfDi33Amzo6L_j7X_YCSuEhZJxZohNazm3e7rDYX23Mm7kLnA/formResponse';
const GOOGLE_FORM_ENTRY_NAME = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_NAME || 'entry.1297131437';

// Client-side helper: forward suggestion to our server API which posts to Google Forms
async function sendSuggestionClient(name, details) {
  try {
    return await fetch('/api/send-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ suggestionName: name, suggestionDetails: details }),
    });
  } catch (error) {
    console.error('Erro ao chamar /api/send-suggestion:', error);
    throw error;
  }
}

function formatGroup(group) {
  if (!group) return '';
  const normalized = group.toString().trim().toLowerCase();
  const map = {
    cereais_e_tuberculos: 'cereais e tubérculos',
    leite_e_derivados: 'leite e derivados',
    carnes_e_ovos: 'carnes e ovos',
    frutas: 'frutas',
    verduras_e_legumes: 'verduras e legumes',
    leguminosas: 'leguminosas',
    gorduras_e_oleos: 'gorduras e óleos',
    acucares_e_doces: 'açúcares e doces',
  };

  return map[normalized] || normalized.replace(/_/g, ' ');
}

function extractGroupFields(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  // try top-level
  let baseGroup = pick(payload, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
  let substituteGroup = pick(payload, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);

  // try common nested containers
  if (!baseGroup) baseGroup = pick(payload?.grupos, ['base', 'grupo_base', 'grupoBase']);
  if (!substituteGroup) substituteGroup = pick(payload?.grupos, ['substituto', 'substitute', 'substitute_group']);
  if (!baseGroup) baseGroup = pick(payload?.groups, ['base', 'baseGroup']);
  if (!substituteGroup) substituteGroup = pick(payload?.groups, ['substitute', 'substituteGroup']);

  // try inside equivalencia/equivalente payloads
  const eq = payload.equivalencia || payload.equivalent || payload.equivalente || payload.equivalencia || payload?.equivalencia || payload?.equivalent || payload?.equivalente || payload?.equivalencia;
  if (eq && typeof eq === 'object') {
    if (!baseGroup) baseGroup = pick(eq, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
    if (!substituteGroup) substituteGroup = pick(eq, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);
    if (!baseGroup) baseGroup = pick(eq?.grupos, ['base', 'grupo_base']);
    if (!substituteGroup) substituteGroup = pick(eq?.grupos, ['substituto', 'substitute']);
    if (!baseGroup) baseGroup = pick(eq?.groups, ['base']);
    if (!substituteGroup) substituteGroup = pick(eq?.groups, ['substitute']);
  }

  // try other nested shapes like payload.base.group or payload.base.grupo
  if (!baseGroup && payload.base && typeof payload.base === 'object') {
    baseGroup = pick(payload.base, ['group', 'grupo', 'grupo_base']);
  }
  if (!substituteGroup && payload.substitute && typeof payload.substitute === 'object') {
    substituteGroup = pick(payload.substitute, ['group', 'grupo', 'grupo_substituto']);
  }

  return { baseGroup, substituteGroup };
}

function buildGroupWarning(baseFood, substituteFood, baseGroup, substituteGroup) {
  if (!baseGroup || !substituteGroup || baseGroup === substituteGroup) return '';
  const formattedBase = formatGroup(baseGroup);
  const formattedSubstitute = formatGroup(substituteGroup);
  return `⚠️ Atenção: esta substituição envolve grupos alimentares diferentes, podendo alterar o perfil nutricional da refeição. "${baseFood}" pertence ao grupo ${formattedBase} e "${substituteFood}" ao grupo ${formattedSubstitute}.`;
}

function inferGroupFromName(name) {
  if (!name || typeof name !== 'string') return undefined;
  const n = name.toLowerCase();

  const checks = [
    { keys: ['arroz', 'trigo', 'aveia', 'milho', 'macarr', 'massa', 'pão', 'cereal', 'batata', 'mandioca', 'inhame', 'tuberculo'], group: 'cereais_e_tuberculos' },
    { keys: ['leite', 'queijo', 'iogurte', 'condensado', 'leite condensado', 'leite condensado'], group: 'leite_e_derivados' },
    { keys: ['carne', 'frango', 'peixe', 'ovo', 'ovos', 'bife', 'presunto'], group: 'carnes_e_ovos' },
    { keys: ['banana', 'maçã', 'maca', 'laranja', 'pera', 'morango', 'abacate', 'uva', 'fruta'], group: 'frutas' },
    { keys: ['alface', 'couve', 'espinafre', 'cenoura', 'tomate', 'beterraba', 'pepino', 'verdura', 'legume'], group: 'verduras_e_legumes' },
    { keys: ['feijão', 'feijao', 'lentilha', 'grão-de-bico', 'grao-de-bico', 'grão', 'ervilha', 'leguminosa'], group: 'leguminosas' },
    { keys: ['azeite', 'óleo', 'oleo', 'manteiga', 'margarina', 'óleo', 'gordura'], group: 'gorduras_e_oleos' },
    { keys: ['açúcar', 'acucar', 'mel', 'doce', 'açucarado', 'doce', 'chocolate'], group: 'acucares_e_doces' },
  ];

  for (const check of checks) {
    for (const k of check.keys) {
      if (n.includes(k)) return check.group;
    }
  }

  return undefined;
}

export default function EquivalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [brand, setBrand] = useState(defaultBrand);
  const [baseFood, setBaseFood] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [substituteFood, setSubstituteFood] = useState('');
  const [resultText, setResultText] = useState('');
  const [groupWarning, setGroupWarning] = useState('');
  const [lastPayload, setLastPayload] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [baseOptions, setBaseOptions] = useState([]);
  const [substituteOptions, setSubstituteOptions] = useState([]);
  const [loadingEquivalence, setLoadingEquivalence] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionDetails, setSuggestionDetails] = useState('');
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const baseTimer = useRef(null);
  const substituteTimer = useRef(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  const { perfil } = useNutriPerfil();

  useEffect(() => {
    if (!perfil) return;
    setBrand((current) => ({ ...defaultBrand, ...current, ...perfil }));
  }, [perfil]);

  async function loadSuggestions(value, setOptions) {
    if (!apiUrl || value.trim().length < 2) {
      setOptions([]);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const response = await fetch(`${apiUrl}/api/sugestoes?query=${encodeURIComponent(value.trim())}`);
      if (!response.ok) {
        setOptions([]);
        return;
      }
      const payload = await response.json();
      const suggestions = normalizeSuggestions(payload).map(formatSuggestionItem).filter(Boolean);
      setOptions([...new Set(suggestions)].slice(0, 10));
    } catch (error) {
      setOptions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleBaseFoodChange(event) {
    const value = event.target.value;
    setBaseFood(value);
    window.clearTimeout(baseTimer.current);
    baseTimer.current = window.setTimeout(() => loadSuggestions(value, setBaseOptions), 300);
  }

  function handleSubstituteFoodChange(event) {
    const value = event.target.value;
    setSubstituteFood(value);
    window.clearTimeout(substituteTimer.current);
    substituteTimer.current = window.setTimeout(() => loadSuggestions(value, setSubstituteOptions), 300);
  }

  function formatQuantity(amount) {
    if (amount == null) return '';
    if (typeof amount === 'number') {
      return `${Number(amount).toFixed(amount % 1 === 0 ? 0 : 2)}g`;
    }
    const raw = amount.toString().trim().replace(/g$/i, '').replace(',', '.');
    const value = Number(raw);
    if (!Number.isNaN(value)) {
      return `${value.toFixed(value % 1 === 0 ? 0 : 2)}g`;
    }
    return `${raw}g`;
  }

  function getResponseText(payload) {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (payload.result) return payload.result;
    if (payload.message) return payload.message;
    if (payload.text) return payload.text;

    // Normalize common response shapes
    const equivalencia = payload.equivalencia || payload.equivalent || payload.equivalente || payload || {};

    // Try multiple possible field names (supports older and newer API responses)
    const amount = equivalencia?.quantidade
      || equivalencia?.quantidade_equivalente
      || equivalencia?.qtd
      || equivalencia?.quantidadeSubstituto
      || equivalencia?.quantidade
      || payload.equivalentQuantity
      || payload.equivalent_quantity
      || payload.equivalent
      || payload.baseQuantity
      || payload.base_quantity;

    const substitute = equivalencia?.substituto
      || equivalencia?.alimento_substituto
      || equivalencia?.substituicao
      || equivalencia?.alimento
      || equivalencia?.substituto
      || payload.substituteFood
      || payload.substitute_food
      || payload.alimento_substituto
      || payload.substituto
      || payload.alimento
      || payload.substitute;

    if (amount && substitute) {
      const formattedAmount = formatQuantity(amount);
      return `${quantity.trim()}g de ${baseFood.trim()} equivale a ${formattedAmount} de ${substitute}.`;
    }

    return `Não foi possível interpretar o resultado. Verifique os dados e tente novamente.`;
  }

  function getGroupWarning(payload) {
    if (!payload) return '';
    const fields = extractGroupFields(payload);
    const warning = buildGroupWarning(baseFood.trim(), substituteFood.trim(), fields.baseGroup, fields.substituteGroup);
    if (warning) return warning;
    // Fallback: try to infer groups from the food names when API doesn't return groups
    const inferredBase = inferGroupFromName(baseFood);
    const inferredSub = inferGroupFromName(substituteFood);
    const fallbackWarning = buildGroupWarning(baseFood.trim(), substituteFood.trim(), inferredBase, inferredSub);
    if (fallbackWarning) return fallbackWarning;
    if (payload.warning) return payload.warning;
    if (payload.aviso) return payload.aviso;
    if (payload.gruposDiferentes || payload.grupo_diferente || payload.isDifferentGroup || payload.groupMismatch) {
      return 'Essa troca pode não ser ideal para grupos diferentes.';
    }
    const text = payload.message || payload.result || '';
    if (typeof text === 'string' && /não ideal|não é ideal|não recomend/i.test(text)) {
      return 'Essa troca pode não ser ideal para grupos diferentes.';
    }
    return '';
  }

  async function handleCalculate(event) {
    event.preventDefault();

    if (!baseFood.trim() || !quantity.trim() || !substituteFood.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha alimento base, quantidade e substituto.' });
      return;
    }

    if (!apiUrl) {
      toast({ title: 'API não configurada', description: 'Não foi possível acessar a API de equivalência.' });
      return;
    }

    setLoadingEquivalence(true);
    setResultText('');
    setGroupWarning('');

    try {
      const url = new URL(`${apiUrl}/api/equivalencia`);
      url.searchParams.set('baseFood', baseFood.trim());
      url.searchParams.set('substituteFood', substituteFood.trim());
      url.searchParams.set('baseQuantity', quantity.trim());

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        toast({ title: 'Erro na API', description: errorText || 'Falha ao calcular a equivalência.' });
        return;
      }

      const payload = await response.json();
      // store payload for debugging / inspection
      setLastPayload(payload);
      console.debug('Equivale payload:', payload);
      const responseText = getResponseText(payload);
      const warning = getGroupWarning(payload);

      setResultText(responseText || `Resultado calculado para ${quantity.trim()}g de ${baseFood.trim()}.`);
      setGroupWarning(warning);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível calcular a equivalência.' });
    } finally {
      setLoadingEquivalence(false);
    }
  }

  async function handleSuggestionSubmit(event) {
    event.preventDefault();
    if (!suggestionName.trim() || !suggestionDetails.trim()) {
      toast({ title: 'Preencha o formulário', description: 'Informe o alimento e a razão da sugestão.' });
      return;
    }

    try {
      const res = await sendSuggestionClient(suggestionName.trim(), suggestionDetails.trim());
      if (res.ok) {
        setSuggestionSubmitted(true);
        toast({ title: 'Sugestão enviada', description: 'Sua sugestão foi enviada ao Google Forms.' });
        setSuggestionName('');
        setSuggestionDetails('');
        return;
      }

      const payload = await res.json().catch(() => null);
      console.error('Falha ao enviar sugestão, resposta:', res.status, payload);
      toast({ title: 'Falha ao enviar', description: 'Não foi possível enviar a sugestão ao formulário. Tente novamente.' });
    } catch (error) {
      console.error('Erro ao enviar sugestão para /api/send-suggestion:', error);
      toast({ title: 'Falha ao enviar', description: 'Não foi possível enviar a sugestão ao formulário. Tente novamente.' });
    }
  }

  function handleLogout() {
    localStorage.removeItem('auth');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('patientToken');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href={null} size="md" className="h-10 w-auto" />
            <div>
              <p className="text-base font-semibold text-slate-900">Equivale</p>
              <p className="text-sm text-slate-500">Ferramenta de equivalência alimentar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <BackButton href="/nutricionista/dashboard" />
        </div>
        <div className="mx-auto max-w-5xl">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
              <div className="grid gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  {(brand.logo || brand.logo_url) ? (
                    <img src={brand.logo || brand.logo_url} alt="Logo do nutricionista" className="mx-auto h-24 w-24 rounded-3xl border border-slate-200 object-contain bg-slate-50 p-3" />
                  ) : (
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                      LOGO
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{brand.nome}</h1>
                    <p className="mt-2 text-sm text-slate-600">{brand.especialidade}</p>
                  </div>
                </div>

                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-1">
                      <label htmlFor="alimento-base" className="text-sm font-semibold text-slate-700">Alimento base</label>
                      <Input
                        id="alimento-base"
                        list="base-sugestoes"
                        value={baseFood}
                        onChange={handleBaseFoodChange}
                        placeholder="Ex: arroz"
                      />
                      <datalist id="base-sugestoes">
                        {baseOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <label htmlFor="quantidade" className="text-sm font-semibold text-slate-700">Quantidade em gramas</label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <label htmlFor="alimento-substituto" className="text-sm font-semibold text-slate-700">Alimento substituto</label>
                      <Input
                        id="alimento-substituto"
                        list="substituto-sugestoes"
                        value={substituteFood}
                        onChange={handleSubstituteFoodChange}
                        placeholder="Ex: batata"
                      />
                      <datalist id="substituto-sugestoes">
                        {substituteOptions.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="submit" variant="default" className="w-full sm:w-auto" disabled={loadingEquivalence}>
                      {loadingEquivalence ? 'Calculando...' : 'Calcular substituição'}
                    </Button>
                    <p className="text-sm text-slate-500">Use os campos acima para buscar a equivalência correta.</p>
                  </div>
                </form>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resultado</p>
                  <div className="mt-4">
                    {resultText ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                        <p className="text-base leading-7 font-semibold tracking-tight text-slate-900">{resultText}</p>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-slate-600">Digite os alimentos e clique em calcular para ver a equivalência.</p>
                    )}
                    {groupWarning ? (
                      <div className="mt-4 rounded-3xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-slate-800">
                        <p className="text-sm font-semibold text-slate-800">Aviso clínico</p>
                        <p className="mt-2 leading-6">{groupWarning}</p>
                      </div>
                    ) : null}

                    {/* Debug: raw payload viewer - toggleable */}
                    {lastPayload ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setShowPayload((s) => !s)}
                          className="text-xs text-slate-500 underline"
                        >
                          {showPayload ? 'Ocultar payload bruto' : 'Mostrar payload bruto'}
                        </button>
                        {showPayload ? (
                          <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-100 p-3 text-xs">
                            {JSON.stringify(lastPayload, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">Não encontrou o alimento?</p>
                    <p className="text-sm text-slate-600">Envie sua sugestão para que possamos ampliar o catálogo do Equivale.</p>
                  </div>

                  <form onSubmit={handleSuggestionSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="sugestao-nome" className="text-sm font-semibold text-slate-700">Alimento sugerido</label>
                      <Input
                        id="sugestao-nome"
                        value={suggestionName}
                        onChange={(event) => setSuggestionName(event.target.value)}
                        placeholder="Nome do alimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="sugestao-detalhes" className="text-sm font-semibold text-slate-700">Por que esse alimento deve ser incluído?</label>
                      <Textarea
                        id="sugestao-detalhes"
                        value={suggestionDetails}
                        onChange={(event) => setSuggestionDetails(event.target.value)}
                        placeholder="Explique o contexto ou o uso na substituição alimentar"
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                      Enviar sugestão
                    </Button>
                    {suggestionSubmitted ? (
                      <p className="text-sm text-emerald-700">Sugestão registrada. Obrigado!</p>
                    ) : null}
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto flex flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {(brand.logo || brand.logo_url) ? (
              <img src={brand.logo || brand.logo_url} alt="Logo do nutricionista" className="h-14 w-14 rounded-3xl object-contain bg-slate-50 p-3" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">LOGO</div>
            )}
            <div className="text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{brand.nome}</p>
              {formatCrn(brand.crn) ? <p>{formatCrn(brand.crn)}</p> : null}
            </div>
          </div>
          <div className="grid gap-1 text-sm text-slate-600 sm:text-right">
            {brand.whatsapp ? <p>WhatsApp: {brand.whatsapp}</p> : null}
            {brand.instagram ? <p>Instagram: {brand.instagram}</p> : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
