'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Alert, Icon } from '@/components/ui';
import type { AbaProps } from '@/modules/pacientes/components/abas';
import { OrcamentoImpressao } from '@/modules/orcamentos/components/OrcamentoImpressao';
import { dataHora, formatarData } from '@/utils/dates';
import { hashSimulado } from '@/utils/hash';
import { can } from '@/utils/permissions';
import { useCurrentUser, useUsuarios } from '@/hooks/useAuth';
import { useAnexarDigitalizacao, useDocumentosEmitidos } from '@/modules/documentos/services';
import { useOrcamentos } from '@/modules/orcamentos/services';
import type { IssuedDocument, TipoDocumento } from '@/mock/types';
import { DocumentoImpressao } from '@/modules/documentos/components/DocumentoImpressao';

const ICONES: Record<TipoDocumento, string> = {
  receita: 'prescriptions',
  atestado: 'badge',
  termo: 'contract',
  orcamento: 'request_quote',
  anamnese: 'assignment',
};

const GRID = 'grid grid-cols-[40px_minmax(0,1fr)_110px_170px_210px_130px] items-center gap-3';

/** Hash do arquivo escaneado (simulado: amostra do conteúdo + tamanho; no real, sha256 no servidor). */
async function hashArquivo(f: File): Promise<string> {
  const amostra = new Uint8Array(await f.slice(0, 256 * 1024).arrayBuffer());
  let s = `${f.name}|${f.size}|`;
  for (let i = 0; i < amostra.length; i += 64) s += amostra[i].toString(16);
  return hashSimulado(s);
}

export function DocumentosLista({ paciente }: AbaProps) {
  const user = useCurrentUser();
  const users = useUsuarios();
  const todos = useDocumentosEmitidos();
  const quotes = useOrcamentos();
  const anexar = useAnexarDigitalizacao();
  const [imprimindo, setImprimindo] = useState<IssuedDocument | null>(null);
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'danger'; texto: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const alvo = useRef<IssuedDocument | null>(null);
  const fim = useCallback(() => setImprimindo(null), []);

  const docs = useMemo(
    () => todos.filter((d) => d.patientId === paciente.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [todos, paciente.id],
  );
  const podeAnexar = can(user?.papel, 'documentos:anexar');
  const pendentes = docs.filter((d) => !d.digitalizacao).length;

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    const d = alvo.current;
    if (!f || !d) return;
    const r = anexar(d.id, { nome: f.name, hash: await hashArquivo(f) });
    setAviso(r.ok ? { tom: 'ok', texto: `Cópia assinada anexada a “${d.titulo}”. O arquivo e o hash ficam guardados.` } : { tom: 'danger', texto: r.erro });
  }

  const nomeUser = (id: string) => users.find((u) => u.id === id)?.nome ?? '—';

  return (
    <section className="flex flex-col rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-lg font-bold">Documentos</h2>
          <span className="text-[13px] text-ink-600">
            Emitidos para imprimir e assinar à mão.{' '}
            {pendentes > 0 ? `${pendentes} aguardando a cópia assinada.` : docs.length > 0 ? 'Todos com cópia assinada anexada.' : ''}
          </span>
        </div>
        {can(user?.papel, 'receita:emitir') && (
          <Link
            href={`/receitas/nova?paciente=${paciente.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-[18px] text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Icon name="add" size={20} />
            Nova receita
          </Link>
        )}
      </div>

      {aviso && (
        <div className="px-5 pt-4">
          <Alert tone={aviso.tom}>{aviso.texto}</Alert>
        </div>
      )}

      {docs.length === 0 ? (
        <EmptyState icon="description" title="Nenhum documento emitido">
          Receitas, atestados, termos e orçamentos impressos para este paciente aparecem aqui, com a cópia assinada anexada depois.
        </EmptyState>
      ) : (
        <>
          <div className={`${GRID} border-b border-line bg-surface-subtle px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-ink-600`}>
            <span />
            <span>Documento</span>
            <span>Data</span>
            <span>Emitido por</span>
            <span>Situação</span>
            <span />
          </div>
          {docs.map((d) => {
            const ok = !!d.digitalizacao;
            return (
              <div key={d.id} className={`${GRID} border-b border-line-faint px-5 py-3 last:border-b-0`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-ink-700">
                  <Icon name={ICONES[d.tipo]} size={22} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold">{d.titulo}</span>
                  <span className="truncate text-[13px] text-ink-600">
                    {d.subtitulo} · nº {d.numero}
                  </span>
                </div>
                <span className="text-sm tabular-nums text-ink-700">{formatarData(d.criadoEm)}</span>
                <span className="truncate text-sm text-ink-700">{nomeUser(d.autorId)}</span>
                <span title={ok ? `${d.digitalizacao!.arquivoNome} · anexado em ${dataHora(d.digitalizacao!.em)} · hash ${d.digitalizacao!.hash}` : undefined}>
                  <span
                    className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${ok ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'}`}
                  >
                    <Icon name={ok ? 'task_alt' : 'draw'} size={15} />
                    {ok ? 'Assinado e digitalizado' : 'Impresso · assinar à mão'}
                  </span>
                </span>
                <div className="flex justify-end gap-1">
                  {!ok && podeAnexar && (
                    <button
                      title="Anexar cópia assinada (PDF ou imagem)"
                      aria-label={`Anexar cópia assinada de ${d.titulo}`}
                      onClick={() => {
                        alvo.current = d;
                        inputRef.current?.click();
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-brand hover:bg-brand-soft"
                    >
                      <Icon name="upload_file" size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setImprimindo(d)}
                    className="flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[13px] font-semibold hover:bg-surface-bg"
                  >
                    <Icon name="print" size={18} />
                    Reimprimir
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={aoEscolher} />
      <p className="m-0 border-t border-line px-5 py-3 text-xs text-ink-500">
        Protótipo: o arquivo anexado não sai do navegador; guardamos só o nome e um hash simulado. Atestados e termos chegam na etapa de documentos.
      </p>

      {imprimindo &&
        (imprimindo.tipo === 'orcamento' && quotes.find((q) => q.id === imprimindo.refId) ? (
          <OrcamentoImpressao orcamento={quotes.find((q) => q.id === imprimindo.refId)!} onFim={fim} />
        ) : (
          <DocumentoImpressao doc={imprimindo} onFim={fim} />
        ))}
    </section>
  );
}
