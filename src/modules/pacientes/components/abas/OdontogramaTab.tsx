import { Odontograma } from '@/modules/pacientes/components/odontograma/Odontograma';
import type { AbaProps } from '@/modules/pacientes/components/abas';

export function OdontogramaTab(props: AbaProps) {
  return <Odontograma {...props} />;
}
