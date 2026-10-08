import { hashSimulado } from '@/utils/hash';
import type { ClinicalEntry } from '@/mock/types';

export const HASH_INICIAL = '0'.repeat(14);

/** Conteúdo que entra no hash: tudo o que identifica a entrada (no real: JSON canônico + sha256). */
export function conteudoEntrada(e: Omit<ClinicalEntry, 'hash' | 'hashAnterior'>): string {
  return [e.id, e.patientId, e.tipo, e.autorId ?? 'paciente', e.criadoEm, e.parentEntryId ?? '', e.etiqueta ?? '', e.texto].join('|');
}

export function hashEntrada(e: Omit<ClinicalEntry, 'hash' | 'hashAnterior'>, hashAnterior: string): string {
  return hashSimulado(conteudoEntrada(e) + hashAnterior);
}

/**
 * Confere a cadeia de um paciente (entradas em ordem de gravação).
 * Devolve o id da primeira entrada quebrada, ou null se íntegra.
 */
export function verificarCadeia(entradas: ClinicalEntry[]): string | null {
  let anterior = HASH_INICIAL;
  for (const e of entradas) {
    if (e.hashAnterior !== anterior || e.hash !== hashEntrada(e, anterior)) return e.id;
    anterior = e.hash;
  }
  return null;
}
