'use client';

import { useStore } from '@/mock/store';

/**
 * Acesso a documentos emitidos (snapshot, número, hash) e às cópias assinadas.
 * Hoje: store em memória (src/mock). Fase 1: API do backend + Storage privado.
 */
export const useDocumentosEmitidos = () => useStore((s) => s.issuedDocuments);
export const useEmitirDocumento = () => useStore((s) => s.emitirDocumento);
export const useAnexarDigitalizacao = () => useStore((s) => s.anexarDigitalizacao);
