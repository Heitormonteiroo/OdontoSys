import { PIN_TENTATIVAS } from '@/features/anamnese/lib/regras';
import type { SeedData } from '../types';
import { anamneseTemplates, createAnamneseRespostas } from './anamnese';
import { clinic } from './clinic';
import { patients } from './patients';
import { users } from './users';

/** Gera uma cópia nova dos dados de exemplo. Usada na carga e em "Restaurar dados de exemplo". */
export function createSeed(): SeedData {
  return structuredClone({
    clinic,
    users,
    patients,
    anamneseTemplates,
    anamneseLinks: [],
    anamneseRespostas: createAnamneseRespostas(patients),
    anamneseRascunhos: {},
    totemPin: { tentativasRestantes: PIN_TENTATIVAS, bloqueadoAte: null },
  });
}
