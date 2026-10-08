import { Suspense } from 'react';
import { PacienteNovoPage } from '@/modules/pacientes/pages/PacienteNovoPage';

export default function Page() {
  return (
    <Suspense>
      <PacienteNovoPage />
    </Suspense>
  );
}
