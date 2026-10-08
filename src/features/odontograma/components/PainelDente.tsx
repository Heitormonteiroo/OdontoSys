'use client';

import { useState } from 'react';
import { Alert, Button, Icon } from '@/components/ui';
import { dataHora } from '@/lib/dates';
import { useStore } from '@/mock/store';
import type { Achado, Face, SituacaoAchado, ToothEvent, User } from '@/mock/types';
import { ORDEM_FACES, nomeDente, nomeFace, posicoesFaces, siglaFace, siglasFaces } from '../lib/dentes';
import { idsCorrigidos, rotuloAchado, situacaoDente, type Catalogo, type EstadoDente } from '../lib/estado';
import { Amostra, DenteDesenho } from './DenteDesenho';

const SITUACOES: { id: SituacaoAchado; label: string; bg: string; fg: string }[] = [
  { id: 'existente', label: 'Existente', bg: '#F0F3F5', fg: '#3B4F5D' },
  { id: 'planejado', label: 'Planejado', bg: '#EFF8FF', fg: '#175CD3' },
  { id: 'realizado', label: 'Realizado', bg: '#ECFDF3', fg: '#067647' },
];

const chip = (on: boolean) =>
  `h-8 rounded-md border px-2.5 text-[13px] ${on ? 'border-brand bg-brand-soft font-semibold text-brand-dark' : 'border-line-strong bg-white font-medium text-ink-700'}`;

