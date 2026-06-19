"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import BackButton from '@/components/back-button';
import { BrandLogo } from '@/components/brand';

const BACKEND_API_URL = 'https://backend-production-e77b.up.railway.app';
const PATIENT_PROFILE_URL = `${BACKEND_API_URL}/api/pacientes/perfil`;
const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || 'https://docs.google.com/forms/u/0/d/e/ID-DO-FORMULARIO/formResponse';
const GOOGLE_FORM_ENTRY_NAME = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_NAME || 'entry.XXXXXXXXX';
const GOOGLE_FORM_ENTRY_REASON = process.env.NEXT_PUBLIC_GOOGLE_FORM_ENTRY_REASON || 'entry.YYYYYYYYY';

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function normalizeSuggestions(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.sugestoes)) return payload.sugestoes;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
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

function extractGroupFields(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };

  let baseGroup = pick(payload, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
  let substituteGroup = pick(payload, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);

  const eq = payload.equivalencia || payload.equivalent || payload.equivalente || payload || {};
  if (eq && typeof eq === 'object') {
    if (!baseGroup) baseGroup = pick(eq, ['baseGroup', 'base_group', 'grupo_base', 'grupoBase']);
    if (!substituteGroup) substituteGroup = pick(eq, ['substituteGroup', 'substitute_group', 'grupo_substituto', 'substituto']);
  }

  if (!baseGroup && payload.base && typeof payload.base === 'object') baseGroup = pick(payload.base, ['group', 'grupo', 'grupo_base']);
  if (!substituteGroup && payload.substitute && typeof payload.substitute === 'object') substituteGroup = pick(payload.substitute, ['group', 'grupo', 'grupo_substituto']);

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
    { keys: ['leite', 'queijo', 'iogurte', 'condensado'], group: 'leite_e_derivados' },
    { keys: ['carne', 'frango', 'peixe', 'ovo', 'ovos', 'bife'], group: 'carnes_e_ovos' },
    { keys: ['banana', 'maçã', 'maca', 'laranja', 'pera', 'morango', 'abacate', 'uva', 'fruta'], group: 'frutas' },
    { keys: ['alface', 'couve', 'espinafre', 'cenoura', 'tomate', 'beterraba', 'pepino', 'verdura', 'legume'], group: 'verduras_e_legumes' },
    { keys: ['feijão', 'feijao', 'lentilha', 'grão-de-bico', 'grao-de-bico', 'grão', 'ervilha'], group: 'leguminosas' },
    { keys: ['azeite', 'óleo', 'oleo', 'manteiga', 'margarina'], group: 'gorduras_e_oleos' },
    { keys: ['açúcar', 'acucar', 'mel', 'doce', 'chocolate'], group: 'acucares_e_doces' },
  ];

  for (const check of checks) {
    for (const k of check.keys) {
      if (n.includes(k)) return check.group;
    }
  }

  return undefined;
}

function getResponseText(payload, baseFood, quantity) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (payload.result) return payload.result;
  if (payload.message) return payload.message;
  if (payload.text) return payload.text;

  const equivalencia = payload.equivalencia || payload.equivalent || payload.equivalente || payload || {};

  const amount = equivalencia.quantidade
    || equivalencia.quantidade_equivalente
    || equivalencia.qtd
    || equivalencia.quantidadeSubstituto
    || equivalencia.quantidade
    || payload.equivalentQuantity
    || payload.equivalent_quantity
    || payload.equivalent
    || payload.baseQuantity
    || payload.base_quantity;

  const substitute = equivalencia.substituto
    || equivalencia.alimento_substituto
    || equivalencia.substituicao
    || equivalencia.alimento
    || equivalencia.substituto
    || payload.substituteFood
    || payload.substitute_food
    || payload.alimento_substituto
    || payload.substituto
    || payload.alimento
    || payload.substitute;

  if (amount && substitute) {
    return `${quantity.trim()}g de ${baseFood.trim()} equivale a ${formatQuantity(amount)} de ${substitute}.`;
  }

  return `Não foi possível interpretar o resultado. Verifique os dados e tente novamente.`;
}

