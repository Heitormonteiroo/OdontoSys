import { PacienteFichaScreen } from '@/features/pacientes/screens/PacienteFichaScreen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PacienteFichaScreen id={id} />;
}
