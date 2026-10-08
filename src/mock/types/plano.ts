import type { StatusTratamento } from './common';
import type { Achado, Face } from './odontograma';

/** Catálogo de procedimentos da clínica (`procedures`). Preços em centavos, fornecidos pela clínica. */
export interface Procedure {
  id: string;
  nome: string;
  precoCentavos: number;
  /** face: pede dente e faces · dente: pede dente · boca: sem dente. */
  escopo: 'face' | 'dente' | 'boca';
  /** Achado registrado no odontograma quando o item é concluído. */
  achadoRealizado: Achado | null;
  ativo: boolean;
}

/**
 * Plano de tratamento. Alterar um plano já aprovado cria nova versão
 * (a anterior fica preservada com `substituidoPor`).
 */
export interface TreatmentPlan {
  id: string;
  patientId: string;
  versao: number;
  criadoEm: string;
  criadoPor: string;
  aprovadoEm: string | null;
  substituidoPor: string | null;
}

export interface TreatmentPlanItem {
  id: string;
  planId: string;
  procedureId: string;
  dente: number | null;
  faces: Face[];
  etapa: number;
  dentistaId: string;
  /** Preço do catálogo no momento em que o item entrou no plano. */
  precoCentavos: number;
  nota: string;
  /** Item da versão anterior do plano que este continua (mesmo histórico de status). */
  origemItemId: string | null;
}

/** Histórico append-only de status (`plan_item_events`). Status atual = último evento. */
export interface PlanItemEvent {
  id: string;
  itemId: string;
  status: StatusTratamento;
  autorId: string;
  em: string;
  nota: string;
}

export type StatusOrcamento = 'rascunho' | 'emitido' | 'aprovado' | 'recusado' | 'expirado';

/** Linha do orçamento: snapshot do procedimento, dente e valor no momento da emissão. */
export interface QuoteItem {
  itemId: string;
  procedimento: string;
  dente: number | null;
  faces: Face[];
  etapa: number;
  precoCentavos: number;
}

/** Orçamento. Emitido é imutável; alteração = novo orçamento que substitui o anterior. */
export interface Quote {
  id: string;
  numero: string; // sequencial por clínica, "0412"
  patientId: string;
  planId: string;
  planVersao: number;
  itens: QuoteItem[];
  subtotalCentavos: number;
  descontoCentavos: number;
  totalCentavos: number;
  validadeDias: number;
  validoAte: string; // AAAA-MM-DD
  condicoes: string;
  status: Exclude<StatusOrcamento, 'expirado'>; // "expirado" é calculado pela data
  criadoEm: string;
  criadoPor: string;
  hash: string;
  documentoId: string | null;
  decididoEm: string | null;
  decididoPor: string | null;
  substitui: string | null;
  substituidoPor: string | null;
}

export interface NovoItemPlano {
  procedureId: string;
  dente: number | null;
  faces: Face[];
  etapa: number;
  dentistaId: string;
  nota: string;
}

export interface NovoOrcamento {
  itemIds: string[];
  descontoCentavos: number;
  validadeDias: number;
  condicoes: string;
}
