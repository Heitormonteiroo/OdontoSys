'use client';

import { useCallback, useMemo } from 'react';
import { Imprimivel, LinhaAssinatura, RodapeImpressao, Timbre } from '@/components/print/Imprimivel';
import { siglaFace, TODOS_DENTES } from '@/features/odontograma/lib/dentes';
import { catalogoPorId, estadoBoca, situacaoDente } from '@/features/odontograma/lib/estado';
import { agora, dataHora, formatarData, idadeEm } from '@/lib/dates';
import { useCurrentUser, useStore } from '@/mock/store';
import type { Patient } from '@/mock/types';
import { verificarCadeia } from '../lib/cadeia';
import { TIPOS_ENTRADA, rotuloAutor } from '../lib/autor';

/**
 * Exportação do prontuário para a clínica imprimir, assinar e arquivar:
 * linha do tempo completa (com adendos, autor, data e hash) + odontograma atual.
 */
export function ExportacaoProntuario({ paciente, onFim }: { paciente: Patient; onFim: () => void }) {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const todas = useStore((s) => s.clinicalEntries);
  const toothEvents = useStore((s) => s.toothEvents);
  const findingTypes = useStore((s) => s.findingTypes);
  const fim = useCallback(onFim, [onFim]);

  const entradas = useMemo(() => todas.filter((e) => e.patientId === paciente.id), [todas, paciente.id]);
  const quebra = verificarCadeia(entradas);
  const dentes = useMemo(() => {
    const cat = catalogoPorId(findingTypes);
    const boca = estadoBoca(toothEvents.filter((e) => e.patientId === paciente.id), cat);
    return TODOS_DENTES.map((n) => ({ n, itens: situacaoDente(n, boca.get(n)!, cat, siglaFace) }))
      .filter((d) => d.itens.length > 0 && !(d.itens.length === 1 && d.itens[0].achado === 'higido'));
  }, [toothEvents, findingTypes, paciente.id]);
  const geradoEm = agora();

  return (
    <Imprimivel onFim={fim}>
      <Timbre titulo="Registro clínico auxiliar" direita={`Gerado em ${dataHora(geradoEm)}`} />
      <section className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        <div><strong>Paciente:</strong> {paciente.nome}</div>
        <div><strong>Prontuário nº</strong> {paciente.prontuarioNo}</div>
        <div><strong>Nascimento:</strong> {formatarData(paciente.nascimento)} ({idadeEm(paciente.nascimento)} anos)</div>
        <div><strong>CPF:</strong> {paciente.cpf ?? 'não informado'}</div>
        {paciente.responsavel && <div><strong>Responsável:</strong> {paciente.responsavel}</div>}
        <div className="col-span-2">
          <strong>Alertas críticos:</strong> {paciente.alertas.length ? paciente.alertas.map((a) => a.texto).join('; ') : 'nenhum registrado'}
        </div>
      </section>

      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em]">Linha do tempo ({entradas.length} entradas, em ordem de registro)</h2>
      <table className="mb-6 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="w-[62px] py-1 pr-2">Registro</th>
            <th className="w-[112px] py-1 pr-2">Data · autor</th>
            <th className="py-1 pr-2">Conteúdo</th>
            <th className="w-[96px] py-1">Hash</th>
          </tr>
        </thead>
        <tbody>
          {entradas.map((e) => (
            <tr key={e.id} className="break-inside-avoid border-b border-line align-top">
              <td className="py-1.5 pr-2 font-semibold tabular-nums">{e.id}</td>
              <td className="py-1.5 pr-2">
                {dataHora(e.criadoEm)}
                <br />
                {rotuloAutor(users, e.autorId)}
              </td>
              <td className="py-1.5 pr-2">
                <strong>
                  {TIPOS_ENTRADA[e.tipo].label}
                  {e.parentEntryId && ` · corrige ${e.parentEntryId}`}
                </strong>
                <div className="whitespace-pre-wrap">{e.texto}</div>
                {e.etiqueta && <div className="italic text-ink-600">{e.etiqueta}</div>}
              </td>
              <td className="break-all py-1.5 font-mono text-[9px] text-ink-600">
                {e.hash}
                <br />
                ant. {e.hashAnterior}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.06em]">Odontograma atual</h2>
      {dentes.length === 0 ? (
        <p className="text-[12px]">Sem achados registrados.</p>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {dentes.map((d) => (
              <tr key={d.n} className="border-b border-line">
                <td className="w-[48px] py-1 font-semibold tabular-nums">{d.n}</td>
                <td className="py-1">{d.itens.map((i) => `${i.texto}${i.planejado ? ' (planejado)' : ''}`).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-1 text-[10px] text-ink-600">Demais dentes avaliados sem achados (hígidos) ou sem registro.</p>

      <LinhaAssinatura rotulo={`${user?.nome ?? ''}${user?.cro ? ` · ${user.cro}` : ''} · assinatura e carimbo`} />
      <RodapeImpressao>
        Registro clínico auxiliar de apoio ao atendimento, gerado pelo sistema para impressão, assinatura e arquivo pela clínica.
        A guarda do prontuário oficial é responsabilidade da clínica. Integridade da cadeia de hash:{' '}
        {quebra ? `QUEBRADA em ${quebra}` : 'íntegra'}.
      </RodapeImpressao>
    </Imprimivel>
  );
}
