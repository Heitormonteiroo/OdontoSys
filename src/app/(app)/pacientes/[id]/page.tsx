import { PacienteFichaPage } from '@/modules/pacientes/pages/PacienteFichaPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PacienteFichaPage id={id} />;
}
