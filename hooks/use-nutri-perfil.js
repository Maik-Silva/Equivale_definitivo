'use client';

import { useEffect, useState } from 'react';

const PROFILE_URL = 'https://backend-production-e77b.up.railway.app/api/nutri/perfil';
const STORAGE_KEY = 'equivale_brand';

function normalizePerfil(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const logoUrl = data?.logo_url || data?.logo || '';
  return {
    nome: data?.nome || data?.name || data?.email || '',
    crn: data?.crn || '',
    especialidade: data?.especialidade || '',
    whatsapp: data?.whatsapp || '',
    instagram: data?.instagram || '',
    logo: logoUrl,
    logo_url: logoUrl,
    bloquear_grupos_diferentes: data?.bloquear_grupos_diferentes ?? false,
  };
}

function getStoredPerfil() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const normalized = normalizePerfil(parsed);
      if (normalized) {
        return normalized;
      }
    }
  } catch (error) {
    // ignore malformed JSON
  }

  try {
    const rawNutri = localStorage.getItem('nutricionista');
    if (rawNutri) {
      const parsed = JSON.parse(rawNutri);
      return {
        nome: parsed?.nome || parsed?.name || parsed?.email || '',
        crn: '',
        especialidade: '',
        whatsapp: '',
        instagram: '',
        logo: '',
        logo_url: '',
      };
    }
  } catch (error) {
    // ignore malformed JSON
  }

  return null;
}

export function useNutriPerfil() {
  const [perfil, setPerfil] = useState(() => {
    const stored = getStoredPerfil();
    return stored || {
      nome: 'Nutricionista',
      crn: '',
      especialidade: '',
      whatsapp: '',
      instagram: '',
      logo: '',
      logo_url: '',
      bloquear_grupos_diferentes: false,
    };
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const stored = getStoredPerfil();
    if (stored) {
      setPerfil((current) => ({ ...current, ...stored }));
    }

    fetchPerfil(token).catch((error) => {
      console.warn('Erro ao sincronizar perfil do nutricionista:', error?.message || error);
    });
  }, []);

  async function fetchPerfil(token) {
    const response = await fetch(PROFILE_URL, {
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

    const normalized = normalizePerfil(data);
    if (!normalized) {
      throw new Error('Perfil retornado pelo backend possui formato inválido.');
    }

    setPerfil(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Não foi possível salvar perfil no localStorage:', error);
    }

    return normalized;
  }

  return { perfil, fetchPerfil };
}
