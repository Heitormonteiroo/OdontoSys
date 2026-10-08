import { mesesDesde } from '@/lib/dates';
import { normalizar, soDigitos } from '@/lib/text';
import type { Patient } from '@/mock/types';

export const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'alertas', label: 'Com alertas críticos' },
  { id: 'anamnese', label: 'Anamnese pendente' },
  { id: 'andamento', label: 'Tratamento em andamento' },
  { id: 'sem-retorno', label: 'Sem retorno 6+ meses' },
] as const;

export type FiltroId = (typeof FILTROS)[number]['id'];
export type Ordem = 'recentes' | 'nome';

export interface CriterioBusca {
  query: string;
  filtro: FiltroId;
  dentistaId: string; // 'todos' ou id
  ordem: Ordem;
}

function bate(p: Patient, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  // Busca numérica (CPF ou telefone): só dígitos e separadores.
  if (/^[\d\s().+-]+$/.test(q)) {
    const d = soDigitos(q);
    if (d.length === 0) return true;
    return soDigitos(p.cpf ?? '').includes(d) || soDigitos(p.telefone).includes(d);
  }
  return normalizar(p.nome).includes(normalizar(q));
}

export function filtrarPacientes(todos: Patient[], c: CriterioBusca): Patient[] {
  const lista = todos.filter((p) => {
    if (!bate(p, c.query)) return false;
    if (c.dentistaId !== 'todos' && p.dentistaId !== c.dentistaId) return false;
    switch (c.filtro) {
      case 'alertas':
        return p.alertas.length > 0;
      case 'anamnese':
        return p.anamnese === 'pendente';
      case 'andamento':
        return p.tratamento === 'em_andamento';
      case 'sem-retorno':
        return p.ultimoAtendimento !== null && mesesDesde(p.ultimoAtendimento) >= 6;
      default:
        return true;
    }
  });
  if (c.ordem === 'nome') return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return lista.sort((a, b) => (b.ultimoAtendimento ?? '').localeCompare(a.ultimoAtendimento ?? ''));
}

/** "Anticoagulante" (1 alerta) ou "3 alertas" (vários). */
export function resumoAlertas(p: Patient): string {
  if (p.alertas.length === 0) return '';
  if (p.alertas.length === 1) return p.alertas[0].curto;
  return `${p.alertas.length} alertas`;
}
