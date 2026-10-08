import { can, type Permissao } from '@/utils/permissions';
import type { User } from '../types';
import type { AppState } from './types';

export type Resultado<T extends object = object> = ({ ok: true } & T) | { ok: false; erro: string };

export const falha = (erro: string) => ({ ok: false as const, erro });

/** Usuário da sessão, se tiver a permissão (simula a checagem do servidor / RLS). */
export function autorizado(s: AppState, p: Permissao): User | null {
  const u = s.users.find((x) => x.id === s.session?.userId) ?? null;
  return u && can(u.papel, p) ? u : null;
}

/** Próximo número de uma sequência de ids como "E-1045" / "A-1046" (compartilhada). */
export function proximoNumero(ids: string[]): number {
  return ids.reduce((m, id) => Math.max(m, Number(id.replace(/\D/g, '')) || 0), 0) + 1;
}

/** Registros append-only são congelados ao gravar: nem o próprio app consegue alterá-los. */
export const congelar = <T extends object>(x: T): T => Object.freeze(x);
