export type TipoDocumento = 'receita' | 'atestado' | 'termo' | 'orcamento' | 'anamnese';

export interface Digitalizacao {
  em: string;
  porId: string;
  arquivoNome: string;
  /** Hash do arquivo digitalizado (simulado no protótipo). */
  hash: string;
}

/**
 * Documento emitido (`issued_documents`): snapshot do conteúdo, número
 * sequencial por clínica e tipo, e hash. Editar o modelo depois não muda o emitido.
 */
export interface IssuedDocument {
  id: string;
  patientId: string;
  tipo: TipoDocumento;
  numero: string;
  titulo: string;
  subtitulo: string;
  /** Texto do documento como foi impresso (no orçamento, o snapshot fica no próprio orçamento). */
  conteudo: string;
  /** Orçamento ou anamnese de origem, quando houver. */
  refId: string | null;
  autorId: string;
  criadoEm: string;
  hash: string;
  digitalizacao: Digitalizacao | null;
}

export interface NovoDocumento {
  tipo: TipoDocumento;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  refId?: string | null;
}
