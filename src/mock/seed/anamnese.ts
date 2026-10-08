import type {
  AlertaCritico,
  AnamneseResposta,
  AnamneseTemplate,
  Patient,
  RespostasAnamnese,
} from '../types';

// Modelo PROVISÓRIO, copiado do design (design/AnamneseTablet.dc.html).
// O conteúdo definitivo será fornecido pelo dentista da clínica piloto (CLAUDE.md, decisão pendente nº 7).

const SN = ['Sim', 'Não'];
const SNS = ['Sim', 'Não', 'Não sei'];

export const anamneseTemplates: AnamneseTemplate[] = [
  {
    id: 'tpl-anamnese-adulto',
    versao: 1,
    nome: 'Questionário de saúde',
    publicadoEm: '2026-09-01',
    passos: [
      {
        id: 'saude',
        titulo: 'Histórico de saúde',
        subtitulo: 'Responda com calma. Se não souber, toque em "Não sei".',
        perguntas: [
          { id: 'tratamento', texto: 'Está em tratamento médico atualmente?', rotulo: 'Em tratamento médico', opcoes: SN, detalhe: { rotulo: 'Qual tratamento?', placeholder: 'Ex.: acompanhamento de pressão' } },
          { id: 'pressao', texto: 'Tem pressão alta?', rotulo: 'Pressão alta', opcoes: SNS },
          { id: 'coracao', texto: 'Tem algum problema no coração?', rotulo: 'Problemas cardíacos', opcoes: SNS, detalhe: { rotulo: 'Qual problema?', placeholder: 'Ex.: arritmia, sopro, marca-passo' } },
          { id: 'diabetes', texto: 'Tem diabetes?', rotulo: 'Diabetes', opcoes: SNS },
          { id: 'sangra', texto: 'Sangra muito ao se cortar ou depois de tirar um dente?', rotulo: 'Sangramento prolongado', opcoes: SNS },
          { id: 'anestesia', texto: 'Já passou mal com anestesia de dentista?', rotulo: 'Reação à anestesia', opcoes: SN, detalhe: { rotulo: 'O que aconteceu?', placeholder: 'Ex.: tontura, falta de ar' } },
          {
            id: 'gravidez', texto: 'Está grávida ou pode estar grávida?', rotulo: 'Gestação', dica: 'Se não se aplica a você, responda "Não".',
            opcoes: SNS, importante: true,
            alerta: { tipo: 'gestante', texto: 'Gestante', curto: 'Gestante' },
          },
        ],
      },
      {
        id: 'alergias',
        titulo: 'Alergias',
        subtitulo: 'Estas respostas são muito importantes para sua segurança.',
        perguntas: [
          {
            id: 'alergiaMed', texto: 'Tem alergia a algum remédio?', rotulo: 'Alergia a medicamentos', opcoes: SNS, importante: true,
            chips: {
              rotulo: 'Quais remédios? Toque em todos que se aplicam.',
              opcoes: ['Penicilina / amoxicilina', 'Dipirona', 'Anti-inflamatório (ibuprofeno, diclofenaco)', 'AAS', 'Anestésico local', 'Outro'],
            },
            detalhe: { rotulo: 'Que reação você teve?', placeholder: 'Ex.: inchaço, manchas na pele, falta de ar' },
            avisoSim: 'Vamos avisar o dentista sobre esta alergia antes do atendimento.',
            alerta: { tipo: 'alergia', texto: 'Alergia a medicamento', curto: 'Alergia' },
          },
          {
            id: 'latex', texto: 'Tem alergia a látex (luva ou balão de borracha)?', rotulo: 'Alergia a látex', opcoes: SNS,
            avisoSim: 'A equipe usará luvas sem látex no seu atendimento.',
            alerta: { tipo: 'alergia', texto: 'Alergia a látex', curto: 'Látex' },
          },
          { id: 'outraAlergia', texto: 'Tem alguma outra alergia?', rotulo: 'Outras alergias', dica: 'Alimentos, picada de inseto, produtos de limpeza…', opcoes: SN, detalhe: { rotulo: 'Qual alergia?', placeholder: 'Ex.: camarão' } },
        ],
      },
      {
        id: 'medicamentos',
        titulo: 'Remédios em uso',
        subtitulo: 'Inclua remédios que você toma todos os dias, mesmo os sem receita.',
        perguntas: [
          { id: 'remedio', texto: 'Toma algum remédio todos os dias?', rotulo: 'Medicamentos em uso', opcoes: SN, remedios: true },
          {
            id: 'anticoag', texto: 'Toma remédio para "afinar o sangue"?', rotulo: 'Usa anticoagulante',
            dica: 'Por exemplo: varfarina (Marevan), AAS, clopidogrel, rivaroxabana (Xarelto), enoxaparina.',
            opcoes: SNS, importante: true,
            avisoSim: 'Vamos avisar o dentista. Não pare de tomar o remédio sem falar com seu médico.',
            avisoNaoSei: 'Tudo bem. O dentista vai conferir com você antes de qualquer procedimento.',
            alerta: { tipo: 'anticoagulante', texto: 'Usa anticoagulante', curto: 'Anticoagulante' },
          },
        ],
      },
      {
        id: 'habitos',
        titulo: 'Hábitos',
        subtitulo: 'Último passo. Não existe resposta certa ou errada.',
        perguntas: [
          { id: 'fuma', texto: 'Você fuma?', rotulo: 'Fuma', opcoes: ['Não', 'Parei', 'Sim'] },
          { id: 'alcool', texto: 'Toma bebida alcoólica?', rotulo: 'Bebida alcoólica', opcoes: ['Nunca', 'Às vezes', 'Toda semana'] },
          { id: 'range', texto: 'Range ou aperta os dentes?', rotulo: 'Bruxismo', opcoes: ['Não', 'À noite', 'De dia', 'Não sei'] },
          { id: 'escova', texto: 'Quantas vezes escova os dentes por dia?', rotulo: 'Escovação por dia', opcoes: ['1', '2', '3 ou mais'] },
          { id: 'fio', texto: 'Usa fio dental?', rotulo: 'Fio dental', opcoes: ['Nunca', 'Às vezes', 'Todo dia'] },
        ],
      },
    ],
  },
];

