'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSessao } from '@/hooks/useAuth';
import { Sidebar } from '@/layouts/Sidebar';

/** Área logada. Sem sessão (ex.: após recarregar a página), volta ao login. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSessao();

  useEffect(() => {
    if (!session) router.replace('/login');
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="flex h-[calc(100vh-28px)] print:block print:h-auto">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto print:overflow-visible">{children}</main>
    </div>
  );
}
