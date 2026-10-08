import { textoAnamnese } from '@/features/anamnese/lib/respostas';
import { HASH_INICIAL, hashEntrada } from '@/features/prontuario/lib/cadeia';
import { PERM_INF, PERM_SUP } from '@/features/odontograma/lib/dentes';
import { hashOrcamento, somaCentavos, somarDias } from '@/features/plano/lib/plano';
import { dataHora } from '@/lib/dates';
import { formatarCentavos } from '@/lib/dinheiro';
import { hashSimulado } from '@/lib/hash';
import type {
  Achado,
  AnamneseResposta,
  AnamneseTemplate,
  ClinicalEntry,
  Face,
  FindingType,
  IssuedDocument,
  PlanItemEvent,
  Procedure,
  Quote,
  SituacaoAchado,
  StatusTratamento,
  TipoEntrada,
  ToothEvent,
  TreatmentPlan,
  TreatmentPlanItem,
} from '../types';

// Tudo FICTÍCIO. Catálogo e preços são exemplos (no sistema real, fornecidos pela clínica).
// Textos clínicos sem nomes nem doses reais de medicamentos.

const H = 'u-dentista';
const M = 'u-dentista-2';
const R = 'u-recepcao';

/** Catálogo de achados copiado do design (decisão pendente nº 16: símbolos e cores do dentista). */
export const findingTypes: FindingType[] = [
  { id: 'carie', label: 'Cárie', cor: '#DC6803', escopo: 'face' },
  { id: 'restauracao', label: 'Restauração', cor: '#1570EF', escopo: 'face' },
  { id: 'coroa', label: 'Coroa', cor: '#6938EF', escopo: 'dente' },
  { id: 'canal', label: 'Canal', cor: '#C11574', escopo: 'dente' },
  { id: 'implante', label: 'Implante', cor: '#344054', escopo: 'dente' },
  { id: 'ausente', label: 'Ausente', cor: '#475467', escopo: 'dente' },
  { id: 'higido', label: 'Hígido', cor: '#079455', escopo: 'dente' },
];

export const procedures: Procedure[] = [
  { id: 'pr-resina-1', nome: 'Restauração em resina · 1 face', precoCentavos: 18000, escopo: 'face', achadoRealizado: 'restauracao', ativo: true },
  { id: 'pr-resina-2', nome: 'Restauração em resina · 2 faces', precoCentavos: 28000, escopo: 'face', achadoRealizado: 'restauracao', ativo: true },
  { id: 'pr-profilaxia', nome: 'Profilaxia e raspagem', precoCentavos: 18000, escopo: 'boca', achadoRealizado: null, ativo: true },
  { id: 'pr-canal-molar', nome: 'Tratamento de canal · molar', precoCentavos: 120000, escopo: 'dente', achadoRealizado: 'canal', ativo: true },
  { id: 'pr-canal-uni', nome: 'Tratamento de canal · unirradicular', precoCentavos: 70000, escopo: 'dente', achadoRealizado: 'canal', ativo: true },
  { id: 'pr-coroa', nome: 'Coroa metalocerâmica', precoCentavos: 165000, escopo: 'dente', achadoRealizado: 'coroa', ativo: true },
  { id: 'pr-extracao', nome: 'Extração simples', precoCentavos: 25000, escopo: 'dente', achadoRealizado: 'ausente', ativo: true },
  { id: 'pr-siso', nome: 'Extração de siso', precoCentavos: 35000, escopo: 'dente', achadoRealizado: 'ausente', ativo: true },
  { id: 'pr-implante', nome: 'Implante unitário', precoCentavos: 300000, escopo: 'dente', achadoRealizado: 'implante', ativo: true },
  { id: 'pr-selante', nome: 'Aplicação de selante', precoCentavos: 9000, escopo: 'face', achadoRealizado: null, ativo: true },
  { id: 'pr-clareamento', nome: 'Clareamento de consultório', precoCentavos: 90000, escopo: 'boca', achadoRealizado: null, ativo: true },
];

const proc = (id: string) => procedures.find((p) => p.id === id)!;

