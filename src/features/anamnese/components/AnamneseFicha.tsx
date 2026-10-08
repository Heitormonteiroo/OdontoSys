'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Alert, Button, Chip, Icon } from '@/components/ui';
import { dataHora, horaDe } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { useCurrentUser, useStore } from '@/mock/store';
import type { AnamneseResposta, AnamneseTemplate, Patient } from '@/mock/types';
import { resumoPergunta } from '../lib/respostas';
import { EnviarTabletDialog, useEnviarAoTablet } from './EnviarTabletDialog';

/** Aba "Anamnese" da ficha: última resposta, alertas destacados, envio ao tablet e histórico. */
export function AnamneseFicha({ paciente }: { paciente: Patient }) {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const templates = useStore((s) => s.anamneseTemplates);
  const todasRespostas = useStore((s) => s.anamneseRespostas);
  const links = useStore((s) => s.anamneseLinks);
  const rascunhos = useStore((s) => s.anamneseRascunhos);
  const conferir = useStore((s) => s.conferirAnamnese);
  const { envio, enviar, fechar } = useEnviarAoTablet();

  const respostas = useMemo(
    () =>
      todasRespostas
        .filter((r) => r.patientId === paciente.id)
        .sort((x, y) => y.preenchidaEm.localeCompare(x.preenchidaEm)),
    [todasRespostas, paciente.id],
  );
  const [selId, setSelId] = useState<string | null>(null);
  const atual = respostas.find((r) => r.id === selId) ?? respostas[0];

  const linkAtivo = links.find(
    (l) => l.patientId === paciente.id && !l.usadoEm && !l.revogadoEm && l.expiraEm > Date.now(),
  );
  const temRascunho = !!rascunhos[paciente.id];
  const podeEnviar = can(user?.papel, 'anamnese:enviar');
  const nome = (id: string | null) => users.find((u) => u.id === id)?.nome ?? '—';

  const avisos = (
    <>
      {linkAtivo && (
        <Alert tone="info" className="no-print">
          <strong>No tablet:</strong> link {linkAtivo.codigo} ativo até {horaDe(linkAtivo.expiraEm)}. Gerar um novo link
          invalida este.
        </Alert>
      )}
      {temRascunho && (
        <Alert tone="warn" className="no-print">
          <strong>Questionário interrompido.</strong> O paciente começou no tablet e não terminou. Ao enviar de novo, as
          respostas guardadas voltam para ele conferir.
        </Alert>
      )}
    </>
  );

  if (!atual) {
    return (
      <div className="flex flex-col gap-4">
        {avisos}
        <section className="rounded-2xl border border-line bg-white">
          <EmptyState
            icon="assignment"
            title="Anamnese pendente"
            actions={
              podeEnviar && (
                <Button icon="tablet" onClick={() => enviar(paciente.id)}>
                  Enviar ao tablet
                </Button>
              )
            }
          >
            O paciente ainda não respondeu o questionário de saúde. Até lá, confirme alergias e medicamentos de viva voz
            antes de qualquer procedimento.
          </EmptyState>
        </section>
        <EnviarTabletDialog envio={envio} onClose={fechar} />
      </div>
    );
  }

  const tpl = templates.find((t) => t.id === atual.templateId && t.versao === atual.templateVersao);
  const ehUltima = atual.id === respostas[0].id;

  return (
    <div className="flex flex-col gap-4">
      {avisos}
      <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-[22px] shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2 className="m-0 text-lg font-bold">Anamnese</h2>
              {!ehUltima && <Chip size="sm">Versão anterior</Chip>}
              {atual.conferidaPor ? (
                <Chip size="sm" tone="ok" dot>
                  Conferida
                </Chip>
              ) : (
                <Chip size="sm" tone="warn" dot>
                  Aguardando conferência
                </Chip>
              )}
            </div>
            <span className="text-[13px] text-ink-600">
              Preenchida pelo paciente no tablet em {dataHora(atual.preenchidaEm)}
              {atual.conferidaPor && ` · conferida por ${nome(atual.conferidaPor)}`}
            </span>
          </div>
          <div className="no-print flex flex-wrap gap-2.5">
            {podeEnviar && !atual.conferidaPor && (
              <Button size="md" icon="task_alt" onClick={() => conferir(atual.id)}>
                Marcar como conferida
              </Button>
            )}
            {podeEnviar && (
              <Button variant="secondary" icon="tablet" onClick={() => enviar(paciente.id)}>
                Enviar atualização ao tablet
              </Button>
            )}
            <Button variant="secondary" icon="print" onClick={() => window.print()}>
              Imprimir para assinatura
            </Button>
          </div>
        </div>

        <AlertasResposta resposta={atual} />

        {tpl ? (
          <Respostas resposta={atual} tpl={tpl} />
        ) : (
          <Alert tone="warn">Modelo da anamnese (v{atual.templateVersao}) não encontrado.</Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[13px] text-ink-500">
          <span>
            Modelo: {tpl?.nome ?? atual.templateId} · versão {atual.templateVersao}
          </span>
          <span>Registro auxiliar de apoio ao atendimento. Confirme as respostas com o paciente.</span>
        </div>

        <div className="hidden flex-col gap-10 pt-10 print:flex">
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col items-center gap-1 border-t border-ink pt-2">
              Assinatura do paciente ou responsável
            </div>
            <div className="flex flex-col items-center gap-1 border-t border-ink pt-2">Data</div>
          </div>
        </div>
      </section>

      {respostas.length > 1 && (
        <section className="no-print flex flex-col rounded-2xl border border-line bg-white">
          <h3 className="m-0 border-b border-surface-muted px-5 py-3.5 text-[15px] font-bold">Histórico de anamneses</h3>
          {respostas.map((r, i) => {
            const on = r.id === atual.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelId(r.id)}
                aria-current={on}
                className={`flex items-center gap-3 border-b border-line-faint px-5 py-3 text-left text-sm last:border-b-0 ${
                  on ? 'bg-brand-tint' : 'hover:bg-surface-hover'
                }`}
              >
                <Icon name="assignment" size={20} className={on ? 'text-brand' : 'text-ink-500'} />
                <span className="flex-1 font-medium">{dataHora(r.preenchidaEm)}</span>
                <span className="text-ink-600">
                  {r.alertas.length === 0 ? 'Sem alertas' : `${r.alertas.length} alerta${r.alertas.length > 1 ? 's' : ''}`}
                </span>
                {i === 0 && <Chip size="sm" tone="brand">Atual</Chip>}
              </button>
            );
          })}
        </section>
      )}

      <EnviarTabletDialog envio={envio} onClose={fechar} />
    </div>
  );
}

