'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Field, Modal } from '@/components/ui';
import { siglasFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import { formatarCentavos, lerCentavos } from '@/utils/dinheiro';
import { can } from '@/utils/permissions';
import { useCurrentUser } from '@/hooks/useAuth';
import { useEmitirOrcamento } from '@/modules/orcamentos/services';
import { useProcedimentos } from '@/modules/pacientes/services';
import type { Quote, TreatmentPlanItem } from '@/mock/types';
import { erroDesconto, somaCentavos } from '@/modules/orcamentos/utils/orcamento';

/** Validade padrão (decisão pendente nº 20: configurável pela clínica). */
export const VALIDADE_PADRAO_DIAS = 30;

export function EmitirOrcamentoDialog({
  patientId,
  propostos,
  substitui,
  onFechar,
}: {
  patientId: string;
  propostos: TreatmentPlanItem[];
  substitui: Quote | null;
  onFechar: (emitido?: Quote) => void;
}) {
  const user = useCurrentUser();
  const procedures = useProcedimentos();
  const emitir = useEmitirOrcamento();
  const podeDesconto = can(user?.papel, 'orcamento:desconto');

  const [marcados, setMarcados] = useState<string[]>(propostos.map((i) => i.id));
  const [desconto, setDesconto] = useState('');
  const [validade, setValidade] = useState(String(VALIDADE_PADRAO_DIAS));
  const [condicoes, setCondicoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const escolhidos = propostos.filter((i) => marcados.includes(i.id));
  const subtotal = somaCentavos(escolhidos);
  const descontoCent = lerCentavos(desconto);
  const erroD = descontoCent === null ? 'Valor inválido. Use o formato 150,00.' : erroDesconto(descontoCent, subtotal);
  const total = subtotal - (descontoCent ?? 0);
  const nome = useMemo(() => Object.fromEntries(procedures.map((p) => [p.id, p.nome])), [procedures]);

  function salvar() {
    if (erroD || descontoCent === null) return setErro(erroD);
    const r = emitir(patientId, { itemIds: marcados, descontoCentavos: descontoCent, validadeDias: Number(validade), condicoes });
    if (!r.ok) return setErro(r.erro);
    onFechar(r.orcamento);
  }

  return (
    <Modal
      open
      width={620}
      title="Gerar orçamento"
      onClose={() => onFechar()}
      actions={
        <>
          <Button variant="secondary" onClick={() => onFechar()}>
            Cancelar
          </Button>
          <Button icon="print" disabled={escolhidos.length === 0} onClick={salvar}>
            Emitir e imprimir
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {substitui && (
          <Alert tone="warn">
            O orçamento nº {substitui.numero}, ainda sem assinatura, será <strong>substituído</strong> por este. Ele continua guardado no histórico.
          </Alert>
        )}
        <div className="flex flex-col rounded-lg border border-line">
          {propostos.map((i) => (
            <label key={i.id} className="flex cursor-pointer items-center gap-3 border-b border-line-faint px-3 py-2.5 text-sm last:border-b-0">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#0F766E]"
                checked={marcados.includes(i.id)}
                onChange={() => setMarcados((x) => (x.includes(i.id) ? x.filter((y) => y !== i.id) : [...x, i.id]))}
              />
              <span className="w-14 text-ink-600">Etapa {i.etapa}</span>
              <span className="flex-1">
                {nome[i.procedureId]}
                {i.dente && <span className="text-ink-600"> · dente {i.dente}{i.faces.length ? ` (${siglasFaces(i.dente, i.faces)})` : ''}</span>}
              </span>
              <span className="tabular-nums">{formatarCentavos(i.precoCentavos)}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Desconto (R$)"
            inputMode="decimal"
            placeholder="0,00"
            value={desconto}
            disabled={!podeDesconto}
            hint={podeDesconto ? undefined : 'Só o dentista pode conceder desconto.'}
            error={desconto && erroD ? erroD : undefined}
            onChange={(e) => setDesconto(e.target.value)}
          />
          <Field label="Validade (dias)" inputMode="numeric" value={validade} onChange={(e) => setValidade(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Condições de pagamento (texto livre)
          <textarea
            value={condicoes}
            onChange={(e) => setCondicoes(e.target.value)}
            maxLength={500}
            placeholder="Ex.: à vista ou em parcelas, a combinar com a recepção."
            className="min-h-[72px] rounded-md border border-line-strong p-3 text-[15px] font-normal outline-none focus:border-2 focus:border-brand focus:shadow-field"
          />
        </label>
        <div className="flex flex-col gap-1 rounded-lg bg-surface-subtle px-4 py-3 text-sm tabular-nums">
          <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{formatarCentavos(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-ink-600">Desconto</span><span>{formatarCentavos(-(descontoCent ?? 0))}</span></div>
          <div className="flex justify-between border-t border-line pt-1 text-base font-bold"><span>Total</span><span>{formatarCentavos(total)}</span></div>
        </div>
        <p className="m-0 text-[13px] text-ink-500">
          Depois de emitido, o orçamento não muda (snapshot com número e hash). É impresso para o paciente assinar à mão. Aprovar não gera cobrança.
        </p>
        {erro && <Alert tone="danger">{erro}</Alert>}
      </div>
    </Modal>
  );
}
