'use client';

import { useEffect, useRef, useState } from 'react';
import { buscarAlimentos } from '@/lib/api-equivalencia';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

/**
 * Componente de busca de alimentos da tabela banco_equivale
 * Usa debounce para evitar múltiplas requisições
 */
export function AlimentoSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Ex: arroz',
  id,
  label,
  className,
  debounceDelay = 300,
  minChars = 2,
  maxSuggestions = 10,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  // Busca sugestões quando o valor muda
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value?.trim() || value.trim().length < minChars) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await buscarAlimentos(value, {
          limit: maxSuggestions,
        });
        setSuggestions(results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erro ao buscar alimentos:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceDelay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, debounceDelay, minChars, maxSuggestions]);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSuggestion = (suggestion) => {
    const alimentoNome = typeof suggestion === 'string' ? suggestion : suggestion.nome || suggestion;
    onChange({ target: { value: alimentoNome } });
    if (onSelect) {
      onSelect(alimentoNome, suggestion);
    }
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 block mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-3xl border border-slate-200 bg-white shadow-lg">
          <ul className="divide-y divide-slate-200">
            {suggestions.map((suggestion, index) => {
              const displayName =
                typeof suggestion === 'string' ? suggestion : suggestion.nome || suggestion;

              return (
                <li key={`${displayName}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                  >
                    <p className="font-medium text-slate-900">{displayName}</p>
                    {typeof suggestion === 'object' && suggestion.grupo && (
                      <p className="text-xs text-slate-500 mt-1">
                        Grupo: {suggestion.grupo}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
