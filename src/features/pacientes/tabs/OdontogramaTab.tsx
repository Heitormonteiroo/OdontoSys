import type { Patient } from '@/mock/types';
import { EmConstrucao } from './EmConstrucao';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function OdontogramaTab({ paciente }: { paciente: Patient }) {
  return <EmConstrucao titulo="Odontograma" etapa="Odontograma" />;
}
