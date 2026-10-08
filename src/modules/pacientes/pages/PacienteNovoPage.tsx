'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Alert, Button, Field, Icon, Select } from '@/components/ui';
import { idadeEm } from '@/utils/dates';
import { can } from '@/utils/permissions';
import { mascaraCpf, mascaraTelefone, soDigitos } from '@/utils/text';
import { useCurrentUser, useUsuarios } from '@/hooks/useAuth';
import { useCadastrarPaciente, usePacientes } from '@/modules/pacientes/services';
import { validarPaciente, type ErrosPaciente, type FormPaciente } from '@/modules/pacientes/utils/validacao';

export function PacienteNovoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useCurrentUser();
  const users = useUsuarios();
  const patients = usePacientes();
  const addPatient = useCadastrarPaciente();

  const dentistas = useMemo(() => users.filter((u) => u.papel === 'dentista'), [users]);
  const proximoNo = String(Math.max(0, ...patients.map((p) => Number(p.prontuarioNo))) + 1).padStart(5, '0');

  const [f, setF] = useState<FormPaciente>({
    nome: params.get('nome') ?? '',
    nascimento: '',
    cpf: '',
    telefone: '',
    dentistaId: dentistas[0]?.id ?? '',
    responsavel: '',
  });
  const [erros, setErros] = useState<ErrosPaciente>({});
  const [tentou, setTentou] = useState(false);

  const set = <K extends keyof FormPaciente>(k: K, v: FormPaciente[K]) => {
    const novo = { ...f, [k]: v };
    setF(novo);
    if (tentou) setErros(validarPaciente(novo));
  };

  const menor = f.nascimento !== '' && idadeEm(f.nascimento) < 18;

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    const er = validarPaciente(f);
    setErros(er);
    if (Object.keys(er).length > 0) return;
    const criado = addPatient({
      nome: f.nome.trim(),
      nascimento: f.nascimento,
      cpf: soDigitos(f.cpf).length === 11 ? mascaraCpf(f.cpf) : null,
      telefone: mascaraTelefone(f.telefone),
      dentistaId: f.dentistaId,
      responsavel: menor ? f.responsavel.trim() : null,
    });
    router.push(`/pacientes/${criado.id}`);
  }

  if (!can(user?.papel, 'paciente:cadastrar')) {
    return (
      <div className="p-10">
        <Alert tone="danger" title="Sem permissão.">
          Seu perfil não pode cadastrar pacientes.
        </Alert>
      </div>
    );
  }

  const n = Object.keys(erros).length;

  return (
    <div className="flex max-w-[760px] flex-col gap-6 px-10 pb-10 pt-7">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-[13px] text-ink-600">
          <Link href="/pacientes" className="font-medium text-brand">
            Pacientes
          </Link>
          <Icon name="chevron_right" size={16} />
          <span>Novo paciente</span>
        </div>
        <h1 className="m-0 text-[28px] font-bold tracking-tight">Novo paciente</h1>
        <div className="text-sm text-ink-600">Cadastro simples. A anamnese é preenchida depois, no tablet.</div>
      </div>

      <form onSubmit={salvar} noValidate className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
        {tentou && n > 0 && (
          <Alert tone="danger" title="Revise os campos destacados.">
            {n === 1 ? 'Há 1 campo' : `Há ${n} campos`} a corrigir antes de salvar.
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nome completo *" value={f.nome} onChange={(e) => set('nome', e.target.value)} error={erros.nome} autoFocus />
          </div>
          <Field
            label="Data de nascimento *"
            type="date"
            value={f.nascimento}
            onChange={(e) => set('nascimento', e.target.value)}
            error={erros.nascimento}
          />
          <Field
            label="CPF (opcional)"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={f.cpf}
            onChange={(e) => set('cpf', mascaraCpf(e.target.value))}
            error={erros.cpf}
          />
          <Field
            label="Telefone *"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={f.telefone}
            onChange={(e) => set('telefone', mascaraTelefone(e.target.value))}
            error={erros.telefone}
          />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Dentista responsável
            <Select value={f.dentistaId} onChange={(e) => set('dentistaId', e.target.value)}>
              {dentistas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </Select>
          </label>
          {menor && (
            <div className="col-span-2">
              <Field
                label="Responsável legal *"
                value={f.responsavel}
                onChange={(e) => set('responsavel', e.target.value)}
                error={erros.responsavel}
                hint={`Paciente com ${idadeEm(f.nascimento)} anos (menor de idade).`}
              />
            </div>
          )}
          <Field label="Prontuário nº" value={proximoNo} disabled hint="Gerado automaticamente." readOnly />
        </div>
        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Link
            href="/pacientes"
            className="inline-flex h-11 items-center rounded-md border border-line-strong bg-white px-[18px] text-sm font-semibold hover:bg-surface-bg"
          >
            Cancelar
          </Link>
          <Button type="submit" icon="check">
            Salvar paciente
          </Button>
        </div>
      </form>
    </div>
  );
}
