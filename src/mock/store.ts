'use client';

import { create } from 'zustand';
import type { Role, SeedData, User } from './types';
import { createSeed } from './seed';

/**
 * Camada única de dados do protótipo. As telas só falam com este store;
 * para trocar pelo backend real, basta reimplementar estas ações/leituras.
 * Todo o estado vive em memória (recarregar a página reinicia a demonstração).
 */
interface State extends SeedData {
  session: { userId: string } | null;
  login: (role: Role) => void;
  logout: () => void;
  /** Restaura todos os dados de exemplo (mantém a sessão atual). */
  reset: () => void;
}

export const useStore = create<State>()((set) => ({
  ...createSeed(),
  session: null,
  login: (role) =>
    set((s) => {
      const u = s.users.find((x) => x.papel === role);
      return { session: u ? { userId: u.id } : null };
    }),
  logout: () => set({ session: null }),
  reset: () => set({ ...createSeed() }),
}));

export function useCurrentUser(): User | null {
  return useStore((s) => s.users.find((u) => u.id === s.session?.userId) ?? null);
}
