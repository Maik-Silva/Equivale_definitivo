/**
 * Serviço de API para equivalência de alimentos
 * Padroniza as chamadas para o novo endpoint unificado: POST /api/equivalencia/verificar
 * e oferece compatibilidade com o endpoint antigo GET /api/equivalencia.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'https://backend-production-e77b.up.railway.app';

function unwrapResponsePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return unwrapResponsePayload(payload.data);
  }

  return payload;
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

/**
 * Verifica a equivalência entre dois alimentos usando a tabela banco_equivale
 * @param {string} alimentoBase - Nome do alimento base
 * @param {string} alimentoSubstituto - Nome do alimento substituto
 * @param {string} quantidade - Quantidade em gramas
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} Resposta da API com { permitido, mensagem, equivalencia, etc }
 */
export async function verificarEquivalencia(
  alimentoBase,
  alimentoSubstituto,
  quantidade = '100',
  confirmado = false,
  options = {}
) {
  if (typeof confirmado === 'object' && confirmado !== null) {
    options = confirmado
    confirmado = false
  }

  if (!alimentoBase?.trim() || !alimentoSubstituto?.trim()) {
    throw new Error('Alimento base e substituto são obrigatórios');
  }

  const baseUrl = API_BASE_URL;
  const bodyPayload = {
    alimento_base: alimentoBase.trim(),
    alimento_substituto: alimentoSubstituto.trim(),
    quantidade: parseInt(quantidade, 10) || 100,
    confirmado: Boolean(confirmado),
    ...options.payload,
  };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: options.token ? `Bearer ${options.token}` : '',
    ...options.headers,
  };

  try {
    const postResponse = await fetch(`${baseUrl}/api/equivalencia/verificar`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    if (postResponse.ok) {
      const data = await postResponse.json();
      return normalizeResponse(data);
    }

    if (postResponse.status === 404) {
      const query = buildQueryString({
        baseFood: alimentoBase.trim(),
        substituteFood: alimentoSubstituto.trim(),
        baseQuantity: parseInt(quantidade, 10) || 100,
      });
      const getResponse = await fetch(`${baseUrl}/api/equivalencia?${query}`, {
        method: 'GET',
        headers,
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        const error = new Error(`Erro ao verificar equivalência: ${getResponse.status}`);
        error.status = getResponse.status;
        error.details = errorText;
        throw error;
      }

      const data = await getResponse.json();
      return normalizeResponse(data);
    }

    const errorText = await postResponse.text();
    const error = new Error(`Erro ao verificar equivalência: ${postResponse.status}`);
    error.status = postResponse.status;
    error.details = errorText;
    throw error;
  } catch (error) {
    console.error('Erro na chamada da API de equivalência:', error);
    throw error;
  }
}

/**
 * Busca sugestões de alimentos da tabela banco_equivale
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Array>} Lista de alimentos sugeridos
 */
export async function buscarAlimentos(query, options = {}) {
  if (!query?.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: options.limit || 10,
      ...options.params,
    });

    const response = await fetch(
      `${API_BASE_URL}/api/equivalencia/sugerir?${params}`,
      {
        headers: {
          Authorization: options.token ? `Bearer ${options.token}` : '',
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (Array.isArray(data.alimentos)) {
      return data.alimentos;
    }
    
    if (Array.isArray(data.sugestoes)) {
      return data.sugestoes;
    }

    return [];
  } catch (error) {
    console.warn('Erro ao buscar alimentos:', error);
    return [];
  }
}

function normalizeResponse(data) {
  const rawData = unwrapResponsePayload(data);

  if (!rawData) {
    return {
      permitido: false,
      mensagem: 'Resposta vazia da API',
      equivalencia: null,
      avisos: [],
      raw: data,
    };
  }

  const equivalencia = rawData.equivalencia || rawData.equivalent || rawData.equivalente || rawData;

  const permitido =
    rawData.permitido !== undefined
      ? rawData.permitido
      : rawData.allowed !== undefined
      ? rawData.allowed
      : rawData.bloqueado !== undefined
      ? !rawData.bloqueado
      : true;
  const bloqueado = rawData.bloqueado === true || rawData.blocked === true;
  const gruposDiferentes =
    equivalencia?.grupos_diferentes ||
    equivalencia?.gruposDiferentes ||
    equivalencia?.grupo_diferente ||
    equivalencia?.grupoDiferente ||
    rawData.grupos_diferentes ||
    rawData.gruposDiferentes ||
    rawData.grupo_diferente ||
    rawData.grupoDiferente ||
    false;

  return {
    permitido,
    bloqueado,
    gruposDiferentes,
    mensagem:
      rawData.mensagem ||
      rawData.message ||
      rawData.aviso ||
      rawData.warning ||
      'Equivalência verificada',
    equivalencia: {
      quantidade:
        equivalencia?.quantidade ||
        equivalencia?.quantidade_equivalente ||
        equivalencia?.qtd ||
        equivalencia?.quantidadeSubstituto ||
        equivalencia?.amount ||
        rawData.quantidade ||
        rawData.quantidade_equivalente ||
        rawData.equivalentQuantity ||
        rawData.equivalent_quantity ||
        rawData.equivalent ||
        null,
      alimento_substituto:
        equivalencia?.alimento_substituto ||
        equivalencia?.substituto ||
        equivalencia?.substituicao ||
        equivalencia?.alimento ||
        equivalencia?.substitute ||
        rawData.alimento_substituto ||
        rawData.substituteFood ||
        rawData.substitute_food ||
        rawData.substitute ||
        null,
      grupo:
        equivalencia?.grupo ||
        rawData.grupo ||
        rawData.baseGroup ||
        rawData.base_group ||
        null,
      grupo_base:
        equivalencia?.grupo_base ||
        rawData.grupo_base ||
        rawData.baseGroup ||
        rawData.base_group ||
        null,
      grupo_substituto:
        equivalencia?.grupo_substituto ||
        rawData.grupo_substituto ||
        rawData.substituteGroup ||
        rawData.substitute_group ||
        null,
      grupos_diferentes: gruposDiferentes,
    },
    avisos: (() => {
      if (Array.isArray(rawData.avisos)) return rawData.avisos;
      if (Array.isArray(rawData.warnings)) return rawData.warnings;
      if (typeof rawData.warning === 'string' && rawData.warning.trim()) return [rawData.warning];
      if (typeof rawData.aviso === 'string' && rawData.aviso.trim()) return [rawData.aviso];
      return [];
    })(),
    raw: rawData,
    originalRaw: data,
  };
}

/**
 * Formata uma quantidade em gramas
 * @param {number|string} quantidade - Quantidade
 * @returns {string} Quantidade formatada com unidade
 */
export function formatarQuantidade(quantidade) {
  if (quantidade == null) return '';

  if (typeof quantidade === 'number') {
    return `${Number(quantidade).toFixed(2)}g`;
  }

  const raw = quantidade
    .toString()
    .trim()
    .replace(/g$/i, '')
    .replace(',', '.');

  const value = Number(raw);

  if (!Number.isNaN(value)) {
    return `${value.toFixed(2)}g`;
  }

  return `${raw}g`;
}

/**
 * Extrai campos de grupo da resposta da API (com fallbacks)
 * @param {Object} payload - Resposta da API
 * @returns {Object} { baseGroup, substituteGroup }
 */
export function extrairGrupos(payload) {
  const rawPayload = unwrapResponsePayload(payload);
  return {
    baseGroup:
      rawPayload?.equivalencia?.grupo_base ||
      rawPayload?.grupo_base ||
      rawPayload?.baseGroup ||
      rawPayload?.base_group ||
      null,
    substituteGroup:
      rawPayload?.equivalencia?.grupo_substituto ||
      rawPayload?.grupo_substituto ||
      rawPayload?.substituteGroup ||
      rawPayload?.substitute_group ||
      null,
  };
}
