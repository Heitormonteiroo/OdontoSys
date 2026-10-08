import { AnamneseFicha } from '@/features/anamnese/components/AnamneseFicha';
import type { Patient } from '@/mock/types';

export function AnamneseTab({ paciente }: { paciente: Patient }) {
  return <AnamneseFicha paciente={paciente} />;
}
