import { Suspense } from 'react';
import { PacienteNovoScreen } from '@/features/pacientes/screens/PacienteNovoScreen';

export default function Page() {
  return (
    <Suspense>
      <PacienteNovoScreen />
    </Suspense>
  );
}
