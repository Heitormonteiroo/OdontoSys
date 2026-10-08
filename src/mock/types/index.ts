import type { AnamneseLink, AnamneseResposta, AnamneseTemplate, RespostasAnamnese, TotemPinState } from './anamnese';
import type { Clinic } from './clinic';
import type { Patient } from './patient';
import type { User } from './user';

export type { Role, User } from './user';
export type { Clinic } from './clinic';
export type { StatusTratamento } from './common';
export type { AlertaCritico, Patient, NovoPaciente } from './patient';
export type {
  AnamneseLink,
  AnamneseResposta,
  AnamneseTemplate,
  DadosPessoaisAnamnese,
  PassoAnamnese,
  PerguntaAnamnese,
  RegraAlerta,
  RemedioInformado,
  RespostasAnamnese,
  TotemPinState,
} from './anamnese';

/** Tudo o que "Restaurar dados de exemplo" recria. Cresce a cada tela construída. */
export interface SeedData {
  clinic: Clinic;
  users: User[];
  patients: Patient[];
  anamneseTemplates: AnamneseTemplate[];
  anamneseLinks: AnamneseLink[];
  anamneseRespostas: AnamneseResposta[];
  /** Respostas parciais salvas quando a equipe sai do totem no meio (por paciente). */
  anamneseRascunhos: Record<string, RespostasAnamnese>;
  totemPin: TotemPinState;
}
