export type TipoEntrada = 'evolucao' | 'procedimento' | 'prescricao' | 'anamnese' | 'odontograma' | 'plano' | 'adendo';

/**
 * Entrada do registro clínico auxiliar (`clinical_entries`). Append-only:
 * o store não expõe nenhuma ação de editar ou apagar, e cada entrada é congelada
 * ao ser gravada. Correção = nova entrada `adendo` com `parentEntryId`.
 */
export interface ClinicalEntry {
  id: string; // "E-1045" (adendos: "A-1046")
  patientId: string;
  tipo: TipoEntrada;
  texto: string;
  /** null = registrado pelo próprio paciente no tablet. */
  autorId: string | null;
  criadoEm: string; // ISO local
  parentEntryId: string | null;
  /** Etiqueta de rodapé, ex.: "Receita impressa para assinatura à mão". */
  etiqueta: string | null;
  /** sha256(conteúdo + hash anterior) no sistema real; aqui hash simulado. Cadeia por paciente. */
  hashAnterior: string;
  hash: string;
}

export interface NovaEntrada {
  tipo: TipoEntrada;
  texto: string;
  parentEntryId?: string | null;
  etiqueta?: string | null;
  /** Padrão: usuário da sessão. */
  autorId?: string | null;
}