interface Saida {
  entries: Omit<ClinicalEntry, 'hash' | 'hashAnterior'>[];
  toothEvents: ToothEvent[];
  plans: TreatmentPlan[];
  items: TreatmentPlanItem[];
  itemEvents: PlanItemEvent[];
  quotes: Quote[];
  docs: IssuedDocument[];
}

function criarBuilder() {
  const s: Saida = { entries: [], toothEvents: [], plans: [], items: [], itemEvents: [], quotes: [], docs: [] };
  let nEntry = 900, nEv = 100, nItemEv = 0, nItem = 0, nQuote = 398;
  const nDoc: Record<string, number> = { receita: 80, atestado: 25, termo: 12, orcamento: 0, anamnese: 40 };

  const api = {
    s,
    entry(patientId: string, tipo: TipoEntrada, autorId: string | null, criadoEm: string, texto: string, extra: { id?: string; parent?: string; etiqueta?: string } = {}) {
      const id = extra.id ?? `E-0${nEntry++}`;
      s.entries.push({ id, patientId, tipo, texto, autorId, criadoEm, parentEntryId: extra.parent ?? null, etiqueta: extra.etiqueta ?? null });
      return id;
    },
    tooth(patientId: string, dente: number, achado: Achado, situacao: SituacaoAchado, faces: Face[], autorId: string, criadoEm: string, nota = '', extra: { substitui?: string; planItemId?: string } = {}) {
      const seq = nEv++;
      const ev: ToothEvent = { id: `EV-0${seq}`, seq, patientId, dente, achado, situacao, faces, nota, autorId, criadoEm, substitui: extra.substitui ?? null, planItemId: extra.planItemId ?? null };
      s.toothEvents.push(ev);
      return ev.id;
    },
    plan(patientId: string, versao: number, criadoPor: string, criadoEm: string, aprovadoEm: string | null) {
      const p: TreatmentPlan = { id: `pl-${patientId}-v${versao}`, patientId, versao, criadoEm, criadoPor, aprovadoEm, substituidoPor: null };
      s.plans.push(p);
      return p;
    },
    item(planId: string, procedureId: string, dente: number | null, faces: Face[], etapa: number, dentistaId: string, nota = '', origemItemId: string | null = null) {
      const it: TreatmentPlanItem = { id: `pi-${String(++nItem).padStart(3, '0')}`, planId, procedureId, dente, faces, etapa, dentistaId, precoCentavos: proc(procedureId).precoCentavos, nota, origemItemId };
      s.items.push(it);
      return it;
    },
    status(itemId: string, status: StatusTratamento, autorId: string, em: string, nota = '') {
      s.itemEvents.push({ id: `pie-${String(++nItemEv).padStart(4, '0')}`, itemId, status, autorId, em, nota });
    },
    doc(d: Omit<IssuedDocument, 'id' | 'numero' | 'hash'>) {
      const numero = String(++nDoc[d.tipo]).padStart(4, '0');
      const id = `doc-${d.tipo}-${numero}`;
      const doc: IssuedDocument = { ...d, id, numero, hash: hashSimulado([id, d.patientId, d.tipo, d.criadoEm, d.conteudo].join('|')) };
      s.docs.push(doc);
      return doc;
    },
    quote(patientId: string, plan: TreatmentPlan, itens: TreatmentPlanItem[], criadoPor: string, criadoEm: string, status: Quote['status'], decididoEm: string | null, numero?: string) {
      const qItens = itens.map((i) => ({ itemId: i.id, procedimento: proc(i.procedureId).nome, dente: i.dente, faces: i.faces, etapa: i.etapa, precoCentavos: i.precoCentavos }));
      const sub = somaCentavos(qItens);
      const base: Omit<Quote, 'hash'> = {
        id: '', numero: numero ?? String(nQuote++).padStart(4, '0'), patientId, planId: plan.id, planVersao: plan.versao, itens: qItens,
        subtotalCentavos: sub, descontoCentavos: 0, totalCentavos: sub, validadeDias: 30, validoAte: somarDias(criadoEm.slice(0, 10), 30),
        condicoes: 'A combinar com a recepção.', status, criadoEm, criadoPor, documentoId: null,
        decididoEm, decididoPor: decididoEm ? criadoPor : null, substitui: null, substituidoPor: null,
      };
      base.id = `orc-${base.numero}`;
      const q: Quote = { ...base, hash: hashOrcamento(base) };
      const d = api.doc({
        patientId, tipo: 'orcamento', titulo: `Orçamento nº ${q.numero}`, subtitulo: `${qItens.length} procedimento${qItens.length > 1 ? 's' : ''} · ${formatarCentavos(q.totalCentavos)}`,
        conteudo: '', refId: q.id, autorId: criadoPor, criadoEm,
        digitalizacao: status === 'aprovado' ? { em: decididoEm!, porId: R, arquivoNome: `orcamento-${q.numero}-assinado.pdf`, hash: hashSimulado(`scan-${q.id}`) } : null,
      });
      q.documentoId = d.id;
      s.quotes.push(q);
      return q;
    },
  };
  return api;
}

