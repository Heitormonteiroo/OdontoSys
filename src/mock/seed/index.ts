import type { SeedData } from '../types';
import { clinic } from './clinic';
import { users } from './users';

/** Gera uma cópia nova dos dados de exemplo. Usada na carga e em "Restaurar dados de exemplo". */
export function createSeed(): SeedData {
  return structuredClone({
    clinic,
    users,
  });
}
