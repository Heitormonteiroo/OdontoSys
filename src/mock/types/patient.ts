import type { StatusTratamento } from './common';

/** Alertas críticos são campos tipados e destacados (não ficam escondidos na anamnese). */
export interface AlertaCritico {
  id: string;
  tipo: 'alergia' | 'anticoagulante' | 'gestante' | 'outro';
  /** Texto completo exibido na faixa do cabeçalho. */
  texto: string;
  /** Rótulo curto exibido na lista de pacientes. */
  curto: string;
}

export interface Patient {
  id: string;
  nome: string;
  nascimento: string; // AAAA-MM-DD
  cpf: string | null; // formatado; opcional
  telefone: string;
  prontuarioNo: string; // "00318"
  dentistaId: string;
  responsavel: string | null; // responsável legal (menores)
  alertas: AlertaCritico[];
  anamnese: 'preenchida' | 'pendente';
  ultimoAtendimento: string | null; // ISO local, ex.: 2026-10-08T09:00
  tratamento: StatusTratamento | null; // status geral do plano
  novo: boolean;
}

export type NovoPaciente = {
  nome: string;
  nascimento: string;
  cpf: string | null;
  telefone: string;
  dentistaId: string;
  responsavel: string | null;
};
