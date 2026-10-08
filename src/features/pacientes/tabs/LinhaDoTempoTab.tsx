import type { Patient } from '@/mock/types';
import { EmConstrucao } from './EmConstrucao';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LinhaDoTempoTab({ paciente }: { paciente: Patient }) {
  return <EmConstrucao titulo="Linha do tempo" etapa="Linha do tempo do prontuário" />;
}
