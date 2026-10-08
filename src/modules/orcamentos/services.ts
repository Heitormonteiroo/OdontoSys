'use client';

import { useStore } from '@/mock/store';

/**
 * Acesso a dados de orçamentos. Orçamento não é controle financeiro:
 * não existe cobrança, parcela nem contas a receber.
 * Hoje: store em memória (src/mock). Fase 1: API do backend.
 */
export const useOrcamentos = () => useStore((s) => s.quotes);
export const useEmitirOrcamento = () => useStore((s) => s.emitirOrcamento);
export const useDecidirOrcamento = () => useStore((s) => s.decidirOrcamento);
