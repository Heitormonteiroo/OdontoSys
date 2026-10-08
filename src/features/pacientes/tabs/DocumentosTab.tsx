import type { Patient } from '@/mock/types';
import { EmConstrucao } from './EmConstrucao';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DocumentosTab({ paciente }: { paciente: Patient }) {
  return <EmConstrucao titulo="Documentos" etapa="Receitas e documentos" />;
}
