import type { StateCreator } from 'zustand';
import { ORDEM_FACES, dentesValidos, siglasFaces } from '@/modules/pacientes/utils/odontograma/dentes';
import { bloqueioRegistro, catalogoPorId, estadoDente, idsCorrigidos, rotuloAchado } from '@/modules/pacientes/utils/odontograma/estado';
import { agora } from '@/utils/dates';
import type { NovoEventoDente, ToothEvent } from '../types';
import { novaEntrada } from './prontuario';
import type { AppState, OdontogramaSlice } from './types';
import { autorizado, congelar, falha } from './util';

/** Monta o evento + a entrada correspondente na linha do tempo (sem gravar). */
export function prepararEventoDente(s: AppState, patientId: string, n: NovoEventoDente, autorId: string) {
  const cat = catalogoPorId(s.findingTypes);
  const seq = s.toothEvents.reduce((m, e) => Math.max(m, e.seq), 0) + 1;
  const faces = cat[n.achado].escopo === 'face' ? ORDEM_FACES.filter((f) => n.faces.includes(f)) : [];
  const evento: ToothEvent = congelar({
    id: `EV-0${seq}`, seq, patientId, dente: n.dente, achado: n.achado, situacao: n.situacao, faces,
    nota: (n.nota ?? '').trim(), autorId, criadoEm: agora(), substitui: n.substitui ?? null, planItemId: n.planItemId ?? null,
  });
  const descr = `Dente ${n.dente} · ${rotuloAchado(evento, cat)}${faces.length ? ` (faces ${siglasFaces(n.dente, faces)})` : ''} · ${evento.situacao}`;
  const texto = evento.substitui
    ? `Odontograma: correção de ${evento.substitui}. ${descr}. Motivo: ${evento.nota}`
    : `Odontograma: ${descr}${evento.nota ? `. ${evento.nota}` : '.'} (${evento.id})`;
  return { evento, texto };
}

export const createOdontogramaSlice: StateCreator<AppState, [], [], OdontogramaSlice> = (set, get) => ({
  registrarEventoDente: (patientId, n) => {
    const s = get();
    const u = autorizado(s, 'odontograma:registrar');
    if (!u) return falha('Seu perfil não pode registrar no odontograma.');
    if (!s.patients.some((p) => p.id === patientId)) return falha('Paciente não encontrado.');
    if (!dentesValidos.has(n.dente)) return falha('Dente inválido (use a notação FDI).');
    if (!s.findingTypes.some((f) => f.id === n.achado)) return falha('Achado fora do catálogo.');
    if (n.faces.some((f) => !ORDEM_FACES.includes(f))) return falha('Face inválida.');

    const doPaciente = s.toothEvents.filter((e) => e.patientId === patientId);
    const cat = catalogoPorId(s.findingTypes);
    if (n.substitui) {
      const orig = doPaciente.find((e) => e.id === n.substitui);
      if (!orig || orig.dente !== n.dente) return falha('Evento original não encontrado neste dente.');
      if (idsCorrigidos(doPaciente).has(orig.id)) return falha('Este evento já foi corrigido. Corrija o evento mais recente.');
      if ((n.nota ?? '').trim().length < 5) return falha('Informe o motivo da correção.');
      if (cat[n.achado].escopo === 'face' && n.faces.length === 0) return falha('Escolha ao menos uma face.');
    } else {
      const estado = estadoDente(doPaciente.filter((e) => e.dente === n.dente), cat);
      const bloqueio = bloqueioRegistro(n, estado, cat);
      if (bloqueio) return falha(bloqueio);
    }

    const { evento, texto } = prepararEventoDente(s, patientId, n, u.id);
    const entrada = novaEntrada(s, patientId, { tipo: 'odontograma', texto });
    set((x) => ({ toothEvents: [...x.toothEvents, evento], clinicalEntries: [...x.clinicalEntries, entrada] }));
    return { ok: true, evento };
  },
});
