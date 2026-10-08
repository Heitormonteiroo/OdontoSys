import type { Patient } from '@/mock/types';
import { EmConstrucao } from './EmConstrucao';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AnamneseTab({ paciente }: { paciente: Patient }) {
  return <EmConstrucao titulo="Anamnese" etapa="Anamnese em totem" />;
}
