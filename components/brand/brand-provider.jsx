'use client';

import { createContext, useContext, useMemo } from 'react';

/**
 * BrandProvider — Camada de white-label do Equivale.
 *
 * Cada nutricionista poderá ter seu próprio tema (cores, logo, nome).
 * Os tokens são injetados como CSS variables em `--brand-*`, lidos pelo
 * Tailwind (config) e por todos os componentes do design system.
 *
 * Uso:
 *   <BrandProvider theme={{ primary: '58 171 89', dark: '2 48 19', name: 'Dra. Marina' }}>
 *     ...
 *   </BrandProvider>
 *
 * Valores devem ser strings RGB no formato "R G B" (sem vírgulas), pois
 * o Tailwind aplica opacity via rgb(var(--brand-primary) / <alpha-value>).
 */
const BrandContext = createContext(null);

export const DEFAULT_BRAND = {
  name: 'Equivale',
  shortName: 'equivale',
  tagline: 'Plataforma Equivale',
  // Cores em formato RGB triplet (string "R G B")
  primary: '58 171 89',
  primaryHover: '46 142 72',
  dark: '2 48 19',
  accent: '31 122 60',
  soft: '245 245 245',
  logoUrl: null, // futuro: URL da logo personalizada
};

export function BrandProvider({ theme, children }) {
  const merged = useMemo(() => ({ ...DEFAULT_BRAND, ...(theme || {}) }), [theme]);

  const cssVars = {
    '--brand-primary': merged.primary,
    '--brand-primary-hover': merged.primaryHover,
    '--brand-dark': merged.dark,
    '--brand-accent': merged.accent,
    '--brand-soft': merged.soft,
  };

  return (
    <BrandContext.Provider value={merged}>
      <div style={cssVars} className="contents">
        {children}
      </div>
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  return ctx || DEFAULT_BRAND;
}
