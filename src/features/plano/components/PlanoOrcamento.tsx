'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Alert, Button, Chip, ConfirmDialog, Icon, Modal } from '@/components/ui';
import { siglasFaces } from '@/features/odontograma/lib/dentes';
import type { AbaProps } from '@/features/pacientes/tabs';
import { dataHora, formatarData } from '@/lib/dates';
import { formatarCentavos } from '@/lib/dinheiro';
import { can } from '@/lib/permissions';
import { STATUS_TRATAMENTO } from '@/lib/status';
import { useCurrentUser, useStore } from '@/mock/store';
import type { Quote, StatusTratamento, TreatmentPlanItem } from '@/mock/types';
import { STATUS_ORCAMENTO, TRANSICOES, historicoItem, planoAtual, statusItem, statusOrcamento } from '../lib/plano';
import { AdicionarItemDialog } from './AdicionarItemDialog';
import { EmitirOrcamentoDialog } from './EmitirOrcamentoDialog';
import { OrcamentoImpressao } from './OrcamentoImpressao';

const GRID = 'grid grid-cols-[64px_minmax(0,1fr)_130px_104px_140px] items-center gap-3';

type Acao = { item: TreatmentPlanItem; para: StatusTratamento } | null;

export function PlanoOrcamento({ paciente, intencao, irPara }: AbaProps) {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const procedures = useStore((s) => s.procedures);
  const plans = useStore((s) => s.treatmentPlans);
  const allItems = useStore((s) => s.treatmentPlanItems);
  const eventos = useStore((s) => s.planItemEvents);
  const quotes = useStore((s) => s.quotes);
  const documentos = useStore((s) => s.issuedDocuments);
  const mudarStatus = useStore((s) => s.mudarStatusItem);
  const decidir = useStore((s) => s.decidirOrcamento);

  const podeEditar = can(user?.papel, 'plano:editar');
  const podeEmitir = can(user?.papel, 'orcamento:emitir');
  const podeDecidir = can(user?.papel, 'orcamento:decidir');

  const [adicionando, setAdicionando] = useState<{ dente: number | null; faces: TreatmentPlanItem['faces'] } | null>(null);
  const [emitindo, setEmitindo] = useState(false);
  const [imprimindo, setImprimindo] = useState<Quote | null>(null);
  const [acao, setAcao] = useState<Acao>(null);
  const [nota, setNota] = useState('');
  const [decisao, setDecisao] = useState<'aprovado' | 'recusado' | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [verVersoes, setVerVersoes] = useState(false);
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'danger'; texto: string } | null>(null);
  const fimImpressao = useCallback(() => setImprimindo(null), []);

  useEffect(() => {
    if (intencao?.tipo === 'adicionar-procedimento' && podeEditar) setAdicionando({ dente: intencao.dente, faces: intencao.faces });
  }, [intencao, podeEditar]);

  const plano = planoAtual(plans, paciente.id);
  const versoes = useMemo(() => plans.filter((p) => p.patientId === paciente.id).sort((a, b) => b.versao - a.versao), [plans, paciente.id]);
  const itens = useMemo(
    () =>
      plano
        ? allItems
            .filter((i) => i.planId === plano.id)
            .map((i) => ({ item: i, status: statusItem(eventos, allItems, i), proc: procedures.find((p) => p.id === i.procedureId)! }))
            .sort((a, b) => a.item.etapa - b.item.etapa)
        : [],
    [plano, allItems, eventos, procedures],
  );
  const orcamentos = useMemo(() => quotes.filter((q) => q.patientId === paciente.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)), [quotes, paciente.id]);
  const vigente = orcamentos.find((q) => !q.substituidoPor) ?? null;
  const aberto_ = vigente && statusOrcamento(vigente) === 'emitido' ? vigente : null;
  const propostos = itens.filter((x) => x.status === 'proposto').map((x) => x.item);
  const naoCobertos = propostos.filter((i) => !aberto_?.itens.some((q) => q.itemId === i.id));

  const soma = (f: (s: StatusTratamento) => boolean) => itens.filter((x) => f(x.status)).reduce((t, x) => t + x.item.precoCentavos, 0);
  const totalPlano = soma((s) => s !== 'cancelado');
  const totalAprovado = soma((s) => ['aprovado', 'em_andamento', 'concluido'].includes(s));
  const totalProposto = soma((s) => s === 'proposto');

  const tipos = new Set(paciente.alertas.map((a) => a.tipo));
  const riscos = [tipos.has('gestante') && 'gestante', tipos.has('anticoagulante') && 'em uso de anticoagulante', tipos.has('alergia') && 'com alergia registrada'].filter(Boolean) as string[];

  const nomeUser = (id: string | null) => users.find((u) => u.id === id)?.nome ?? '—';
  const etapaSugerida = Math.max(1, ...itens.map((x) => x.item.etapa));

  function confirmarAcao() {
    if (!acao) return;
    const r = mudarStatus(acao.item.id, acao.para, { nota, confirmado: acao.para === 'concluido' });
    if (!r.ok) return setAviso({ tom: 'danger', texto: r.erro });
    const proc = procedures.find((p) => p.id === acao.item.procedureId)!;
    setAviso({
      tom: 'ok',
      texto:
        acao.para === 'concluido'
          ? `${proc.nome} concluído. ${proc.achadoRealizado && acao.item.dente ? 'Odontograma e prontuário atualizados.' : 'Registrado no prontuário.'}`
          : `${proc.nome}: ${r.status}.`,
    });
    setAcao(null);
    setNota('');
  }

  function confirmarDecisao() {
    if (!vigente || !decisao) return;
    const r = decidir(vigente.id, decisao);
    setDecisao(null);
    setAviso(r.ok ? { tom: 'ok', texto: decisao === 'aprovado' ? `Orçamento nº ${vigente.numero} aprovado. Itens liberados para execução.` : `Orçamento nº ${vigente.numero} registrado como recusado.` } : { tom: 'danger', texto: r.erro });
  }

  const dialogos = (
    <>
      {adicionando && (
        <AdicionarItemDialog
          patientId={paciente.id}
          plano={plano}
          etapaSugerida={etapaSugerida}
          inicial={adicionando}
          onFechar={(msg) => {
            setAdicionando(null);
            if (msg) setAviso({ tom: 'ok', texto: msg });
          }}
        />
      )}
      {emitindo && (
        <EmitirOrcamentoDialog
          patientId={paciente.id}
          propostos={propostos}
          substitui={aberto_}
          onFechar={(q) => {
            setEmitindo(false);
            if (q) {
              setAviso({ tom: 'ok', texto: `Orçamento nº ${q.numero} emitido. Imprima, colha a assinatura e anexe a cópia digitalizada em Documentos.` });
              setImprimindo(q);
            }
          }}
        />
      )}
      {imprimindo && <OrcamentoImpressao orcamento={imprimindo} onFim={fimImpressao} />}
    </>
  );

  if (!plano || itens.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-line bg-white">
          <EmptyState
            icon="request_quote"
            title="Nenhum plano de tratamento ainda"
            actions={
              <>
                {can(user?.papel, 'odontograma:ver') && (
                  <Button variant="secondary" onClick={() => irPara('odonto')}>
                    Abrir odontograma
                  </Button>
                )}
                {podeEditar && <Button onClick={() => setAdicionando({ dente: null, faces: [] })}>Criar plano de tratamento</Button>}
              </>
            }
          >
            {podeEditar
              ? 'Monte o plano a partir do odontograma ou adicione procedimentos do catálogo. O orçamento é gerado a partir do plano e impresso para assinatura.'
              : 'O dentista ainda não montou o plano deste paciente.'}
          </EmptyState>
        </section>
        {dialogos}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        {aviso && (
          <Alert tone={aviso.tom} className="no-print">
            {aviso.texto}
          </Alert>
        )}
        <section className="flex flex-col rounded-2xl border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h2 className="m-0 text-lg font-bold">Plano de tratamento</h2>
                <Chip size="sm" tone={plano.aprovadoEm ? 'ok' : 'warn'}>
                  v{plano.versao} · {plano.aprovadoEm ? 'aprovado' : 'em elaboração'}
                </Chip>
              </div>
              <div className="text-[13px] text-ink-600">
                Versão {plano.versao} criada em {dataHora(plano.criadoEm)} por {nomeUser(plano.criadoPor)}
                {plano.aprovadoEm && ` · aprovada em ${dataHora(plano.aprovadoEm)}`}
                {versoes.length > 1 && (
                  <>
                    {' · '}
                    <button onClick={() => setVerVersoes((v) => !v)} className="font-semibold text-brand underline">
                      {verVersoes
                        ? 'ocultar versões anteriores'
                        : versoes.length === 2
                          ? '1 versão anterior preservada'
                          : `${versoes.length - 1} versões anteriores preservadas`}
                    </button>
                  </>
                )}
              </div>
            </div>
            {podeEditar && (
              <Button icon="add" onClick={() => setAdicionando({ dente: null, faces: [] })}>
                Adicionar procedimento
              </Button>
            )}
          </div>

          {verVersoes && (
            <div className="mx-5 mb-3 flex flex-col gap-1 rounded-lg bg-surface-subtle px-4 py-3 text-[13px]">
              {versoes.map((v) => (
                <div key={v.id} className="flex gap-2">
                  <strong>v{v.versao}</strong>
                  <span className="text-ink-600">
                    criada em {dataHora(v.criadoEm)} por {nomeUser(v.criadoPor)}
                    {v.aprovadoEm && ` · aprovada em ${dataHora(v.aprovadoEm)}`}
                    {v.substituidoPor ? ' · substituída (somente leitura)' : ' · vigente'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {riscos.length > 0 && (
            <div className="mx-5 mb-3 flex items-start gap-2.5 rounded-lg border border-warn-border bg-warn-bg px-4 py-3 text-sm text-warn-text">
              <Icon name="warning" size={20} className="text-warn" />
              <span>
                <strong>Paciente {riscos.join(', ')}.</strong> Reavalie procedimentos cirúrgicos e eletivos antes de aprovar ou executar.
              </span>
            </div>
          )}

          <div className={`${GRID} border-y border-line bg-surface-subtle px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-ink-600`}>
            <span>Dente</span>
            <span>Procedimento</span>
            <span>Dentista</span>
            <span className="text-right">Valor</span>
            <span>Status</span>
          </div>

          {itens.map(({ item, status, proc }, k) => {
            const novaEtapa = k === 0 || itens[k - 1].item.etapa !== item.etapa;
            const cancel = status === 'cancelado';
            const st = STATUS_TRATAMENTO[status];
            const possiveis = podeEditar ? TRANSICOES[status] : [];
            const hist = aberto === item.id ? historicoItem(eventos, allItems, item) : [];
            return (
              <div key={item.id}>
                {novaEtapa && (
                  <div className="border-b border-line-faint bg-white px-5 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.06em] text-ink-500">
                    Etapa {item.etapa}
                  </div>
                )}
                <div className={`${GRID} border-b border-line-faint px-5 py-3`}>
                  <span className="text-[15px] font-semibold tabular-nums">
                    {item.dente ?? '—'}
                    {item.dente && item.faces.length > 0 && <span className="block text-xs font-medium text-ink-600">{siglasFaces(item.dente, item.faces)}</span>}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className={`text-[15px] font-medium ${cancel ? 'text-ink-500 line-through' : ''}`}>{proc.nome}</span>
                    {item.nota && <span className={`text-[13px] ${item.nota.startsWith('Aprovação bloqueada') ? 'text-warn' : 'text-ink-600'}`}>{item.nota}</span>}
                    <div className="no-print flex flex-wrap gap-1 pt-1">
                      {possiveis.includes('em_andamento') && (
                        <button onClick={() => setAcao({ item, para: 'em_andamento' })} className="h-7 rounded-md px-2 text-[13px] font-semibold text-brand hover:bg-brand-soft">
                          Iniciar
                        </button>
                      )}
                      {possiveis.includes('concluido') && (
                        <button onClick={() => setAcao({ item, para: 'concluido' })} className="h-7 rounded-md px-2 text-[13px] font-semibold text-brand hover:bg-brand-soft">
                          Concluir
                        </button>
                      )}
                      {possiveis.includes('cancelado') && (
                        <button onClick={() => setAcao({ item, para: 'cancelado' })} className="h-7 rounded-md px-2 text-[13px] font-semibold text-ink-600 hover:bg-surface-hover">
                          Cancelar
                        </button>
                      )}
                      <button
                        onClick={() => setAberto(aberto === item.id ? null : item.id)}
                        className="h-7 rounded-md px-2 text-[13px] font-medium text-ink-600 hover:bg-surface-hover"
                      >
                        {aberto === item.id ? 'Ocultar histórico' : 'Histórico'}
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-ink-700">{nomeUser(item.dentistaId)}</span>
                  <span className={`text-right text-[15px] tabular-nums ${cancel ? 'text-ink-500 line-through' : ''}`}>{formatarCentavos(item.precoCentavos)}</span>
                  <span>
                    <Chip tone={st.tone} dot size="sm">
                      {st.label}
                    </Chip>
                  </span>
                </div>
                {hist.length > 0 && (
                  <ol className="m-0 flex list-none flex-col gap-1 border-b border-line-faint bg-surface-subtle py-2.5 pl-[96px] pr-5 text-[13px]">
                    {hist.map((h) => (
                      <li key={h.id} className="flex flex-wrap gap-x-2">
                        <span className="tabular-nums text-ink-600">{dataHora(h.em)}</span>
                        <strong>{STATUS_TRATAMENTO[h.status].label}</strong>
                        <span className="text-ink-600">por {nomeUser(h.autorId)}</span>
                        {h.nota && <span className="text-ink-700">· {h.nota}</span>}
                      </li>
                    ))}
                    <li className="flex items-center gap-1 pt-1 text-xs text-ink-500">
                      <Icon name="lock" size={14} /> Histórico permanente (não editável)
                    </li>
                  </ol>
                )}
              </div>
            );
          })}
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="m-0 text-lg font-bold">Resumo do orçamento</h2>
          <div className="flex flex-col gap-2.5 text-sm tabular-nums">
            <div className="flex justify-between"><span className="text-ink-600">Total do plano</span><span className="font-semibold">{formatarCentavos(totalPlano)}</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Aprovado pelo paciente</span><span className="font-semibold text-ok">{formatarCentavos(totalAprovado)}</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Proposto, aguardando aprovação</span><span className="font-semibold">{formatarCentavos(totalProposto)}</span></div>
          </div>

          {vigente ? (
            <OrcamentoCard
              q={vigente}
              digitalizado={!!documentos.find((d) => d.id === vigente.documentoId)?.digitalizacao}
              nomeUser={nomeUser}
              podeDecidir={podeDecidir}
              onImprimir={() => setImprimindo(vigente)}
              onDecidir={setDecisao}
            />
          ) : (
            <div className="rounded-lg bg-surface-subtle px-3.5 py-3 text-[13px] text-ink-600">Nenhum orçamento emitido para este plano.</div>
          )}

          {naoCobertos.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-warn-border bg-warn-bg px-3.5 py-3 text-[13px] text-warn-text">
              <span>
                <strong>{naoCobertos.length === 1 ? '1 item proposto' : `${naoCobertos.length} itens propostos`}</strong> sem orçamento em aberto.
              </span>
              {podeEmitir && (
                <Button icon="request_quote" onClick={() => setEmitindo(true)}>
                  {aberto_ ? 'Gerar novo orçamento' : 'Gerar orçamento'}
                </Button>
              )}
            </div>
          )}
          {naoCobertos.length === 0 && propostos.length > 0 && podeEmitir && aberto_ && (
            <Button variant="secondary" icon="request_quote" onClick={() => setEmitindo(true)}>
              Refazer orçamento
            </Button>
          )}
          <p className="m-0 text-xs leading-snug text-ink-500">
            Orçamento para imprimir e assinar à mão. Aprovar não gera cobrança, parcela nem contas a receber.
          </p>
        </section>

        {orcamentos.length > 1 && (
          <section className="flex flex-col rounded-2xl border border-line bg-white">
            <h3 className="m-0 border-b border-surface-muted px-5 py-3 text-[15px] font-bold">Orçamentos anteriores</h3>
            {orcamentos
              .filter((q) => q.id !== vigente?.id)
              .map((q) => (
                <div key={q.id} className="flex items-center gap-2 border-b border-line-faint px-5 py-2.5 text-[13px] last:border-b-0">
                  <span className="flex-1">
                    <strong>nº {q.numero}</strong> · {formatarData(q.criadoEm)} · {formatarCentavos(q.totalCentavos)}
                    <span className="block text-ink-600">
                      {q.substituidoPor ? `Substituído pelo nº ${quotes.find((x) => x.id === q.substituidoPor)?.numero ?? '—'}` : STATUS_ORCAMENTO[statusOrcamento(q)].label}
                    </span>
                  </span>
                  <button aria-label={`Reimprimir orçamento ${q.numero}`} onClick={() => setImprimindo(q)} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-600 hover:bg-surface-hover">
                    <Icon name="print" size={18} />
                  </button>
                </div>
              ))}
          </section>
        )}
      </aside>

      {dialogos}

      {acao && acao.para === 'concluido' && (
        <ConfirmDialog
          open
          title="Confirmar conclusão"
          confirmLabel="Confirmar conclusão"
          onCancel={() => setAcao(null)}
          onConfirm={confirmarAcao}
        >
          <div className="flex flex-col gap-3">
            <p className="m-0">
              Você confirma que <strong>{procedures.find((p) => p.id === acao.item.procedureId)?.nome}</strong>
              {acao.item.dente && ` no dente ${acao.item.dente}`} foi realizado?
            </p>
            <p className="m-0 text-sm text-ink-600">
              {procedures.find((p) => p.id === acao.item.procedureId)?.achadoRealizado && acao.item.dente
                ? 'O achado “realizado” entra no odontograma e uma entrada é gravada no prontuário. '
                : 'Uma entrada é gravada no prontuário. '}
              Nada disso pode ser desfeito, só corrigido por adendo.
            </p>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Observação (opcional)"
              className="min-h-[64px] rounded-md border border-line-strong p-2.5 text-sm outline-none focus:border-brand focus:shadow-field"
            />
          </div>
        </ConfirmDialog>
      )}
      {acao && acao.para !== 'concluido' && (
        <Modal
          open
          title={acao.para === 'cancelado' ? 'Cancelar item do plano' : 'Iniciar tratamento'}
          onClose={() => setAcao(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setAcao(null)}>
                Voltar
              </Button>
              <Button variant={acao.para === 'cancelado' ? 'danger' : 'primary'} disabled={acao.para === 'cancelado' && nota.trim().length < 5} onClick={confirmarAcao}>
                {acao.para === 'cancelado' ? 'Cancelar item' : 'Marcar em andamento'}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="m-0">{procedures.find((p) => p.id === acao.item.procedureId)?.nome}{acao.item.dente && ` · dente ${acao.item.dente}`}</p>
            {acao.para === 'cancelado' && (
              <textarea
                autoFocus
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Motivo do cancelamento (obrigatório)"
                className="min-h-[72px] rounded-md border border-line-strong p-2.5 text-sm outline-none focus:border-brand focus:shadow-field"
              />
            )}
          </div>
        </Modal>
      )}
      {decisao && vigente && (
        <ConfirmDialog
          open
          title={decisao === 'aprovado' ? `Registrar aprovação do orçamento nº ${vigente.numero}` : `Registrar recusa do orçamento nº ${vigente.numero}`}
          confirmLabel={decisao === 'aprovado' ? 'Registrar aprovação' : 'Registrar recusa'}
          danger={decisao === 'recusado'}
          onCancel={() => setDecisao(null)}
          onConfirm={confirmarDecisao}
        >
          {decisao === 'aprovado'
            ? 'Confirme que o paciente (ou responsável) assinou o orçamento impresso. Os itens passam a “aprovado” e o plano fica aprovado. Não é gerada nenhuma cobrança.'
            : 'O orçamento fica registrado como recusado e os itens continuam propostos.'}
        </ConfirmDialog>
      )}
    </div>
  );
}

function OrcamentoCard({
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
