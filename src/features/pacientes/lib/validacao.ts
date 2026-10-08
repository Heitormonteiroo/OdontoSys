import { idadeEm } from '@/lib/dates';
import { soDigitos } from '@/lib/text';

export interface FormPaciente {
  nome: string;
  nascimento: string;
  cpf: string;
  telefone: string;
  dentistaId: string;
  responsavel: string;
}

export type ErrosPaciente = Partial<Record<keyof FormPaciente, string>>;

export function validarPaciente(f: FormPaciente): ErrosPaciente {
  const e: ErrosPaciente = {};
  if (f.nome.trim().split(/\s+/).filter(Boolean).length < 2) e.nome = 'Informe nome e sobrenome.';
  if (!f.nascimento) e.nascimento = 'Informe a data de nascimento.';
  else if (f.nascimento > '2026-10-08') e.nascimento = 'A data não pode estar no futuro.';
  const cpf = soDigitos(f.cpf);
  if (cpf.length > 0 && cpf.length < 11) {
    const falta = 11 - cpf.length;
    e.cpf = `CPF incompleto: falta${falta > 1 ? 'm' : ''} ${falta} dígito${falta > 1 ? 's' : ''}.`;
  }
  if (soDigitos(f.telefone).length < 10) e.telefone = 'Informe o telefone com DDD.';
  if (f.nascimento && idadeEm(f.nascimento) < 18 && !f.responsavel.trim()) {
    e.responsavel = 'Paciente menor de idade: informe o responsável legal.';
  }
  return e;
}