type B = ReturnType<typeof criarBuilder>;

/** Paciente com plano simples, uma versão. Itens concluídos geram evento no odontograma e entrada no prontuário. */
function planoSimples(
  b: B,
  patientId: string,
  data: string, // AAAA-MM-DD
  dentista: string,
  itens: { pr: string; dente?: number; faces?: Face[]; status: StatusTratamento; nota?: string }[],
  orcamento: 'aprovado' | 'emitido' | null,
) {
  const aprovado = orcamento === 'aprovado';
  const plan = b.plan(patientId, 1, dentista, `${data}T08:40`, aprovado ? `${data}T08:55` : null);
  const criados = itens.map((x) => b.item(plan.id, x.pr, x.dente ?? null, x.faces ?? [], 1, dentista, x.nota ?? ''));
  criados.forEach((it) => b.status(it.id, 'proposto', dentista, `${data}T08:40`));
  if (orcamento) b.quote(patientId, plan, criados, R, `${data}T08:50`, orcamento === 'aprovado' ? 'aprovado' : 'emitido', aprovado ? `${data}T08:55` : null);
  criados.forEach((it, k) => {
    const st = itens[k].status;
    if (st === 'proposto') return;
    if (st === 'cancelado' && !aprovado) return b.status(it.id, 'cancelado', dentista, `${data}T09:00`, itens[k].nota ?? '');
    b.status(it.id, 'aprovado', R, `${data}T08:55`);
    if (st === 'aprovado') return;
    if (st === 'cancelado') return b.status(it.id, 'cancelado', dentista, `${data}T09:30`, itens[k].nota ?? '');
    b.status(it.id, 'em_andamento', dentista, `${data}T09:05`);
    if (st === 'concluido') {
      b.status(it.id, 'concluido', dentista, `${data}T09:40`);
      const p = proc(it.procedureId);
      if (p.achadoRealizado && it.dente) b.tooth(patientId, it.dente, p.achadoRealizado, 'realizado', p.escopo === 'face' ? it.faces : [], dentista, `${data}T09:40`, '', { planItemId: it.id });
      b.entry(patientId, 'procedimento', dentista, `${data}T09:41`, `${p.nome}${it.dente ? ` no dente ${it.dente}` : ''} concluído conforme o plano de tratamento.`);
    }
  });
}

