import type { StateCreator } from 'zustand';
import { derivarAlertas, limparRespostas, validarRespostas } from '@/modules/pacientes/utils/anamnese/respostas';
import { LINK_VALIDADE_HORAS, PIN_BLOQUEIO_MINUTOS, PIN_TENTATIVAS } from '@/modules/pacientes/utils/anamnese/regras';
import { agora } from '@/utils/dates';
import { gerarToken, hashSimulado } from '@/utils/hash';
import type { AnamneseLink, AnamneseResposta } from '../types';
import { novaEntrada } from './prontuario';
import type { AnamneseSlice, AppState, SituacaoLink } from './types';

/**
 * Simula as rotas de servidor do totem. O paciente NÃO usa login: a única
 * credencial é o token do link, do qual só o hash é guardado.
 */
export const createAnamneseSlice: StateCreator<AppState, [], [], AnamneseSlice> = (set, get) => {
  /** Situação atual de um link pelo token (sem revelar o motivo exato ao tablet). */
  function situacao(link: AnamneseLink | undefined): SituacaoLink {
    if (!link) return 'invalido';
    if (link.usadoEm) return 'usado';
    if (link.revogadoEm) return 'revogado';
    if (Date.now() > link.expiraEm) return 'expirado';
    return 'ativo';
  }
  const buscar = (token: string) => get().anamneseLinks.find((l) => l.tokenHash === hashSimulado(token));
  const templateAtual = () => get().anamneseTemplates.reduce((a, b) => (b.versao > a.versao ? b : a));

  return {
    gerarLinkAnamnese: (patientId) => {
      const userId = get().session?.userId ?? 'desconhecido';
      const tpl = templateAtual();
      const token = gerarToken();
      const agoraIso = agora();
      const link: AnamneseLink = {
        id: `lnk-${Date.now().toString(36)}`,
        patientId,
        tokenHash: hashSimulado(token),
        codigo: `ANM-${String(1000 + Math.floor(Math.random() * 9000))}`,
        templateId: tpl.id,
        templateVersao: tpl.versao,
        criadoPor: userId,
        criadoEm: agoraIso,
        expiraEm: Date.now() + LINK_VALIDADE_HORAS * 3600_000,
        usadoEm: null,
        revogadoEm: null,
      };
      // Um link ativo por paciente: os anteriores ainda não usados são revogados.
      set((s) => ({
        anamneseLinks: [
          link,
          ...s.anamneseLinks.map((l) =>
            l.patientId === patientId && !l.usadoEm && !l.revogadoEm ? { ...l, revogadoEm: agoraIso } : l,
          ),
        ],
      }));
      return { token, link };
    },

    abrirLinkAnamnese: (token) => {
      const link = buscar(token);
      const sit = situacao(link);
      if (sit !== 'ativo') return { situacao: sit, codigo: link?.codigo ?? null, criadoEm: link?.criadoEm ?? null };
      if (!link) return { situacao: 'invalido', codigo: null, criadoEm: null };
      const s = get();
      return {
        situacao: 'ativo',
        codigo: link.codigo,
        criadoEm: link.criadoEm,
        patient: s.patients.find((p) => p.id === link.patientId) ?? null,
        template: s.anamneseTemplates.find((t) => t.id === link.templateId && t.versao === link.templateVersao) ?? null,
        rascunho: s.anamneseRascunhos[link.patientId] ?? null,
      };
    },

    salvarRascunhoAnamnese: (token, answers) => {
      const link = buscar(token);
      if (situacao(link) !== 'ativo' || !link) return;
      set((s) => ({ anamneseRascunhos: { ...s.anamneseRascunhos, [link.patientId]: structuredClone(answers) } }));
    },

    enviarAnamnese: (token, answers) => {
      const link = buscar(token);
      if (situacao(link) !== 'ativo' || !link) return { ok: false, motivo: 'link' };
      const tpl = get().anamneseTemplates.find((t) => t.id === link.templateId && t.versao === link.templateVersao);
      if (!tpl) return { ok: false, motivo: 'link' };
      const erros = validarRespostas(tpl, answers);
      if (Object.keys(erros).length > 0) return { ok: false, motivo: 'validacao', erros };

      const limpas = limparRespostas(tpl, answers);
      const alertas = derivarAlertas(tpl, limpas);
      const agoraIso = agora();
      let consumido = false;
      set((s) => {
        // Equivale a `UPDATE ... SET used_at = now() WHERE id = ? AND used_at IS NULL RETURNING`.
        const atual = s.anamneseLinks.find((l) => l.id === link.id);
        if (!atual || atual.usadoEm) return {};
        consumido = true;
        const resposta: AnamneseResposta = {
          id: `anm-${Date.now().toString(36)}`,
          patientId: link.patientId,
          linkId: link.id,
          templateId: tpl.id,
          templateVersao: tpl.versao,
          answers: limpas,
          alertas,
          preenchidaEm: agoraIso,
          origem: 'tablet',
          conferidaPor: null,
          conferidaEm: null,
        };
        const { [link.patientId]: _descartado, ...rascunhos } = s.anamneseRascunhos;
        const resumo = alertas.length ? ` Alertas críticos: ${alertas.map((a) => a.texto).join('; ')}.` : ' Nenhum alerta crítico.';
        const entrada = novaEntrada(s, link.patientId, {
          tipo: 'anamnese',
          texto: `Anamnese preenchida no tablet (modelo v${tpl.versao}).${resumo}`,
          autorId: null,
        });
        return {
          clinicalEntries: [...s.clinicalEntries, entrada],
          anamneseLinks: s.anamneseLinks.map((l) => (l.id === link.id ? { ...l, usadoEm: agoraIso } : l)),
          anamneseRespostas: [resposta, ...s.anamneseRespostas],
          anamneseRascunhos: rascunhos,
          patients: s.patients.map((p) => (p.id === link.patientId ? { ...p, alertas, anamnese: 'preenchida' as const } : p)),
        };
      });
      return consumido ? { ok: true } : { ok: false, motivo: 'link' };
    },

    conferirAnamnese: (respostaId) => {
      const userId = get().session?.userId;
      if (!userId) return;
      set((s) => ({
        anamneseRespostas: s.anamneseRespostas.map((r) =>
          r.id === respostaId && !r.conferidaPor ? { ...r, conferidaPor: userId, conferidaEm: agora() } : r,
        ),
      }));
    },

    verificarPinTotem: (pin) => {
      const { totemPin, users } = get();
      const agoraMs = Date.now();
      if (totemPin.bloqueadoAte && agoraMs < totemPin.bloqueadoAte) {
        return { ok: false, tentativasRestantes: 0, bloqueadoAte: totemPin.bloqueadoAte };
      }
      const user = users.find((u) => u.pinHash === hashSimulado(pin));
      if (user) {
        set({ totemPin: { tentativasRestantes: PIN_TENTATIVAS, bloqueadoAte: null } });
        return { ok: true, userId: user.id };
      }
      const restantes = (totemPin.bloqueadoAte ? PIN_TENTATIVAS : totemPin.tentativasRestantes) - 1;
      const bloqueadoAte = restantes <= 0 ? agoraMs + PIN_BLOQUEIO_MINUTOS * 60_000 : null;
      set({ totemPin: { tentativasRestantes: bloqueadoAte ? PIN_TENTATIVAS : restantes, bloqueadoAte } });
      return { ok: false, tentativasRestantes: Math.max(0, restantes), bloqueadoAte };
    },
  };
};
