'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Alert, Button, Icon } from '@/components/ui';
import { dataHora, formatarData, HOJE } from '@/utils/dates';
import { can } from '@/utils/permissions';
import { useCurrentUser, useUsuarios } from '@/hooks/useAuth';
import { useEntradasClinicas, useRegistrarAdendo, useRegistrarEvolucao } from '@/modules/pacientes/services';
import type { ClinicalEntry, TipoEntrada } from '@/mock/types';
import type { AbaProps } from '@/modules/pacientes/components/abas';
import { verificarCadeia } from '@/modules/pacientes/utils/prontuario/cadeia';
import { TIPOS_ENTRADA, rotuloAutor } from '@/modules/pacientes/utils/prontuario/autor';
import { ExportacaoProntuario } from '@/modules/pacientes/components/prontuario/ExportacaoProntuario';

type Filtro = 'todos' | TipoEntrada | 'com-adendo';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'evolucao', label: 'Evoluções' },
  { id: 'procedimento', label: 'Procedimentos' },
  { id: 'prescricao', label: 'Prescrições' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'odontograma', label: 'Odontograma' },
  { id: 'plano', label: 'Plano' },
  { id: 'com-adendo', label: 'Com adendos' },
];

const TEXTAREA =
  'min-h-[112px] w-full resize-y rounded-lg border border-line-strong bg-white p-3 text-[15px] leading-relaxed text-ink outline-none focus:border-2 focus:border-brand focus:shadow-field';

