import type { Clinic } from './clinic';
import type { Patient } from './patient';
import type { User } from './user';

export type { Role, User } from './user';
export type { Clinic } from './clinic';
export type { StatusTratamento } from './common';
export type { AlertaCritico, Patient, NovoPaciente } from './patient';

/** Tudo o que "Restaurar dados de exemplo" recria. Cresce a cada tela construída. */
export interface SeedData {
  clinic: Clinic;
  users: User[];
  patients: Patient[];
}
