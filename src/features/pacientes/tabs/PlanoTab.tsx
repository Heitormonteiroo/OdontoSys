import type { Patient } from '@/mock/types';
import { EmConstrucao } from './EmConstrucao';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PlanoTab({ paciente }: { paciente: Patient }) {
  return <EmConstrucao titulo="Plano e orçamento" etapa="Plano de tratamento e orçamento" />;
}
