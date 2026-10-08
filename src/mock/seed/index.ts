import { PIN_TENTATIVAS } from '@/features/anamnese/lib/regras';
import { planoAtual, statusGeral, statusItem } from '@/features/plano/lib/plano';
import type { SeedData } from '../types';
import { anamneseTemplates, createAnamneseRespostas } from './anamnese';
import { clinic } from './clinic';
import { createClinico } from './clinico';
import { patients } from './patients';
import { users } from './users';

/** Gera uma cópia nova dos dados de exemplo. Usada na carga e em "Restaurar dados de exemplo". */
export function createSeed(): SeedData {
  const anamneseRespostas = createAnamneseRespostas(patients);
  const clinico = createClinico(anamneseRespostas, anamneseTemplates);
  // Status geral de cada paciente coerente com o plano de exemplo.
  const comStatus = patients.map((p) => {
    const plano = planoAtual(clinico.treatmentPlans, p.id);
    const itens = plano ? clinico.treatmentPlanItems.filter((i) => i.planId === plano.id) : [];
    return { ...p, tratamento: statusGeral(itens.map((i) => statusItem(clinico.planItemEvents, clinico.treatmentPlanItems, i))) };
  });
  return structuredClone({
    clinic,
    users,
    patients: comStatus,
    anamneseTemplates,
    anamneseLinks: [],
    anamneseRespostas,
    anamneseRascunhos: {},
    totemPin: { tentativasRestantes: PIN_TENTATIVAS, bloqueadoAte: null },
    ...clinico,
  });
}
