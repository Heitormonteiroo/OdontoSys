import type { AlertaCritico, Patient } from '../types';

// Todos os dados abaixo são FICTÍCIOS (CPFs com dígito verificador inválido de propósito).
// Medicamentos citados nos alertas são genéricos e inventados.

const alergia = (id: string): AlertaCritico => ({
  id,
  tipo: 'alergia',
  texto: 'Alergia: Medicamento Exemplo B',
  curto: 'Alergia',
});
const anticoag = (id: string): AlertaCritico => ({
  id,
  tipo: 'anticoagulante',
  texto: 'Anticoagulante em uso: Medicamento Exemplo C',
  curto: 'Anticoagulante',
});
const gestante = (id: string, semanas: number): AlertaCritico => ({
  id,
  tipo: 'gestante',
  texto: `Gestante · ${semanas} semanas`,
  curto: 'Gestante',
});

export const patients: Patient[] = [
  {
    id: 'p-00318', nome: 'Mariana Alves Costa', nascimento: '1992-03-14', cpf: '412.735.890-12',
    telefone: '(67) 99812-4470', prontuarioNo: '00318', dentistaId: 'u-dentista', responsavel: null,
    alertas: [alergia('a1'), anticoag('a2'), gestante('a3', 24)],
    anamnese: 'preenchida', ultimoAtendimento: '2026-10-08T09:00', tratamento: 'em_andamento', novo: false,
  },
  {
    id: 'p-00287', nome: 'João Pedro Ramos', nascimento: '1974-05-20', cpf: '238.104.567-30',
    telefone: '(67) 98123-0915', prontuarioNo: '00287', dentistaId: 'u-dentista-2', responsavel: null,
    alertas: [anticoag('a4')],
    anamnese: 'preenchida', ultimoAtendimento: '2026-09-12T14:30', tratamento: 'aprovado', novo: false,
  },
  {
    id: 'p-00201', nome: 'Lúcia Fernandes Okada', nascimento: '1959-01-09', cpf: '509.882.143-07',
    telefone: '(67) 99245-6681', prontuarioNo: '00201', dentistaId: 'u-dentista', responsavel: null,
    alertas: [alergia('a5')],
    anamnese: 'preenchida', ultimoAtendimento: '2026-10-08T08:00', tratamento: 'concluido', novo: false,
  },
  {
    id: 'p-00355', nome: 'Thiago Moreira Lins', nascimento: '1997-08-02', cpf: '671.290.334-58',
    telefone: '(67) 99370-2248', prontuarioNo: '00355', dentistaId: 'u-dentista', responsavel: null,
    alertas: [],
    anamnese: 'preenchida', ultimoAtendimento: '2026-10-08T08:40', tratamento: 'concluido', novo: false,
  },
  {
    id: 'p-00412', nome: 'Ana Beatriz Souza', nascimento: '2018-04-11', cpf: '803.415.926-41',
    telefone: '(67) 98456-1123', prontuarioNo: '00412', dentistaId: 'u-dentista', responsavel: 'Cláudia Souza',
    alertas: [],
    anamnese: 'preenchida', ultimoAtendimento: '2026-09-02T10:15', tratamento: 'proposto', novo: false,
  },
  {
    id: 'p-00530', nome: 'Carlos Eduardo Vieira', nascimento: '1981-02-23', cpf: '124.659.870-93',
    telefone: '(67) 99601-7734', prontuarioNo: '00530', dentistaId: 'u-dentista', responsavel: null,
    alertas: [],
    anamnese: 'pendente', ultimoAtendimento: null, tratamento: 'proposto', novo: false,
  },
  {
    id: 'p-00266', nome: 'Renata Campos Duarte', nascimento: '1987-06-30', cpf: '356.071.248-65',
    telefone: '(67) 99189-4402', prontuarioNo: '00266', dentistaId: 'u-dentista', responsavel: null,
    alertas: [gestante('a6', 18)],
    anamnese: 'preenchida', ultimoAtendimento: '2026-09-30T16:00', tratamento: 'em_andamento', novo: false,
  },
  {
    id: 'p-00149', nome: 'Sebastião Rocha Filho', nascimento: '1955-10-02', cpf: '947.312.605-28',
    telefone: '(67) 98877-3390', prontuarioNo: '00149', dentistaId: 'u-dentista-2', responsavel: null,
    alertas: [anticoag('a7'), alergia('a8')],
    anamnese: 'preenchida', ultimoAtendimento: '2026-08-18T11:00', tratamento: 'cancelado', novo: false,
  },
  {
    id: 'p-00547', nome: 'Rafael Nunes Batista', nascimento: '1999-07-19', cpf: '290.514.736-81',
    telefone: '(67) 99734-0158', prontuarioNo: '00547', dentistaId: 'u-dentista', responsavel: null,
    alertas: [],
    anamnese: 'pendente', ultimoAtendimento: null, tratamento: null, novo: true,
  },
  {
    id: 'p-00391', nome: 'Beatriz Lima Pinheiro', nascimento: '1985-11-05', cpf: '318.402.759-16',
    telefone: '(67) 99455-2087', prontuarioNo: '00391', dentistaId: 'u-dentista', responsavel: null,
    alertas: [],
    anamnese: 'preenchida', ultimoAtendimento: '2026-07-21T09:30', tratamento: 'concluido', novo: false,
  },
  {
    id: 'p-00098', nome: 'Otávio Brandão Neto', nascimento: '1968-12-17', cpf: '665.120.348-70',
    telefone: '(67) 98312-6645', prontuarioNo: '00098', dentistaId: 'u-dentista-2', responsavel: null,
    alertas: [alergia('a9')],
    anamnese: 'preenchida', ultimoAtendimento: '2026-03-10T15:00', tratamento: null, novo: false,
  },
  {
    id: 'p-00174', nome: 'Fernanda Ishikawa Dias', nascimento: '1995-09-28', cpf: '702.846.913-55',
    telefone: '(67) 99028-7719', prontuarioNo: '00174', dentistaId: 'u-dentista', responsavel: null,
    alertas: [],
    anamnese: 'preenchida', ultimoAtendimento: '2026-01-15T10:00', tratamento: 'concluido', novo: false,
  },
];
