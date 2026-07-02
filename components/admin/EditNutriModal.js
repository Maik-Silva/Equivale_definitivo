"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const { getAdminToken, getAdminApiBaseUrl, getAdminHeaders } = require('@/lib/admin-auth');

export default function EditNutriModal({ open, onOpenChange, nutricionista, onSaved }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('ativo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!nutricionista) return;
    setNome(nutricionista.nome || '');
    setEmail(nutricionista.email || '');
    setStatus(nutricionista.status || 'ativo');
    setError('');
  }, [nutricionista]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nutricionista?.id) return;

    setLoading(true);
    setError('');

    const token = getAdminToken();
    if (!token) {
      setError('Token não encontrado. Faça login novamente.');
      setLoading(false);
      return;
    }

    const endpoint = `${getAdminApiBaseUrl()}/api/admin/nutricionistas/${encodeURIComponent(nutricionista.id)}`;
    const payload = JSON.stringify({ nome, email, status });

    try {
      let response = await fetch(endpoint, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: payload,
      });

      let body = await response.json().catch(() => ({}));
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: getAdminHeaders(),
          body: payload,
        });
        body = await response.json().catch(() => ({}));
      }

      if (!response.ok) {
        setError(body?.message || 'Falha ao atualizar o nutricionista.');
        setLoading(false);
        return;
      }

      onSaved?.({
        ...nutricionista,
        nome,
        email,
        status,
      });
      onOpenChange?.(false);
    } catch (err) {
      setError('Erro de rede ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
        <DialogHeader>
          <DialogTitle>Editar Nutricionista</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-slate-600">
            Atualize nome, e-mail e status. As alterações serão enviadas para a API de administração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="nutri-nome">Nome</Label>
            <Input
              id="nutri-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Nome do nutricionista"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="nutri-email">E-mail</Label>
            <Input
              id="nutri-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemplo.com"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="nutri-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger id="nutri-status" className="mt-2">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <DialogFooter className="justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