/** Respostas de exemplo coerentes com os alertas já cadastrados de cada paciente. */
function respostaExemplo(p: Patient, preenchidaEm: string, conferidaPor: string | null): AnamneseResposta {
  const tem = (t: AlertaCritico['tipo']) => p.alertas.some((a) => a.tipo === t);
  const [y, m, d] = p.nascimento.split('-');
  const answers: RespostasAnamnese = {
    dados: { nome: p.nome, nascimento: `${d}/${m}/${y}`, cpf: p.cpf ?? '', celular: p.telefone, emergenciaNome: '', emergenciaTelefone: '' },
    respostas: {
      tratamento: 'Não', pressao: 'Não', coracao: 'Não', diabetes: 'Não', sangra: 'Não', anestesia: 'Não',
      gravidez: tem('gestante') ? 'Sim' : 'Não',
      alergiaMed: tem('alergia') ? 'Sim' : 'Não', latex: 'Não', outraAlergia: 'Não',
      remedio: tem('anticoagulante') ? 'Sim' : 'Não', anticoag: tem('anticoagulante') ? 'Sim' : 'Não',
      fuma: 'Não', alcool: 'Às vezes', range: 'Não', escova: '2', fio: 'Às vezes',
    },
    detalhes: tem('alergia') ? { alergiaMed: 'Medicamento Exemplo B · manchas na pele' } : {},
    chips: {},
    remedios: tem('anticoagulante') ? [{ nome: 'Medicamento Exemplo C', dose: 'conforme orientação médica' }] : [],
  };
  return {
    id: `anm-${p.id}`,
    patientId: p.id,
    linkId: null,
    templateId: 'tpl-anamnese-adulto',
    templateVersao: 1,
    answers,
    alertas: structuredClone(p.alertas),
    preenchidaEm,
    origem: 'tablet',
    conferidaPor,
    conferidaEm: conferidaPor ? preenchidaEm : null,
  };
}

export function createAnamneseRespostas(patients: Patient[]): AnamneseResposta[] {
  return patients
    .filter((p) => p.anamnese === 'preenchida')
    .map((p) => {
      // Mariana: preenchida ontem, como no design da ficha.
      if (p.id === 'p-00318') return respostaExemplo(p, '2026-10-07T08:58', 'u-recepcao');
      const base = (p.ultimoAtendimento ?? '2026-01-10T08:30').slice(0, 10);
      return respostaExemplo(p, `${base}T08:30`, 'u-recepcao');
    });
}
