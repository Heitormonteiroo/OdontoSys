import type { StateCreator } from 'zustand';
import { ORDEM_FACES, dentesValidos, siglasFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import { TRANSICOES, linhagemItem, planoAtual, statusGeral, statusItem } from '@/modules/pacientes/utils/plano';
import { erroDesconto, hashOrcamento, somaCentavos, somarDias, statusOrcamento } from '@/modules/orcamentos/utils/orcamento';
import { agora, HOJE } from '@/utils/dates';
import { formatarCentavos } from '@/utils/dinheiro';
import { hashSimulado } from '@/utils/hash';
import type { IssuedDocument, Patient, PlanItemEvent, Quote, StatusTratamento, TreatmentPlan, TreatmentPlanItem } from '../types';
import { prepararEventoDente } from './odontograma';
import { novaEntrada } from './prontuario';
import type { AppState, PlanoSlice } from './types';
import { autorizado, congelar, falha, proximoNumero } from './util';

const STATUS_TEXTO: Record<StatusTratamento, string> = {
  proposto: 'proposto', aprovado: 'aprovado', em_andamento: 'em andamento', concluido: 'concluído', cancelado: 'cancelado',
};

/** Status geral do paciente (chip da lista) recalculado a partir do plano vigente. */
function pacientesAtualizados(patients: Patient[], plans: TreatmentPlan[], itens: TreatmentPlanItem[], eventos: PlanItemEvent[], patientId: string) {
  const plano = planoAtual(plans, patientId);
  const doPlano = plano ? itens.filter((i) => i.planId === plano.id) : [];
  const tratamento = statusGeral(doPlano.map((i) => statusItem(eventos, itens, i)));
  return patients.map((p) => (p.id === patientId ? { ...p, tratamento } : p));
}

let contadorEventos = 0;
const novoEventoItem = (itemId: string, status: StatusTratamento, autorId: string, nota = ''): PlanItemEvent =>
  congelar({ id: `pie-n${Date.now().toString(36)}${++contadorEventos}`, itemId, status, autorId, em: agora(), nota });

export const createPlanoSlice: StateCreator<AppState, [], [], PlanoSlice> = (set, get) => ({
  adicionarItemPlano: (patientId, n) => {
    const s = get();
    const u = autorizado(s, 'plano:editar');
    if (!u) return falha('Seu perfil não pode alterar o plano de tratamento.');
    const proc = s.procedures.find((p) => p.id === n.procedureId && p.ativo);
    if (!proc) return falha('Escolha um procedimento do catálogo.');
    if (proc.escopo !== 'boca' && (n.dente === null || !dentesValidos.has(n.dente))) return falha('Informe o dente (notação FDI).');
    if (proc.escopo === 'face' && n.faces.length === 0) return falha('Escolha ao menos uma face.');
    if (!Number.isInteger(n.etapa) || n.etapa < 1 || n.etapa > 99) return falha('Etapa deve ser um número de 1 a 99.');
    if (!s.users.some((x) => x.id === n.dentistaId && x.papel === 'dentista')) return falha('Escolha o dentista responsável.');

    let plans = s.treatmentPlans;
    let itens = s.treatmentPlanItems;
    let entradas = s.clinicalEntries;
    let plano = planoAtual(plans, patientId);
    if (!plano) {
      plano = { id: `pl-${patientId}-v1`, patientId, versao: 1, criadoEm: agora(), criadoPor: u.id, aprovadoEm: null, substituidoPor: null };
      plans = [...plans, plano];
    } else if (plano.aprovadoEm) {
      // Plano aprovado não é alterado: nova versão com os mesmos itens (histórico compartilhado).
      const antigo: TreatmentPlan = plano;
      const novo: TreatmentPlan = { id: `pl-${patientId}-v${antigo.versao + 1}`, patientId, versao: antigo.versao + 1, criadoEm: agora(), criadoPor: u.id, aprovadoEm: null, substituidoPor: null };
      const copias = itens
        .filter((i) => i.planId === antigo.id)
        .map((i, k) => ({ ...i, id: `pi-${novo.id}-${k + 1}`, planId: novo.id, origemItemId: i.id }));
      plans = [...plans.map((p) => (p.id === antigo.id ? { ...p, substituidoPor: novo.id } : p)), novo];
      itens = [...itens, ...copias];
      const e = novaEntrada({ ...s, clinicalEntries: entradas }, patientId, {
        tipo: 'plano',
        texto: `Plano de tratamento v${novo.versao} criado para incluir ${proc.nome}${n.dente ? ` no dente ${n.dente}` : ''}. A versão ${antigo.versao}, aprovada, foi preservada.`,
      });
      entradas = [...entradas, e];
      plano = novo;
    }
    const doPlano = itens.filter((i) => i.planId === plano!.id).length;
    const item: TreatmentPlanItem = {
      id: `pi-${plano.id}-${doPlano + 1}`,
      planId: plano.id,
      procedureId: proc.id,
      dente: proc.escopo === 'boca' ? null : n.dente,
      faces: proc.escopo === 'face' ? ORDEM_FACES.filter((f) => n.faces.includes(f)) : [],
      etapa: n.etapa,
      dentistaId: n.dentistaId,
      precoCentavos: proc.precoCentavos,
      nota: n.nota.trim(),
      origemItemId: null,
    };
    const ev = novoEventoItem(item.id, 'proposto', u.id);
    const eventos = [...s.planItemEvents, ev];
    itens = [...itens, item];
    set({
      treatmentPlans: plans,
      treatmentPlanItems: itens,
      planItemEvents: eventos,
      clinicalEntries: entradas,
      patients: pacientesAtualizados(s.patients, plans, itens, eventos, patientId),
    });
    return { ok: true, item };
  },

  mudarStatusItem: (itemId, para, opcoes) => {
    const s = get();
    const u = autorizado(s, 'plano:editar');
    if (!u) return falha('Seu perfil não pode alterar o andamento do tratamento.');
    const item = s.treatmentPlanItems.find((i) => i.id === itemId);
    if (!item) return falha('Item não encontrado.');
    const plano = s.treatmentPlans.find((p) => p.id === item.planId);
    if (!plano || plano.substituidoPor) return falha('Este item pertence a uma versão antiga do plano.');
    const de = statusItem(s.planItemEvents, s.treatmentPlanItems, item);
    if (!TRANSICOES[de].includes(para))
      return falha(de === 'proposto' && para !== 'cancelado' ? 'O item precisa ser aprovado no orçamento antes.' : 'Mudança de status não permitida.');
    const nota = (opcoes?.nota ?? '').trim();
    if (para === 'cancelado' && nota.length < 5) return falha('Informe o motivo do cancelamento.');
    if (para === 'concluido' && !opcoes?.confirmado) return falha('A conclusão precisa da confirmação do dentista.');

    const proc = s.procedures.find((p) => p.id === item.procedureId)!;
    const ev = novoEventoItem(item.id, para, u.id, nota);
    const eventos = [...s.planItemEvents, ev];
    let toothEvents = s.toothEvents;
    let entradas = s.clinicalEntries;
    if (para === 'concluido') {
      // Item concluído com confirmação: achado "realizado" no odontograma + entrada no prontuário.
      let ref = '';
      if (proc.achadoRealizado && item.dente) {
        const { evento } = prepararEventoDente(s, plano.patientId, { dente: item.dente, achado: proc.achadoRealizado, situacao: 'realizado', faces: item.faces, nota: nota, planItemId: item.id }, u.id);
        toothEvents = [...toothEvents, evento];
        ref = ` Odontograma atualizado (${evento.id}).`;
      }
      const local = item.dente ? ` no dente ${item.dente}${item.faces.length ? ` (faces ${siglasFaces(item.dente, item.faces)})` : ''}` : '';
      const e = novaEntrada(s, plano.patientId, { tipo: 'procedimento', texto: `${proc.nome}${local} concluído.${nota ? ` ${nota}` : ''}${ref}` });
      entradas = [...entradas, e];
    } else if (para === 'cancelado') {
      const e = novaEntrada(s, plano.patientId, { tipo: 'plano', texto: `Plano: ${proc.nome}${item.dente ? ` (dente ${item.dente})` : ''} cancelado. Motivo: ${nota}` });
      entradas = [...entradas, e];
    }
    set({
      planItemEvents: eventos,
      toothEvents,
      clinicalEntries: entradas,
      patients: pacientesAtualizados(s.patients, s.treatmentPlans, s.treatmentPlanItems, eventos, plano.patientId),
    });
    return { ok: true, status: STATUS_TEXTO[para] };
  },

  emitirOrcamento: (patientId, n) => {
    const s = get();
    const u = autorizado(s, 'orcamento:emitir');
    if (!u) return falha('Seu perfil não pode emitir orçamentos.');
    const plano = planoAtual(s.treatmentPlans, patientId);
    if (!plano) return falha('O paciente ainda não tem plano de tratamento.');
    const itens = s.treatmentPlanItems.filter((i) => i.planId === plano.id && n.itemIds.includes(i.id));
    if (itens.length === 0 || itens.length !== n.itemIds.length) return falha('Escolha ao menos um item do plano vigente.');
    if (itens.some((i) => statusItem(s.planItemEvents, s.treatmentPlanItems, i) !== 'proposto'))
      return falha('Só itens propostos entram em um novo orçamento.');
    if (n.descontoCentavos > 0 && !autorizado(s, 'orcamento:desconto')) return falha('Só o dentista pode conceder desconto.');
    if (!Number.isInteger(n.validadeDias) || n.validadeDias < 1 || n.validadeDias > 180) return falha('Validade deve ser de 1 a 180 dias.');
    if (n.condicoes.trim().length > 500) return falha('Condições de pagamento: no máximo 500 caracteres.');

    const qItens = itens
      .map((i) => ({ itemId: i.id, procedimento: s.procedures.find((p) => p.id === i.procedureId)!.nome, dente: i.dente, faces: i.faces, etapa: i.etapa, precoCentavos: i.precoCentavos }))
      .sort((a, b) => a.etapa - b.etapa);
    const sub = somaCentavos(qItens);
    const errD = erroDesconto(n.descontoCentavos, sub);
    if (errD) return falha(errD);

    const numero = String(proximoNumero(s.quotes.map((q) => q.numero))).padStart(4, '0');
    const criadoEm = agora();
    const anterior = s.quotes.find((q) => q.patientId === patientId && q.status === 'emitido' && !q.substituidoPor && statusOrcamento(q) === 'emitido');
    const base: Omit<Quote, 'hash'> = {
      id: `orc-${numero}`, numero, patientId, planId: plano.id, planVersao: plano.versao, itens: qItens,
      subtotalCentavos: sub, descontoCentavos: n.descontoCentavos, totalCentavos: sub - n.descontoCentavos,
      validadeDias: n.validadeDias, validoAte: somarDias(HOJE, n.validadeDias), condicoes: n.condicoes.trim(),
      status: 'emitido', criadoEm, criadoPor: u.id, documentoId: `doc-orcamento-${numero}`,
      decididoEm: null, decididoPor: null, substitui: anterior?.id ?? null, substituidoPor: null,
    };
    const q: Quote = congelar({ ...base, hash: hashOrcamento(base) });
    const doc: IssuedDocument = congelar({
      id: base.documentoId!, patientId, tipo: 'orcamento', numero, titulo: `Orçamento nº ${numero}`,
      subtitulo: `${qItens.length} procedimento${qItens.length > 1 ? 's' : ''} · ${formatarCentavos(q.totalCentavos)}`,
      conteudo: '', refId: q.id, autorId: u.id, criadoEm, digitalizacao: null, hash: hashSimulado(`${q.hash}|doc`),
    });
    set((x) => ({
      quotes: [...x.quotes.map((o) => (o.id === anterior?.id ? { ...o, substituidoPor: q.id } : o)), q],
      issuedDocuments: [...x.issuedDocuments, doc],
    }));
    return { ok: true, orcamento: q };
  },

  decidirOrcamento: (quoteId, decisao) => {
    const s = get();
    const u = autorizado(s, 'orcamento:decidir');
    if (!u) return falha('Seu perfil não pode registrar a decisão do orçamento.');
    const q = s.quotes.find((o) => o.id === quoteId);
    if (!q) return falha('Orçamento não encontrado.');
    if (q.substituidoPor) return falha('Este orçamento foi substituído por outro.');
    const st = statusOrcamento(q);
    if (st === 'expirado') return falha('Orçamento expirado. Emita um novo.');
    if (st !== 'emitido') return falha('A decisão deste orçamento já foi registrada.');

    const em = agora();
    let eventos = s.planItemEvents;
    let plans = s.treatmentPlans;
    const plano = planoAtual(plans, q.patientId);
    if (decisao === 'aprovado' && plano) {
      const ids = new Set(q.itens.map((i) => i.itemId));
      const aprovar = s.treatmentPlanItems.filter(
        (i) => i.planId === plano.id && linhagemItem(s.treatmentPlanItems, i).some((id) => ids.has(id)) && statusItem(eventos, s.treatmentPlanItems, i) === 'proposto',
      );
      eventos = [...eventos, ...aprovar.map((i) => novoEventoItem(i.id, 'aprovado', u.id, `Orçamento nº ${q.numero} assinado`))];
      plans = plans.map((p) => (p.id === plano.id ? { ...p, aprovadoEm: em } : p));
    }
    const texto =
      decisao === 'aprovado'
        ? `Orçamento nº ${q.numero} aprovado: assinado pelo paciente no papel (${q.itens.length} procedimento${q.itens.length > 1 ? 's' : ''}, ${formatarCentavos(q.totalCentavos)}). Plano de tratamento v${plano?.versao ?? q.planVersao} aprovado.`
        : `Orçamento nº ${q.numero} recusado pelo paciente.`;
    const e = novaEntrada(s, q.patientId, { tipo: 'plano', texto });
    set({
      quotes: s.quotes.map((o) => (o.id === q.id ? congelar({ ...o, status: decisao, decididoEm: em, decididoPor: u.id }) : o)),
      planItemEvents: eventos,
      treatmentPlans: plans,
      clinicalEntries: [...s.clinicalEntries, e],
      patients: pacientesAtualizados(s.patients, plans, s.treatmentPlanItems, eventos, q.patientId),
    });
    return { ok: true };
  },
});
