'use client';

import { useState } from 'react';
import { useRestaurarDemo } from '@/hooks/useDemo';
import { Icon } from '@/components/ui';

/** Banner fixo e discreto, presente em todas as telas (inclusive no totem). */
export function PrototypeBanner() {
  const reset = useRestaurarDemo();
  const [done, setDone] = useState(false);

  function onReset() {
    reset();
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="no-print fixed inset-x-0 top-0 z-[60] flex h-7 items-center justify-center border-b border-warn-border bg-warn-bg px-3 text-warn-text">
      <span className="text-[11px] font-bold uppercase tracking-[0.06em]">
        Protótipo · Dados fictícios · Não usar em atendimento
      </span>
      <button
        onClick={onReset}
        className="absolute right-3 flex h-5 items-center gap-1 rounded px-2 text-[11px] font-semibold text-warn-text hover:bg-warn-border/60"
      >
        <Icon name={done ? 'check' : 'restart_alt'} size={14} />
        {done ? 'Dados restaurados' : 'Restaurar dados de exemplo'}
      </button>
    </div>
  );
}
