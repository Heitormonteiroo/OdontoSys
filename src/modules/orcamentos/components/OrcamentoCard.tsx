'use client';

import { Button, Chip, Icon } from '@/components/ui';
import type { Quote } from '@/mock/types';
import { STATUS_ORCAMENTO, statusOrcamento } from '@/modules/orcamentos/utils/orcamento';
import { dataHora, formatarData } from '@/utils/dates';
import { formatarCentavos } from '@/utils/dinheiro';

/** Cartão do orçamento vigente: situação, total e ações (imprimir, registrar assinatura ou recusa). */
export function OrcamentoCard({
  q,
  digitalizado,
  nomeUser,
  podeDecidir,
  onImprimir,
  onDecidir,
}: {
  q: Quote;
  digitalizado: boolean;
  nomeUser: (id: string | null) => string;
  podeDecidir: boolean;
  onImprimir: () => void;
  onDecidir: (d: 'aprovado' | 'recusado') => void;
}) {
  const st = statusOrcamento(q);
  const info = STATUS_ORCAMENTO[st];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold">Orçamento nº {q.numero}</span>
        <Chip size="sm" tone={info.tone}>
          {info.label}
        </Chip>
      </div>
      <div className="flex flex-col gap-1 text-[13px] text-ink-600">
        <span>
          Emitido em {dataHora(q.criadoEm)} por {nomeUser(q.criadoPor)}
        </span>
        <span>
          {q.itens.length} procedimento{q.itens.length > 1 ? 's' : ''} · válido até {formatarData(q.validoAte)}
        </span>
        {q.descontoCentavos > 0 && <span>Desconto de {formatarCentavos(q.descontoCentavos)}</span>}
        {q.decididoEm && (
          <span>
            {st === 'aprovado' ? 'Aprovado' : 'Recusado'} em {dataHora(q.decididoEm)} · registrado por {nomeUser(q.decididoPor)}
          </span>
        )}
      </div>
      <div className="text-xl font-bold tabular-nums">{formatarCentavos(q.totalCentavos)}</div>
      {st === 'aprovado' && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${digitalizado ? 'bg-ok-bg text-ok-text' : 'bg-warn-bg text-warn-text'}`}>
          <Icon name={digitalizado ? 'task_alt' : 'upload_file'} size={18} />
          {digitalizado ? 'Assinado à mão. Cópia digitalizada em Documentos.' : 'Assinado à mão. Anexe a cópia digitalizada em Documentos.'}
        </div>
      )}
      {st === 'expirado' && <div className="text-[13px] text-ink-600">Validade vencida sem assinatura. Gere um novo orçamento para os itens propostos.</div>}
      <Button variant="secondary" icon="print" onClick={onImprimir}>
        {st === 'emitido' ? 'Imprimir para assinatura' : 'Reimprimir'}
      </Button>
      {st === 'emitido' && podeDecidir && (
        <div className="flex gap-2">
          <Button className="flex-1" icon="task_alt" onClick={() => onDecidir('aprovado')}>
            Assinado
          </Button>
          <Button className="flex-1" variant="secondary" onClick={() => onDecidir('recusado')}>
            Recusado
          </Button>
        </div>
      )}
    </div>
  );
}
