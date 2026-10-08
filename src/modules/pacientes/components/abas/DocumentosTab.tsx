import { DocumentosLista } from '@/modules/documentos/components/DocumentosLista';
import type { AbaProps } from '@/modules/pacientes/components/abas';

export function DocumentosTab(props: AbaProps) {
  return <DocumentosLista {...props} />;
}
