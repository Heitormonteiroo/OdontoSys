import type { PlanItemEvent, StatusTratamento, TreatmentPlan, TreatmentPlanItem } from '@/mock/types';

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