function mariana(b: B) {
  const P = 'p-00318';
  const d1 = '2026-09-23T';
  // Exame inicial: dentes hígidos + achados (design/Odontograma.dc.html)
  const especiais = new Set([46, 17, 48, 24, 25, 26, 14, 37, 36, 18]);
  [...PERM_SUP, ...PERM_INF].filter((n) => !especiais.has(n)).forEach((n) => b.tooth(P, n, 'higido', 'existente', [], H, `${d1}09:39`));
  b.tooth(P, 46, 'restauracao', 'existente', ['O'], H, `${d1}09:40`, 'Restauração anterior ao 1º atendimento (≈2019).');
  b.tooth(P, 17, 'restauracao', 'existente', ['O'], H, `${d1}09:40`);
  b.tooth(P, 48, 'ausente', 'existente', [], H, `${d1}09:41`, 'Extraído antes do 1º atendimento.');
  b.tooth(P, 24, 'coroa', 'existente', [], H, `${d1}09:41`, 'Coroa metalocerâmica prévia, adaptação satisfatória.');
  b.tooth(P, 25, 'implante', 'existente', [], H, `${d1}09:42`, 'Implante instalado em outra clínica (2021).');
  b.tooth(P, 25, 'coroa', 'existente', [], H, `${d1}09:42`, 'Coroa sobre implante.');
  b.tooth(P, 26, 'carie', 'existente', ['M', 'O'], H, `${d1}09:42`);
  b.tooth(P, 14, 'carie', 'existente', ['M'], H, `${d1}09:43`, 'Lesão inicial em esmalte.');
  b.tooth(P, 37, 'carie', 'existente', ['O'], H, `${d1}09:43`);
  const errado = b.tooth(P, 36, 'carie', 'existente', ['O', 'M'], H, `${d1}09:44`, 'Cárie profunda com provável envolvimento pulpar.');
  b.tooth(P, 36, 'carie', 'existente', ['O', 'D'], H, `${d1}09:58`, 'A lesão é ocluso-distal, não ocluso-mesial. Confirmado na radiografia periapical.', { substitui: errado });
  b.tooth(P, 36, 'canal', 'planejado', [], H, `${d1}10:00`, 'Endodontia em 3 sessões.');
  b.tooth(P, 36, 'coroa', 'planejado', [], H, `${d1}10:00`, 'Após a conclusão do canal.');
  b.tooth(P, 14, 'restauracao', 'planejado', ['M'], H, `${d1}10:02`);
  b.tooth(P, 37, 'restauracao', 'planejado', ['O'], H, `${d1}10:02`);
  b.tooth(P, 18, 'ausente', 'planejado', [], M, `${d1}10:12`, 'Extração do siso planejada: aguardar o fim da gestação.');
  b.entry(P, 'odontograma', H, `${d1}10:13`, 'Exame inicial registrado no odontograma (32 dentes avaliados).');

  // Plano v1, aprovado com o orçamento 0412
  const v1 = b.plan(P, 1, H, `${d1}10:05`, `${d1}10:15`);
  const i26 = b.item(v1.id, 'pr-resina-2', 26, ['M', 'O'], 1, H);
  const iProf = b.item(v1.id, 'pr-profilaxia', null, [], 1, H);
  const iCanal = b.item(v1.id, 'pr-canal-molar', 36, [], 2, H, 'Sessão 2 de 3 realizada em 07/10');
  const iCoroa = b.item(v1.id, 'pr-coroa', 36, [], 3, H, 'Após conclusão do canal');
  const iClar = b.item(v1.id, 'pr-clareamento', null, [], 4, H);
  const v1Itens = [i26, iProf, iCanal, iCoroa, iClar];
  v1Itens.forEach((i) => b.status(i.id, 'proposto', H, `${d1}10:05`));
  b.quote(P, v1, v1Itens, R, `${d1}10:08`, 'aprovado', `${d1}10:15`, '0412');
  v1Itens.forEach((i) => b.status(i.id, 'aprovado', R, `${d1}10:15`, 'Orçamento nº 0412 assinado'));
  b.entry(P, 'plano', R, `${d1}10:16`, 'Orçamento nº 0412 aprovado e assinado pela paciente (5 procedimentos). Plano de tratamento v1 aprovado.');
  b.status(iCanal.id, 'em_andamento', H, `${d1}10:20`);
  b.entry(P, 'evolucao', H, `${d1}10:22`, 'Abertura coronária e pulpectomia do dente 36 (sessão 1 de 3). Odontometria eletrônica. Curativo de demora e selamento provisório.', { id: 'E-1026' });
  b.status(i26.id, 'em_andamento', H, `${d1}10:25`);
  b.status(i26.id, 'concluido', H, `${d1}10:30`);
  b.tooth(P, 26, 'restauracao', 'realizado', ['M', 'O'], H, `${d1}10:30`, 'Resina composta classe II, isolamento relativo.', { planItemId: i26.id });
  b.entry(P, 'procedimento', H, `${d1}10:31`, 'Restauração em resina composta classe II no dente 26 (faces mesial e oclusal). Isolamento relativo. Ajuste oclusal realizado.', { id: 'E-1027' });
  b.status(iProf.id, 'em_andamento', H, `${d1}10:40`);
  b.status(iProf.id, 'concluido', H, `${d1}10:50`);
  b.doc({ patientId: P, tipo: 'termo', titulo: 'Termo de consentimento · Endodontia', subtitulo: 'Dente 36', conteudo: 'Texto do termo de consentimento (modelo fictício, a ser redigido pelo dentista e revisado por advogado).', refId: null, autorId: H, criadoEm: `${d1}10:18`, digitalizacao: { em: `${d1}10:19`, porId: R, arquivoNome: 'termo-endodontia-36.pdf', hash: hashSimulado('scan-termo-36') } });

  // 07/10: anamnese atualizada, sessão 2 do canal, clareamento cancelado, plano v2 com o siso
  const d2 = '2026-10-07T';
  b.entry(P, 'anamnese', R, `${d2}09:02`, 'Paciente informou gestação de 24 semanas e início de Medicamento Exemplo C, prescrito pelo obstetra. Alertas críticos da ficha atualizados.', { id: 'E-1041', etiqueta: 'Anamnese assinada e digitalizada' });
  const e43 = b.entry(P, 'evolucao', H, `${d2}09:24`, 'Tratamento endodôntico do dente 36, sessão 2 de 3. Instrumentação dos canais MV, ML e D. Medicação intracanal e selamento provisório. Anestesia local com 1 tubete. Paciente sem queixas ao final.', { id: 'E-1043' });
  b.status(iClar.id, 'cancelado', H, `${d2}09:30`, 'Contraindicado durante a gestação');
  b.entry(P, 'prescricao', H, `${d2}09:48`, 'Medicamento Exemplo A, conforme receita impressa. Anti-inflamatórios evitados (gestação e uso de anticoagulante).', { id: 'E-1045', etiqueta: 'Receita impressa para assinatura à mão' });
  b.doc({ patientId: P, tipo: 'receita', titulo: 'Receita · Medicamento Exemplo A', subtitulo: 'Receita simples', conteudo: 'Medicamento Exemplo A\nUso conforme orientação do profissional (texto fictício).', refId: null, autorId: H, criadoEm: `${d2}09:48`, digitalizacao: null });
  b.entry(P, 'adendo', H, `${d2}09:52`, 'Correção da quantidade de anestésico: foram utilizados 2 tubetes, e não 1. Dose dentro do limite seguro para a paciente.', { id: 'A-1046', parent: e43 });
  b.doc({ patientId: P, tipo: 'atestado', titulo: 'Atestado de comparecimento', subtitulo: 'Período: 08:50 às 10:00', conteudo: 'Atesto, para os devidos fins, que a paciente esteve em atendimento odontológico no período das 08:50 às 10:00 (texto fictício).', refId: null, autorId: H, criadoEm: `${d2}09:55`, digitalizacao: { em: `${d2}10:05`, porId: R, arquivoNome: 'atestado-07-10.pdf', hash: hashSimulado('scan-atestado') } });

  const v2 = b.plan(P, 2, M, `${d2}10:10`, null);
  v1.substituidoPor = v2.id;
  v1Itens.forEach((i) => b.item(v2.id, i.procedureId, i.dente, i.faces, i.etapa, i.dentistaId, i.nota, i.id));
  const iSiso = b.item(v2.id, 'pr-siso', 18, [], 5, M, 'Aprovação bloqueada: reavaliar após a gestação');
  b.status(iSiso.id, 'proposto', M, `${d2}10:10`);
  b.entry(P, 'plano', M, `${d2}10:11`, 'Plano de tratamento v2: incluída extração do dente 18, a reavaliar após a gestação. Versão 1 preservada.');
}

