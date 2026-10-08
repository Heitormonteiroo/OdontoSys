export type Achado = 'carie' | 'restauracao' | 'coroa' | 'canal' | 'implante' | 'ausente' | 'higido';

/** O oclusal/incisal · M mesial · D distal · V vestibular · L lingual/palatina */
export type Face = 'O' | 'M' | 'D' | 'V' | 'L';

export type SituacaoAchado = 'existente' | 'planejado' | 'realizado';

export type Denticao = 'permanente' | 'decidua' | 'mista';

/** Catálogo de achados (`finding_types`). Cores e símbolos: decisão pendente nº 16. */
export interface FindingType {
  id: Achado;
  label: string;
  cor: string;
  escopo: 'face' | 'dente';
}

/**
 * Evento do odontograma (`tooth_events`). Append-only: o estado atual é uma
 * projeção dos eventos. Correção = novo evento com `substitui`.
 */
export interface ToothEvent {
  id: string; // "EV-0160"
  seq: number;
  patientId: string;
  dente: number; // FDI
  achado: Achado;
  situacao: SituacaoAchado;
  faces: Face[]; // vazio = dente inteiro
  nota: string;
  autorId: string;
  criadoEm: string; // ISO local
  substitui: string | null;
  /** Item do plano que gerou o evento (procedimento concluído). */
  planItemId: string | null;
}

export interface NovoEventoDente {
  dente: number;
  achado: Achado;
  situacao: SituacaoAchado;
  faces: Face[];
  nota?: string;
  substitui?: string | null;
  planItemId?: string | null;
}
