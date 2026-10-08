import { AnamneseFicha } from '@/modules/pacientes/components/anamnese/AnamneseFicha';
import type { Patient } from '@/mock/types';

export function AnamneseTab({ paciente }: { paciente: Patient }) {
  return <AnamneseFicha paciente={paciente} />;
}