function getGroupWarning(payload, baseFood, substituteFood) {
  if (!payload) return '';
  const fields = extractGroupFields(payload);
  const warning = buildGroupWarning(baseFood.trim(), substituteFood.trim(), fields.baseGroup, fields.substituteGroup);
  if (warning) return warning;
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

function parseResult(payload, baseFood, substituteFood, quantity) {
  if (!payload) return 'Nenhum resultado recebido.';
  if (typeof payload === 'string') return payload;
  if (payload.result || payload.message || payload.text) return payload.result || payload.message || payload.text;

  const equivalencia = payload.equivalencia || payload.equivalent || payload.equivalente || payload || {};
  const amount = equivalencia.quantidade || equivalencia.quantidade_equivalente || equivalencia.qtd || equivalencia.quantidadeSubstituto || payload.quantidade || payload.amount;
  const substitute = equivalencia.substituto || equivalencia.alimento_substituto || equivalencia.substituicao || equivalencia.substituto || payload.substitute || payload.substituteFood;

  if (amount && substitute) {
    return `${quantity.trim()}g de ${baseFood.trim()} equivale a ${amount} de ${substitute}.`;
  }

  return JSON.stringify(payload, null, 2);
}

export default function PacienteDashboardPage() {
  const router = useRouter();
  const [pacienteNome, setPacienteNome] = useState('Paciente');
  const [nutricionista, setNutricionista] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [baseQuery, setBaseQuery] = useState('');
  const [subQuery, setSubQuery] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [resultText, setResultText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [groupWarning, setGroupWarning] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionReason, setSuggestionReason] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState('');
  const [baseOptions, setBaseOptions] = useState([]);
  const [subOptions, setSubOptions] = useState([]);
  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const baseTimer = useRef(null);
  const subTimer = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('patientToken');
    if (!token) {
      router.push('/login');
      return;
    }

    async function fetchPerfil() {
      setLoadingPerfil(true);
      setErrorMessage('');

      try {
        const response = await fetch(PATIENT_PROFILE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Não foi possível carregar o perfil.');
        }

        const paciente = data?.paciente || data;
        setPacienteNome(paciente?.nome || paciente?.nome_paciente || data?.nome || 'Paciente');
        setNutricionista(data?.nutricionista || data?.nutri || data?.profissional || null);
      } catch (error) {
        setErrorMessage(error?.message || 'Erro ao carregar os dados do perfil.');
      } finally {
        setLoadingPerfil(false);
      }
    }

    fetchPerfil();
  }, [router]);

  async function loadSuggestions(value, setOptions) {
    if (!value || value.trim().length < 2) {
      setOptions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/sugestoes?query=${encodeURIComponent(value.trim())}`);
      if (!response.ok) {
        setOptions([]);
        return;
      }
      const payload = await response.json();
      const suggestions = normalizeSuggestions(payload)
        .map(formatSuggestionItem)
        .filter(Boolean);
      setOptions([...new Set(suggestions)].slice(0, 8));
    } catch (error) {
      setOptions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleBaseQueryChange(event) {
    const value = event.target.value;
    setBaseQuery(value);
    setBaseOptions([]);
    window.clearTimeout(baseTimer.current);
    baseTimer.current = window.setTimeout(() => loadSuggestions(value, setBaseOptions), 300);
  }

  function handleSubQueryChange(event) {
    const value = event.target.value;
    setSubQuery(value);
    setSubOptions([]);
    window.clearTimeout(subTimer.current);
    subTimer.current = window.setTimeout(() => loadSuggestions(value, setSubOptions), 300);
  }

  function handleSelectBase(option) {
    setBaseQuery(option);
    setBaseOptions([]);
  }

  function handleSelectSub(option) {
    setSubQuery(option);
    setSubOptions([]);
  }

  async function handleCalculate(event) {
    event.preventDefault();
    setErrorMessage('');
    setResultText('');
    setGroupWarning('');

    if (!baseQuery.trim() || !subQuery.trim() || !quantity.trim()) {
      setErrorMessage('Preencha alimento base, substituto e quantidade.');
      return;
    }

    setLoadingCalculation(true);

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/equivalencia?baseFood=${encodeURIComponent(baseQuery.trim())}&substituteFood=${encodeURIComponent(subQuery.trim())}&baseQuantity=${encodeURIComponent(quantity.trim())}`
      );
      const payload = await response.json();
      const parsed = getResponseText(payload, baseQuery, quantity);
      const warning = getGroupWarning(payload, baseQuery, subQuery);
      setResultText(parsed);
      setGroupWarning(warning);
    } catch (error) {
      setErrorMessage('Não foi possível calcular a equivalência.');
    } finally {
      setLoadingCalculation(false);
    }
  }

  async function handleSuggestionSubmit(event) {
    event.preventDefault();
    if (!suggestionText.trim() || !suggestionReason.trim()) {
      setSuggestionStatus('Preencha o alimento e o motivo da sugestão.');
      return;
    }

    setSuggestionStatus('Enviando sugestão...');
    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          [GOOGLE_FORM_ENTRY_NAME]: suggestionText.trim(),
          [GOOGLE_FORM_ENTRY_REASON]: suggestionReason.trim(),
        }).toString(),
      });
      setSuggestionText('');
      setSuggestionReason('');
      setSuggestionStatus('Sugestão enviada com sucesso!');
    } catch (error) {
      setSuggestionStatus('Erro ao enviar sugestão. Tente novamente.');
    }
  }

  const whatsappNumber = onlyDigits(nutricionista?.whatsapp || nutricionista?.telefone || '');
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  function handleLogout() {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href={null} size="md" className="h-10 w-auto" />
            <div>
              <p className="text-base font-semibold text-slate-900">Equivale</p>
              <p className="text-sm text-slate-500">Painel do paciente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <BackButton href="/login" />
        </div>

        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Nutricionista</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{nutricionista?.nome || 'Nutricionista'}</h1>
                <p className="mt-2 text-sm text-slate-600">{nutricionista?.especialidade || 'Especialidade não informada'}</p>
                <p className="mt-1 text-sm text-slate-600">{nutricionista?.crn ? `CRN ${nutricionista.crn}` : 'CRN não informado'}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Olá, {pacienteNome}. Aqui você pode calcular equivalências indicadas pela sua nutricionista com um visual intuitivo e fiel ao painel profissional.
                </p>
              </div>

              <div className="flex items-center justify-center">
                {nutricionista?.logo_url ? (
                  <img
                    src={nutricionista.logo_url}
                    alt={nutricionista?.nome || 'Nutricionista'}
                    className="h-32 w-32 rounded-[1.5rem] border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                    LOGO
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="alimento-base" className="text-sm font-semibold text-slate-700">Alimento base</label>
                  <input
                    id="alimento-base"
                    value={baseQuery}
                    onChange={handleBaseQueryChange}
                    placeholder="Ex: arroz"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  {baseOptions.length > 0 && (
                    <div className="mt-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <ul className="divide-y divide-slate-200">
                        {baseOptions.map((option) => (
                          <li key={option}>
                            <button
                              type="button"
                              onClick={() => handleSelectBase(option)}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="quantidade" className="text-sm font-semibold text-slate-700">Quantidade em gramas</label>
                  <input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="100"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="alimento-substituto" className="text-sm font-semibold text-slate-700">Alimento substituto</label>
                  <input
                    id="alimento-substituto"
                    value={subQuery}
                    onChange={handleSubQueryChange}
                    placeholder="Ex: batata"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  {subOptions.length > 0 && (
                    <div className="mt-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <ul className="divide-y divide-slate-200">
                        {subOptions.map((option) => (
                          <li key={option}>
                            <button
                              type="button"
                              onClick={() => handleSelectSub(option)}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loadingCalculation}
                  className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                >
                  {loadingCalculation ? 'Calculando...' : 'Calcular equivalência'}
                </button>
                <p className="text-sm text-slate-500">Use os campos acima para buscar a equivalência correta.</p>
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Resultado</p>
            <div className="mt-4 min-h-[86px] text-sm leading-6 text-slate-700">
              {resultText ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
                  <p className="text-base leading-7 font-semibold tracking-tight text-slate-900">{resultText}</p>
                </div>
              ) : loadingPerfil ? (
                'Carregando perfil e resultados...'
              ) : (
                'Digite os dados e clique em calcular para ver a equivalência.'
              )}
            </div>
            {groupWarning ? (
              <div className="mt-4 rounded-3xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-slate-800">
                <p className="text-sm font-semibold text-slate-800">Aviso clínico</p>
                <p className="mt-2 leading-6">{groupWarning}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-900">Não encontrou o alimento?</p>
              <p className="text-sm text-slate-600">Envie sua sugestão para que possamos ampliar o catálogo do Equivale.</p>
            </div>

            <form onSubmit={handleSuggestionSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="sugestao-nome" className="text-sm font-semibold text-slate-700">Alimento sugerido</label>
                <input
                  id="sugestao-nome"
                  value={suggestionText}
                  onChange={(event) => setSuggestionText(event.target.value)}
                  placeholder="Nome do alimento"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sugestao-detalhes" className="text-sm font-semibold text-slate-700">Por que esse alimento deve ser incluído?</label>
                <textarea
                  id="sugestao-detalhes"
                  value={suggestionReason}
                  onChange={(event) => setSuggestionReason(event.target.value)}
                  placeholder="Explique o contexto ou o uso na substituição alimentar"
                  className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Enviar sugestão
              </button>
            </form>
            {suggestionStatus ? (
              <p className="mt-3 text-sm text-slate-700">{suggestionStatus}</p>
            ) : null}
          </section>
        </div>
      </main>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer noopener"
          className="fixed bottom-6 right-6 inline-flex items-center gap-3 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-emerald-600"
        >
          <span>WhatsApp</span>
          <span aria-hidden="true">💬</span>
        </a>
      ) : null}
    </div>
  );
}
