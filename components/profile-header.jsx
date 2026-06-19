'use client';

import { useNutriPerfil } from '@/hooks/use-nutri-perfil';

export function ProfileHeader({ showName = true, className = '' }) {
  const { perfil } = useNutriPerfil();
  const displayName = perfil?.nome || 'Nutricionista';
  const displayAvatar = perfil?.logo_url || perfil?.logo || null;

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {showName ? (
        <span className="hidden text-sm text-slate-600 sm:inline">Olá, {displayName}</span>
      ) : null}
      {displayAvatar ? (
        <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white">
          <img src={displayAvatar} alt={`${displayName} logo`} className="h-9 w-9 object-cover" />
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
          {displayName?.charAt(0)?.toUpperCase() || 'N'}
        </div>
      )}
    </div>
  );
}
