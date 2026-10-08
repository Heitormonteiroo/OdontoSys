import type { StateCreator } from 'zustand';
import { HASH_INICIAL, hashEntrada } from '@/modules/pacientes/utils/prontuario/cadeia';
import { agora } from '@/utils/dates';
import type { ClinicalEntry, IssuedDocument, NovaEntrada, NovoDocumento } from '../types';
import type { AppState, DocumentosSlice, ProntuarioSlice } from './types';
import { autorizado, congelar, falha, proximoNumero } from './util';
import { hashSimulado } from '@/utils/hash';

/**
 * Grava uma entrada append-only, encadeando o hash com a última entrada do paciente.
 * Única forma de escrever em `clinicalEntries` (não existe editar nem apagar).
 */
export function novaEntrada(s: AppState, patientId: string, n: NovaEntrada): ClinicalEntry {
  const doPaciente = s.clinicalEntries.filter((e) => e.patientId === patientId);
  const anterior = doPaciente.length ? doPaciente[doPaciente.length - 1].hash : HASH_INICIAL;
  const numero = proximoNumero(s.clinicalEntries.map((e) => e.id));
  const base = {
    id: `${n.tipo === 'adendo' ? 'A' : 'E'}-${numero}`,
    patientId,
    tipo: n.tipo,
    texto: n.texto.trim(),
    autorId: n.autorId === undefined ? (s.session?.userId ?? null) : n.autorId,
    criadoEm: agora(),
    parentEntryId: n.parentEntryId ?? null,
    etiqueta: n.etiqueta ?? null,
  };
  return congelar({ ...base, hashAnterior: anterior, hash: hashEntrada(base, anterior) });
}

export const createProntuarioSlice: StateCreator<AppState, [], [], ProntuarioSlice> = (set, get) => ({
  registrarEvolucao: (patientId, texto) => {
    const s = get();
    if (!autorizado(s, 'evolucao:registrar')) return falha('Seu perfil não pode registrar no prontuário.');
    if (texto.trim().length < 10) return falha('Escreva ao menos 10 caracteres.');
    if (!s.patients.some((p) => p.id === patientId)) return falha('Paciente não encontrado.');
    const e = novaEntrada(s, patientId, { tipo: 'evolucao', texto });
    set((x) => ({ clinicalEntries: [...x.clinicalEntries, e] }));
    return { ok: true, entrada: e };
  },

  registrarAdendo: (parentId, texto) => {
    const s = get();
    if (!autorizado(s, 'evolucao:registrar')) return falha('Seu perfil não pode registrar no prontuário.');
    const pai = s.clinicalEntries.find((e) => e.id === parentId);
    if (!pai) return falha('Entrada original não encontrada.');
    if (pai.tipo === 'adendo') return falha('Adendos se ligam à entrada original, não a outro adendo.');
    if (texto.trim().length < 10) return falha('Escreva ao menos 10 caracteres.');
    const e = novaEntrada(s, pai.patientId, { tipo: 'adendo', texto, parentEntryId: pai.id });
    set((x) => ({ clinicalEntries: [...x.clinicalEntries, e] }));
    return { ok: true, entrada: e };
  },
});

export const createDocumentosSlice: StateCreator<AppState, [], [], DocumentosSlice> = (set, get) => ({
  emitirDocumento: (patientId, d: NovoDocumento) => {
    const s = get();
    const u = s.users.find((x) => x.id === s.session?.userId);
    if (!u) return falha('Sessão expirada.');
    const doTipo = s.issuedDocuments.filter((x) => x.tipo === d.tipo).map((x) => x.numero);
    const numero = String(proximoNumero(doTipo)).padStart(4, '0');
    const id = `doc-${d.tipo}-${numero}`;
    const criadoEm = agora();
    const doc: IssuedDocument = congelar({
      id, patientId, tipo: d.tipo, numero, titulo: d.titulo, subtitulo: d.subtitulo, conteudo: d.conteudo,
      refId: d.refId ?? null, autorId: u.id, criadoEm, digitalizacao: null,
      hash: hashSimulado([id, patientId, d.tipo, criadoEm, d.conteudo].join('|')),
    });
    set((x) => ({ issuedDocuments: [...x.issuedDocuments, doc] }));
    return { ok: true, documento: doc };
  },

  anexarDigitalizacao: (docId, arquivo) => {
    const s = get();
    const u = autorizado(s, 'documentos:anexar');
    if (!u) return falha('Seu perfil não pode anexar documentos.');
    const doc = s.issuedDocuments.find((d) => d.id === docId);
    if (!doc) return falha('Documento não encontrado.');
    if (doc.digitalizacao) return falha('Este documento já tem a cópia assinada anexada.');
    if (!/\.(pdf|jpe?g|png)$/i.test(arquivo.nome)) return falha('Envie um PDF ou uma imagem (JPG ou PNG).');
    const digitalizacao = { em: agora(), porId: u.id, arquivoNome: arquivo.nome, hash: arquivo.hash };
    // O documento emitido é imutável; a digitalização é o único anexo, gravado uma vez.
    set((x) => ({ issuedDocuments: x.issuedDocuments.map((d) => (d.id === docId ? congelar({ ...d, digitalizacao }) : d)) }));
    return { ok: true };
  },
});