export function createClinico(respostas: AnamneseResposta[], templates: AnamneseTemplate[]) {
  const b = criarBuilder();

  // Entradas de anamnese de todos os pacientes (respostas do tablet)
  for (const r of respostas) {
    const alertas = r.alertas.length ? ` Alertas críticos: ${r.alertas.map((a) => a.texto).join('; ')}.` : ' Nenhum alerta crítico.';
    b.entry(r.patientId, 'anamnese', null, r.preenchidaEm, `Anamnese preenchida no tablet (modelo v${r.templateVersao}).${alertas}`);
    if (r.patientId === 'p-00318') {
      b.doc({ patientId: r.patientId, tipo: 'anamnese', titulo: 'Anamnese', subtitulo: 'Preenchida no tablet', conteudo: textoAnamnese(templates.find((t) => t.id === r.templateId && t.versao === r.templateVersao)!, r, dataHora(r.preenchidaEm)), refId: r.id, autorId: R, criadoEm: r.preenchidaEm, digitalizacao: { em: '2026-10-07T09:05', porId: R, arquivoNome: 'anamnese-assinada.pdf', hash: hashSimulado('scan-anamnese') } });
    }
  }

  mariana(b);
  planoSimples(b, 'p-00287', '2026-09-12', M, [
    { pr: 'pr-resina-1', dente: 35, faces: ['O'], status: 'aprovado' },
    { pr: 'pr-profilaxia', status: 'aprovado' },
  ], 'aprovado');
  planoSimples(b, 'p-00201', '2026-10-08', H, [{ pr: 'pr-profilaxia', status: 'concluido' }], 'aprovado');
  planoSimples(b, 'p-00355', '2026-10-08', H, [{ pr: 'pr-resina-1', dente: 16, faces: ['O'], status: 'concluido' }], 'aprovado');
  planoSimples(b, 'p-00412', '2026-09-02', H, [
    { pr: 'pr-selante', dente: 36, faces: ['O'], status: 'proposto' },
    { pr: 'pr-selante', dente: 46, faces: ['O'], status: 'proposto' },
  ], 'emitido');
  planoSimples(b, 'p-00530', '2026-10-01', H, [{ pr: 'pr-profilaxia', status: 'proposto' }], null);
  planoSimples(b, 'p-00266', '2026-09-30', H, [
    { pr: 'pr-canal-uni', dente: 21, status: 'em_andamento' },
    { pr: 'pr-coroa', dente: 21, status: 'aprovado' },
  ], 'aprovado');
  planoSimples(b, 'p-00149', '2026-08-18', M, [{ pr: 'pr-implante', dente: 46, status: 'cancelado', nota: 'Paciente optou por não realizar' }], 'aprovado');
  planoSimples(b, 'p-00391', '2026-07-21', H, [{ pr: 'pr-clareamento', status: 'concluido' }], 'aprovado');
  planoSimples(b, 'p-00174', '2026-01-15', H, [{ pr: 'pr-resina-2', dente: 25, faces: ['M', 'O'], status: 'concluido' }], 'aprovado');

  // Cadeia de hash por paciente, em ordem de gravação
  const porPaciente = new Map<string, Omit<ClinicalEntry, 'hash' | 'hashAnterior'>[]>();
  for (const e of b.s.entries) porPaciente.set(e.patientId, [...(porPaciente.get(e.patientId) ?? []), e]);
  const clinicalEntries: ClinicalEntry[] = [];
  for (const lista of porPaciente.values()) {
    let anterior = HASH_INICIAL;
    for (const e of [...lista].sort((x, y) => x.criadoEm.localeCompare(y.criadoEm))) {
      const hash = hashEntrada(e, anterior);
      clinicalEntries.push({ ...e, hashAnterior: anterior, hash });
      anterior = hash;
    }
  }

  return {
    clinicalEntries,
    findingTypes,
    toothEvents: b.s.toothEvents,
    procedures,
    treatmentPlans: b.s.plans,
    treatmentPlanItems: b.s.items,
    planItemEvents: b.s.itemEvents,
    quotes: b.s.quotes,
    issuedDocuments: b.s.docs,
  };
}
