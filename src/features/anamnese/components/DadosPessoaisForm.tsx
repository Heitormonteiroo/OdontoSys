'use client';

import { Icon } from '@/components/ui';
import { mascaraCpf, mascaraData, mascaraTelefone } from '@/lib/text';
import type { DadosPessoaisAnamnese } from '@/mock/types';
import type { Erros } from '../lib/respostas';

type Campo = keyof DadosPessoaisAnamnese;

const CAMPOS: {
  k: Campo;
  label: string;
  req: string;
  mode: 'text' | 'numeric' | 'tel';
  ph: string;
  mask?: (s: string) => string;
  largo?: boolean;
}[] = [
  { k: 'nome', label: 'Nome completo', req: 'obrigatório', mode: 'text', ph: '', largo: true },
  { k: 'nascimento', label: 'Data de nascimento', req: 'obrigatório', mode: 'numeric', ph: 'dd/mm/aaaa', mask: mascaraData },
  { k: 'cpf', label: 'CPF', req: '', mode: 'numeric', ph: '000.000.000-00', mask: mascaraCpf },
  { k: 'celular', label: 'Celular', req: 'obrigatório', mode: 'tel', ph: '(00) 00000-0000', mask: mascaraTelefone },
  { k: 'emergenciaNome', label: 'Contato de emergência', req: 'opcional', mode: 'text', ph: 'Nome de um familiar ou amigo' },
  { k: 'emergenciaTelefone', label: 'Telefone do contato', req: 'opcional', mode: 'tel', ph: '(00) 00000-0000', mask: mascaraTelefone },
];

export function DadosPessoaisForm({
  dados,
  erros,
  onChange,
}: {
  dados: DadosPessoaisAnamnese;
  erros: Erros;
  onChange: (d: DadosPessoaisAnamnese) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 rounded-xl border border-info-border bg-info-bg px-4 py-3 text-[17px] text-info-text">
        <Icon name="info" size={24} className="text-info" />
        A recepção já preencheu alguns dados. Confira e corrija se for preciso.
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] rounded-2xl border border-line bg-white p-6 md:grid-cols-2">
        {CAMPOS.map((c) => {
          const err = erros[c.k];
          return (
            <label key={c.k} className={`flex flex-col gap-2 text-lg font-semibold ${c.largo ? 'md:col-span-2' : ''}`}>
              <span className="flex items-baseline gap-2">
                {c.label}
                {c.req && <span className="text-[15px] font-medium text-ink-600">{c.req}</span>}
              </span>
              <input
                value={dados[c.k]}
                inputMode={c.mode}
                placeholder={c.ph}
                onChange={(e) => onChange({ ...dados, [c.k]: c.mask ? c.mask(e.target.value) : e.target.value })}
                className={`h-[60px] rounded-xl bg-white px-[18px] text-[21px] font-normal tabular-nums text-ink outline-none ${
                  err ? 'border-2 border-danger-strong' : 'border-2 border-line-strong focus:border-brand focus:shadow-field'
                }`}
              />
              {err && (
                <span className="flex items-center gap-1.5 text-base font-semibold text-danger">
                  <Icon name="error" size={20} />
                  {err}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </>
  );
}
