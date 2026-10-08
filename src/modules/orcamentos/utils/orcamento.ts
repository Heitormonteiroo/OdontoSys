import { HOJE } from '@/utils/dates';
import { hashSimulado } from '@/utils/hash';
import type { Quote, QuoteItem, StatusOrcamento } from '@/mock/types';

/** Regras do orçamento (não é controle financeiro: nada de cobrança ou parcelas). Valores em centavos. */
export const somaCentavos = (itens: Pick<QuoteItem, 'precoCentavos'>[]) => itens.reduce((s, i) => s + i.precoCentavos, 0);

export function erroDesconto(descontoCentavos: number, subtotalCentavos: number): string | null {
  if (!Number.isInteger(descontoCentavos) || descontoCentavos < 0) return 'Desconto inválido.';
  if (descontoCentavos > subtotalCentavos) return 'O desconto não pode ser maior que o subtotal.';
  return null;
}

/** "expirado" não é gravado: é um emitido cuja validade já passou. */
export function statusOrcamento(q: Quote, hoje = HOJE): StatusOrcamento {
  if (q.status === 'emitido' && q.validoAte < hoje) return 'expirado';
  return q.status;
}

export function somarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

export function hashOrcamento(q: Omit<Quote, 'hash'>): string {
  const linhas = q.itens.map((i) => [i.itemId, i.procedimento, i.dente ?? '', i.faces.join(''), i.etapa, i.precoCentavos].join(':'));
  return hashSimulado([q.numero, q.patientId, q.planId, q.planVersao, q.subtotalCentavos, q.descontoCentavos, q.totalCentavos, q.validoAte, q.condicoes, q.criadoEm, ...linhas].join('|'));
}

export const STATUS_ORCAMENTO: Record<StatusOrcamento, { label: string; tone: 'neutral' | 'warn' | 'ok' | 'danger' | 'info' }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  emitido: { label: 'Emitido · aguardando assinatura', tone: 'warn' },
  aprovado: { label: 'Aprovado pelo paciente', tone: 'ok' },
  recusado: { label: 'Recusado', tone: 'danger' },
  expirado: { label: 'Expirado', tone: 'neutral' },
};
