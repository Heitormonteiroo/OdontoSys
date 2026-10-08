import { HOJE } from '@/lib/dates';
import { hashSimulado } from '@/lib/hash';
import type {
  PlanItemEvent,
  Quote,
  QuoteItem,
  StatusOrcamento,
  StatusTratamento,
  TreatmentPlan,
  TreatmentPlanItem,
} from '@/mock/types';

/** Plano vigente do paciente (a versão que não foi substituída). */
export function planoAtual(planos: TreatmentPlan[], patientId: string): TreatmentPlan | null {
  return planos.find((p) => p.patientId === patientId && !p.substituidoPor) ?? null;
}

/** Cadeia de ids do item ao longo das versões do plano (o histórico de status é compartilhado). */
export function linhagemItem(itens: TreatmentPlanItem[], item: TreatmentPlanItem): string[] {
  const ids = [item.id];
  let atual: TreatmentPlanItem | undefined = item;
  while (atual?.origemItemId) {
    ids.push(atual.origemItemId);
    atual = itens.find((i) => i.id === atual!.origemItemId);
  }
  return ids;
}

export function historicoItem(eventos: PlanItemEvent[], itens: TreatmentPlanItem[], item: TreatmentPlanItem): PlanItemEvent[] {
  const ids = new Set(linhagemItem(itens, item));
  return eventos.filter((e) => ids.has(e.itemId)).sort((a, b) => a.em.localeCompare(b.em) || a.id.localeCompare(b.id));
}

/** Status atual = último evento do histórico. */
export function statusItem(eventos: PlanItemEvent[], itens: TreatmentPlanItem[], item: TreatmentPlanItem): StatusTratamento {
  const h = historicoItem(eventos, itens, item);
  return h.length ? h[h.length - 1].status : 'proposto';
}

/** Transições permitidas a partir de cada status (aprovação vem do orçamento). */
export const TRANSICOES: Record<StatusTratamento, StatusTratamento[]> = {
  proposto: ['cancelado'],
  aprovado: ['em_andamento', 'concluido', 'cancelado'],
  em_andamento: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
};

/** Status geral do tratamento (chip da lista de pacientes). */
export function statusGeral(statuses: StatusTratamento[]): StatusTratamento | null {
  if (statuses.length === 0) return null;
  if (statuses.includes('em_andamento')) return 'em_andamento';
  if (statuses.includes('aprovado')) return statuses.includes('concluido') ? 'em_andamento' : 'aprovado';
  if (statuses.includes('proposto')) return 'proposto';
  if (statuses.includes('concluido')) return 'concluido';
  return 'cancelado';
}

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
