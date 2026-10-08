import { TotemAnamnesePage } from '@/modules/pacientes/pages/TotemAnamnesePage';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TotemAnamnesePage token={token} />;
}
