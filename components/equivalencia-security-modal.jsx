'use client';

import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function EquivalenciaSecurityModal({
  open,
  onOpenChange,
  message,
  onConfirm,
  isLoading = false,
  alimentoBase,
  alimentoSubstituto,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <DialogTitle className="text-lg">Aviso do Sistema</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm text-slate-600">
            Esta substituição envolve grupos alimentares diferentes. Revise o aviso antes de confirmar a troca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Aviso do Sistema</p>
                <p className="mt-2 text-sm text-amber-800 leading-6">{message}</p>
              </div>
            </div>
          </div>

          {alimentoBase && alimentoSubstituto && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                Troca de Alimentos
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{alimentoBase}</p>
                  <p className="text-xs text-slate-500">Alimento base</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-semibold text-slate-900">{alimentoSubstituto}</p>
                  <p className="text-xs text-slate-500">Substituto</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Você pode continuar</p>
                <p className="mt-2 text-sm text-blue-800">
                  Clique em "Confirmar e continuar" para prosseguir com a atualização da dieta.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onConfirm}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Processando...
              </>
            ) : (
              'Confirmar e continuar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
