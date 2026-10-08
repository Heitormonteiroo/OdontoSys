import type { NovoPaciente, Patient, Role, SeedData } from '../types';

export interface SessionSlice {
  session: { userId: string } | null;
  login: (role: Role) => void;
  logout: () => void;
}

export interface PatientsSlice {
  /** Cadastra e devolve o paciente criado (prontuário nº gerado automaticamente). */
  addPatient: (input: NovoPaciente) => Patient;
}

export interface CoreSlice {
  /** Restaura todos os dados de exemplo (mantém a sessão atual). */
  reset: () => void;
}

export type AppState = SeedData & SessionSlice & PatientsSlice & CoreSlice;
