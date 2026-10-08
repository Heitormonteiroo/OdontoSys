import type {
  AnamneseLink,
  AnamneseTemplate,
  NovoPaciente,
  Patient,
  RespostasAnamnese,
  Role,
  SeedData,
} from '../types';

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

export interface CoreSlice {
  /** Restaura todos os dados de exemplo (mantém a sessão atual). */
  reset: () => void;
}

export type AppState = SeedData & SessionSlice & PatientsSlice & AnamneseSlice & CoreSlice;
