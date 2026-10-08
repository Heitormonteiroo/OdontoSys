import { DocumentosLista } from '@/features/documentos/components/DocumentosLista';
import type { AbaProps } from '.';

export function DocumentosTab(props: AbaProps) {
  return <DocumentosLista {...props} />;
}