/** Painel lateral do dente: faces ampliadas, situação atual e histórico com correção. */
export function PainelDente({
  n,
  estado,
  eventos,
  cat,
  users,
  face,
  facesPendentes,
  podeRegistrar,
  podePlanejar,
  onFace,
  onFechar,
  onCorrigido,
  onAdicionarAoPlano,
}: {
  n: number;
  estado: EstadoDente;
  eventos: ToothEvent[];
  cat: Catalogo;
  users: User[];
  face: Face | null;
  facesPendentes: Face[] | 'todas' | null;
  podeRegistrar: boolean;
  podePlanejar: boolean;
  onFace: (f: Face) => void;
  onFechar: () => void;
  onCorrigido: (msg: string) => void;
  onAdicionarAoPlano: () => void;
}) {
  const registrar = useStore((s) => s.registrarEventoDente);
  const [corrigindo, setCorrigindo] = useState<ToothEvent | null>(null);
  const [cAchado, setCAchado] = useState<Achado>('carie');
  const [cFaces, setCFaces] = useState<Face[]>([]);
  const [cSit, setCSit] = useState<SituacaoAchado>('existente');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const pos = posicoesFaces(n);
  const rot = (p: keyof typeof pos) => `${siglaFace(n, pos[p])} · ${nomeFace(n, pos[p])}`;
  const situacao = situacaoDente(n, estado, cat, siglaFace);
  const corrigidos = idsCorrigidos(eventos);
  const historico = [...eventos].sort((a, b) => b.seq - a.seq);
  const nomeUser = (id: string) => users.find((u) => u.id === id)?.nome ?? '—';

  let infoFace = 'Clique em uma face para ver os achados dela.';
  if (face) {
    const fs = estado.faces[face];
    const partes = [fs.atual && cat[fs.atual].label, fs.planejado && `${cat[fs.planejado].label} planejada`].filter(Boolean);
    infoFace = `Face ${nomeFace(n, face).toLowerCase()}: ${partes.length ? partes.join(' + ') : 'sem achados'}`;
  }

  function iniciar(e: ToothEvent) {
    setCorrigindo(e);
    setCAchado(e.achado);
    setCFaces(e.faces);
    setCSit(e.situacao);
    setMotivo('');
    setErro(null);
  }

  function salvar() {
    if (!corrigindo) return;
    const r = registrar(corrigindo.patientId, { dente: n, achado: cAchado, situacao: cSit, faces: cFaces, nota: motivo, substitui: corrigindo.id });
    if (!r.ok) return setErro(r.erro);
    onCorrigido(`${r.evento.id} registrado como correção de ${corrigindo.id}. O evento original continua no histórico.`);
    setCorrigindo(null);
  }

  const faceEscopo = cat[cAchado].escopo === 'face';
  const podeSalvar = motivo.trim().length >= 5 && (!faceEscopo || cFaces.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-lg font-bold">Dente {n}</h2>
          <span className="text-[13px] text-ink-600">{nomeDente(n)}</span>
        </div>
        <button aria-label="Fechar painel do dente" onClick={onFechar} className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-surface-hover">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-subtle py-4">
        <span className="text-xs font-bold text-ink-600">{rot('top')}</span>
        <div className="flex items-center gap-2.5">
          <span className="w-16 text-right text-xs font-bold text-ink-600">{rot('left')}</span>
          <DenteDesenho n={n} estado={estado} cat={cat} tamanho={112} faceSelecionada={face} facesPendentes={facesPendentes} onFace={onFace} centro={siglaFace(n, 'O')} />
          <span className="w-16 text-xs font-bold text-ink-600">{rot('right')}</span>
        </div>
        <span className="text-xs font-bold text-ink-600">{rot('bottom')}</span>
        <div className="mt-1 text-[13px] text-ink-700">{infoFace}</div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">Situação atual</span>
        <div className="flex flex-wrap gap-1.5">
          {situacao.length === 0 && <span className="text-[13px] text-ink-500">Sem achados registrados.</span>}
          {situacao.map((s) => (
            <span key={s.texto + s.planejado} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[13px] font-medium">
              <Amostra achado={s.achado} cat={cat} planejado={s.planejado} tamanho={14} />
              {s.texto}
              <span className="text-ink-500">· {s.planejado ? 'planejado' : 'presente'}</span>
            </span>
          ))}
        </div>
      </div>

      {podePlanejar && (
        <Button variant="secondary" icon="add" onClick={onAdicionarAoPlano}>
          Adicionar ao plano de tratamento
        </Button>
      )}

      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-ink-600">
          Histórico · {historico.length === 1 ? '1 evento' : `${historico.length} eventos`}
        </span>
        <span className="flex items-center gap-1 text-xs text-ink-500">
          <Icon name="lock" size={14} />
          Eventos não editáveis
        </span>
      </div>
      {historico.length === 0 && <div className="text-[13px] text-ink-500">Nenhum evento registrado neste dente.</div>}
      <div className="flex flex-col gap-2">
        {historico.map((e) => {
          const corrBy = eventos.find((x) => x.substitui === e.id);
          const sit = SITUACOES.find((s) => s.id === e.situacao)!;
          return (
            <article
              key={e.id}
              className="flex flex-col gap-1.5 rounded-lg border px-3 py-2.5"
              style={{ background: corrBy ? '#F8FAFB' : '#FFFFFF', borderColor: e.substitui ? '#B2DDFF' : corrigindo?.id === e.id ? '#0F766E' : '#E1E8ED' }}
            >
              {e.substitui && (
                <div className="flex items-center gap-1 text-[11px] font-bold tracking-[0.05em] text-info">
                  <Icon name="link" size={14} />
                  CORREÇÃO · substitui {e.substitui}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11px] font-semibold" style={{ background: sit.bg, color: sit.fg }}>
                  {sit.label}
                </span>
                <span className="flex-1" />
                <span title="Registro imutável" className="flex items-center gap-1 text-[11px] tabular-nums text-ink-500">
                  <Icon name="lock" size={13} />
                  {e.id}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-sm ${corrBy ? 'text-ink-500 line-through' : 'text-ink-900'}`}>
                <Amostra achado={e.achado} cat={cat} planejado={e.situacao === 'planejado'} tamanho={14} />
                <span className="font-semibold">{rotuloAchado(e, cat)}</span>
                <span className="text-ink-600">· {e.faces.length ? `faces ${siglasFaces(n, e.faces)}` : 'dente inteiro'}</span>
              </div>
              {e.nota && <p className="m-0 text-[13px] leading-snug text-ink-700">{e.nota}</p>}
              <div className="text-xs text-ink-600">
                <strong className="font-semibold text-ink-700">{nomeUser(e.autorId)}</strong> · {dataHora(e.criadoEm)}
                {e.planItemId && ' · via plano de tratamento'}
              </div>
              {corrBy && (
                <div className="flex items-center gap-1 text-xs text-ink-600">
                  <Icon name="history" size={14} />
                  Substituído por {corrBy.id} · mantido no histórico
                </div>
              )}
              {podeRegistrar && !corrigidos.has(e.id) && corrigindo?.id !== e.id && (
                <div>
                  <button onClick={() => iniciar(e)} className="flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-semibold text-brand hover:bg-brand-soft">
                    <Icon name="add_link" size={16} />
                    Registrar correção
                  </button>
                </div>
              )}
              {corrigindo?.id === e.id && (
                <div className="mt-1 flex flex-col gap-2.5 rounded-lg bg-surface-subtle p-3">
                  <div className="text-sm font-semibold">Correção de {e.id}</div>
                  <div className="text-xs text-ink-600">O evento original não é alterado. A correção cria um novo evento vinculado.</div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-ink-700">Achado correto</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(cat) as Achado[]).map((a) => (
                        <button key={a} onClick={() => setCAchado(a)} className={chip(cAchado === a)}>
                          {a === 'canal' ? 'Canal' : cat[a].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {faceEscopo && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-ink-700">Faces</span>
                      <div className="flex gap-1.5">
                        {ORDEM_FACES.map((f) => (
                          <button
                            key={f}
                            title={nomeFace(n, f)}
                            onClick={() => setCFaces((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))}
                            className={`${chip(cFaces.includes(f))} w-9 px-0`}
                          >
                            {siglaFace(n, f)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    {SITUACOES.map((s) => (
                      <button key={s.id} onClick={() => setCSit(s.id)} className={chip(cSit === s.id)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-ink-700">
                    Motivo da correção (obrigatório)
                    <textarea
                      value={motivo}
                      onChange={(ev) => setMotivo(ev.target.value)}
                      placeholder="Ex.: face registrada errada; confirmado na radiografia."
                      className="min-h-[64px] rounded-md border border-line-strong bg-white p-2 text-[13px] font-normal text-ink outline-none focus:border-brand focus:shadow-field"
                    />
                  </label>
                  {erro && <Alert tone="danger">{erro}</Alert>}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setCorrigindo(null)}>
                      Cancelar
                    </Button>
                    <Button icon="lock" disabled={!podeSalvar} title={podeSalvar ? undefined : 'Informe o motivo para continuar'} onClick={salvar}>
                      Registrar correção
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