function AlertasResposta({ resposta }: { resposta: AnamneseResposta }) {
  if (resposta.alertas.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-bg px-4 py-3 text-sm text-ink-600">
        <Icon name="check_circle" size={20} className="text-ok" />
        Nenhum alerta crítico nesta anamnese.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-4 py-3.5">
      <div className="flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] text-danger">
        <Icon name="error" size={20} fill />
        ALERTAS CRÍTICOS
      </div>
      <div className="flex flex-wrap gap-2">
        {resposta.alertas.map((al) => (
          <Chip key={al.id} tone="dangerSolid">
            <span className="text-sm">{al.texto}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Respostas({ resposta, tpl }: { resposta: AnamneseResposta; tpl: AnamneseTemplate }) {
  const d = resposta.answers.dados;
  const emergencia = d.emergenciaNome
    ? `${d.emergenciaNome}${d.emergenciaTelefone ? ` · ${d.emergenciaTelefone}` : ''}`
    : 'Não informado';
  const dados = [
    { id: 'nome', rotulo: 'Nome informado', valor: d.nome },
    { id: 'nasc', rotulo: 'Nascimento informado', valor: d.nascimento },
    { id: 'cel', rotulo: 'Celular informado', valor: d.celular },
    { id: 'emerg', rotulo: 'Contato de emergência', valor: emergencia },
  ];
  return (
    <div className="flex flex-col gap-5">
      {tpl.passos.map((p) => (
        <div key={p.id} className="flex flex-col gap-2.5 break-inside-avoid">
          <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-600">{p.titulo}</h3>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 print:grid-cols-2">
            {p.perguntas.map((q) => {
              const l = resumoPergunta(q, resposta.answers);
              return (
                <div
                  key={l.id}
                  className={`flex flex-col gap-1 rounded-lg border px-3.5 py-3 ${
                    l.critico ? 'border-danger-border bg-danger-bg' : 'border-surface-muted bg-surface-subtle'
                  }`}
                >
                  <span className="text-[13px] text-ink-600">{l.rotulo}</span>
                  <span className={`text-[15px] font-semibold ${l.critico ? 'text-danger' : 'text-ink'}`}>{l.valor}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-2.5 break-inside-avoid">
        <h3 className="m-0 text-[13px] font-bold uppercase tracking-[0.06em] text-ink-600">Dados informados no tablet</h3>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 print:grid-cols-2">
          {dados.map((l) => (
            <div key={l.id} className="flex flex-col gap-1 rounded-lg border border-surface-muted bg-surface-subtle px-3.5 py-3">
              <span className="text-[13px] text-ink-600">{l.rotulo}</span>
              <span className="text-[15px] font-semibold tabular-nums">{l.valor || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
