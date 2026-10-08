'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button, Chip, Icon, Select } from '@/components/ui';
import { dataRelativa, idadeEm } from '@/utils/dates';
import { can } from '@/utils/permissions';
import { iniciais } from '@/utils/text';
import { useCurrentUser, useUsuarios } from '@/hooks/useAuth';
import { usePacientes } from '@/modules/pacientes/services';
import type { Patient } from '@/mock/types';
import { TratamentoChip } from '@/modules/pacientes/components/ficha/TratamentoChip';
import { FILTROS, filtrarPacientes, resumoAlertas, type FiltroId, type Ordem } from '@/modules/pacientes/utils/filtros';

const POR_PAGINA = 8;
const GRID = 'grid grid-cols-[minmax(0,1fr)_130px_136px_140px_136px_136px_24px] gap-4';

export function PacientesListPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const patients = usePacientes();
  const users = useUsuarios();

  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<FiltroId>('todos');
  const [dentistaId, setDentistaId] = useState('todos');
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [pagina, setPagina] = useState(0);

  useEffect(() => setPagina(0), [query, filtro, dentistaId, ordem]);

  const dentistas = useMemo(() => users.filter((u) => u.papel === 'dentista'), [users]);
  const resultado = useMemo(
    () => filtrarPacientes(patients, { query, filtro, dentistaId, ordem }),
    [patients, query, filtro, dentistaId, ordem],
  );

  const total = resultado.length;
  const inicio = pagina * POR_PAGINA;
  const visiveis = resultado.slice(inicio, inicio + POR_PAGINA);
  const filtrando = query.trim() !== '' || filtro !== 'todos' || dentistaId !== 'todos';
  const podeCadastrar = can(user?.papel, 'paciente:cadastrar');

  const contagem = filtrando
    ? `${total} ${total === 1 ? 'resultado' : 'resultados'}`
    : `${patients.length} pacientes cadastrados`;

  function limpar() {
    setQuery('');
    setFiltro('todos');
    setDentistaId('todos');
  }

  return (
    <div className="flex flex-col gap-5 px-10 pb-10 pt-7">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold tracking-tight">Pacientes</h1>
          <div className="text-sm text-ink-600">{contagem}</div>
        </div>
        {podeCadastrar && (
          <Link
            href="/pacientes/novo"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand-dark"
          >
            <Icon name="person_add" size={22} />
            Novo paciente
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <label className="flex h-[52px] items-center gap-3 rounded-xl border-2 border-brand bg-white px-4 shadow-field">
          <Icon name="search" size={24} className="text-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone"
            className="flex-1 bg-transparent text-base text-ink outline-none"
          />
          {query && (
            <button
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-muted text-ink-700"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => {
            const on = f.id === filtro;
            return (
              <button
                key={f.id}
                aria-pressed={on}
                onClick={() => setFiltro(f.id)}
                className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm ${
                  on
                    ? 'border-brand bg-brand-soft font-semibold text-brand-dark'
                    : 'border-line-strong bg-white font-medium text-ink-700 hover:border-ink-400'
                }`}
              >
                {on && <Icon name="check" size={18} />}
                {f.label}
              </button>
            );
          })}
          <Select variant="filter" prefix="Dentista:" value={dentistaId} onChange={(e) => setDentistaId(e.target.value)}>
            <option value="todos">Todos</option>
            {dentistas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </Select>
          <Select variant="filter" prefix="Ordenar:" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
            <option value="recentes">Recentes</option>
            <option value="nome">Nome (A–Z)</option>
          </Select>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div
          role="row"
          className={`${GRID} border-b border-line bg-surface-subtle px-[22px] py-3 text-xs font-semibold uppercase tracking-[0.04em] text-ink-600`}
        >
          <span>Paciente</span>
          <span>CPF</span>
          <span>Telefone</span>
          <span>Último atendimento</span>
          <span>Tratamento</span>
          <span>Alertas</span>
          <span />
        </div>

        {total === 0 ? (
          <EmptyState
            icon="person_search"
            title={query.trim() ? `Nenhum paciente encontrado para “${query.trim()}”` : 'Nenhum paciente com estes filtros'}
            actions={
              <>
                <Button variant="secondary" onClick={limpar}>
                  Limpar busca
                </Button>
                {podeCadastrar && query.trim() && (
                  <Button onClick={() => router.push(`/pacientes/novo?nome=${encodeURIComponent(query.trim())}`)}>
                    Cadastrar “{query.trim()}”
                  </Button>
                )}
              </>
            }
          >
            Confira a grafia ou busque pelo CPF ou telefone. Se for a primeira visita, faça o cadastro.
          </EmptyState>
        ) : (
          <>
            {visiveis.map((p) => (
              <LinhaPaciente key={p.id} p={p} onOpen={() => router.push(`/pacientes/${p.id}`)} />
            ))}
            <div className="flex items-center justify-between px-[22px] py-3.5 text-sm text-ink-600">
              <span>
                Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, total)} de {total}
              </span>
              <div className="flex gap-2">
                <PagButton disabled={pagina === 0} onClick={() => setPagina((n) => n - 1)}>
                  Anterior
                </PagButton>
                <PagButton disabled={inicio + POR_PAGINA >= total} onClick={() => setPagina((n) => n + 1)}>
                  Próxima
                </PagButton>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PagButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="h-9 rounded-md border border-line-strong bg-white px-3.5 text-sm font-semibold text-ink disabled:border-line disabled:bg-surface-subtle disabled:font-medium disabled:text-ink-400"
    >
      {children}
    </button>
  );
}

function LinhaPaciente({ p, onOpen }: { p: Patient; onOpen: () => void }) {
  const idade = `${idadeEm(p.nascimento)} anos${p.responsavel ? ` · resp. ${p.responsavel}` : ''}`;
  const alerta = resumoAlertas(p);
  return (
    <div
      role="row"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={`${GRID} cursor-pointer items-center border-b border-line-faint px-[22px] py-3 text-sm hover:bg-surface-subtle`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-surface-muted text-[13px] font-semibold text-ink-700">
          {iniciais(p.nome)}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">{p.nome}</span>
          <span className="truncate text-[13px] text-ink-600">{idade}</span>
        </div>
      </div>
      <span className="tabular-nums text-ink-700">{p.cpf ?? '—'}</span>
      <span className="tabular-nums text-ink-700">{p.telefone}</span>
      <span className="text-ink-700">{dataRelativa(p.ultimoAtendimento)}</span>
      <span>
        <TratamentoChip status={p.tratamento} />
      </span>
      <span>
        {alerta && (
          <Chip tone="danger" size="sm">
            <Icon name="error" size={15} fill />
            {alerta}
          </Chip>
        )}
      </span>
      <Icon name="chevron_right" size={22} className="text-ink-400" />
    </div>
  );
}