export function LinhaDoTempo({ paciente, intencao }: AbaProps) {
  const user = useCurrentUser();
  const users = useUsuarios();
  const todas = useEntradasClinicas();
  const registrarEvolucao = useRegistrarEvolucao();
  const registrarAdendo = useRegistrarAdendo();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [compondo, setCompondo] = useState<string | null>(null); // 'nova' ou id da entrada
  const [rascunho, setRascunho] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const podeRegistrar = can(user?.papel, 'evolucao:registrar');
  const podeExportar = can(user?.papel, 'prontuario:exportar');

  useEffect(() => {
    if (intencao?.tipo === 'nova-evolucao' && podeRegistrar) abrir('nova');
  }, [intencao, podeRegistrar]);

  const entradas = useMemo(() => todas.filter((e) => e.patientId === paciente.id), [todas, paciente.id]);
  const quebra = useMemo(() => verificarCadeia(entradas), [entradas]);
  const adendosDe = useMemo(() => {
    const m = new Map<string, ClinicalEntry[]>();
    for (const e of entradas) if (e.parentEntryId) m.set(e.parentEntryId, [...(m.get(e.parentEntryId) ?? []), e]);
    return m;
  }, [entradas]);

  const grupos = useMemo(() => {
    const principais = entradas
      .filter((e) => !e.parentEntryId)
      .filter((e) => (filtro === 'todos' ? true : filtro === 'com-adendo' ? adendosDe.has(e.id) : e.tipo === filtro))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm) || b.id.localeCompare(a.id));
    const out: { data: string; itens: ClinicalEntry[] }[] = [];
    for (const e of principais) {
      const d = e.criadoEm.slice(0, 10);
      if (out.at(-1)?.data !== d) out.push({ data: d, itens: [] });
      out.at(-1)!.itens.push(e);
    }
    return out;
  }, [entradas, filtro, adendosDe]);

  function abrir(alvo: string) {
    setCompondo(alvo);
    setRascunho('');
    setErro(null);
  }

  function salvar() {
    if (!compondo) return;
    const r = compondo === 'nova' ? registrarEvolucao(paciente.id, rascunho) : registrarAdendo(compondo, rascunho);
    if (!r.ok) return setErro(r.erro);
    setCompondo(null);
    setRascunho('');
  }

  const compositor = (titulo: string, aviso: string) => (
    <div className="flex flex-col gap-2.5 rounded-xl border-2 border-brand bg-white p-4 shadow-card">
      <div className="text-sm font-semibold">{titulo}</div>
      <textarea
        autoFocus
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        placeholder={compondo === 'nova' ? 'Descreva o atendimento.' : 'Descreva a correção ou complemento. A entrada original não será alterada.'}
        className={TEXTAREA}
      />
      {erro && <Alert tone="danger" title="Não foi salvo.">{erro}</Alert>}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex flex-1 items-center gap-1.5 text-[13px] text-ink-600">
          <Icon name="lock" size={16} />
          {aviso}
        </span>
        <Button variant="secondary" onClick={() => setCompondo(null)}>
          Cancelar
        </Button>
        <Button icon="lock" onClick={salvar} disabled={rascunho.trim().length === 0}>
          {compondo === 'nova' ? 'Salvar evolução' : 'Salvar adendo'}
        </Button>
      </div>
    </div>
  );

  const barra = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`h-9 rounded-full border px-3.5 text-sm ${
              filtro === f.id ? 'border-brand bg-brand-soft font-semibold text-brand-dark' : 'border-line-strong bg-white font-medium text-ink-700 hover:border-ink-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5">
        {podeRegistrar && compondo !== 'nova' && (
          <Button variant="secondary" icon="edit_note" onClick={() => abrir('nova')}>
            Nova evolução
          </Button>
        )}
        {podeExportar && (
          <Button variant="secondary" icon="picture_as_pdf" disabled={entradas.length === 0} onClick={() => setExportando(true)}>
            Exportar prontuário em PDF
          </Button>
        )}
      </div>
    </div>
  );

  if (entradas.length === 0) {
    return (
      <div className="flex max-w-[960px] flex-col gap-4">
        {compondo === 'nova' ? (
          compositor('Primeira evolução', 'Depois de salva, a evolução não poderá ser editada nem apagada.')
        ) : (
          <section className="rounded-2xl border border-line bg-white">
            <EmptyState
              icon="history_edu"
              title="Prontuário sem registros"
              actions={podeRegistrar && <Button onClick={() => abrir('nova')}>Registrar primeira evolução</Button>}
            >
              Cada entrada é permanente: depois de salva não pode ser editada, apenas complementada por adendo.
            </EmptyState>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="flex max-w-[960px] flex-col gap-[18px]">
      {barra}
      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-subtle px-4 py-2.5 text-[13px] text-ink-700">
        <Icon name="lock" size={18} className="text-ink-600" />
        <span className="flex-1">
          Entradas são permanentes e não podem ser editadas. Correções são feitas por adendo vinculado. Ordem: mais recentes primeiro.
        </span>
        {quebra ? (
          <span className="flex items-center gap-1 font-semibold text-danger">
            <Icon name="gpp_bad" size={18} /> Cadeia de hash quebrada em {quebra}
          </span>
        ) : (
          <span className="flex items-center gap-1 font-semibold text-ok" title="Cada entrada guarda o hash da anterior">
            <Icon name="verified" size={18} /> Cadeia íntegra
          </span>
        )}
      </div>

      {compondo === 'nova' && compositor('Nova evolução', 'Depois de salva, a evolução não poderá ser editada nem apagada.')}

      {grupos.length === 0 && (
        <section className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-[15px] text-ink-600">
          Nenhuma entrada deste tipo.
        </section>
      )}

      {grupos.map((g) => (
        <div key={g.data} className="flex flex-col gap-3">
          <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-600">
            {g.data === HOJE ? `Hoje · ${formatarData(g.data)}` : formatarData(g.data)}
          </div>
          {g.itens.map((e) => {
            const adendos = (adendosDe.get(e.id) ?? []).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
            const t = TIPOS_ENTRADA[e.tipo];
            return (
              <div key={e.id} className="flex flex-col gap-2">
                <article className="flex flex-col gap-3 rounded-xl border border-line bg-white px-5 py-4 shadow-card">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-soft px-2.5 font-semibold text-brand-dark">
                      <Icon name={t.icon} size={17} />
                      {t.label}
                    </span>
                    <span className="font-semibold text-ink">{rotuloAutor(users, e.autorId)}</span>
                    <span className="tabular-nums text-ink-600">{dataHora(e.criadoEm)}</span>
                    <span className="flex-1" />
                    <span title="Registro imutável: não pode ser editado nem excluído" className="flex items-center gap-1 tabular-nums text-ink-500">
                      <Icon name="lock" size={15} />
                      Registro imutável · {e.id}
                    </span>
                  </div>
                  <p className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900">{e.texto}</p>
                  {adendos.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-info-bg px-3 py-2 text-[13px] font-medium text-info-text">
                      <Icon name="south" size={18} />
                      Esta entrada possui {adendos.length === 1 ? '1 adendo' : `${adendos.length} adendos`} de correção logo abaixo. Leia em conjunto.
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {e.etiqueta && (
                      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-chip px-2.5 text-xs font-semibold text-ink-600">
                        <Icon name="print" size={15} />
                        {e.etiqueta}
                      </span>
                    )}
                    <span className="flex-1" />
                    {podeRegistrar && compondo !== e.id && (
                      <button
                        onClick={() => abrir(e.id)}
                        className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"
                      >
                        <Icon name="add_comment" size={18} />
                        Adicionar adendo
                      </button>
                    )}
                  </div>
                </article>

                {adendos.map((a) => (
                  <div key={a.id} className="flex gap-2 pl-6">
                    <div className="w-4 shrink-0 border-b-2 border-l-2 border-info-border" style={{ height: 24, borderBottomLeftRadius: 8 }} />
                    <article className="flex flex-1 flex-col gap-2 rounded-xl border border-info-border bg-white px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                        <span className="flex items-center gap-1 text-xs font-bold tracking-[0.06em] text-info">
                          <Icon name="link" size={16} />
                          ADENDO
                        </span>
                        <span className="text-ink-600">
                          Corrige {e.id} de {dataHora(e.criadoEm)}
                        </span>
                        <span className="flex-1" />
                        <span className="flex items-center gap-1 tabular-nums text-ink-500">
                          <Icon name="lock" size={15} />
                          Registro imutável · {a.id}
                        </span>
                      </div>
                      <div className="text-[13px] text-ink-600">
                        <strong className="text-ink">{rotuloAutor(users, a.autorId)}</strong> · {dataHora(a.criadoEm)}
                      </div>
                      <p className="m-0 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900">{a.texto}</p>
                    </article>
                  </div>
                ))}

                {compondo === e.id && (
                  <div className="pl-6">{compositor(`Novo adendo à entrada ${e.id}`, 'Depois de salvo, o adendo também não poderá ser editado.')}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {exportando && <ExportacaoProntuario paciente={paciente} onFim={() => setExportando(false)} />}
    </div>
  );
}
