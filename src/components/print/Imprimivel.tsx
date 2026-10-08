'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/mock/store';

/**
 * Renderiza `children` numa folha A4 e abre a impressão do navegador.
 * Durante a impressão só a folha aparece (classe `imprimindo` no body).
 * O PDF de verdade (pdf-lib / react-pdf no servidor) fica para a etapa de documentos.
 */
export function Imprimivel({ children, onFim }: { children: ReactNode; onFim: () => void }) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  useEffect(() => {
    if (!pronto) return;
    document.body.classList.add('imprimindo');
    const fim = () => {
      document.body.classList.remove('imprimindo');
      onFim();
    };
    window.addEventListener('afterprint', fim, { once: true });
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', fim);
      document.body.classList.remove('imprimindo');
    };
  }, [pronto, onFim]);
  if (!pronto) return null;
  return createPortal(<div className="folha-impressao">{children}</div>, document.body);
}

/** Timbre da clínica + linha do profissional (dados fictícios; configuráveis por clínica). */
export function Timbre({ titulo, direita }: { titulo: string; direita?: ReactNode }) {
  const clinic = useStore((s) => s.clinic);
  return (
    <header className="mb-6 flex items-start justify-between border-b-2 border-ink pb-3">
      <div>
        <div className="text-xl font-bold">{clinic.nome}</div>
        <div className="text-[11px] text-ink-600">
          {clinic.endereco} · {clinic.telefone}
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-bold">{titulo}</div>
        {direita && <div className="text-[11px] text-ink-600">{direita}</div>}
      </div>
    </header>
  );
}

export function LinhaAssinatura({ rotulo }: { rotulo: string }) {
  return <div className="mt-14 w-[260px] border-t border-ink pt-1 text-center text-[11px]">{rotulo}</div>;
}

export function RodapeImpressao({ children }: { children: ReactNode }) {
  return <footer className="mt-8 border-t border-line pt-2 text-[10px] leading-snug text-ink-600">{children}</footer>;
}
