import type { Role } from '@/mock/types';

/**
 * Matriz de permissões do protótipo (proposta da especificação: recepção sem
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
  | 'agenda:gerir'
  | 'odontograma:registrar'
  | 'plano:editar'
  | 'orcamento:emitir'
  | 'orcamento:desconto'
  | 'orcamento:decidir'
  | 'documentos:anexar'
  | 'prontuario:exportar';

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
    'odontograma:registrar',
    'plano:editar',
    'orcamento:emitir',
    'orcamento:desconto',
    'orcamento:decidir',
    'documentos:anexar',
    'prontuario:exportar',
  ],
  // Recepção: emite orçamento e registra a assinatura, mas não altera o plano nem dá desconto (decisão pendente nº 20).
  recepcao: [
    'plano:ver',
    'documentos:ver',
    'anamnese:ver',
    'anamnese:enviar',
    'paciente:cadastrar',
    'agenda:gerir',
    'orcamento:emitir',
    'orcamento:decidir',
    'documentos:anexar',
  ],
};

export function can(role: Role | undefined, permissao: Permissao): boolean {
  return !!role && matriz[role].includes(permissao);
}
