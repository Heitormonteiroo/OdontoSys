import type { AnamneseLink, AnamneseResposta, AnamneseTemplate, RespostasAnamnese, TotemPinState } from './anamnese';
import type { Clinic } from './clinic';
import type { IssuedDocument } from './documentos';
import type { FindingType, ToothEvent } from './odontograma';
import type { Patient } from './patient';
import type { PlanItemEvent, Procedure, Quote, TreatmentPlan, TreatmentPlanItem } from './plano';
import type { ClinicalEntry } from './prontuario';
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
export type { ClinicalEntry, NovaEntrada, TipoEntrada } from './prontuario';
export type {
  Achado,
  Denticao,
  Face,
  FindingType,
  NovoEventoDente,
  SituacaoAchado,
  ToothEvent,
} from './odontograma';
export type {
  NovoItemPlano,
  NovoOrcamento,
  PlanItemEvent,
  Procedure,
  Quote,
  QuoteItem,
  StatusOrcamento,
  TreatmentPlan,
  TreatmentPlanItem,
} from './plano';
export type { Digitalizacao, IssuedDocument, NovoDocumento, TipoDocumento } from './documentos';

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
  clinicalEntries: ClinicalEntry[];
  findingTypes: FindingType[];
  toothEvents: ToothEvent[];
  procedures: Procedure[];
  treatmentPlans: TreatmentPlan[];
  treatmentPlanItems: TreatmentPlanItem[];
  planItemEvents: PlanItemEvent[];
  quotes: Quote[];
  issuedDocuments: IssuedDocument[];
}
