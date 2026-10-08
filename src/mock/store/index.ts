'use client';

import { create } from 'zustand';
import type { User } from '../types';
import { createSeed } from '../seed';
import { createAnamneseSlice } from './anamnese';
import { createPatientsSlice } from './patients';
import { createSessionSlice } from './session';
import type { AppState } from './types';

/**
 * Camada única de dados do protótipo. As telas só falam com este store;
 * para trocar pelo backend real, reimplemente estas ações/leituras.
 * Todo o estado vive em memória (recarregar a página reinicia a demonstração).
 *
 * Importante: seletores não devem criar arrays/objetos novos a cada chamada
 * (filtre/ordene com useMemo na tela).
 */
export const useStore = create<AppState>()((...a) => ({
  ...createSeed(),
  ...createSessionSlice(...a),
  ...createPatientsSlice(...a),
  ...createAnamneseSlice(...a),
  reset: () => a[0]({ ...createSeed() }),
}));

export function useCurrentUser(): User | null {
  return useStore((s) => s.users.find((u) => u.id === s.session?.userId) ?? null);
}
