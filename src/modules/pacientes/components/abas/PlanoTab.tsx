import { PlanoOrcamento } from '@/modules/pacientes/components/plano/PlanoOrcamento';
import type { AbaProps } from '@/modules/pacientes/components/abas';

export function PlanoTab(props: AbaProps) {
  return <PlanoOrcamento {...props} />;
}
