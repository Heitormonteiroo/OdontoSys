import type {
  AnamneseLink,
  AnamneseTemplate,
  ClinicalEntry,
  IssuedDocument,
  NovoDocumento,
  NovoEventoDente,
  NovoItemPlano,
  NovoOrcamento,
  NovoPaciente,
  Patient,
  Quote,
  RespostasAnamnese,
  Role,
  SeedData,
  StatusTratamento,
  ToothEvent,
  TreatmentPlanItem,
} from '../types';
import type { Resultado } from './util';

export interface SessionSlice {
  session: { userId: string } | null;
  login: (role: Role) => void;
  logout: () => void;
}

export interface PatientsSlice {
  /** Cadastra e devolve o paciente criado (prontuário nº gerado automaticamente). */
  addPatient: (input: NovoPaciente) => Patient;
}

export type SituacaoLink = 'ativo' | 'usado' | 'expirado' | 'revogado' | 'invalido';

export type AberturaLink =
  | { situacao: Exclude<SituacaoLink, 'ativo'>; codigo: string | null; criadoEm: string | null }
  | {
      situacao: 'ativo';
      codigo: string;
      criadoEm: string;
      patient: Patient | null;
      template: AnamneseTemplate | null;
      rascunho: RespostasAnamnese | null;
    };

export type ResultadoEnvio =
  | { ok: true }
  | { ok: false; motivo: 'link' }
  | { ok: false; motivo: 'validacao'; erros: Record<string, string> };

export type ResultadoPin =
  | { ok: true; userId: string }
  | { ok: false; tentativasRestantes: number; bloqueadoAte: number | null };

export interface AnamneseSlice {
  /** Gera link de uso único (revoga os anteriores não usados). O token só existe no retorno. */
  gerarLinkAnamnese: (patientId: string) => { token: string; link: AnamneseLink };
  /** "Rota" do tablet: valida o token e devolve só o necessário para aquele questionário. */
  abrirLinkAnamnese: (token: string) => AberturaLink;
  salvarRascunhoAnamnese: (token: string, answers: RespostasAnamnese) => void;
  /** Valida contra o modelo, consome o link (uso único) e grava a resposta. */
  enviarAnamnese: (token: string, answers: RespostasAnamnese) => ResultadoEnvio;
  conferirAnamnese: (respostaId: string) => void;
  /** PIN da equipe para sair do modo totem, com limite de tentativas e bloqueio temporário. */
  verificarPinTotem: (pin: string) => ResultadoPin;
}

/** Registro clínico append-only: não existe ação de editar nem de apagar. */
export interface ProntuarioSlice {
  registrarEvolucao: (patientId: string, texto: string) => Resultado<{ entrada: ClinicalEntry }>;
  registrarAdendo: (parentEntryId: string, texto: string) => Resultado<{ entrada: ClinicalEntry }>;
}

/** Odontograma = eventos append-only; correção é um novo evento com `substitui`. */
export interface OdontogramaSlice {
  registrarEventoDente: (patientId: string, n: NovoEventoDente) => Resultado<{ evento: ToothEvent }>;
}

export interface PlanoSlice {
  /** Plano aprovado não é alterado: incluir item cria nova versão. */
  adicionarItemPlano: (patientId: string, n: NovoItemPlano) => Resultado<{ item: TreatmentPlanItem }>;
  /** Concluir exige `confirmado` (confirmação explícita do dentista). Cancelar exige motivo. */
  mudarStatusItem: (
    itemId: string,
    para: StatusTratamento,
    opcoes?: { nota?: string; confirmado?: boolean },
  ) => Resultado<{ status: string }>;
  /** Snapshot imutável + documento para imprimir e assinar. Substitui o orçamento em aberto anterior. */
  emitirOrcamento: (patientId: string, n: NovoOrcamento) => Resultado<{ orcamento: Quote }>;
  /** Registra a decisão do paciente (assinatura no papel). Não gera cobrança. */
  decidirOrcamento: (quoteId: string, decisao: 'aprovado' | 'recusado') => Resultado;
}

export interface DocumentosSlice {
  emitirDocumento: (patientId: string, d: NovoDocumento) => Resultado<{ documento: IssuedDocument }>;
  /** Anexa a cópia assinada e escaneada (uma vez), guardando o hash do arquivo. */
  anexarDigitalizacao: (docId: string, arquivo: { nome: string; hash: string }) => Resultado;
}

export interface CoreSlice {
  /** Restaura todos os dados de exemplo (mantém a sessão atual). */
  reset: () => void;
}

export type AppState = SeedData &
  SessionSlice &
  PatientsSlice &
  AnamneseSlice &
  ProntuarioSlice &
  OdontogramaSlice &
  PlanoSlice &
  DocumentosSlice &
  CoreSlice;
