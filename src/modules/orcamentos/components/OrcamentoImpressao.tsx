'use client';

import { Imprimivel, LinhaAssinatura, RodapeImpressao, Timbre } from '@/components/print/Imprimivel';
import { siglasFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import { dataHora, formatarData } from '@/utils/dates';
import { formatarCentavos } from '@/utils/dinheiro';
import { useUsuarios } from '@/hooks/useAuth';
import { useItensPlano, usePacientes } from '@/modules/pacientes/services';
import type { Quote } from '@/mock/types';

/** Orçamento impresso a partir do SNAPSHOT (não do plano atual): reimprimir sempre dá o mesmo documento. */
export function OrcamentoImpressao({ orcamento: q, onFim }: { orcamento: Quote; onFim: () => void }) {
  const paciente = usePacientes().find((p) => p.id === q.patientId);
  const users = useUsuarios();
  const planItems = useItensPlano();
  const dentistas = [...new Set(planItems.filter((i) => q.itens.some((x) => x.itemId === i.id)).map((i) => i.dentistaId))]
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <Imprimivel onFim={onFim}>
      <Timbre titulo={`Orçamento nº ${q.numero}`} direita={`Emitido em ${dataHora(q.criadoEm)}`} />
      <section className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        <div><strong>Paciente:</strong> {paciente?.nome}</div>
        <div><strong>Prontuário nº</strong> {paciente?.prontuarioNo}</div>
        {paciente?.responsavel && <div><strong>Responsável:</strong> {paciente.responsavel}</div>}
        <div><strong>Plano de tratamento:</strong> versão {q.planVersao}</div>
      </section>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="w-[52px] py-1">Etapa</th>
            <th className="w-[90px] py-1">Dente</th>
            <th className="py-1">Procedimento</th>
            <th className="w-[110px] py-1 text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {q.itens.map((i) => (
            <tr key={i.itemId} className="border-b border-line">
              <td className="py-1.5">{i.etapa}</td>
              <td className="py-1.5">{i.dente ? `${i.dente}${i.faces.length ? ` (${siglasFaces(i.dente, i.faces)})` : ''}` : '—'}</td>
              <td className="py-1.5">{i.procedimento}</td>
              <td className="py-1.5 text-right tabular-nums">{formatarCentavos(i.precoCentavos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-3 w-[260px] text-[12px] tabular-nums">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatarCentavos(q.subtotalCentavos)}</span></div>
        <div className="flex justify-between"><span>Desconto</span><span>{formatarCentavos(-q.descontoCentavos)}</span></div>
        <div className="mt-1 flex justify-between border-t border-ink pt-1 text-[14px] font-bold"><span>Total</span><span>{formatarCentavos(q.totalCentavos)}</span></div>
      </div>
      <section className="mt-4 flex flex-col gap-1 text-[12px]">
        <div><strong>Validade:</strong> até {formatarData(q.validoAte)} ({q.validadeDias} dias).</div>
        <div><strong>Condições de pagamento:</strong> {q.condicoes || 'a combinar.'}</div>
      </section>
      <div className="flex justify-between gap-8">
        <LinhaAssinatura rotulo={`${paciente?.responsavel ? 'Responsável legal' : 'Paciente'} · data ____/____/______`} />
        <LinhaAssinatura rotulo={dentistas.map((d) => `${d!.nome}${d!.cro ? ` · ${d!.cro}` : ''}`).join(' / ') || 'Dentista responsável'} />
      </div>
      <RodapeImpressao>
        Documento emitido pelo sistema de apoio ao atendimento. Conteúdo fixo (snapshot): alterações no plano geram um novo orçamento. Este orçamento
        não é cobrança. Hash {q.hash}.
      </RodapeImpressao>
    </Imprimivel>
  );
}
