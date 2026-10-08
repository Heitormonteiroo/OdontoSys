import type { StateCreator } from 'zustand';
import type { AppState, SessionSlice } from './types';

export const createSessionSlice: StateCreator<AppState, [], [], SessionSlice> = (set) => ({
  session: null,
  login: (role) =>
    set((s) => {
      const u = s.users.find((x) => x.papel === role);
      return { session: u ? { userId: u.id } : null };
    }),
  logout: () => set({ session: null }),
});
