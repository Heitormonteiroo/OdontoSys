import type { Role } from '@/mock/types';

/**
 * Matriz de permissões do protótipo (proposta do CLAUDE.md: recepção sem
 * acesso ao registro clínico). No sistema real isto vira RLS + checagem no servidor.
 */
export type Permissao =
  | 'prontuario:ver'
  | 'odontograma:ver'
  | 'plano:ver'
  | 'documentos:ver'
  | 'anamnese:ver'
  | 'anamnese:enviar'
  | 'receita:emitir'
  | 'evolucao:registrar'
  | 'paciente:cadastrar'
  | 'agenda:gerir';

const matriz: Record<Role, Permissao[]> = {
  dentista: [
    'prontuario:ver',
    'odontograma:ver',
    'plano:ver',
    'documentos:ver',
    'anamnese:ver',
    'anamnese:enviar',
    'receita:emitir',
    'evolucao:registrar',
    'paciente:cadastrar',
    'agenda:gerir',
  ],
  recepcao: ['plano:ver', 'documentos:ver', 'anamnese:ver', 'anamnese:enviar', 'paciente:cadastrar', 'agenda:gerir'],
};

export function can(role: Role | undefined, permissao: Permissao): boolean {
  return !!role && matriz[role].includes(permissao);
}
