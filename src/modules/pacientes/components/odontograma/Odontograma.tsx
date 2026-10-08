'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { Imprimivel, LinhaAssinatura, RodapeImpressao, Timbre } from '@/components/print/Imprimivel';
import type { AbaProps } from '@/modules/pacientes/components/abas';
import { formatarData, idadeEm } from '@/utils/dates';
import { can } from '@/utils/permissions';
import { useCurrentUser, useUsuarios } from '@/hooks/useAuth';
import { useEventosDente, useRegistrarEventoDente, useTiposAchado } from '@/modules/pacientes/services';
import type { Achado, Denticao, Face, SituacaoAchado } from '@/mock/types';
import { ORDEM_FACES, TODOS_DENTES, denticaoPorIdade, ehSuperior, linhasDenticao, siglaFace, siglasFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import { bloqueioRegistro, catalogoPorId, estadoBoca, planejadosPendentes, rotuloAchado, situacaoDente } from '@/modules/pacientes/utils/odontograma/estado';
import { Amostra, DenteDesenho, RaizDesenho } from '@/modules/pacientes/components/odontograma/DenteDesenho';
import { PainelDente } from '@/modules/pacientes/components/odontograma/PainelDente';

type Ferramenta = 'selecionar' | Achado;

const SITUACOES: { id: SituacaoAchado; label: string; cor: string }[] = [
  { id: 'existente', label: 'Existente', cor: '#3B4F5D' },
  { id: 'planejado', label: 'Planejado', cor: '#175CD3' },
  { id: 'realizado', label: 'Realizado', cor: '#067647' },
];
const DENTICOES: { id: Denticao; label: string }[] = [
  { id: 'permanente', label: 'Permanente' },
  { id: 'decidua', label: 'Decídua' },
  { id: 'mista', label: 'Mista' },
];
const ACHADOS: Achado[] = ['carie', 'restauracao', 'coroa', 'canal', 'implante', 'ausente', 'higido'];

const segmento = (on: boolean) =>
  `flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] ${on ? 'bg-white font-semibold text-ink shadow-card' : 'font-medium text-ink-600 hover:text-ink'}`;

export function Odontograma({ paciente, irPara }: AbaProps) {
  const user = useCurrentUser();
  const users = useUsuarios();
  const findingTypes = useTiposAchado();
  const todos = useEventosDente();
  const registrar = useRegistrarEventoDente();

  const idade = idadeEm(paciente.nascimento);
  const [denticao, setDenticao] = useState<Denticao>(() => denticaoPorIdade(idade));
  const [ferramenta, setFerramenta] = useState<Ferramenta>('selecionar');
  const [situacao, setSituacao] = useState<SituacaoAchado>('existente');
  const [pendente, setPendente] = useState<{ dente: number; faces: Face[] } | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [face, setFace] = useState<Face | null>(null);
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null);
  const [imprimindo, setImprimindo] = useState(false);
  const fimImpressao = useCallback(() => setImprimindo(false), []);

  const podeRegistrar = can(user?.papel, 'odontograma:registrar');
  const podePlanejar = can(user?.papel, 'plano:editar');
  const cat = useMemo(() => catalogoPorId(findingTypes), [findingTypes]);
  const eventos = useMemo(() => todos.filter((e) => e.patientId === paciente.id), [todos, paciente.id]);
  const boca = useMemo(() => estadoBoca(eventos, cat), [eventos, cat]);
  const planejados = useMemo(() => planejadosPendentes(eventos), [eventos]);
  const escopo = ferramenta === 'selecionar' ? null : cat[ferramenta].escopo;

  function escolherFerramenta(f: Ferramenta) {
    setFerramenta(f);
    setPendente(null);
  }

  function onFace(n: number, f: Face) {
    setAviso(null);
    if (!escopo) {
      setSel(n);
      setFace(f);
      return;
    }
    setSel(n);
    setFace(null);
    if (escopo === 'dente') return setPendente({ dente: n, faces: [] });
    setPendente((p) => {
      const atual = p && p.dente === n ? p.faces : [];
      return { dente: n, faces: atual.includes(f) ? atual.filter((x) => x !== f) : [...atual, f] };
    });
  }

  function onDente(n: number) {
    setAviso(null);
    setSel(n);
    setFace(null);
    if (escopo === 'dente') setPendente({ dente: n, faces: [] });
    else if (pendente && pendente.dente !== n) setPendente(null);
  }

  function registrarPendente() {
    if (!pendente || ferramenta === 'selecionar') return;
    const r = registrar(paciente.id, { dente: pendente.dente, achado: ferramenta, situacao, faces: pendente.faces });
    if (!r.ok) return setAviso({ tom: 'erro', texto: r.erro });
    setAviso({
      tom: 'ok',
      texto: `${r.evento.id} registrado no dente ${pendente.dente}: ${cat[ferramenta].label} (${situacao}). O evento não pode ser editado.`,
    });
    setPendente(null);
  }

  // Barra de registro (dica, pronto ou bloqueado)
  let barra: { tipo: 'dica' | 'pronto' | 'bloqueado'; texto: string } | null = null;
  if (ferramenta !== 'selecionar') {
    const rotulo = `${cat[ferramenta].label} · ${situacao}`;
    if (!pendente || (escopo === 'face' && pendente.faces.length === 0)) {
      barra = { tipo: 'dica', texto: `Modo de registro: ${rotulo}. Clique ${escopo === 'face' ? 'nas faces de um dente' : 'no número ou nas faces de um dente'}.` };
    } else {
      const bloqueio = bloqueioRegistro({ dente: pendente.dente, achado: ferramenta, situacao, faces: pendente.faces }, boca.get(pendente.dente)!, cat);
      barra = bloqueio
        ? { tipo: 'bloqueado', texto: bloqueio }
        : { tipo: 'pronto', texto: `Dente ${pendente.dente}${escopo === 'face' ? ` · faces ${siglasFaces(pendente.dente, pendente.faces)}` : ' · dente inteiro'} → ${rotulo}` };
    }
  }

  const rotDenticao = { permanente: 'dentição permanente', decidua: 'dentição decídua', mista: 'dentição mista' }[denticao];
  const temDeciduos = eventos.some((e) => e.dente >= 51);

  return (
    <div className="flex flex-col gap-4">
      {podeRegistrar && (
        <section className="no-print flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Ferramenta</span>
            {(['selecionar', ...ACHADOS] as Ferramenta[]).map((f) => {
              const on = ferramenta === f;
              return (
                <button
                  key={f}
                  aria-pressed={on}
                  onClick={() => escolherFerramenta(f)}
                  className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm ${
                    on ? 'border-brand bg-brand-soft font-semibold text-brand-dark' : 'border-line-strong bg-white font-medium text-ink-700 hover:border-ink-400'
                  }`}
                >
                  {f === 'selecionar' ? <Icon name="arrow_selector_tool" size={18} /> : <Amostra achado={f} cat={cat} />}
                  {f === 'selecionar' ? 'Selecionar' : cat[f].label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5" style={{ opacity: escopo ? 1 : 0.5 }}>
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Registrar como</span>
              <div role="radiogroup" aria-label="Situação do achado" className="flex gap-1 rounded-lg bg-surface-muted p-1">
                {SITUACOES.map((s) => (
                  <button
                    key={s.id}
                    role="radio"
                    aria-checked={situacao === s.id}
                    disabled={!escopo}
                    onClick={() => setSituacao(s.id)}
                    className={segmento(situacao === s.id)}
                  >
                    {situacao === s.id && <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Dentição</span>
              <div role="radiogroup" aria-label="Dentição" className="flex gap-1 rounded-lg bg-surface-muted p-1">
                {DENTICOES.map((d) => (
                  <button key={d.id} role="radio" aria-checked={denticao === d.id} onClick={() => setDenticao(d.id)} className={segmento(denticao === d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {aviso && (
        <div
          role={aviso.tom === 'erro' ? 'alert' : 'status'}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm ${
            aviso.tom === 'ok' ? 'border-ok-border bg-ok-bg text-ok-text' : 'border-danger-border bg-danger-bg text-danger-text'
          }`}
        >
          <Icon name={aviso.tom === 'ok' ? 'check_circle' : 'error'} size={20} fill />
          <span className="flex-1">{aviso.texto}</span>
          <button aria-label="Fechar aviso" onClick={() => setAviso(null)} className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/5">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {eventos.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-text">
          <Icon name="info" size={20} className="text-info" />
          <span>
            <strong>Odontograma sem registros.</strong>{' '}
            {podeRegistrar
              ? 'Escolha um achado na barra de ferramentas e clique nas faces ou no número do dente. Cada registro vira um evento permanente no prontuário.'
              : 'Nenhum achado registrado pelo dentista.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-4 overflow-x-auto rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-lg font-bold">Odontograma · {rotDenticao}</h2>
            <span className="text-[13px] text-ink-600">Notação FDI · vista do profissional</span>
          </div>

          {barra && (
            <div
              role={barra.tipo === 'bloqueado' ? 'alert' : undefined}
              className={`flex flex-wrap items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm ${
                barra.tipo === 'bloqueado' ? 'bg-warn-bg text-warn-text' : barra.tipo === 'pronto' ? 'bg-brand-soft text-brand-dark' : 'bg-surface-subtle text-ink-700'
              }`}
            >
              <Icon name={barra.tipo === 'bloqueado' ? 'warning' : barra.tipo === 'pronto' ? 'edit_note' : 'touch_app'} size={20} />
              <span className="flex-1 font-medium">{barra.texto}</span>
              {barra.tipo === 'dica' && (
                <button onClick={() => escolherFerramenta('selecionar')} className="text-[13px] font-semibold underline">
                  Sair do modo de registro
                </button>
              )}
              {barra.tipo === 'pronto' && (
                <>
                  <Button variant="secondary" onClick={() => setPendente(null)}>
                    Cancelar
                  </Button>
                  <Button icon="lock" onClick={registrarPendente}>
                    Registrar evento
                  </Button>
                </>
              )}
              {barra.tipo === 'bloqueado' && (
                <Button variant="secondary" onClick={() => setPendente(null)}>
                  Entendi
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-between px-1 text-xs font-medium text-ink-500">
            <span>← Direito do paciente</span>
            <span>Esquerdo do paciente →</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            {linhasDenticao(denticao).map((linha, i) =>
              linha === 'divisor' ? (
                <div key={`d${i}`} className="my-1 h-px w-full max-w-[720px] bg-line-strong" />
              ) : (
                <div key={linha.legenda + i} className="flex flex-col items-center gap-1">
                  {linha.legenda && <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-500">{linha.legenda}</div>}
                  <div className="flex">
                    {linha.dentes.map((n, k) => {
                      const est = boca.get(n)!;
                      const ativo = sel === n;
                      const pend = pendente?.dente === n ? (escopo === 'dente' ? 'todas' : pendente.faces) : null;
                      return (
                        <div
                          key={n}
                          className={`flex w-10 items-center gap-[3px] rounded-lg py-1 ${ehSuperior(n) ? 'flex-col' : 'flex-col-reverse'} ${ativo ? 'bg-brand-soft' : ''}`}
                          style={{ marginRight: k === linha.dentes.length / 2 - 1 ? 14 : 0 }}
                        >
                          <button
                            onClick={() => onDente(n)}
                            aria-label={ativo ? `Dente ${n} selecionado` : `Selecionar dente ${n}`}
                            className={`h-6 w-[34px] rounded-md text-[13px] tabular-nums ${ativo ? 'bg-brand font-bold text-white' : 'font-semibold text-ink-700 hover:bg-surface-muted hover:text-ink'}`}
                          >
                            {n}
                          </button>
                          <RaizDesenho estado={est} cat={cat} />
                          <DenteDesenho
                            n={n}
                            estado={est}
                            cat={cat}
                            tamanho={34}
                            faceSelecionada={ativo && !escopo ? face : null}
                            facesPendentes={pend}
                            onFace={(f) => onFace(n, f)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          {denticao !== 'permanente' && !temDeciduos && (
            <div className="text-center text-[13px] text-ink-500">Paciente de {idade} anos: nenhum registro na dentição decídua.</div>
          )}

          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Legenda</span>
              {ACHADOS.map((a) => (
                <span key={a} className="flex items-center gap-1.5">
                  <Amostra achado={a} cat={cat} />
                  {a === 'canal' ? 'Tratamento de canal' : cat[a].label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
              <span>Sólido: existente ou realizado</span>
              <span>Hachurado ou tracejado: planejado</span>
              <span>
                Faces: <strong>O/I</strong> oclusal/incisal · <strong>M</strong> mesial · <strong>D</strong> distal · <strong>V</strong> vestibular ·{' '}
                <strong>L/P</strong> lingual/palatina
              </span>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          {sel !== null ? (
            <PainelDente
              key={sel}
              n={sel}
              estado={boca.get(sel)!}
              eventos={eventos.filter((e) => e.dente === sel)}
              cat={cat}
              users={users}
              face={escopo ? null : face}
              facesPendentes={pendente?.dente === sel ? (escopo === 'dente' ? 'todas' : pendente.faces) : null}
              podeRegistrar={podeRegistrar}
              podePlanejar={podePlanejar}
              onFace={(f) => onFace(sel, f)}
              onFechar={() => {
                setSel(null);
                setFace(null);
              }}
              onCorrigido={(texto) => setAviso({ tom: 'ok', texto })}
              onAdicionarAoPlano={() => {
                // Faces sugeridas: a face clicada; senão, as faces com cárie ativa no dente.
                const comCarie = ORDEM_FACES.filter((f) => boca.get(sel)!.faces[f].atual === 'carie');
                irPara('plano', { tipo: 'adicionar-procedimento', dente: sel, faces: face ? [face] : comCarie });
              }}
            />
          ) : eventos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-ink-600">
                <Icon name="dentistry" size={28} />
              </div>
              <div className="font-semibold">Nenhum dente selecionado</div>
              <div className="text-[13px] text-ink-600">Clique no número de um dente para ver as faces e o histórico de eventos.</div>
            </div>
          ) : (
            <Resumo
              boca={boca}
              cat={cat}
              total={eventos.length}
              inicio={eventos.reduce((m, e) => (e.criadoEm < m ? e.criadoEm : m), eventos[0].criadoEm)}
              planejados={planejados.map((e) => ({
                id: e.id,
                dente: e.dente,
                texto: `${rotuloAchado(e, cat)}${e.faces.length ? ` · ${siglasFaces(e.dente, e.faces)}` : ''}`,
                sub: `${users.find((u) => u.id === e.autorId)?.nome ?? '—'} · ${formatarData(e.criadoEm)}`,
              }))}
              onDente={(n) => {
                setSel(n);
                setFace(null);
              }}
              onImprimir={() => setImprimindo(true)}
            />
          )}
        </aside>
      </div>

      {imprimindo && (
        <Imprimivel onFim={fimImpressao}>
          <Timbre titulo="Odontograma" direita={`${paciente.nome} · prontuário nº ${paciente.prontuarioNo}`} />
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              {TODOS_DENTES.map((n) => ({ n, itens: situacaoDente(n, boca.get(n)!, cat, siglaFace) }))
                .filter((d) => d.itens.length > 0)
                .map((d) => (
                  <tr key={d.n} className="border-b border-line">
                    <td className="w-[48px] py-1 font-semibold tabular-nums">{d.n}</td>
                    <td className="py-1">{d.itens.map((i) => `${i.texto}${i.planejado ? ' (planejado)' : ''}`).join(' · ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <LinhaAssinatura rotulo={`${user?.nome ?? ''}${user?.cro ? ` · ${user.cro}` : ''}`} />
          <RodapeImpressao>Estado atual derivado dos eventos registrados. Registro clínico auxiliar de apoio ao atendimento.</RodapeImpressao>
        </Imprimivel>
      )}
    </div>
  );
}

function Resumo({
  boca,
  cat,
  total,
  inicio,
  planejados,
  onDente,
  onImprimir,
}: {
  boca: ReturnType<typeof estadoBoca>;
  cat: ReturnType<typeof catalogoPorId>;
  total: number;
  inicio: string;
  planejados: { id: string; dente: number; texto: string; sub: string }[];
  onDente: (n: number) => void;
  onImprimir: () => void;
}) {
  const cont: Record<Achado, number> = { carie: 0, restauracao: 0, coroa: 0, canal: 0, implante: 0, ausente: 0, higido: 0 };
  for (const est of boca.values()) {
    if (ORDEM_FACES.some((f) => est.faces[f].atual === 'carie')) cont.carie++;
    if (ORDEM_FACES.some((f) => est.faces[f].atual === 'restauracao')) cont.restauracao++;
    (['coroa', 'canal', 'implante', 'ausente'] as Achado[]).forEach((a) => est.inteiro[a] === 'presente' && cont[a]++);
    if (est.higido) cont.higido++;
  }
  const rot: Record<Achado, string> = { carie: 'Com cárie', restauracao: 'Restaurados', coroa: 'Coroas', canal: 'Com canal', implante: 'Implantes', ausente: 'Ausentes', higido: 'Hígidos' };
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-lg font-bold">Resumo do odontograma</h2>
        <span className="text-[13px] text-ink-600">
          Primeiro registro em {formatarData(inicio)} · {total} eventos
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACHADOS.map((a) => (
          <div key={a} className="flex items-center gap-2 rounded-lg border border-surface-muted bg-surface-subtle px-3 py-2">
            <Amostra achado={a} cat={cat} />
            <span className="flex-1 text-[13px] text-ink-700">{rot[a]}</span>
            <span className="text-base font-bold tabular-nums">{cont[a]}</span>
          </div>
        ))}
      </div>
      <div className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Planejado ({planejados.length})</div>
      <div className="flex flex-col gap-1.5">
        {planejados.length === 0 && <span className="text-[13px] text-ink-500">Nada planejado no odontograma.</span>}
        {planejados.map((p) => (
          <button key={p.id} onClick={() => onDente(p.dente)} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-left hover:border-brand">
            <span className="w-7 text-sm font-bold tabular-nums">{p.dente}</span>
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-semibold">{p.texto}</span>
              <span className="text-xs text-ink-600">{p.sub}</span>
            </span>
            <Icon name="chevron_right" size={18} className="text-ink-400" />
          </button>
        ))}
      </div>
      <Button variant="secondary" icon="print" onClick={onImprimir}>
        Imprimir odontograma
      </Button>
    </>
  );
}
