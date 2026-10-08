'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SemPermissao } from '@/components/feedback/SemPermissao';
import { Icon } from '@/components/ui';
import { can } from '@/lib/permissions';
import { useCurrentUser, useStore } from '@/mock/store';
import { EnviarTabletDialog, useEnviarAoTablet } from '@/features/anamnese/components/EnviarTabletDialog';
import { PacienteHeader } from '../components/PacienteHeader';
import { ABAS, type AbaId, type AbaProps, type Intencao } from '../tabs';

export function PacienteFichaScreen({ id }: { id: string }) {
  const user = useCurrentUser();
  const patients = useStore((s) => s.patients);
  const users = useStore((s) => s.users);
  const paciente = useMemo(() => patients.find((p) => p.id === id), [patients, id]);
  const [aba, setAba] = useState<AbaId>('linha');
  const [intencao, setIntencao] = useState<{ aba: AbaId; i: Intencao } | null>(null);
  const irPara: AbaProps['irPara'] = (destino, i) => {
    setAba(destino);
    if (i) setIntencao({ aba: destino, i: { ...i, n: Date.now() } as Intencao });
  };
  const tablet = useEnviarAoTablet();

  if (!paciente) {
    return (
      <div className="p-10">
        <section className="rounded-2xl border border-line bg-white">
          <EmptyState
            icon="person_off"
            title="Paciente não encontrado"
            actions={
              <Link href="/pacientes" className="inline-flex h-11 items-center rounded-md bg-brand px-[18px] text-sm font-semibold text-white">
                Voltar para Pacientes
              </Link>
            }
          >
            O cadastro pode ter sido removido ao restaurar os dados de exemplo.
          </EmptyState>
        </section>
      </div>
    );
  }

  const dentista = users.find((u) => u.id === paciente.dentistaId)?.nome ?? '—';
  const atual = ABAS.find((a) => a.id === aba) ?? ABAS[0];
  const permitido = can(user?.papel, atual.permissao);

  return (
    <div className="flex min-h-full flex-col">
      <div className="no-print flex shrink-0 items-center gap-1.5 border-b border-surface-muted bg-white px-8 py-3 text-[13px] text-ink-600">
        <Link href="/pacientes" className="font-medium text-brand">
          Pacientes
        </Link>
        <Icon name="chevron_right" size={16} />
        <span>{paciente.nome}</span>
      </div>

      <PacienteHeader
        paciente={paciente}
        dentistaNome={dentista}
        podeEvoluir={can(user?.papel, 'evolucao:registrar')}
        podeReceitar={can(user?.papel, 'receita:emitir')}
        podeEnviarAnamnese={can(user?.papel, 'anamnese:enviar')}
        onNovaEvolucao={() => irPara('linha', { tipo: 'nova-evolucao' })}
        onVerAnamnese={() => setAba('anam')}
        onEnviarAnamnese={() => tablet.enviar(paciente.id)}
      />
      <EnviarTabletDialog envio={tablet.envio} onClose={tablet.fechar} />

      <div role="tablist" className="no-print flex shrink-0 gap-1 border-b border-line bg-white px-6">
        {ABAS.map((a) => {
          const ativa = a.id === aba;
          return (
            <button
              key={a.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(a.id)}
              className={`flex h-[52px] items-center gap-2 border-b-[3px] px-3.5 text-[15px] ${
                ativa ? 'border-brand font-semibold text-brand-dark' : 'border-transparent font-medium text-ink-600 hover:text-ink'
              }`}
            >
              <Icon name={a.icon} size={20} fill={ativa} />
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 px-8 pb-10 pt-6 print:px-0">
        {permitido ? (
          <atual.Component
            key={paciente.id}
            paciente={paciente}
            intencao={intencao?.aba === atual.id ? intencao.i : null}
            irPara={irPara}
          />
        ) : (
          <SemPermissao area={atual.area} perfil="Recepção" />
        )}
      </div>
    </div>
  );
}
