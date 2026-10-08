import type { AlertaCritico } from './patient';

/** Como uma pergunta vira alerta crítico tipado (fora do JSONB, destacado na ficha). */
export interface RegraAlerta {
  tipo: AlertaCritico['tipo'];
  /** Texto base do alerta, ex.: "Alergia a medicamento". */
  texto: string;
  /** Rótulo curto da lista de pacientes. */
  curto: string;
}

export interface PerguntaAnamnese {
  id: string;
  /** Texto exibido ao paciente no tablet (linguagem simples). */
  texto: string;
  /** Rótulo curto exibido à equipe na ficha. */
  rotulo: string;
  dica?: string;
  opcoes: string[];
  /** Selo "Importante" e borda amarela no tablet. */
  importante?: boolean;
  /** Campo de texto aberto quando a resposta é "Sim". */
  detalhe?: { rotulo: string; placeholder: string };
  /** Escolha múltipla quando a resposta é "Sim" (ex.: quais remédios causam alergia). */
  chips?: { rotulo: string; opcoes: string[] };
  /** Lista "nome do remédio / quanto e quando" quando a resposta é "Sim". */
  remedios?: boolean;
  /** Aviso mostrado ao paciente quando responde "Sim". */
  avisoSim?: string;
  /** Aviso mostrado ao paciente quando responde "Não sei". */
  avisoNaoSei?: string;
  /** "Sim" ou "Não sei" geram este alerta crítico. */
  alerta?: RegraAlerta;
}

export interface PassoAnamnese {
  id: string;
  titulo: string;
  subtitulo: string;
  perguntas: PerguntaAnamnese[];
}

/**
 * Modelo versionado. Versão publicada NUNCA é alterada: mudança gera versão nova
 * (novo objeto com `versao` + 1). Respostas guardam `templateId` + `templateVersao`.
 */
export interface AnamneseTemplate {
  id: string;
  versao: number;
  nome: string;
  publicadoEm: string; // AAAA-MM-DD
  passos: PassoAnamnese[];
}

export interface DadosPessoaisAnamnese {
  nome: string;
  nascimento: string; // dd/mm/aaaa, como digitado
  cpf: string;
  celular: string;
  emergenciaNome: string;
  emergenciaTelefone: string;
}

export interface RemedioInformado {
  nome: string;
  dose: string;
}

/** Respostas livres do modelo (no banco real: coluna JSONB `answers`). */
export interface RespostasAnamnese {
  dados: DadosPessoaisAnamnese;
  respostas: Record<string, string>; // perguntaId -> opção escolhida
  detalhes: Record<string, string>;
  chips: Record<string, string[]>;
  remedios: RemedioInformado[];
}

/**
 * Link de uso único para o totem. Guarda só o HASH do token (o token em si
 * só existe na URL entregue ao tablet).
 */
export interface AnamneseLink {
  id: string;
  patientId: string;
  tokenHash: string;
  /** Código curto que o tablet mostra para a recepção, ex.: "ANM-4471". */
  codigo: string;
  templateId: string;
  templateVersao: number;
  criadoPor: string; // userId
  criadoEm: string; // ISO local
  expiraEm: number; // epoch ms
  usadoEm: string | null;
  revogadoEm: string | null;
}

export interface AnamneseResposta {
  id: string;
  patientId: string;
  linkId: string | null;
  templateId: string;
  templateVersao: number;
  answers: RespostasAnamnese;
  /** Alertas críticos tipados derivados das respostas no momento do envio. */
  alertas: AlertaCritico[];
  preenchidaEm: string; // ISO local
  origem: 'tablet';
  conferidaPor: string | null; // userId
  conferidaEm: string | null;
}

/** Estado do bloqueio do totem (PIN da equipe). */
export interface TotemPinState {
  tentativasRestantes: number;
  bloqueadoAte: number | null; // epoch ms
}
