'use client';

import Link from 'next/link';
import { Avatar, Button, Chip, Icon } from '@/components/ui';
import { idadeEm } from '@/lib/dates';
import { iniciais } from '@/lib/text';
import type { Patient } from '@/mock/types';

export function PacienteHeader({
  paciente: p,
  dentistaNome,
  podeEvoluir,
  podeReceitar,
  onNovaEvolucao,
  onVerAnamnese,
}: {
  paciente: Patient;
  dentistaNome: string;
  podeEvoluir: boolean;
  podeReceitar: boolean;
  onNovaEvolucao: () => void;
  onVerAnamnese: () => void;
}) {
  const temAlertas = p.alertas.length > 0;
  return (
    <header className="border-b border-line bg-white">
      <div className="flex items-center gap-5 px-8 py-5">
        <Avatar initials={iniciais(p.nome)} size={60} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline gap-3">
            <h1 className="m-0 text-2xl font-bold tracking-tight">{p.nome}</h1>
            <span className="text-base font-medium text-ink-700">{idadeEm(p.nascimento)} anos</span>
            {p.novo && (
              <span className="inline-flex h-6 items-center rounded-full bg-info-bg px-2.5 text-xs font-semibold text-info">
                Novo paciente
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm tabular-nums text-ink-600">
            {p.cpf && <span>CPF {p.cpf}</span>}
            <span>{p.telefone}</span>
            <span>Prontuário nº {p.prontuarioNo}</span>
            <span>Dentista: {dentistaNome}</span>
            {p.responsavel && <span>Responsável: {p.responsavel}</span>}
          </div>
        </div>
        <div className="flex gap-2.5">
          {podeReceitar && (
            <Link
              href={`/receitas/nova?paciente=${p.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm font-semibold hover:bg-surface-bg"
            >
              <Icon name="prescriptions" size={20} />
              Nova receita
            </Link>
          )}
          {podeEvoluir && (
            <Button icon="edit_note" onClick={onNovaEvolucao}>
              Nova evolução
            </Button>
          )}
        </div>
      </div>

      {temAlertas ? (
        <div role="alert" className="flex items-center gap-3.5 border-t border-danger-border bg-danger-bg px-8 py-2.5">
          <div className="flex shrink-0 items-center gap-2 text-[13px] font-bold tracking-[0.06em] text-danger">
            <Icon name="error" size={22} fill />
            ALERTAS CRÍTICOS
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {p.alertas.map((a) => (
              <Chip key={a.id} tone="dangerSolid">
                <span className="text-sm">{a.texto}</span>
              </Chip>
            ))}
          </div>
          <button onClick={onVerAnamnese} className="shrink-0 text-sm font-semibold text-danger underline">
            Ver anamnese
          </button>
        </div>
      ) : p.anamnese === 'pendente' ? (
        <div className="flex items-center gap-3 border-t border-warn-border bg-warn-bg px-8 py-2.5 text-sm text-warn-text">
          <Icon name="warning" size={22} className="text-warn" />
          <span className="flex-1">
            <strong>Alertas desconhecidos.</strong> A anamnese ainda não foi preenchida — confirme alergias e
            medicamentos antes de qualquer procedimento.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 border-t border-line bg-surface-bg px-8 py-2 text-[13px] text-ink-600">
          <Icon name="check_circle" size={18} className="text-ok" />
          Nenhum alerta crítico registrado na anamnese.
        </div>
      )}
    </header>
  );
}
